"""
Admin configuration for investors app.
"""
from django.contrib import admin
from .models import InvestorProfile, InvestorVisibleToVenture


@admin.register(InvestorProfile)
class InvestorProfileAdmin(admin.ModelAdmin):
    """Admin interface for InvestorProfile."""
    list_display = ('full_name', 'organization_name', 'user', 'status', 'visible_to_ventures', 'created_at')
    list_filter = ('status', 'visible_to_ventures', 'created_at')
    search_fields = ('full_name', 'organization_name', 'user__email', 'email')
    readonly_fields = ('id', 'created_at', 'updated_at', 'submitted_at', 'approved_at')
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'full_name', 'organization_name', 'email', 'phone')
        }),
        ('Profile Details', {
            'fields': ('linkedin_or_website', 'investment_experience_years', 'deals_count',
                      'stage_preferences', 'industry_preferences', 'average_ticket_size')
        }),
        ('Visibility & Status', {
            'fields': ('visible_to_ventures', 'status', 'submitted_at', 'approved_at')
        }),
        ('Timestamps', {
            'fields': ('id', 'created_at', 'updated_at')
        }),
    )


@admin.register(InvestorVisibleToVenture)
class InvestorVisibleToVentureAdmin(admin.ModelAdmin):
    """Admin interface for InvestorVisibleToVenture."""
    list_display = ('investor', 'venture_user', 'granted_at')
    list_filter = ('granted_at',)
    search_fields = ('investor__full_name', 'investor__organization_name', 'venture_user__email')
    readonly_fields = ('id', 'granted_at')
    fieldsets = (
        ('Visibility Grant', {
            'fields': ('investor', 'venture_user', 'granted_at')
        }),
        ('Metadata', {
            'fields': ('id',)
        }),
    )
