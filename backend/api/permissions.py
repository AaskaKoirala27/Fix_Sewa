from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Only users with the Admin role can access."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.user_roles.filter(role__role_name='Admin', role__is_active=True).exists()
        )


class IsStaffOrAdmin(BasePermission):
    """Users with Admin or Staff roles can access."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.user_roles.filter(
                role__role_name__in=['Admin', 'Staff'],
                role__is_active=True
            ).exists()
        )
