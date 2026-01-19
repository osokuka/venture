"""
Celery tasks for accounts app.
"""
import base64
import os
from pathlib import Path
from celery import shared_task
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.urls import reverse
from django.utils import timezone
from .models import EmailVerificationToken

# Load logo for email templates (prefers WebP for smaller size, falls back to SVG/PNG)
# Cache the logo to avoid reading file on every email
_logo_cache = None

def get_logo_for_email():
    """Load logo file and return as inline SVG or base64 data URI (WebP/PNG) for email templates.
    Prioritizes WebP format for optimal file size and quality."""
    global _logo_cache
    
    # Return cached version if available
    if _logo_cache is not None:
        return _logo_cache
    
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        # Use BASE_DIR from Django settings for reliable path resolution
        from django.conf import settings as django_settings
        base_dir = Path(django_settings.BASE_DIR)
        
        # Try multiple possible locations for the logo file (prefer WebP, then SVG, then PNG)
        possible_paths = [
            # Option 1: WebP logo (preferred - smaller file size, good quality)
            base_dir / 'static' / 'logos' / 'ventureuplink.webp',
            base_dir / 'staticfiles' / 'logos' / 'ventureuplink.webp',
            base_dir.parent / 'frontend' / 'public' / 'logos' / 'ventureuplink.webp',
            base_dir.parent / 'frontend' / 'src' / 'assets' / 'logos' / 'ventureuplink.webp',
            # Option 2: SVG logo (fallback - scalable)
            base_dir / 'static' / 'logos' / 'ventureuplink.svg',
            base_dir.parent / 'frontend' / 'public' / 'logos' / 'ventureuplink.svg',
            # Option 3: PNG logo (final fallback)
            base_dir / 'static' / 'logos' / 'ventureuplink.png',
            base_dir / 'staticfiles' / 'logos' / 'ventureuplink.png',
            base_dir.parent / 'frontend' / 'public' / 'logos' / 'ventureuplink.png',
            base_dir.parent / 'frontend' / 'src' / 'assets' / 'logos' / 'ventureuplink.png',
        ]
        
        for logo_path in possible_paths:
            if logo_path.exists():
                try:
                    file_ext = logo_path.suffix.lower()
                    if file_ext == '.svg':
                        # Read SVG as text and embed directly (smaller and better quality)
                        with open(logo_path, 'r', encoding='utf-8') as f:
                            svg_content = f.read()
                            # Inline SVG for email (most modern email clients support it)
                            _logo_cache = svg_content
                            logger.info(f"Successfully loaded SVG logo from {logo_path} ({len(svg_content)} bytes)")
                            return _logo_cache
                    elif file_ext == '.webp':
                        # WebP - convert to base64 (WebP has better compression than PNG)
                        with open(logo_path, 'rb') as f:
                            logo_data = f.read()
                            if len(logo_data) > 0:
                                logo_base64 = base64.b64encode(logo_data).decode('utf-8')
                                _logo_cache = f'data:image/webp;base64,{logo_base64}'
                                logger.info(f"Successfully loaded WebP logo from {logo_path} ({len(logo_data)} bytes)")
                                return _logo_cache
                    else:
                        # PNG - convert to base64
                        with open(logo_path, 'rb') as f:
                            logo_data = f.read()
                            if len(logo_data) > 0:
                                logo_base64 = base64.b64encode(logo_data).decode('utf-8')
                                _logo_cache = f'data:image/png;base64,{logo_base64}'
                                logger.info(f"Successfully loaded PNG logo from {logo_path} ({len(logo_data)} bytes)")
                                return _logo_cache
                except Exception as e:
                    logger.warning(f"Failed to read logo from {logo_path}: {str(e)}")
                    continue
        
        # If file not found, use inline SVG as fallback (embedded in code)
        logger.warning("Logo file not found. Using embedded SVG fallback.")
        _logo_cache = """<svg viewBox="0 0 800 800" width="200" height="200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="mainGradient" x1="150" y1="550" x2="650" y2="150" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0052D4" />
      <stop offset="50%" stop-color="#22C1C3" />
      <stop offset="100%" stop-color="#76E32D" />
    </linearGradient>
    <linearGradient id="orangeGradient" x1="550" y1="650" x2="650" y2="300" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#F2994A" />
      <stop offset="100%" stop-color="#F2C94C" />
    </linearGradient>
  </defs>
  <path d="M175 515 L400 340 L400 550" stroke="url(#mainGradient)" stroke-width="60" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M500 450 L600 550 L640 300" stroke="url(#orangeGradient)" stroke-width="60" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M400 340 L620 150" stroke="url(#mainGradient)" stroke-width="60" stroke-linecap="round" />
  <path d="M580 120 L680 150 L620 250 Z" fill="#76E32D" />
  <circle cx="175" cy="515" r="35" stroke="#0052D4" stroke-width="15" fill="white" />
  <circle cx="400" cy="340" r="35" stroke="#22C1C3" stroke-width="15" fill="white" />
  <circle cx="600" cy="550" r="35" stroke="#F2994A" stroke-width="15" fill="white" />
</svg>"""
        return _logo_cache
        
    except Exception as e:
        # Log error for debugging but don't fail email sending
        logger.error(f"Failed to load logo for email: {str(e)}", exc_info=True)
        # Fallback: use embedded SVG
        _logo_cache = """<svg viewBox="0 0 800 800" width="200" height="200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="mainGradient" x1="150" y1="550" x2="650" y2="150" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0052D4" />
      <stop offset="50%" stop-color="#22C1C3" />
      <stop offset="100%" stop-color="#76E32D" />
    </linearGradient>
    <linearGradient id="orangeGradient" x1="550" y1="650" x2="650" y2="300" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#F2994A" />
      <stop offset="100%" stop-color="#F2C94C" />
    </linearGradient>
  </defs>
  <path d="M175 515 L400 340 L400 550" stroke="url(#mainGradient)" stroke-width="60" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M500 450 L600 550 L640 300" stroke="url(#orangeGradient)" stroke-width="60" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M400 340 L620 150" stroke="url(#mainGradient)" stroke-width="60" stroke-linecap="round" />
  <path d="M580 120 L680 150 L620 250 Z" fill="#76E32D" />
  <circle cx="175" cy="515" r="35" stroke="#0052D4" stroke-width="15" fill="white" />
  <circle cx="400" cy="340" r="35" stroke="#22C1C3" stroke-width="15" fill="white" />
  <circle cx="600" cy="550" r="35" stroke="#F2994A" stroke-width="15" fill="white" />
</svg>"""
        return _logo_cache


