import csv
from decimal import Decimal
from datetime import timedelta, date

from django.contrib.auth import authenticate
from django.db.models import Sum
from django.http import HttpResponse
from django.utils import timezone

from rest_framework import status, viewsets, filters
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    User, Role, UserRole, Menu, UserMenu,
    Staff, Appointment, Product, Invoice, InvoiceItem, Payment
)
from .permissions import IsAdmin, IsStaffOrAdmin
from .serializers import (
    UserSerializer, UserCreateSerializer, UserUpdateSerializer,
    RoleSerializer, MenuSerializer,
    StaffSerializer, AppointmentSerializer,
    ProductSerializer, InvoiceSerializer, InvoiceCreateSerializer,
    InvoiceItemSerializer, PaymentSerializer,
    DashboardStatsSerializer, SalesReportSerializer
)


# ── Helpers ────────────────────────────────────────────────────────────────────

def _set_jwt_cookies(response, user):
    refresh = RefreshToken.for_user(user)
    access  = str(refresh.access_token)
    response.set_cookie(
        key='access_token', value=access,
        httponly=True, samesite='Lax', secure=False, max_age=1800
    )
    response.set_cookie(
        key='refresh_token', value=str(refresh),
        httponly=True, samesite='Lax', secure=False, max_age=604800
    )
    return response


# ── Auth Views ─────────────────────────────────────────────────────────────────

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '')
        user = authenticate(request, username=username, password=password)

        if not user:
            return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_400_BAD_REQUEST)
        if not user.is_active:
            return Response({'detail': 'Account is disabled.'}, status=status.HTTP_403_FORBIDDEN)
        if not user.is_approved:
            return Response({'detail': 'Account is pending approval by an administrator.'}, status=status.HTTP_403_FORBIDDEN)

        response = Response({'user': UserSerializer(user).data})
        return _set_jwt_cookies(response, user)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass

        response = Response({'detail': 'Logged out successfully.'})
        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')
        return response


class TokenRefreshCookieView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')
        if not refresh_token:
            return Response({'detail': 'No refresh token provided.'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            refresh  = RefreshToken(refresh_token)
            access   = str(refresh.access_token)
            response = Response({'detail': 'Token refreshed.'})
            response.set_cookie(
                key='access_token', value=access,
                httponly=True, samesite='Lax', secure=False, max_age=1800
            )
            return response
        except Exception:
            return Response({'detail': 'Invalid or expired refresh token.'}, status=status.HTTP_401_UNAUTHORIZED)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save(is_approved=False)
            # Auto-assign Staff role
            staff_role = Role.objects.filter(role_name='Staff', is_active=True).first()
            if staff_role:
                UserRole.objects.get_or_create(user=user, role=staff_role)
            # Auto-assign Appointments menu
            appt_menu = Menu.objects.filter(menu_name='Appointments', is_active=True).first()
            if appt_menu:
                UserMenu.objects.get_or_create(user=user, menu=appt_menu)
            return Response({'detail': 'Registration submitted. Awaiting admin approval.'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


# ── Dashboard ──────────────────────────────────────────────────────────────────

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        data = {
            'total_appointments':     Appointment.objects.count(),
            'scheduled_appointments': Appointment.objects.filter(status='Scheduled').count(),
            'completed_appointments': Appointment.objects.filter(status='Completed').count(),
            'cancelled_appointments': Appointment.objects.filter(status='Cancelled').count(),
            'today_appointments':     Appointment.objects.filter(start_time__date=today).count(),
            'total_staff':            Staff.objects.count(),
            'active_staff':           Staff.objects.filter(is_active=True).count(),
            'total_users':            User.objects.count(),
            'active_users':           User.objects.filter(is_active=True).count(),
            'pending_approvals':      User.objects.filter(is_approved=False).count(),
            'recent_appointments':    list(
                Appointment.objects.select_related('staff')
                .order_by('-created_at')[:5]
            ),
        }
        serializer = DashboardStatsSerializer(data)
        return Response(serializer.data)


# ── Users ViewSet ──────────────────────────────────────────────────────────────

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.prefetch_related('user_roles__role', 'user_menus__menu').all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'full_name', 'email']
    ordering_fields = ['created_at', 'username']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        if self.action in ('update', 'partial_update'):
            return UserUpdateSerializer
        return UserSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve', 'approve', 'assign_roles', 'assign_menus', 'destroy'):
            return [IsAdmin()]
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated()]

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def approve(self, request, pk=None):
        user = self.get_object()
        user.is_approved = True
        user.save()
        return Response({'detail': f'{user.username} has been approved.'})

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def assign_roles(self, request, pk=None):
        user = self.get_object()
        role_ids = request.data.get('role_ids', [])
        UserRole.objects.filter(user=user).delete()
        for role_id in role_ids:
            try:
                role = Role.objects.get(pk=role_id)
                UserRole.objects.create(user=user, role=role)
            except Role.DoesNotExist:
                pass
        return Response({'detail': 'Roles updated.', 'user': UserSerializer(user).data})

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def assign_menus(self, request, pk=None):
        user = self.get_object()
        menu_ids = request.data.get('menu_ids', [])
        UserMenu.objects.filter(user=user).delete()
        for menu_id in menu_ids:
            try:
                menu = Menu.objects.get(pk=menu_id)
                UserMenu.objects.create(user=user, menu=menu)
            except Menu.DoesNotExist:
                pass
        return Response({'detail': 'Menus updated.', 'user': UserSerializer(user).data})


# ── Roles ViewSet ──────────────────────────────────────────────────────────────

class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAdmin]


# ── Menus ViewSet ──────────────────────────────────────────────────────────────

class MenuViewSet(viewsets.ModelViewSet):
    queryset = Menu.objects.all()
    serializer_class = MenuSerializer
    permission_classes = [IsAdmin]


# ── Staff ViewSet ──────────────────────────────────────────────────────────────

class StaffViewSet(viewsets.ModelViewSet):
    queryset = Staff.objects.all()
    serializer_class = StaffSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['full_name', 'email', 'specialty']
    ordering_fields = ['full_name', 'is_active']
    ordering = ['full_name']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdmin()]
        return [IsAuthenticated()]


