from django.contrib import admin
from .models import FAQItem, SuccessStory, Resource, ContactInfo


@admin.register(FAQItem)
class FAQItemAdmin(admin.ModelAdmin):
    list_display = ('question', 'order', 'published', 'created_at')
    list_filter = ('published', 'created_at')
    search_fields = ('question', 'answer')


@admin.register(SuccessStory)
class SuccessStoryAdmin(admin.ModelAdmin):
    list_display = ('title', 'product', 'published', 'created_at')
    list_filter = ('published', 'created_at')
    search_fields = ('title', 'summary')


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'published', 'created_at')
    list_filter = ('category', 'published', 'created_at')
    search_fields = ('title', 'description')


@admin.register(ContactInfo)
class ContactInfoAdmin(admin.ModelAdmin):
    list_display = ('email', 'phone', 'created_at')
    search_fields = ('email', 'phone')