def get_email_base_html(title, content, button_text=None, button_url=None, footer_note=None):
    """Generate base HTML template for emails."""
    # Use FRONTEND_URL from settings (should be set via environment variable)
    frontend_url = settings.FRONTEND_URL
    if not frontend_url:
        raise ValueError("FRONTEND_URL must be set in Django settings")
    
    button_html = ""
    if button_text and button_url:
        button_html = f"""
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
            <tr>
                <td align="center">
                    <a href="{button_url}" style="display: inline-block; padding: 14px 32px; background-color: #1f2937; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                        {button_text}
                    </a>
                </td>
            </tr>
        </table>
        """
    
    footer_note_html = ""
    if footer_note:
        footer_note_html = f"""
        <p style="margin: 24px 0 0 0; padding: 16px; background-color: #f9fafb; border-left: 4px solid #6b7280; border-radius: 4px; color: #374151; font-size: 14px; line-height: 1.6;">
            {footer_note}
        </p>
        """
    
    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6; line-height: 1.6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); max-width: 100%;">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 32px 40px; background: linear-gradient(135deg, #1f2937 0%, #111827 100%); border-radius: 12px 12px 0 0;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                                            VentureUP Link
                                        </h1>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            {content}
                            {button_html}
                            {footer_note_html}
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 32px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                            <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px; text-align: center;">
                                © 2025 VentureUP Link. All rights reserved.
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                                Provided by <a href="https://scardustech.com" style="color: #6b7280; text-decoration: none;">ScardusTech L.L.C</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""


