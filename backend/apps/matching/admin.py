from django.contrib import admin
from .models import Match


@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display = ('product', 'target_type', 'score', 'refreshed_at', 'created_at')
    list_filter = ('target_type', 'refreshed_at')
    search_fields = ('product__name',)
