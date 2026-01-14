"""
URL configuration for VentureUP Link project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from apps.accounts.views import AdminUserListCreateView, AdminUserDetailView, admin_stats
from apps.ventures.views import AdminProductListView, AdminProductDetailView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/admin/stats', admin_stats, name='admin_stats'),
    path('api/admin/users', AdminUserListCreateView.as_view(), name='admin_users'),
    path('api/admin/users/<uuid:pk>', AdminUserDetailView.as_view(), name='admin_user_detail'),
    path('api/admin/products', AdminProductListView.as_view(), name='admin_products'),
    path('api/admin/products/<uuid:id>', AdminProductDetailView.as_view(), name='admin_product_detail'),
    path('api/ventures/', include('apps.ventures.urls')),
    path('api/investors/', include('apps.investors.urls')),
    path('api/mentors/', include('apps.mentors.urls')),
    path('api/reviews/', include('apps.approvals.urls')),
    path('api/matches/', include('apps.matching.urls')),
    path('api/messages/', include('apps.messaging.urls')),
    path('api/content/', include('apps.content.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
