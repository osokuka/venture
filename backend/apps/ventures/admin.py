from django.contrib import admin
from .models import VentureProduct, VentureProfile, Founder, TeamMember, VentureNeed, VentureDocument


@admin.register(VentureProfile)
class VentureProfileAdmin(admin.ModelAdmin):
    list_display = ('company_name', 'user', 'sector', 'created_at', 'updated_at')
    list_filter = ('sector', 'created_at')
    search_fields = ('company_name', 'user__email', 'user__full_name')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Company Information', {
            'fields': ('user', 'company_name', 'sector', 'short_description', 'website', 'linkedin_url', 'address', 'year_founded', 'employees_count')
        }),
        ('Founder Information', {
            'fields': ('founder_name', 'founder_linkedin', 'founder_role')
        }),
        ('Additional Information', {
            'fields': ('customers', 'key_metrics', 'needs', 'phone')
        }),
        ('Media', {
            'fields': ('logo', 'logo_url')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(VentureProduct)
class VentureProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'industry_sector', 'status', 'is_active', 'created_at')
    list_filter = ('status', 'is_active', 'industry_sector', 'created_at')
    search_fields = ('name', 'user__email')
    readonly_fields = ('created_at', 'updated_at', 'submitted_at', 'approved_at')


@admin.register(Founder)
class FounderAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'product', 'email', 'created_at')
    search_fields = ('full_name', 'email')


@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ('name', 'product', 'role_title', 'created_at')
    search_fields = ('name', 'role_title')


@admin.register(VentureNeed)
class VentureNeedAdmin(admin.ModelAdmin):
    list_display = ('product', 'need_type', 'created_at')
    list_filter = ('need_type',)


@admin.register(VentureDocument)
class VentureDocumentAdmin(admin.ModelAdmin):
    list_display = ('product', 'document_type', 'file_size', 'uploaded_at')
    list_filter = ('document_type',)
