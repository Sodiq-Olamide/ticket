from rest_framework import viewsets, status, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db import transaction
from .models import Department, Unit, Transaction, SystemSettings, TransactionIntent
from .serializers import (
    UserSerializer, DepartmentSerializer, UnitSerializer, 
    TransactionSerializer, TransactionIntentSerializer, SystemSettingsSerializer
)

User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def create(self, request, *args, **kwargs):
        if request.user.role not in [User.Role.SUPERADMIN, User.Role.ADMIN]:
            return Response({'error': 'Only Admins can create users'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def change_password(self, request):
        new_password = request.data.get('new_password')
        if not new_password or len(new_password) < 4:
            return Response({'error': 'Valid new_password is required (min 4 chars)'}, status=status.HTTP_400_BAD_REQUEST)
        request.user.set_password(new_password)
        request.user.save()
        return Response({'message': 'Password successfully updated'})

    @action(detail=True, methods=['post'])
    def admin_reset_password(self, request, pk=None):
        if request.user.role not in [User.Role.SUPERADMIN, User.Role.ADMIN]:
            return Response({'error': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        
        user_to_change = self.get_object()
        new_password = request.data.get('new_password')
        if not new_password:
            return Response({'error': 'new_password is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        user_to_change.set_password(new_password)
        user_to_change.save()
        return Response({'message': f'Password manually reset for user: {user_to_change.username}'})

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

    def create(self, request, *args, **kwargs):
        if request.user.role not in [User.Role.SUPERADMIN, User.Role.ADMIN]:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer

    def create(self, request, *args, **kwargs):
        if request.user.role not in [User.Role.SUPERADMIN, User.Role.ADMIN]:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Transaction.objects.all().order_by('-timestamp')
    serializer_class = TransactionSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role in [User.Role.SUPERADMIN, User.Role.HCS]:
            return self.queryset
        return self.queryset.filter(sender=user) | self.queryset.filter(receiver=user)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def generate_tickets(request):
    if request.user.role != User.Role.SUPERADMIN:
        return Response({'error': 'Only SuperAdmin can generate tickets'}, status=status.HTTP_403_FORBIDDEN)
    
    amount = int(request.data.get('amount', 0))
    if amount <= 0:
         return Response({'error': 'Amount must be positive'}, status=status.HTTP_400_BAD_REQUEST)
         
    request.user.ticket_balance += amount
    request.user.save()
    
    Transaction.objects.create(
        receiver=request.user,
        amount=amount,
        transaction_type=Transaction.Type.SYSTEM_GENERATION,
        description=f"System generated {amount} tickets for SuperAdmin payload"
    )
    return Response({'message': f'Successfully created {amount} tickets.'})

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def distribute_tickets(request):
    sender = request.user
    receiver_ids = request.data.get('receiver_ids', [])
    if 'receiver_id' in request.data:
        receiver_ids.append(request.data.get('receiver_id'))
    
    amount = int(request.data.get('amount', 0))

    if not receiver_ids or amount <= 0:
        return Response({'error': 'Invalid receivers or amount'}, status=status.HTTP_400_BAD_REQUEST)

    total_needed = amount * len(receiver_ids)
    if sender.ticket_balance < total_needed and sender.role != User.Role.SUPERADMIN:
        return Response({'error': f'Insufficient ticket balance. You need {total_needed} tickets.'}, status=status.HTTP_400_BAD_REQUEST)

    receivers = User.objects.filter(id__in=receiver_ids)
    if receivers.count() != len(set(receiver_ids)):
        return Response({'error': 'One or more receivers not found'}, status=status.HTTP_404_NOT_FOUND)

    with transaction.atomic():
        if sender.role != User.Role.SUPERADMIN:
            sender.ticket_balance -= total_needed
            sender.save()
        
        for receiver in receivers:
            receiver.ticket_balance += amount
            receiver.save()
            Transaction.objects.create(
                sender=sender,
                receiver=receiver,
                amount=amount,
                transaction_type=Transaction.Type.DISTRIBUTION,
                description=f"{sender.role} distributed {amount} to {receiver.username}"
            )
            
    return Response({'message': 'Success distributed tickets'})



class IntentViewSet(viewsets.ViewSet):
    """
    ViewSet handling QR code payment intents.
    """
    permission_classes = [permissions.IsAuthenticated]

    # Buyer creates an intent
    @action(detail=False, methods=['post'])
    def create_intent(self, request):
        intent = TransactionIntent.objects.create(buyer=request.user)
        return Response({'intent_id': intent.id})

    # Poll endpoints for Buyer
    @action(detail=False, methods=['get'])
    def my_intent(self, request):
        # get the latest pending or requested intent
        intent = TransactionIntent.objects.filter(buyer=request.user).exclude(status__in=[TransactionIntent.Status.EXPIRED, TransactionIntent.Status.CONFIRMED, TransactionIntent.Status.REJECTED]).order_by('-created_at').first()
        if not intent:
            return Response({'intent': None})
        if not intent.is_valid():
            intent.status = TransactionIntent.Status.EXPIRED
            intent.save()
            return Response({'intent': None})
        
        return Response({'intent': TransactionIntentSerializer(intent).data})

    # Buyer Confirms Intent
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        try:
            intent = TransactionIntent.objects.get(pk=pk, buyer=request.user)
        except TransactionIntent.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        if intent.status != TransactionIntent.Status.REQUESTED:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not intent.is_valid():
            intent.status = TransactionIntent.Status.EXPIRED
            intent.save()
            return Response({'error': 'Intent expired'}, status=status.HTTP_400_BAD_REQUEST)

        amount = intent.amount_requested
        if request.user.ticket_balance < amount:
            return Response({'error': 'Insufficient balance'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Update user balances
            request.user.ticket_balance -= amount
            request.user.save()
            
            intent.seller.ticket_balance += amount
            intent.seller.save()

            # Create Transaction
            Transaction.objects.create(
                sender=request.user,
                receiver=intent.seller,
                amount=amount,
                transaction_type=Transaction.Type.PURCHASE,
                description=f"Purchase from seller {intent.seller.username}"
            )

            intent.status = TransactionIntent.Status.CONFIRMED
            intent.save()

        return Response({'message': 'Payment confirmed'})

    # Seller Scans and requests amount
    @action(detail=True, methods=['post'])
    def request_amount(self, request, pk=None):
        amount = int(request.data.get('amount', 0))
        if amount <= 0:
            return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            intent = TransactionIntent.objects.get(pk=pk)
        except TransactionIntent.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        if intent.status != TransactionIntent.Status.PENDING:
            return Response({'error': 'Intent already processed or requested'}, status=status.HTTP_400_BAD_REQUEST)

        if not intent.is_valid():
            intent.status = TransactionIntent.Status.EXPIRED
            intent.save()
            return Response({'error': 'Intent expired'}, status=status.HTTP_400_BAD_REQUEST)

        # Ensure seller role
        if request.user.role != User.Role.SELLER:
            return Response({'error': 'Only sellers can scan QR'}, status=status.HTTP_403_FORBIDDEN)

        intent.seller = request.user
        intent.amount_requested = amount
        intent.status = TransactionIntent.Status.REQUESTED
        intent.save()

        return Response({'message': 'Request sent to buyer'})

class ReportViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        if request.user.role not in [User.Role.SUPERADMIN, User.Role.ADMIN]:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            
        from django.db import models
        generated = Transaction.objects.filter(transaction_type=Transaction.Type.SYSTEM_GENERATION).aggregate(total=models.Sum('amount'))['total'] or 0
        distributed = Transaction.objects.filter(transaction_type=Transaction.Type.DISTRIBUTION).aggregate(total=models.Sum('amount'))['total'] or 0
        purchased = Transaction.objects.filter(transaction_type=Transaction.Type.PURCHASE).aggregate(total=models.Sum('amount'))['total'] or 0
        
        # recent purchases
        recent_purchases = TransactionSerializer(
            Transaction.objects.filter(transaction_type=Transaction.Type.PURCHASE).order_by('-timestamp')[:20], 
            many=True
        ).data

        return Response({
            'overview': {
                'total_generated': generated,
                'total_distributed': distributed,
                'total_purchased': purchased,
            },
            'recent_purchases': recent_purchases
        })
