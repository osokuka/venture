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
    VentureProfileCreateUpdateView,
    upload_pitch_deck,
    update_pitch_deck_metadata,
    list_product_documents,
    delete_product_document,
    TeamMemberListCreateView,
    TeamMemberDetailView,
    FounderListCreateView,
    FounderDetailView,
    download_pitch_deck,
    view_pitch_deck,
    grant_pitch_deck_access,
    revoke_pitch_deck_access,
    list_pitch_deck_access,
    share_pitch_deck,
    list_pitch_deck_shares,
    request_pitch_deck,
    list_pitch_deck_requests,
    respond_to_pitch_deck_request,
    get_pitch_deck_analytics
)

urlpatterns = [
    # Profile management (user endpoints)
    path('profile', VentureProfileCreateUpdateView.as_view(), name='venture_profile_create'),
    path('profile/me', VentureProfileCreateUpdateView.as_view(), name='venture_profile_me'),
    
    # Product management (user endpoints)
    path('products', ProductListCreateView.as_view(), name='product_list_create'),
    path('products/<uuid:product_id>', ProductDetailView.as_view(), name='product_detail'),
    path('products/<uuid:product_id>/activate', activate_product, name='product_activate'),
    path('products/<uuid:product_id>/submit', submit_product, name='product_submit'),
    
    # Document management (pitch deck CRUD)
    path('products/<uuid:product_id>/documents/pitch-deck', upload_pitch_deck, name='upload_pitch_deck'),
    path('products/<uuid:product_id>/documents', list_product_documents, name='list_product_documents'),
    path('products/<uuid:product_id>/documents/<uuid:doc_id>/metadata', update_pitch_deck_metadata, name='update_pitch_deck_metadata'),
    path('products/<uuid:product_id>/documents/<uuid:doc_id>', delete_product_document, name='delete_product_document'),
    
    # Pitch deck access (download/view) - VL-823
    path('products/<uuid:product_id>/documents/<uuid:doc_id>/download', download_pitch_deck, name='download_pitch_deck'),
    path('products/<uuid:product_id>/documents/<uuid:doc_id>/view', view_pitch_deck, name='view_pitch_deck'),
    
    # Pitch deck access control - VL-824
    path('products/<uuid:product_id>/documents/<uuid:doc_id>/access', list_pitch_deck_access, name='list_pitch_deck_access'),
    path('products/<uuid:product_id>/documents/<uuid:doc_id>/access/grant', grant_pitch_deck_access, name='grant_pitch_deck_access'),
    path('products/<uuid:product_id>/documents/<uuid:doc_id>/access/revoke', revoke_pitch_deck_access, name='revoke_pitch_deck_access'),
    
    # Pitch deck sharing - VL-825
    path('products/<uuid:product_id>/documents/<uuid:doc_id>/share', share_pitch_deck, name='share_pitch_deck'),
    path('products/<uuid:product_id>/documents/<uuid:doc_id>/shares', list_pitch_deck_shares, name='list_pitch_deck_shares'),
    
    # Pitch deck requests - VL-826
    path('products/<uuid:product_id>/documents/<uuid:doc_id>/request', request_pitch_deck, name='request_pitch_deck'),
    path('products/<uuid:product_id>/documents/<uuid:doc_id>/requests', list_pitch_deck_requests, name='list_pitch_deck_requests'),
    path('products/<uuid:product_id>/documents/<uuid:doc_id>/requests/<uuid:request_id>/respond', respond_to_pitch_deck_request, name='respond_to_pitch_deck_request'),
    
    # Pitch deck analytics - VL-828
    path('products/<uuid:product_id>/documents/<uuid:doc_id>/analytics', get_pitch_deck_analytics, name='get_pitch_deck_analytics'),
    
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
