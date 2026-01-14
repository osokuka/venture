from django.contrib import admin
from .models import InvestorProfile


@admin.register(InvestorProfile)
class InvestorProfileAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'organization_name', 'user', 'status', 'visible_to_ventures', 'created_at')
    list_filter = ('status', 'visible_to_ventures', 'created_at')
    search_fields = ('full_name', 'organization_name', 'user__email')
