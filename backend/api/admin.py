from django.contrib import admin
from .models import (
    User, Role, UserRole, Menu, UserMenu,
    Staff, Appointment, Product, Invoice, InvoiceItem, Payment
)

admin.site.register(User)
admin.site.register(Role)
admin.site.register(UserRole)
admin.site.register(Menu)
admin.site.register(UserMenu)
admin.site.register(Staff)
admin.site.register(Appointment)
admin.site.register(Product)
admin.site.register(Invoice)
admin.site.register(InvoiceItem)
admin.site.register(Payment)
