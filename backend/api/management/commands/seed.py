from django.core.management.base import BaseCommand
from api.models import User, Role, Menu, UserRole, UserMenu


class Command(BaseCommand):
    help = 'Seed initial admin user, roles, and navigation menus'

    def handle(self, *args, **options):
        # ── Roles ──────────────────────────────────────────────────────────────
        admin_role, created = Role.objects.get_or_create(
            role_name='Admin',
            defaults={'description': 'Full system access', 'is_active': True}
        )
        if created:
            self.stdout.write(self.style.SUCCESS('Created role: Admin'))

        staff_role, created = Role.objects.get_or_create(
            role_name='Staff',
            defaults={'description': 'Can manage appointments', 'is_active': True}
        )
        if created:
            self.stdout.write(self.style.SUCCESS('Created role: Staff'))

        # ── Menus ──────────────────────────────────────────────────────────────
        menu_data = [
            ('Appointments', '/appointments',  1, 'calendar'),
            ('Staff',        '/staff',         2, 'users'),
            ('Users',        '/users',         3, 'user'),
            ('Roles',        '/roles',         4, 'shield'),
            ('Menus',        '/menus',         5, 'menu'),
            ('POS',          '/pos',           6, 'shopping-cart'),
            ('Products',     '/pos/products',  7, 'package'),
            ('Invoices',     '/pos/invoices',  8, 'file-text'),
            ('Reports',      '/pos/reports',   9, 'bar-chart'),
        ]

        menus = {}
        for name, url, order, icon in menu_data:
            menu, created = Menu.objects.get_or_create(
                menu_name=name,
                defaults={'url': url, 'display_order': order, 'icon': icon, 'is_active': True}
            )
            menus[name] = menu
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created menu: {name}'))

        # ── Admin user ─────────────────────────────────────────────────────────
        if not User.objects.filter(username='admin').exists():
            admin_user = User.objects.create_user(
                username='admin',
                password='admin123',
                full_name='System Administrator',
                email='admin@fixsewa.com',
                is_active=True,
                is_approved=True,
                is_staff_flag=True,
            )
            UserRole.objects.create(user=admin_user, role=admin_role)
            for menu in menus.values():
                UserMenu.objects.create(user=admin_user, menu=menu)
            self.stdout.write(self.style.SUCCESS('Created admin user: admin / admin123'))
        else:
            self.stdout.write(self.style.WARNING('Admin user already exists — skipping.'))

        # ── Demo staff user ────────────────────────────────────────────────────
        if not User.objects.filter(username='staff').exists():
            staff_user = User.objects.create_user(
                username='staff',
                password='staff123',
                full_name='Demo Staff',
                email='staff@fixsewa.com',
                is_active=True,
                is_approved=True,
            )
            UserRole.objects.create(user=staff_user, role=staff_role)
            # Staff gets Appointments and POS menus
            for name in ('Appointments', 'POS', 'Invoices'):
                if name in menus:
                    UserMenu.objects.create(user=staff_user, menu=menus[name])
            self.stdout.write(self.style.SUCCESS('Created staff user: staff / staff123'))
        else:
            self.stdout.write(self.style.WARNING('Staff user already exists — skipping.'))

        self.stdout.write(self.style.SUCCESS('Seeding complete.'))
