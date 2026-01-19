from django.contrib import admin
from .models import User, EmailVerificationToken, PasswordResetToken


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'full_name', 'role', 'is_email_verified', 'is_active', 'date_joined')
    list_filter = ('role', 'is_email_verified', 'is_active', 'date_joined')
    search_fields = ('email', 'full_name')
    readonly_fields = ('id', 'date_joined', 'last_login', 'created_at', 'updated_at')


@admin.register(EmailVerificationToken)
class EmailVerificationTokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'token', 'expires_at', 'used_at', 'created_at')
    list_filter = ('used_at', 'expires_at')
    search_fields = ('user__email', 'token')
    readonly_fields = ('id', 'created_at')


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'token', 'expires_at', 'used_at', 'ip_address', 'created_at')
    list_filter = ('used_at', 'expires_at', 'created_at')
    search_fields = ('user__email', 'token', 'ip_address')
    readonly_fields = ('id', 'created_at')
    ordering = ['-created_at']