@shared_task
def send_verification_email(user_id, token):
    """
    Send email verification email to user.
    
    Args:
        user_id: User ID
        token: Verification token
    """
    from .models import User
    
    try:
        user = User.objects.get(id=user_id)
        
        # Create verification URL
        frontend_url = settings.FRONTEND_URL
        if not frontend_url:
            raise ValueError("FRONTEND_URL must be set in Django settings")
        verification_url = f"{frontend_url}/verify-email?token={token}"
        
        subject = 'Verify your VentureUP Link account'
        
        # HTML content
        html_content = get_email_base_html(
            title=subject,
            content=f"""
            <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 24px; font-weight: 600;">
                Welcome to VentureUP Link!
            </h2>
            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">
                Hello {user.full_name or 'there'},
            </p>
            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">
                Thank you for registering with VentureUP Link! We're excited to have you join our community of entrepreneurs, investors, and mentors.
            </p>
            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">
                To complete your registration and start connecting, please verify your email address by clicking the button below:
            </p>
            """,
            button_text="Verify Email Address",
            button_url=verification_url,
            footer_note="This verification link will expire in 24 hours. If you didn't create an account, please ignore this email."
        )
        
        # Plain text content
        text_content = f"""
Hello {user.full_name or 'there'},

Thank you for registering with VentureUP Link!

Please verify your email address by clicking the link below:
{verification_url}

This link will expire in 24 hours.

If you didn't create an account, please ignore this email.

Best regards,
The VentureUP Link Team
        """
        
        # Send email with both HTML and plain text
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email]
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)
        
        return f"Verification email sent to {user.email}"
    except User.DoesNotExist:
        return f"User with id {user_id} not found"
    except Exception as e:
        return f"Error sending email: {str(e)}"


@shared_task
def send_approval_notification(user_id, approved=True, rejection_reason=None):
    """
    Send approval/rejection notification email to user.
    
    Args:
        user_id: User ID
        approved: True if approved, False if rejected
        rejection_reason: Reason for rejection (if rejected)
    """
    from .models import User
    
    try:
        user = User.objects.get(id=user_id)
        frontend_url = settings.FRONTEND_URL
        if not frontend_url:
            raise ValueError("FRONTEND_URL must be set in Django settings")
        login_url = f"{frontend_url}/login"
        
        if approved:
            subject = 'Your VentureUP Link profile has been approved!'
            
            # HTML content for approval
            html_content = get_email_base_html(
                title=subject,
                content=f"""
                <div style="text-align: center; margin-bottom: 24px;">
                    <div style="display: inline-block; width: 64px; height: 64px; background-color: #10b981; border-radius: 50%; margin-bottom: 16px;">
                        <div style="color: #ffffff; font-size: 36px; text-align: center; line-height: 64px;">✓</div>
                    </div>
                </div>
                <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 24px; font-weight: 600; text-align: center;">
                    Congratulations!
                </h2>
                <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">
                    Hello {user.full_name or 'there'},
                </p>
                <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">
                    Great news! Your profile has been <strong style="color: #10b981;">approved</strong> and is now live on VentureUP Link.
                </p>
                <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0; border-radius: 4px;">
                    <p style="margin: 0 0 12px 0; color: #065f46; font-size: 15px; font-weight: 600;">
                        You can now:
                    </p>
                    <ul style="margin: 0; padding-left: 20px; color: #047857; font-size: 15px; line-height: 1.8;">
                        <li>Browse and connect with other users</li>
                        <li>Send and receive messages</li>
                        <li>Access all platform features</li>
                        <li>Build your network and grow your business</li>
                    </ul>
                </div>
                <p style="margin: 24px 0 0 0; color: #374151; font-size: 16px;">
                    Ready to get started? Log in to your dashboard and begin exploring the platform!
                </p>
                """,
                button_text="Log In to Dashboard",
                button_url=login_url
            )
            
            # Plain text content for approval
            text_content = f"""
Hello {user.full_name},

Great news! Your profile has been approved and is now live on VentureUP Link.

You can now:
- Browse and connect with other users
- Send and receive messages
- Access all platform features

Log in to get started: {login_url}

Best regards,
The VentureUP Link Team
            """
        else:
            subject = 'Your VentureUP Link profile needs attention'
            
            # HTML content for rejection
            html_content = get_email_base_html(
                title=subject,
                content=f"""
                <div style="text-align: center; margin-bottom: 24px;">
                    <div style="display: inline-block; width: 64px; height: 64px; background-color: #ef4444; border-radius: 50%; margin-bottom: 16px;">
                        <div style="color: #ffffff; font-size: 36px; text-align: center; line-height: 64px;">!</div>
                    </div>
                </div>
                <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 24px; font-weight: 600; text-align: center;">
                    Profile Review Update
                </h2>
                <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">
                    Hello {user.full_name or 'there'},
                </p>
                <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">
                    We've reviewed your profile submission, but unfortunately it doesn't meet our current requirements at this time.
                </p>
                <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0; border-radius: 4px;">
                    <p style="margin: 0 0 8px 0; color: #991b1b; font-size: 15px; font-weight: 600;">
                        Reason for rejection:
                    </p>
                    <p style="margin: 0; color: #b91c1c; font-size: 15px; line-height: 1.6;">
                        {rejection_reason or 'Please review your profile and ensure all required information is provided.'}
                    </p>
                </div>
                <p style="margin: 24px 0 0 0; color: #374151; font-size: 16px;">
                    Don't worry! You can update your profile and resubmit it for review. We're here to help you succeed.
                </p>
                <p style="margin: 16px 0 0 0; color: #6b7280; font-size: 14px;">
                    If you have any questions or need assistance, please don't hesitate to contact our support team.
                </p>
                """,
                button_text="Update My Profile",
                button_url=login_url,
                footer_note="We encourage you to review the feedback above and resubmit your profile. Our team is here to support you!"
            )
            
            # Plain text content for rejection
            text_content = f"""
Hello {user.full_name},

We've reviewed your profile submission, but unfortunately it doesn't meet our current requirements.

Reason: {rejection_reason or 'Please review your profile and ensure all required information is provided.'}

You can update your profile and resubmit for review.

If you have any questions, please contact us.

Best regards,
The VentureUP Link Team
            """
        
        # Send email with both HTML and plain text
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email]
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)
        
        return f"Notification email sent to {user.email}"
    except User.DoesNotExist:
        return f"User with id {user_id} not found"
    except Exception as e:
        return f"Error sending email: {str(e)}"


