from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Department, Unit, Transaction, SystemSettings, TransactionIntent

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'department', 'unit', 'ticket_balance')

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'

class UnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = '__all__'

class TransactionSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    receiver_name = serializers.CharField(source='receiver.username', read_only=True)

    class Meta:
        model = Transaction
        fields = '__all__'

class TransactionIntentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransactionIntent
        fields = '__all__'

class SystemSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSettings
        fields = '__all__'
