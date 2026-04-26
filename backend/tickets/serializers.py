from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Department, Unit, Transaction, SystemSettings, TransactionIntent

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    department_name = serializers.CharField(source='department.name', read_only=True)
    unit_name = serializers.CharField(source='unit.name', read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'department', 'department_name', 'unit', 'unit_name', 'ticket_balance', 'password', 'first_name', 'last_name', 'sex', 'staff_id', 'seller_id', 'seller_org_name', 'seller_location', 'seller_alias', 'seller_contact_info')

    def create(self, validated_data):
        password = validated_data.pop('password', 'defaultpassword')
        user = super().create(validated_data)
        user.set_password(password)
        user.save()
        return user

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