@shared_task
def send_deletion_notification(user_id, product_name, product_status, deleted_by_admin=False):
    """
    Send email notification when a pitch deck is deleted.
    
    Args:
        user_id: User ID (owner of the deleted product)
        product_name: Name of the deleted product
        product_status: Status of the product before deletion
        deleted_by_admin: True if deleted by admin, False if deleted by user
    """
    from .models import User
    
    try:
        user = User.objects.get(id=user_id)
        frontend_url = settings.FRONTEND_URL
        if not frontend_url:
            raise ValueError("FRONTEND_URL must be set in Django settings")
        dashboard_url = f"{frontend_url}/dashboard/venture/pitch"
        
        subject = 'Your pitch deck has been deleted'
        
        # Determine deletion context
        if deleted_by_admin:
            deletion_context = "deleted by an administrator"
            action_context = "If you believe this was done in error, please contact our support team."
        else:
            deletion_context = "successfully deleted"
            action_context = "If you need to create a new pitch deck, you can do so from your dashboard."
        
        # HTML content
        html_content = get_email_base_html(
            title=subject,
            content=f"""
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 64px; height: 64px; background-color: #6b7280; border-radius: 50%; margin-bottom: 16px;">
                    <div style="color: #ffffff; font-size: 36px; text-align: center; line-height: 64px;">🗑️</div>
                </div>
            </div>
            <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 24px; font-weight: 600; text-align: center;">
                Pitch Deck Deleted
            </h2>
            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">
                Hello {user.full_name or 'there'},
            </p>
            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">
                This email confirms that your pitch deck <strong style="color: #111827;">"{product_name}"</strong> has been {deletion_context}.
            </p>
            <div style="background-color: #f9fafb; border-left: 4px solid #6b7280; padding: 16px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0 0 8px 0; color: #374151; font-size: 15px; font-weight: 600;">
                    Deletion Details:
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #6b7280; font-size: 15px; line-height: 1.8;">
                    <li><strong>Pitch Deck:</strong> {product_name}</li>
                    <li><strong>Previous Status:</strong> {product_status}</li>
                    <li><strong>Deleted:</strong> {timezone.now().strftime('%B %d, %Y at %I:%M %p')}</li>
                </ul>
            </div>
            <p style="margin: 24px 0 0 0; color: #374151; font-size: 16px;">
                {action_context}
            </p>
            """,
            button_text="Go to Dashboard",
            button_url=dashboard_url,
            footer_note="This action cannot be undone. All associated data, files, and documents have been permanently removed."
        )
        
        # Plain text content
        text_content = f"""
Hello {user.full_name or 'there'},

This email confirms that your pitch deck "{product_name}" has been {deletion_context}.

Deletion Details:
- Pitch Deck: {product_name}
- Previous Status: {product_status}
- Deleted: {timezone.now().strftime('%B %d, %Y at %I:%M %p')}

{action_context}

Visit your dashboard: {dashboard_url}

This action cannot be undone. All associated data, files, and documents have been permanently removed.

Best regards,
The VentureUP Link Team
        """
        
        # Send email with both HTML and plain text
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email]
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)
        
        return f"Deletion notification email sent to {user.email}"
    except User.DoesNotExist:
        return f"User with id {user_id} not found"
    except Exception as e:
        return f"Error sending email: {str(e)}"


