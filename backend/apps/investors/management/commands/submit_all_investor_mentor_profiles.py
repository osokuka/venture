"""
One-time management command to submit all investor and mentor profiles for review.

Usage (locally):
    python manage.py submit_all_investor_mentor_profiles

Usage with Docker / docker-compose:
    docker-compose exec web python manage.py submit_all_investor_mentor_profiles

Behavior:
- For all InvestorProfile and MentorProfile rows:
  - If status is DRAFT or REJECTED:
    - Ensure there is a ReviewRequest with status='SUBMITTED'
    - Set profile.status = 'SUBMITTED'
    - Set submitted_at (if not already set)
- Profiles already in SUBMITTED/APPROVED/SUSPENDED are left unchanged.
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from django.db import transaction

from apps.investors.models import InvestorProfile
from apps.mentors.models import MentorProfile
from apps.approvals.models import ReviewRequest


class Command(BaseCommand):
    help = "One-time command to mark all investor and mentor profiles as SUBMITTED and create ReviewRequests."

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("Starting bulk submission of investor and mentor profiles..."))

        with transaction.atomic():
            investor_results = self._process_investors()
            mentor_results = self._process_mentors()

        self.stdout.write("")  # Blank line
        self.stdout.write(self.style.SUCCESS("Bulk submission completed. Summary:"))
        self.stdout.write(
            f"  Investors  - updated: {investor_results['updated']}, "
            f"skipped (non-DRAFT/REJECTED): {investor_results['skipped_status']}, "
            f"already submitted: {investor_results['already_submitted']}"
        )
        self.stdout.write(
            f"  Mentors    - updated: {mentor_results['updated']}, "
            f"skipped (non-DRAFT/REJECTED): {mentor_results['skipped_status']}, "
            f"already submitted: {mentor_results['already_submitted']}"
        )

    def _process_investors(self):
        """
        Set all InvestorProfile rows in DRAFT/REJECTED to SUBMITTED and
        ensure a ReviewRequest exists.
        """
        updated = 0
        skipped_status = 0
        already_submitted = 0

        ct = ContentType.objects.get_for_model(InvestorProfile)
        profiles = InvestorProfile.objects.all()

        for profile in profiles:
            if profile.status in ("SUBMITTED", "APPROVED", "SUSPENDED"):
                skipped_status += 1
                continue

            if profile.status not in ("DRAFT", "REJECTED"):
                skipped_status += 1
                continue

            # Check if there's already a pending review
            exists = ReviewRequest.objects.filter(
                content_type=ct,
                object_id=profile.id,
                status="SUBMITTED",
            ).exists()

            if exists:
                already_submitted += 1
            else:
                ReviewRequest.objects.create(
                    content_type=ct,
                    object_id=profile.id,
                    submitted_by=profile.user,
                    status="SUBMITTED",
                )

            profile.status = "SUBMITTED"
            if not profile.submitted_at:
                profile.submitted_at = timezone.now()
            profile.save(update_fields=["status", "submitted_at"])
            updated += 1

        return {
            "updated": updated,
            "skipped_status": skipped_status,
            "already_submitted": already_submitted,
        }

    def _process_mentors(self):
        """
        Set all MentorProfile rows in DRAFT/REJECTED to SUBMITTED and
        ensure a ReviewRequest exists.
        """
        updated = 0
        skipped_status = 0
        already_submitted = 0

        ct = ContentType.objects.get_for_model(MentorProfile)
        profiles = MentorProfile.objects.all()

        for profile in profiles:
            if profile.status in ("SUBMITTED", "APPROVED", "SUSPENDED"):
                skipped_status += 1
                continue

            if profile.status not in ("DRAFT", "REJECTED"):
                skipped_status += 1
                continue

            # Check if there's already a pending review
            exists = ReviewRequest.objects.filter(
                content_type=ct,
                object_id=profile.id,
                status="SUBMITTED",
            ).exists()

            if exists:
                already_submitted += 1
            else:
                ReviewRequest.objects.create(
                    content_type=ct,
                    object_id=profile.id,
                    submitted_by=profile.user,
                    status="SUBMITTED",
                )

            profile.status = "SUBMITTED"
            if not profile.submitted_at:
                profile.submitted_at = timezone.now()
            profile.save(update_fields=["status", "submitted_at"])
            updated += 1

        return {
            "updated": updated,
            "skipped_status": skipped_status,
            "already_submitted": already_submitted,
        }

