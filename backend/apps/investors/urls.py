"""
URL configuration for investors app.
"""
from django.urls import path
from .views import (
    InvestorProfileCreateUpdateView,
    submit_investor_profile,
    PublicInvestorListView,
    PublicInvestorDetailView,
    list_shared_pitch_decks,
    follow_pitch_deck,
    unfollow_pitch_deck,
    commit_to_invest,
    update_commitment,
    withdraw_commitment,
    complete_deal,
    get_investor_portfolio
)

urlpatterns = [
    # Profile management (user endpoints)
    path('profile', InvestorProfileCreateUpdateView.as_view(), name='investor_profile_create'),
    path('profile/me', InvestorProfileCreateUpdateView.as_view(), name='investor_profile_me'),
    path('profile/submit', submit_investor_profile, name='investor_profile_submit'),
    
    # Shared pitch decks (investor only)
    path('shared-pitch-decks', list_shared_pitch_decks, name='investor_shared_pitch_decks'),
    
    # Portfolio (investor only)
    path('portfolio', get_investor_portfolio, name='investor_portfolio'),
    
    # Pitch deck engagement (investor only)
    path('products/<uuid:product_id>/documents/<uuid:doc_id>/follow', follow_pitch_deck, name='investor_follow_pitch_deck'),
    path('products/<uuid:product_id>/documents/<uuid:doc_id>/unfollow', unfollow_pitch_deck, name='investor_unfollow_pitch_deck'),
    path('products/<uuid:product_id>/documents/<uuid:doc_id>/commit', commit_to_invest, name='investor_commit_to_invest'),
    path('products/<uuid:product_id>/commitments/<uuid:commitment_id>/update', update_commitment, name='investor_update_commitment'),
    path('products/<uuid:product_id>/commitments/<uuid:commitment_id>/withdraw', withdraw_commitment, name='investor_withdraw_commitment'),
    path('products/<uuid:product_id>/commitments/<uuid:commitment_id>/complete', complete_deal, name='investor_complete_deal'),
    
    # Public investor views (approved users only)
    path('public', PublicInvestorListView.as_view(), name='public_investors'),
    path('<uuid:id>', PublicInvestorDetailView.as_view(), name='public_investor_detail'),
]
