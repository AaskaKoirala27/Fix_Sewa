from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    LoginView, LogoutView, RegisterView, TokenRefreshCookieView, MeView,
    DashboardStatsView, POSSalesReportView,
    UserViewSet, RoleViewSet, MenuViewSet, StaffViewSet,
    AppointmentViewSet, ProductViewSet, InvoiceViewSet, PaymentViewSet,
)

router = DefaultRouter()
router.register(r'users',        UserViewSet,        basename='users')
router.register(r'roles',        RoleViewSet,        basename='roles')
router.register(r'menus',        MenuViewSet,        basename='menus')
router.register(r'staff',        StaffViewSet,       basename='staff')
router.register(r'appointments', AppointmentViewSet, basename='appointments')
router.register(r'products',     ProductViewSet,     basename='products')
router.register(r'invoices',     InvoiceViewSet,     basename='invoices')
router.register(r'payments',     PaymentViewSet,     basename='payments')

urlpatterns = [
    path('auth/login/',    LoginView.as_view(),              name='login'),
    path('auth/logout/',   LogoutView.as_view(),             name='logout'),
    path('auth/register/', RegisterView.as_view(),           name='register'),
    path('auth/refresh/',  TokenRefreshCookieView.as_view(), name='token_refresh'),
    path('auth/me/',       MeView.as_view(),                 name='me'),
    path('dashboard/',     DashboardStatsView.as_view(),     name='dashboard'),
    path('pos/reports/',   POSSalesReportView.as_view(),     name='pos_reports'),
    path('',               include(router.urls)),
]
