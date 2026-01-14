"""
Views for ventures app.
"""
import os
from django.utils import timezone
from django.db.models import Q
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import MultiPartParser, FormParser

from shared.permissions import IsApprovedUser, IsAdminOrReviewer
from apps.ventures.models import VentureProduct, VentureDocument, TeamMember, Founder
from apps.ventures.serializers import (
    VentureProductSerializer,
    VentureProductCreateSerializer,
    VentureProductUpdateSerializer,
    VentureProductActivateSerializer,
    VentureDocumentSerializer,
    VentureDocumentCreateSerializer,
    TeamMemberSerializer,
    FounderSerializer
)
from apps.approvals.models import ReviewRequest
from django.contrib.contenttypes.models import ContentType


class ProductListCreateView(generics.ListCreateAPIView):
    """
    List user's products or create a new product.
    
    GET /api/ventures/products - List all user's products
    POST /api/ventures/products - Create new product (max 3)
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return only products owned by the current user."""
        return VentureProduct.objects.filter(user=self.request.user).order_by('-created_at')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return VentureProductCreateSerializer
        return VentureProductSerializer


class ProductDetailView(generics.RetrieveUpdateAPIView):
    """
    Retrieve or update a product.
    
    GET /api/ventures/products/{id} - Get product details
    PATCH /api/ventures/products/{id} - Update product (only if DRAFT/REJECTED)
    """
    permission_classes = [IsAuthenticated]
    serializer_class = VentureProductUpdateSerializer
    lookup_field = 'id'
    
    def get_queryset(self):
        """Return products owned by the current user."""
        return VentureProduct.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return VentureProductSerializer
        return VentureProductUpdateSerializer


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def activate_product(request, product_id):
    """
    Activate or deactivate a product.
    
    PATCH /api/ventures/products/{id}/activate
    Body: { "is_active": true/false }
    """
    try:
        product = VentureProduct.objects.get(id=product_id, user=request.user)
    except VentureProduct.DoesNotExist:
        return Response(
            {'detail': 'Product not found or you do not have permission.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = VentureProductActivateSerializer(
        product,
        data=request.data,
        partial=True
    )
    serializer.is_valid(raise_exception=True)
    serializer.save()
    
    return Response(
        {'detail': f'Product {"activated" if product.is_active else "deactivated"} successfully.'},
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_product(request, product_id):
    """
    Submit a product for admin approval.
    
    POST /api/ventures/products/{id}/submit
    Creates a ReviewRequest for the product.
    """
    try:
        product = VentureProduct.objects.get(id=product_id, user=request.user)
    except VentureProduct.DoesNotExist:
        return Response(
            {'detail': 'Product not found or you do not have permission.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if product can be submitted
    if product.status not in ['DRAFT', 'REJECTED']:
        return Response(
            {'detail': f'Product with status {product.status} cannot be submitted.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if there's already a pending review
    content_type = ContentType.objects.get_for_model(VentureProduct)
    existing_review = ReviewRequest.objects.filter(
        content_type=content_type,
        object_id=product.id,
        status='SUBMITTED'
    ).exists()
    
    if existing_review:
        return Response(
            {'detail': 'This product already has a pending review request.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create review request
    review_request = ReviewRequest.objects.create(
        content_type=content_type,
        object_id=product.id,
        submitted_by=request.user,
        status='SUBMITTED'
    )
    
    # Update product status
    product.status = 'SUBMITTED'
    product.submitted_at = timezone.now()
    product.save(update_fields=['status', 'submitted_at'])
    
    return Response(
        {'detail': 'Product submitted for approval.', 'review_id': str(review_request.id)},
        status=status.HTTP_200_OK
    )


class PublicProductListView(generics.ListAPIView):
    """
    List approved and active products (public view).
    
    GET /api/ventures/public
    Only returns products with status=APPROVED and is_active=True
    """
    permission_classes = [IsAuthenticated, IsApprovedUser]
    serializer_class = VentureProductSerializer
    
    def get_queryset(self):
        """Return only approved and active products."""
        return VentureProduct.objects.filter(
            status='APPROVED',
            is_active=True
        ).select_related('user').order_by('-created_at')


class PublicProductDetailView(generics.RetrieveAPIView):
    """
    Get a single approved product (public view).
    
    GET /api/ventures/{id}
    Only returns products with status=APPROVED and is_active=True
    """
    permission_classes = [IsAuthenticated, IsApprovedUser]
    serializer_class = VentureProductSerializer
    lookup_field = 'id'
    
    def get_queryset(self):
        """Return only approved and active products."""
        return VentureProduct.objects.filter(
            status='APPROVED',
            is_active=True
        ).select_related('user')


# Admin endpoints for product management
class AdminProductListView(generics.ListAPIView):
    """
    Admin endpoint to list all products with filtering.
    
    GET /api/admin/products
    Query params: ?user_id=..., ?status=..., ?is_active=...
    """
    permission_classes = [IsAuthenticated, IsAdminOrReviewer]
    serializer_class = VentureProductSerializer
    
    def get_queryset(self):
        queryset = VentureProduct.objects.select_related('user').all()
        
        # Security: Validate and sanitize query parameters to prevent injection
        # Filter by user
        user_id = self.request.query_params.get('user_id')
        if user_id:
            # Validate UUID format to prevent injection
            try:
                import uuid
                uuid.UUID(str(user_id))
                queryset = queryset.filter(user_id=user_id)
            except (ValueError, TypeError):
                # Invalid UUID format, ignore filter
                pass
        
        # Filter by status - whitelist allowed values
        status_filter = self.request.query_params.get('status')
        if status_filter:
            allowed_statuses = ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'SUSPENDED']
            if status_filter.upper() in allowed_statuses:
                queryset = queryset.filter(status=status_filter.upper())
        
        # Filter by is_active - validate boolean
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            is_active_lower = str(is_active).lower()
            if is_active_lower in ('true', '1', 'yes'):
                queryset = queryset.filter(is_active=True)
            elif is_active_lower in ('false', '0', 'no'):
                queryset = queryset.filter(is_active=False)
        
        return queryset.order_by('-created_at')


class AdminProductDetailView(generics.RetrieveDestroyAPIView):
    """
    Admin endpoint to retrieve or delete a product.
    
    GET /api/admin/products/{id} - Get product details
    DELETE /api/admin/products/{id} - Delete product (admin only)
    """
    permission_classes = [IsAuthenticated, IsAdminOrReviewer]
    serializer_class = VentureProductSerializer
    lookup_field = 'id'
    queryset = VentureProduct.objects.select_related('user').all()
    
    def perform_destroy(self, instance):
        """Delete product (cascades to related models)."""
        # Log deletion for audit trail
        product_name = instance.name
        user_email = instance.user.email
        # Product will be deleted via CASCADE
        return super().perform_destroy(instance)


# Document (Pitch Deck) Management Endpoints
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_pitch_deck(request, product_id):
    """
    Upload a pitch deck document for a product with metadata.
    
    POST /api/ventures/products/{id}/documents/pitch-deck
    Body: multipart/form-data with 'file' field and optional metadata fields:
    - problem_statement
    - solution_description
    - target_market
    - traction_metrics (JSON)
    - funding_amount
    - funding_stage
    - use_of_funds
    """
    try:
        product = VentureProduct.objects.get(id=product_id, user=request.user)
    except VentureProduct.DoesNotExist:
        return Response(
            {'detail': 'Product not found or you do not have permission.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Security: Only allow updates if product is in DRAFT or REJECTED status
    if product.status not in ['DRAFT', 'REJECTED']:
        return Response(
            {'detail': f'Cannot upload pitch deck for product with status {product.status}. Only DRAFT or REJECTED products can be modified.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if file is provided
    if 'file' not in request.FILES:
        return Response(
            {'detail': 'No file provided.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    file = request.FILES['file']
    
    # Security: Validate file extension first (prevents MIME type spoofing)
    allowed_extensions = ['.pdf']
    file_name = file.name.lower()
    if not any(file_name.endswith(ext) for ext in allowed_extensions):
        return Response(
            {'detail': 'Only PDF files are allowed for pitch decks.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate file type (PDF only) - MIME type check
    allowed_types = ['application/pdf']
    if file.content_type not in allowed_types:
        return Response(
            {'detail': 'Only PDF files are allowed for pitch decks.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate file size (max 10MB)
    max_size = 10 * 1024 * 1024  # 10MB
    if file.size > max_size:
        return Response(
            {'detail': 'File size exceeds 10MB limit.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Security: Additional validation - check file is not empty
    if file.size == 0:
        return Response(
            {'detail': 'File cannot be empty.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Parse traction_metrics if provided as string
    traction_metrics = None
    if 'traction_metrics' in request.data:
        try:
            import json
            if isinstance(request.data['traction_metrics'], str):
                traction_metrics = json.loads(request.data['traction_metrics'])
            else:
                traction_metrics = request.data['traction_metrics']
        except (json.JSONDecodeError, TypeError):
            return Response(
                {'detail': 'Invalid traction_metrics format. Must be valid JSON.'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # Create document record with metadata
    document = VentureDocument.objects.create(
        product=product,
        document_type='PITCH_DECK',
        file=file,
        file_size=file.size,
        mime_type=file.content_type,
        problem_statement=request.data.get('problem_statement', ''),
        solution_description=request.data.get('solution_description', ''),
        target_market=request.data.get('target_market', ''),
        traction_metrics=traction_metrics,
        funding_amount=request.data.get('funding_amount', ''),
        funding_stage=request.data.get('funding_stage', ''),
        use_of_funds=request.data.get('use_of_funds', '')
    )
    
    serializer = VentureDocumentSerializer(document)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_product_documents(request, product_id):
    """
    List all documents for a product.
    
    GET /api/ventures/products/{id}/documents
    """
    try:
        product = VentureProduct.objects.get(id=product_id, user=request.user)
    except VentureProduct.DoesNotExist:
        return Response(
            {'detail': 'Product not found or you do not have permission.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    documents = VentureDocument.objects.filter(product=product).order_by('-uploaded_at')
    serializer = VentureDocumentSerializer(documents, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_product_document(request, product_id, doc_id):
    """
    Delete a document from a product.
    
    DELETE /api/ventures/products/{id}/documents/{doc_id}
    """
    try:
        product = VentureProduct.objects.get(id=product_id, user=request.user)
    except VentureProduct.DoesNotExist:
        return Response(
            {'detail': 'Product not found or you do not have permission.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        document = VentureDocument.objects.get(id=doc_id, product=product)
    except VentureDocument.DoesNotExist:
        return Response(
            {'detail': 'Document not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Delete the file from storage
    # Security: Use Django's file storage delete method instead of direct os.remove
    # This prevents path traversal attacks and ensures proper file handling
    if document.file:
        try:
            document.file.delete(save=False)
        except Exception:
            # If file doesn't exist, continue with record deletion
            pass
    
    # Delete the document record
    document.delete()
    
    return Response(
        {'detail': 'Document deleted successfully.'},
        status=status.HTTP_200_OK
    )


# Team Member Management Endpoints
class TeamMemberListCreateView(generics.ListCreateAPIView):
    """
    List or create team members for a product.
    
    GET /api/ventures/products/{product_id}/team-members - List team members
    POST /api/ventures/products/{product_id}/team-members - Create team member
    """
    permission_classes = [IsAuthenticated]
    serializer_class = TeamMemberSerializer
    
    def get_queryset(self):
        """Return team members for the product owned by the current user."""
        product_id = self.kwargs['product_id']
        try:
            product = VentureProduct.objects.get(id=product_id, user=self.request.user)
            return TeamMember.objects.filter(product=product).order_by('created_at')
        except VentureProduct.DoesNotExist:
            return TeamMember.objects.none()
    
    def perform_create(self, serializer):
        """Create team member and associate with product."""
        product_id = self.kwargs['product_id']
        try:
            product = VentureProduct.objects.get(id=product_id, user=self.request.user)
            # Security: Only allow updates if product is in DRAFT or REJECTED status
            if product.status not in ['DRAFT', 'REJECTED']:
                raise PermissionDenied(
                    f"Cannot add team members to product with status '{product.status}'. "
                    "Only DRAFT or REJECTED products can be modified."
                )
            serializer.save(product=product)
        except VentureProduct.DoesNotExist:
            raise PermissionDenied('Product not found or you do not have permission.')


class TeamMemberDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a team member.
    
    GET /api/ventures/products/{product_id}/team-members/{id} - Get team member
    PATCH /api/ventures/products/{product_id}/team-members/{id} - Update team member
    DELETE /api/ventures/products/{product_id}/team-members/{id} - Delete team member
    """
    permission_classes = [IsAuthenticated]
    serializer_class = TeamMemberSerializer
    lookup_field = 'id'
    
    def get_queryset(self):
        """Return team members for products owned by the current user."""
        product_id = self.kwargs['product_id']
        try:
            product = VentureProduct.objects.get(id=product_id, user=self.request.user)
            return TeamMember.objects.filter(product=product)
        except VentureProduct.DoesNotExist:
            return TeamMember.objects.none()
    
    def perform_update(self, serializer):
        """Update team member with permission check."""
        team_member = serializer.instance
        product = team_member.product
        
        # Security: Only allow updates if product is in DRAFT or REJECTED status
        if product.status not in ['DRAFT', 'REJECTED']:
            raise PermissionDenied(
                f"Cannot update team members for product with status '{product.status}'. "
                "Only DRAFT or REJECTED products can be modified."
            )
        
        # Security: Ensure user owns the product
        if product.user != self.request.user:
            raise PermissionDenied('You do not have permission to update this team member.')
        
        serializer.save()
    
    def perform_destroy(self, instance):
        """Delete team member with permission check."""
        product = instance.product
        
        # Security: Only allow deletion if product is in DRAFT or REJECTED status
        if product.status not in ['DRAFT', 'REJECTED']:
            raise PermissionDenied(
                f"Cannot delete team members for product with status '{product.status}'. "
                "Only DRAFT or REJECTED products can be modified."
            )
        
        # Security: Ensure user owns the product
        if product.user != self.request.user:
            raise PermissionDenied('You do not have permission to delete this team member.')
        
        instance.delete()


# Founder Management Endpoints
class FounderListCreateView(generics.ListCreateAPIView):
    """
    List or create founders for a product.
    
    GET /api/ventures/products/{product_id}/founders - List founders
    POST /api/ventures/products/{product_id}/founders - Create founder
    """
    permission_classes = [IsAuthenticated]
    serializer_class = FounderSerializer
    
    def get_queryset(self):
        """Return founders for the product owned by the current user."""
        product_id = self.kwargs['product_id']
        try:
            product = VentureProduct.objects.get(id=product_id, user=self.request.user)
            return Founder.objects.filter(product=product).order_by('created_at')
        except VentureProduct.DoesNotExist:
            return Founder.objects.none()
    
    def perform_create(self, serializer):
        """Create founder and associate with product."""
        product_id = self.kwargs['product_id']
        try:
            product = VentureProduct.objects.get(id=product_id, user=self.request.user)
            # Security: Only allow updates if product is in DRAFT or REJECTED status
            if product.status not in ['DRAFT', 'REJECTED']:
                raise PermissionDenied(
                    f"Cannot add founders to product with status '{product.status}'. "
                    "Only DRAFT or REJECTED products can be modified."
                )
            serializer.save(product=product)
        except VentureProduct.DoesNotExist:
            raise PermissionDenied('Product not found or you do not have permission.')


class FounderDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a founder.
    
    GET /api/ventures/products/{product_id}/founders/{id} - Get founder
    PATCH /api/ventures/products/{product_id}/founders/{id} - Update founder
    DELETE /api/ventures/products/{product_id}/founders/{id} - Delete founder
    """
    permission_classes = [IsAuthenticated]
    serializer_class = FounderSerializer
    lookup_field = 'id'
    
    def get_queryset(self):
        """Return founders for products owned by the current user."""
        product_id = self.kwargs['product_id']
        try:
            product = VentureProduct.objects.get(id=product_id, user=self.request.user)
            return Founder.objects.filter(product=product)
        except VentureProduct.DoesNotExist:
            return Founder.objects.none()
    
    def perform_update(self, serializer):
        """Update founder with permission check."""
        founder = serializer.instance
        product = founder.product
        
        # Security: Only allow updates if product is in DRAFT or REJECTED status
        if product.status not in ['DRAFT', 'REJECTED']:
            raise PermissionDenied(
                f"Cannot update founders for product with status '{product.status}'. "
                "Only DRAFT or REJECTED products can be modified."
            )
        
        # Security: Ensure user owns the product
        if product.user != self.request.user:
            raise PermissionDenied('You do not have permission to update this founder.')
        
        serializer.save()
    
    def perform_destroy(self, instance):
        """Delete founder with permission check."""
        product = instance.product
        
        # Security: Only allow deletion if product is in DRAFT or REJECTED status
        if product.status not in ['DRAFT', 'REJECTED']:
            raise PermissionDenied(
                f"Cannot delete founders for product with status '{product.status}'. "
                "Only DRAFT or REJECTED products can be modified."
            )
        
        # Security: Ensure user owns the product
        if product.user != self.request.user:
            raise PermissionDenied('You do not have permission to delete this founder.')
        
        instance.delete()
