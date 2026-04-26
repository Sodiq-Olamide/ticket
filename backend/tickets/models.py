import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings
from django.utils import timezone
class Department(models.Model):
    name = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Unit(models.Model):
    name = models.CharField(max_length=255)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='units')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('name', 'department')

    def __str__(self):
        return f"{self.name} ({self.department.name})"

class User(AbstractUser):
    class Role(models.TextChoices):
        SUPERADMIN = 'SUPERADMIN', 'SuperAdmin'
        ADMIN = 'ADMIN', 'Admin'
        HCS = 'HCS', 'HCS'
        HOD = 'HOD', 'HOD'
        HOU = 'HOU', 'HOU'
        STAFF = 'STAFF', 'Staff'
        SELLER = 'SELLER', 'Seller'

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.STAFF)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    unit = models.ForeignKey(Unit, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    ticket_balance = models.IntegerField(default=0)
    
    # Generic Profile info
    sex = models.CharField(max_length=20, null=True, blank=True)

    # Identifier fields
    staff_id = models.CharField(max_length=50, null=True, blank=True)
    seller_id = models.CharField(max_length=50, null=True, blank=True)

    # Seller specific fields
    seller_org_name = models.CharField(max_length=255, null=True, blank=True)
    seller_location = models.CharField(max_length=255, null=True, blank=True)
    seller_alias = models.CharField(max_length=255, null=True, blank=True)
    seller_contact_info = models.TextField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.username} - {self.role}"

class Transaction(models.Model):
    class Type(models.TextChoices):
        SYSTEM_GENERATION = 'SYSTEM_GENERATION', 'System Generation'
        DISTRIBUTION = 'DISTRIBUTION', 'Distribution'
        PURCHASE = 'PURCHASE', 'Purchase'

    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_transactions')
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_transactions')
    amount = models.IntegerField()
    transaction_type = models.CharField(max_length=20, choices=Type.choices)
    timestamp = models.DateTimeField(auto_now_add=True)
    description = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.transaction_type}: {self.amount} to {self.receiver.username}"

class SystemSettings(models.Model):
    monthly_ticket_volume = models.IntegerField(default=5000)
    auto_generate_enabled = models.BooleanField(default=False)
    hcs_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, blank=True, 
        limit_choices_to={'role': 'HCS'},
        related_name='hcs_settings'
    )
    last_generation_date = models.DateField(null=True, blank=True)
    
    class Meta:
        verbose_name_plural = "System Settings"

    def __str__(self):
        return "Global Settings"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

class TransactionIntent(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        REQUESTED = 'REQUESTED', 'Requested'
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        REJECTED = 'REJECTED', 'Rejected'
        EXPIRED = 'EXPIRED', 'Expired'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='intents')
    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='seller_intents')
    amount_requested = models.IntegerField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def is_valid(self):
        return (timezone.now() - self.created_at).total_seconds() < 600