@shared_task
def send_password_reset_email(user_id, token):
    """
    Send password reset email to user.
    
    Args:
        user_id: User ID
        token: Password reset token
    """
    from .models import User
    
    try:
        user = User.objects.get(id=user_id)
        
        # Create password reset URL
        frontend_url = settings.FRONTEND_URL
        if not frontend_url:
            raise ValueError("FRONTEND_URL must be set in Django settings")
        reset_url = f"{frontend_url}/reset-password?token={token}"
        
        subject = 'Reset your VentureUP Link password'
        
        # HTML content
        html_content = get_email_base_html(
            title=subject,
            content=f"""
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 64px; height: 64px; background-color: #3b82f6; border-radius: 50%; margin-bottom: 16px;">
                    <div style="color: #ffffff; font-size: 36px; text-align: center; line-height: 64px;">🔒</div>
                </div>
            </div>
            <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 24px; font-weight: 600; text-align: center;">
                Password Reset Request
            </h2>
            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">
                Hello {user.full_name or 'there'},
            </p>
            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">
                We received a request to reset your password for your VentureUP Link account.
            </p>
            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">
                Click the button below to reset your password. This link will expire in <strong>1 hour</strong> for security.
            </p>
            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0 0 8px 0; color: #1e40af; font-size: 15px; font-weight: 600;">
                    Security Notice:
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #1e3a8a; font-size: 15px; line-height: 1.8;">
                    <li>This link can only be used once</li>
                    <li>It will expire in 1 hour</li>
                    <li>If you didn't request this, please ignore this email</li>
                </ul>
            </div>
            """,
            button_text="Reset Password",
            button_url=reset_url,
            footer_note="If you didn't request a password reset, please ignore this email. Your password will remain unchanged."
        )
        
        # Plain text content
        text_content = f"""
Hello {user.full_name or 'there'},

We received a request to reset your password for your VentureUP Link account.

Click the link below to reset your password:
{reset_url}

This link will expire in 1 hour and can only be used once.

Security Notice:
- This link can only be used once
- It will expire in 1 hour
- If you didn't request this, please ignore this email

If you didn't request a password reset, please ignore this email. Your password will remain unchanged.

Best regards,
The VentureUP Link Team
        """
        
        # Send email with both HTML and plain text
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email]
        )
        msg.attach_alternative(html_content, "text/html")
        
        # Send email and log any errors
        try:
            msg.send(fail_silently=False)
            return f"Password reset email sent to {user.email}"
        except Exception as email_error:
            # Log the actual SMTP error for debugging
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send password reset email to {user.email}: {str(email_error)}")
            # Re-raise to let Celery know the task failed
            raise Exception(f"Failed to send password reset email: {str(email_error)}")
    except User.DoesNotExist:
        return f"User with id {user_id} not found"
    except Exception as e:
        # Log and re-raise to mark task as failed
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Password reset email task error: {str(e)}")
        raise
