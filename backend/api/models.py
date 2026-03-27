import uuid
from decimal import Decimal
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager


# ── User / Auth ────────────────────────────────────────────────────────────────

class UserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError('Username is required')
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault('is_approved', True)
        extra_fields.setdefault('is_staff_flag', True)
        return self.create_user(username, password, **extra_fields)


class User(AbstractBaseUser):
    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    full_name     = models.CharField(max_length=100)
    username      = models.CharField(max_length=50, unique=True)
    email         = models.EmailField(max_length=255, blank=True, null=True)
    is_active     = models.BooleanField(default=True)
    is_approved   = models.BooleanField(default=False)
    is_staff_flag = models.BooleanField(default=False)
    created_at    = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD  = 'username'
    REQUIRED_FIELDS = ['full_name']
    objects = UserManager()

    class Meta:
        db_table = 'users'

    @property
    def is_staff(self):
        return self.is_staff_flag

    def has_perm(self, perm, obj=None):
        return self.is_staff_flag

    def has_module_perms(self, app_label):
        return self.is_staff_flag

    def __str__(self):
        return self.username


# ── Roles ──────────────────────────────────────────────────────────────────────

class Role(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role_name   = models.CharField(max_length=50, unique=True)
    description = models.CharField(max_length=200, blank=True, null=True)
    is_active   = models.BooleanField(default=True)

    class Meta:
        db_table = 'roles'

    def __str__(self):
        return self.role_name


class UserRole(models.Model):
    id   = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_roles')
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='user_roles')

    class Meta:
        db_table        = 'user_roles'
        unique_together = [('user', 'role')]

    def __str__(self):
        return f'{self.user.username} → {self.role.role_name}'


# ── Menus ──────────────────────────────────────────────────────────────────────

class Menu(models.Model):
    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    menu_name     = models.CharField(max_length=100)
    url           = models.CharField(max_length=255)
    display_order = models.IntegerField(default=0)
    is_active     = models.BooleanField(default=True)
    icon          = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = 'menus'
        ordering = ['display_order']

    def __str__(self):
        return self.menu_name


class UserMenu(models.Model):
    id   = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_menus')
    menu = models.ForeignKey(Menu, on_delete=models.CASCADE, related_name='user_menus')

    class Meta:
        db_table        = 'user_menus'
        unique_together = [('user', 'menu')]

    def __str__(self):
        return f'{self.user.username} → {self.menu.menu_name}'


# ── Staff ──────────────────────────────────────────────────────────────────────

class Staff(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    full_name    = models.CharField(max_length=100)
    email        = models.EmailField(max_length=100, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    specialty    = models.CharField(max_length=80, blank=True, null=True)
    is_active    = models.BooleanField(default=True)

    class Meta:
        db_table = 'staffs'

    def __str__(self):
        return self.full_name


# ── Appointments ───────────────────────────────────────────────────────────────

STATUS_CHOICES = [
    ('Scheduled', 'Scheduled'),
    ('Completed', 'Completed'),
    ('Cancelled', 'Cancelled'),
    ('No-Show',   'No-Show'),
]


class Appointment(models.Model):
    id               = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    staff            = models.ForeignKey(Staff, on_delete=models.PROTECT, related_name='appointments')
    client_name      = models.CharField(max_length=200)
    client_email     = models.EmailField(max_length=255, blank=True, null=True)
    client_phone     = models.CharField(max_length=20)
    start_time       = models.DateTimeField()
    duration_minutes = models.IntegerField()
    status           = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Scheduled')
    notes            = models.CharField(max_length=500, blank=True, null=True)
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True, null=True)

    class Meta:
        db_table = 'appointments'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.client_name} — {self.start_time}'


# ── POS: Products / Services ───────────────────────────────────────────────────

CATEGORY_CHOICES = [
    ('service', 'Service'),
    ('product', 'Product'),
]


class Product(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name        = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    price       = models.DecimalField(max_digits=10, decimal_places=2)
    category    = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='service')
    stock_qty   = models.IntegerField(default=0)
    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'products'
        ordering = ['name']

    def __str__(self):
        return self.name


# ── POS: Invoices ──────────────────────────────────────────────────────────────

INVOICE_STATUS_CHOICES = [
    ('draft',   'Draft'),
    ('pending', 'Pending'),
    ('paid',    'Paid'),
    ('partial', 'Partial'),
    ('void',    'Void'),
]


class Invoice(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice_no  = models.CharField(max_length=20, unique=True, blank=True)
    appointment = models.OneToOneField(
        Appointment, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='invoice'
    )
    client_name  = models.CharField(max_length=200)
    client_email = models.EmailField(max_length=255, blank=True, null=True)
    subtotal     = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    tax_rate     = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))
    tax_amount   = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    total        = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    amount_paid  = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    status       = models.CharField(max_length=20, choices=INVOICE_STATUS_CHOICES, default='draft')
    notes        = models.TextField(blank=True, null=True)
    created_by   = models.ForeignKey(User, on_delete=models.PROTECT, related_name='invoices')
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'invoices'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.invoice_no:
            last = Invoice.objects.order_by('-created_at').first()
            if last and last.invoice_no and last.invoice_no.startswith('INV-'):
                try:
                    num = int(last.invoice_no[4:]) + 1
                except ValueError:
                    num = 1
            else:
                num = 1
            self.invoice_no = f'INV-{num:04d}'
        super().save(*args, **kwargs)

    def recalculate(self):
        items = self.items.all()
        self.subtotal   = sum(item.line_total for item in items) if items else Decimal('0.00')
        self.tax_amount = (self.subtotal * self.tax_rate / Decimal('100')).quantize(Decimal('0.01'))
        self.total      = self.subtotal + self.tax_amount
        if self.amount_paid >= self.total and self.total > 0:
            self.status = 'paid'
        elif self.amount_paid > 0:
            self.status = 'partial'
        elif self.status not in ('void', 'draft'):
            self.status = 'pending'
        self.save()

    def __str__(self):
        return f'{self.invoice_no} — {self.client_name}'


class InvoiceItem(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice     = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    product     = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='invoice_items')
    description = models.CharField(max_length=200)
    unit_price  = models.DecimalField(max_digits=10, decimal_places=2)
    quantity    = models.IntegerField(default=1)
    line_total  = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'invoice_items'

    def save(self, *args, **kwargs):
        self.line_total = (self.unit_price * self.quantity).quantize(Decimal('0.01'))
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.description} × {self.quantity}'


# ── POS: Payments ──────────────────────────────────────────────────────────────

PAYMENT_METHOD_CHOICES = [
    ('cash', 'Cash'),
    ('card', 'Card'),
]


class Payment(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice     = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    amount      = models.DecimalField(max_digits=10, decimal_places=2)
    method      = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    reference   = models.CharField(max_length=100, blank=True, null=True)
    paid_at     = models.DateTimeField(auto_now_add=True)
    recorded_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='payments')

    class Meta:
        db_table = 'payments'
        ordering = ['-paid_at']

    def __str__(self):
        return f'{self.invoice.invoice_no} — {self.method} {self.amount}'
