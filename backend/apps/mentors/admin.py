from django.contrib import admin
from .models import MentorProfile


@admin.register(MentorProfile)
class MentorProfileAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'job_title', 'company', 'user', 'status', 'visible_to_ventures', 'created_at')
    list_filter = ('status', 'visible_to_ventures', 'engagement_type', 'created_at')
    search_fields = ('full_name', 'company', 'user__email')