# ── Appointments ViewSet ───────────────────────────────────────────────────────

class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.select_related('staff').all()
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['client_name', 'client_email', 'client_phone']
    ordering_fields = ['start_time', 'created_at', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = super().get_queryset()
        status_filter = self.request.query_params.get('status')
        staff_filter  = self.request.query_params.get('staff')
        if status_filter:
            qs = qs.filter(status=status_filter)
        if staff_filter:
            qs = qs.filter(staff_id=staff_filter)
        return qs


# ── Products ViewSet ───────────────────────────────────────────────────────────

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'price', 'category']
    ordering = ['name']

    def get_queryset(self):
        qs = super().get_queryset()
        category = self.request.query_params.get('category')
        active   = self.request.query_params.get('is_active')
        if category:
            qs = qs.filter(category=category)
        if active is not None:
            qs = qs.filter(is_active=active.lower() == 'true')
        return qs

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdmin()]
        return [IsAuthenticated()]


# ── Invoices ViewSet ───────────────────────────────────────────────────────────

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.prefetch_related('items__product', 'payments').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['invoice_no', 'client_name', 'client_email']
    ordering_fields = ['created_at', 'total', 'status']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return InvoiceCreateSerializer
        return InvoiceSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        status_filter = self.request.query_params.get('status')
        date_from     = self.request.query_params.get('from')
        date_to       = self.request.query_params.get('to')
        if status_filter:
            qs = qs.filter(status=status_filter)
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        invoice    = self.get_object()
        product_id = request.data.get('product')
        quantity   = int(request.data.get('quantity', 1))

        try:
            product = Product.objects.get(pk=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response({'detail': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        if product.category == 'product' and product.stock_qty > 0:
            if product.stock_qty < quantity:
                return Response(
                    {'detail': f'Only {product.stock_qty} units in stock.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            product.stock_qty -= quantity
            product.save()

        item = InvoiceItem.objects.create(
            invoice=invoice,
            product=product,
            description=product.name,
            unit_price=product.price,
            quantity=quantity,
        )
        invoice.recalculate()

        return Response(InvoiceItemSerializer(item).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def record_payment(self, request, pk=None):
        invoice = self.get_object()
        amount  = Decimal(str(request.data.get('amount', '0')))
        method  = request.data.get('method', 'cash')
        reference = request.data.get('reference', '')

        if amount <= 0:
            return Response({'detail': 'Payment amount must be greater than zero.'}, status=status.HTTP_400_BAD_REQUEST)

        payment = Payment.objects.create(
            invoice=invoice,
            amount=amount,
            method=method,
            reference=reference,
            recorded_by=request.user,
        )

        invoice.amount_paid = (invoice.amount_paid + amount).quantize(Decimal('0.01'))
        invoice.recalculate()

        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def receipt(self, request, pk=None):
        invoice = self.get_object()
        return Response(InvoiceSerializer(invoice).data)


# ── Payments ViewSet ───────────────────────────────────────────────────────────

class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Payment.objects.select_related('invoice', 'recorded_by').all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering = ['-paid_at']


# ── POS Reports ────────────────────────────────────────────────────────────────

class POSSalesReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        now        = timezone.now()
        today      = now.date()
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)

        paid_invoices = Invoice.objects.filter(status__in=['paid', 'partial'])

        revenue_today      = paid_invoices.filter(created_at__date=today).aggregate(t=Sum('amount_paid'))['t'] or Decimal('0')
        revenue_this_week  = paid_invoices.filter(created_at__date__gte=week_start).aggregate(t=Sum('amount_paid'))['t'] or Decimal('0')
        revenue_this_month = paid_invoices.filter(created_at__date__gte=month_start).aggregate(t=Sum('amount_paid'))['t'] or Decimal('0')

        # Daily revenue for the last 30 days
        daily_revenue = []
        for i in range(29, -1, -1):
            d = today - timedelta(days=i)
            rev = paid_invoices.filter(created_at__date=d).aggregate(t=Sum('amount_paid'))['t'] or Decimal('0')
            daily_revenue.append({'date': d.isoformat(), 'revenue': str(rev)})

        # Date range from query params (for CSV export)
        date_from = request.query_params.get('from', (today - timedelta(days=30)).isoformat())
        date_to   = request.query_params.get('to', today.isoformat())

        # Top services by revenue
        from django.db.models import Count
        top_services = (
            InvoiceItem.objects
            .filter(invoice__status__in=['paid', 'partial'], invoice__created_at__date__gte=date_from, invoice__created_at__date__lte=date_to)
            .values('description')
            .annotate(count=Count('id'), revenue=Sum('line_total'))
            .order_by('-revenue')[:10]
        )
        top_services_list = [
            {'name': s['description'], 'count': s['count'], 'revenue': str(s['revenue'] or 0)}
            for s in top_services
        ]

        # Payment method breakdown
        cash_total = Payment.objects.filter(
            method='cash', paid_at__date__gte=date_from, paid_at__date__lte=date_to
        ).aggregate(t=Sum('amount'))['t'] or Decimal('0')
        card_total = Payment.objects.filter(
            method='card', paid_at__date__gte=date_from, paid_at__date__lte=date_to
        ).aggregate(t=Sum('amount'))['t'] or Decimal('0')

        # CSV export
        if request.query_params.get('format') == 'csv':
            resp = HttpResponse(content_type='text/csv')
            resp['Content-Disposition'] = f'attachment; filename="sales-report-{date_from}-to-{date_to}.csv"'
            writer = csv.writer(resp)
            writer.writerow(['Invoice No', 'Client', 'Date', 'Total', 'Amount Paid', 'Status', 'Method'])
            for inv in Invoice.objects.filter(
                created_at__date__gte=date_from,
                created_at__date__lte=date_to
            ).prefetch_related('payments').order_by('-created_at'):
                methods = ', '.join(set(p.method for p in inv.payments.all()))
                writer.writerow([
                    inv.invoice_no, inv.client_name,
                    inv.created_at.strftime('%Y-%m-%d'), inv.total,
                    inv.amount_paid, inv.status, methods
                ])
            return resp

        data = {
            'revenue_today':     revenue_today,
            'revenue_this_week': revenue_this_week,
            'revenue_this_month':revenue_this_month,
            'daily_revenue':     daily_revenue,
            'top_services':      top_services_list,
            'payment_breakdown': {'cash': str(cash_total), 'card': str(card_total)},
        }
        return Response(data)
