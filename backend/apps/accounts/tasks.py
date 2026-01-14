"""
Celery tasks for accounts app.
"""
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.urls import reverse
from .models import EmailVerificationToken


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
        # In production, use actual domain
        verification_url = f"{settings.FRONTEND_URL or 'http://localhost:3000'}/verify-email?token={token}"
        
        subject = 'Verify your VentureUP Link account'
        message = f"""
Hello {user.full_name},

Thank you for registering with Venture UP Link!

Please verify your email address by clicking the link below:
{verification_url}

This link will expire in 24 hours.

If you didn't create an account, please ignore this email.

Best regards,
The VentureUP Link Team
        """
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        
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
        
        if approved:
            subject = 'Your Venture UP Link profile has been approved!'
            message = f"""
Hello {user.full_name},

Great news! Your profile has been approved and is now live on VentureUP Link.

You can now:
- Browse and connect with other users
- Send and receive messages
- Access all platform features

Log in to get started: {settings.FRONTEND_URL or 'http://localhost:3000'}/login

Best regards,
The VentureUP Link Team
            """
        else:
            subject = 'Your VentureUP Link profile needs attention'
            message = f"""
Hello {user.full_name},

We've reviewed your profile submission, but unfortunately it doesn't meet our current requirements.

Reason: {rejection_reason or 'Please review your profile and ensure all required information is provided.'}

You can update your profile and resubmit for review.

If you have any questions, please contact us.

Best regards,
The VentureUP Link Team
            """
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        
        return f"Notification email sent to {user.email}"
    except User.DoesNotExist:
        return f"User with id {user_id} not found"
    except Exception as e:
        return f"Error sending email: {str(e)}"
