from rest_framework import serializers
from .models import (
    User, Role, UserRole, Menu, UserMenu,
    Staff, Appointment, Product, Invoice, InvoiceItem, Payment
)


# ── Roles ──────────────────────────────────────────────────────────────────────

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Role
        fields = ['id', 'role_name', 'description', 'is_active']


# ── Menus ──────────────────────────────────────────────────────────────────────

class MenuSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Menu
        fields = ['id', 'menu_name', 'url', 'display_order', 'is_active', 'icon']


# ── Users ──────────────────────────────────────────────────────────────────────

class UserRoleNestedSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)

    class Meta:
        model  = UserRole
        fields = ['id', 'role']


class UserMenuNestedSerializer(serializers.ModelSerializer):
    menu = MenuSerializer(read_only=True)

    class Meta:
        model  = UserMenu
        fields = ['id', 'menu']


class UserSerializer(serializers.ModelSerializer):
    roles = serializers.SerializerMethodField()
    menus = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = [
            'id', 'full_name', 'username', 'email',
            'is_active', 'is_approved', 'created_at',
            'roles', 'menus'
        ]
        read_only_fields = ['id', 'created_at']

    def get_roles(self, obj):
        return RoleSerializer(
            [ur.role for ur in obj.user_roles.select_related('role').all()],
            many=True
        ).data

    def get_menus(self, obj):
        return MenuSerializer(
            [um.menu for um in obj.user_menus.select_related('menu').filter(menu__is_active=True).order_by('menu__display_order')],
            many=True
        ).data


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model  = User
        fields = ['full_name', 'username', 'email', 'password']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['full_name', 'email', 'is_active', 'is_approved']


# ── Staff ──────────────────────────────────────────────────────────────────────

class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Staff
        fields = ['id', 'full_name', 'email', 'phone_number', 'specialty', 'is_active']


# ── Appointments ───────────────────────────────────────────────────────────────

class AppointmentSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='staff.full_name', read_only=True)

    class Meta:
        model  = Appointment
        fields = [
            'id', 'staff', 'staff_name',
            'client_name', 'client_email', 'client_phone',
            'start_time', 'duration_minutes', 'status', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# ── POS: Products ─────────────────────────────────────────────────────────────

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Product
        fields = ['id', 'name', 'description', 'price', 'category', 'stock_qty', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


# ── POS: Invoice Items ─────────────────────────────────────────────────────────

class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model  = InvoiceItem
        fields = ['id', 'product', 'description', 'unit_price', 'quantity', 'line_total']
        read_only_fields = ['id', 'line_total']


# ── POS: Payments ──────────────────────────────────────────────────────────────

class PaymentSerializer(serializers.ModelSerializer):
    recorded_by_name = serializers.CharField(source='recorded_by.full_name', read_only=True)

    class Meta:
        model  = Payment
        fields = ['id', 'invoice', 'amount', 'method', 'reference', 'paid_at', 'recorded_by', 'recorded_by_name']
        read_only_fields = ['id', 'paid_at', 'recorded_by']


# ── POS: Invoices ──────────────────────────────────────────────────────────────

class InvoiceSerializer(serializers.ModelSerializer):
    items    = InvoiceItemSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)

    class Meta:
        model  = Invoice
        fields = [
            'id', 'invoice_no', 'appointment', 'client_name', 'client_email',
            'subtotal', 'tax_rate', 'tax_amount', 'total', 'amount_paid',
            'status', 'notes', 'created_by', 'created_at', 'updated_at',
            'items', 'payments'
        ]
        read_only_fields = [
            'id', 'invoice_no', 'subtotal', 'tax_amount', 'total',
            'amount_paid', 'created_at', 'updated_at', 'created_by'
        ]


class InvoiceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Invoice
        fields = ['appointment', 'client_name', 'client_email', 'tax_rate', 'notes', 'status']


# ── Dashboard Stats ────────────────────────────────────────────────────────────

class DashboardStatsSerializer(serializers.Serializer):
    total_appointments     = serializers.IntegerField()
    scheduled_appointments = serializers.IntegerField()
    completed_appointments = serializers.IntegerField()
    cancelled_appointments = serializers.IntegerField()
    today_appointments     = serializers.IntegerField()
    total_staff            = serializers.IntegerField()
    active_staff           = serializers.IntegerField()
    total_users            = serializers.IntegerField()
    active_users           = serializers.IntegerField()
    pending_approvals      = serializers.IntegerField()
    recent_appointments    = AppointmentSerializer(many=True)


# ── POS Reports ────────────────────────────────────────────────────────────────

class SalesReportSerializer(serializers.Serializer):
    revenue_today        = serializers.DecimalField(max_digits=12, decimal_places=2)
    revenue_this_week    = serializers.DecimalField(max_digits=12, decimal_places=2)
    revenue_this_month   = serializers.DecimalField(max_digits=12, decimal_places=2)
    daily_revenue        = serializers.ListField()   # [{date, revenue}]
    top_services         = serializers.ListField()   # [{name, count, revenue}]
    payment_breakdown    = serializers.DictField()   # {cash: X, card: Y}
