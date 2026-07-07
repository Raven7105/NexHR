from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User

# Register your models here.

class UserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Informations NexHR", {"fields": ("company", "role")}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ("Informations NexHR", {"fields": ("company", "role")}),
    )
    
    list_display = ("email", "username", "role", "company", "is_active")

admin.site.register(User, UserAdmin)
