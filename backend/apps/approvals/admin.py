from django.contrib import admin
from .models import ReviewRequest


@admin.register(ReviewRequest)
class ReviewRequestAdmin(admin.ModelAdmin):
    list_display = ('content_object', 'submitted_by', 'status', 'reviewer', 'reviewed_at', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('submitted_by__email', 'reviewer__email')
    readonly_fields = ('id', 'created_at', 'updated_at')
