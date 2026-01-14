"""
URL configuration for ventures app.
"""
from django.urls import path
from .views import (
    ProductListCreateView,
    ProductDetailView,
    activate_product,
    submit_product,
    PublicProductListView,
    PublicProductDetailView,
    AdminProductListView,
    AdminProductDetailView,
    upload_pitch_deck,
    list_product_documents,
    delete_product_document,
    TeamMemberListCreateView,
    TeamMemberDetailView,
    FounderListCreateView,
    FounderDetailView
)

urlpatterns = [
    # Product management (user endpoints)
    path('products', ProductListCreateView.as_view(), name='product_list_create'),
    path('products/<uuid:product_id>', ProductDetailView.as_view(), name='product_detail'),
    path('products/<uuid:product_id>/activate', activate_product, name='product_activate'),
    path('products/<uuid:product_id>/submit', submit_product, name='product_submit'),
    
    # Document management (pitch deck CRUD)
    path('products/<uuid:product_id>/documents/pitch-deck', upload_pitch_deck, name='upload_pitch_deck'),
    path('products/<uuid:product_id>/documents', list_product_documents, name='list_product_documents'),
    path('products/<uuid:product_id>/documents/<uuid:doc_id>', delete_product_document, name='delete_product_document'),
    
    # Team member management
    path('products/<uuid:product_id>/team-members', TeamMemberListCreateView.as_view(), name='team_member_list_create'),
    path('products/<uuid:product_id>/team-members/<uuid:id>', TeamMemberDetailView.as_view(), name='team_member_detail'),
    
    # Founder management
    path('products/<uuid:product_id>/founders', FounderListCreateView.as_view(), name='founder_list_create'),
    path('products/<uuid:product_id>/founders/<uuid:id>', FounderDetailView.as_view(), name='founder_detail'),
    
    # Public product views (approved users only)
    path('public', PublicProductListView.as_view(), name='public_products'),
    path('<uuid:id>', PublicProductDetailView.as_view(), name='public_product_detail'),
]
