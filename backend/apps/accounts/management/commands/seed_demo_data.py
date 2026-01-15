"""
Management command to seed comprehensive demo data for presentation.
Creates users, products, profiles, conversations, and messages.

Usage:
    python manage.py seed_demo_data
    python manage.py seed_demo_data --clear  # Clear existing demo data first
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
import random

from apps.accounts.models import User
from apps.ventures.models import (
    VentureProduct, Founder, TeamMember, VentureNeed, VentureDocument
)
from apps.investors.models import InvestorProfile, InvestorVisibleToVenture
from apps.mentors.models import MentorProfile
from apps.messaging.models import Conversation, Message


class Command(BaseCommand):
    help = 'Seed comprehensive demo data for presentation'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing demo data before seeding',
        )
        parser.add_argument(
            '--noinput',
            action='store_true',
            help='Non-interactive mode (for Docker entrypoint)',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write(self.style.WARNING('Clearing existing demo data...'))
            # Clear in reverse dependency order
            Message.objects.filter(conversation__participants__email__contains='@demo').delete()
            Conversation.objects.filter(participants__email__contains='@demo').delete()
            InvestorVisibleToVenture.objects.filter(
                investor__user__email__contains='@demo'
            ).delete()
            VentureDocument.objects.filter(product__user__email__contains='@demo').delete()
            VentureNeed.objects.filter(product__user__email__contains='@demo').delete()
            TeamMember.objects.filter(product__user__email__contains='@demo').delete()
            Founder.objects.filter(product__user__email__contains='@demo').delete()
            VentureProduct.objects.filter(user__email__contains='@demo').delete()
            InvestorProfile.objects.filter(user__email__contains='@demo').delete()
            MentorProfile.objects.filter(user__email__contains='@demo').delete()
            User.objects.filter(email__contains='@demo').delete()
            self.stdout.write(self.style.SUCCESS('Cleared existing demo data'))

        self.stdout.write(self.style.SUCCESS('Starting demo data seeding...'))

        # Create users
        ventures = self.create_ventures()
        investors = self.create_investors()
        mentors = self.create_mentors()

        # Create venture products with full details
        products = self.create_venture_products(ventures)

        # Create investor profiles
        investor_profiles = self.create_investor_profiles(investors)

        # Create mentor profiles
        mentor_profiles = self.create_mentor_profiles(mentors)

        # Create conversations and messages
        self.create_conversations_and_messages(ventures, investors, mentors, products, investor_profiles)

        self.stdout.write(self.style.SUCCESS('\n✅ Demo data seeding complete!'))
        self.stdout.write(self.style.SUCCESS(f'Created: {len(ventures)} ventures, {len(investors)} investors, {len(mentors)} mentors'))
        self.stdout.write(self.style.SUCCESS(f'All accounts use password: demo123'))

    def create_ventures(self):
        """Create venture users."""
        venture_data = [
            {
                'email': 'sarah@techflow.ai',
                'full_name': 'Sarah Chen',
                'role': 'VENTURE',
            },
            {
                'email': 'marcus@greenspace.co',
                'full_name': 'Marcus Rodriguez',
                'role': 'VENTURE',
            },
            {
                'email': 'lisa@healthbridge.com',
                'full_name': 'Dr. Lisa Park',
                'role': 'VENTURE',
            },
            {
                'email': 'david@fintech-solutions.io',
                'full_name': 'David Kim',
                'role': 'VENTURE',
            },
            {
                'email': 'emily@edtech-platform.com',
                'full_name': 'Emily Watson',
                'role': 'VENTURE',
            },
        ]

        ventures = []
        for data in venture_data:
            user, created = User.objects.get_or_create(
                email=data['email'],
                defaults={
                    'full_name': data['full_name'],
                    'role': data['role'],
                    'is_email_verified': True,
                }
            )
            if created:
                user.set_password('demo123')
                user.save()
                self.stdout.write(self.style.SUCCESS(f'  ✓ Created venture: {data["email"]}'))
            else:
                # Ensure password is set even if user exists
                if not user.check_password('demo123'):
                    user.set_password('demo123')
                    user.save()
            ventures.append(user)

        return ventures

    def create_investors(self):
        """Create investor users."""
        investor_data = [
            {
                'email': 'sarah.chen@techventures.com',
                'full_name': 'Sarah Chen',
                'role': 'INVESTOR',
            },
            {
                'email': 'marcus@greentech-ventures.com',
                'full_name': 'Marcus Rodriguez',
                'role': 'INVESTOR',
            },
            {
                'email': 'lisa@innovation-angels.com',
                'full_name': 'Dr. Lisa Park',
                'role': 'INVESTOR',
            },
            {
                'email': 'john@futurefund.com',
                'full_name': 'John Smith',
                'role': 'INVESTOR',
            },
            {
                'email': 'maria@seedventures.com',
                'full_name': 'Maria Garcia',
                'role': 'INVESTOR',
            },
        ]

        investors = []
        for data in investor_data:
            user, created = User.objects.get_or_create(
                email=data['email'],
                defaults={
                    'full_name': data['full_name'],
                    'role': data['role'],
                    'is_email_verified': True,
                }
            )
            if created:
                user.set_password('demo123')
                user.save()
                self.stdout.write(self.style.SUCCESS(f'  ✓ Created investor: {data["email"]}'))
            investors.append(user)

        return investors

    def create_mentors(self):
        """Create mentor users."""
        mentor_data = [
            {
                'email': 'james@stripe.com',
                'full_name': 'James Wilson',
                'role': 'MENTOR',
            },
            {
                'email': 'sarah@startup-demo.io',
                'full_name': 'Sarah Thompson',
                'role': 'MENTOR',
            },
            {
                'email': 'robert@tech-mentor.com',
                'full_name': 'Robert Martinez',
                'role': 'MENTOR',
            },
            {
                'email': 'jennifer@growth-mentor.com',
                'full_name': 'Jennifer Lee',
                'role': 'MENTOR',
            },
        ]

        mentors = []
        for data in mentor_data:
            user, created = User.objects.get_or_create(
                email=data['email'],
                defaults={
                    'full_name': data['full_name'],
                    'role': data['role'],
                    'is_email_verified': True,
                }
            )
            if created:
                user.set_password('demo123')
                user.save()
                self.stdout.write(self.style.SUCCESS(f'  ✓ Created mentor: {data["email"]}'))
            else:
                # Ensure password is set even if user exists
                if not user.check_password('demo123'):
                    user.set_password('demo123')
                    user.save()
            mentors.append(user)

        return mentors

    def create_venture_products(self, ventures):
        """Create venture products with full details."""
        products_data = [
            {
                'user': ventures[0],
                'name': 'TechFlow AI',
                'industry_sector': 'AI/ML',
                'website': 'https://techflow.ai',
                'linkedin_url': 'https://linkedin.com/company/techflow-ai',
                'address': '123 Innovation Drive, San Francisco, CA 94105',
                'year_founded': 2022,
                'employees_count': 25,
                'short_description': 'AI-powered workflow automation platform helping enterprises streamline operations and reduce costs by 40%.',
                'status': 'APPROVED',
                'founders': [
                    {
                        'full_name': 'Sarah Chen',
                        'linkedin_url': 'https://linkedin.com/in/sarahchen',
                        'email': 'sarah@techflow.ai',
                        'phone': '+1-415-555-0101',
                        'role_title': 'CEO & Co-Founder',
                    },
                    {
                        'full_name': 'Alex Kumar',
                        'linkedin_url': 'https://linkedin.com/in/alexkumar',
                        'email': 'alex@techflow-demo.ai',
                        'phone': '+1-415-555-0102',
                        'role_title': 'CTO & Co-Founder',
                    },
                ],
                'team_members': [
                    {
                        'name': 'Jessica Park',
                        'role_title': 'Head of Product',
                        'description': 'Former Product Manager at Google',
                        'linkedin_url': 'https://linkedin.com/in/jessicapark',
                    },
                    {
                        'name': 'Ryan Chen',
                        'role_title': 'Head of Engineering',
                        'description': 'Ex-Uber, 10+ years in ML',
                        'linkedin_url': 'https://linkedin.com/in/ryanchen',
                    },
                ],
                'needs': [
                    {
                        'need_type': 'FINANCE',
                        'finance_size_range': '$2M - $5M',
                        'finance_objectives': 'Scale sales team, expand to enterprise market',
                    },
                    {
                        'need_type': 'MARKET_ACCESS',
                        'target_markets': ['Enterprise SaaS', 'Healthcare', 'Finance'],
                    },
                ],
                'pitch_deck': {
                    'problem_statement': 'Enterprises waste 20+ hours per week on manual, repetitive tasks. Current automation tools are complex and require technical expertise.',
                    'solution_description': 'TechFlow AI provides no-code workflow automation powered by advanced AI. Users can automate complex processes in minutes without coding.',
                    'target_market': 'Mid-to-large enterprises (500-10,000 employees) in finance, healthcare, and technology sectors.',
                    'traction_metrics': {
                        'customers': 150,
                        'mrr': '$450K',
                        'growth_rate': '25% MoM',
                        'churn': '2%',
                        'nps': 72,
                    },
                    'funding_amount': '$3M',
                    'funding_stage': 'SERIES_A',
                    'use_of_funds': '40% Sales & Marketing, 35% Product Development, 15% Operations, 10% Team Expansion',
                },
            },
            {
                'user': ventures[1],
                'name': 'GreenSpace Solutions',
                'industry_sector': 'CleanTech',
                'website': 'https://greenspace.co',
                'linkedin_url': 'https://linkedin.com/company/greenspace',
                'address': '456 Green Street, Austin, TX 78701',
                'year_founded': 2021,
                'employees_count': 18,
                'short_description': 'Sustainable packaging solutions reducing plastic waste by 80% for e-commerce companies.',
                'status': 'APPROVED',
                'founders': [
                    {
                        'full_name': 'Marcus Rodriguez',
                        'linkedin_url': 'https://linkedin.com/in/marcusrodriguez',
                        'email': 'marcus@greenspace.co',
                        'phone': '+1-512-555-0201',
                        'role_title': 'CEO & Founder',
                    },
                ],
                'team_members': [
                    {
                        'name': 'Sophia Martinez',
                        'role_title': 'Head of Operations',
                        'description': 'Former Operations Director at Amazon',
                        'linkedin_url': 'https://linkedin.com/in/sophiamartinez',
                    },
                ],
                'needs': [
                    {
                        'need_type': 'FINANCE',
                        'finance_size_range': '$1M - $3M',
                        'finance_objectives': 'Scale manufacturing, expand distribution network',
                    },
                ],
                'pitch_deck': {
                    'problem_statement': 'E-commerce generates 2.5 billion pounds of plastic waste annually. Current alternatives are expensive and ineffective.',
                    'solution_description': 'GreenSpace produces biodegradable packaging materials from agricultural waste, matching plastic performance at 60% lower cost.',
                    'target_market': 'E-commerce companies, logistics providers, and retail chains committed to sustainability.',
                    'traction_metrics': {
                        'customers': 85,
                        'revenue': '$1.2M ARR',
                        'growth_rate': '30% MoM',
                        'co2_reduced': '500 tons',
                    },
                    'funding_amount': '$2M',
                    'funding_stage': 'SEED',
                    'use_of_funds': '50% Manufacturing, 30% Sales & Marketing, 20% R&D',
                },
            },
            {
                'user': ventures[2],
                'name': 'HealthBridge',
                'industry_sector': 'HealthTech',
                'website': 'https://healthbridge.com',
                'linkedin_url': 'https://linkedin.com/company/healthbridge',
                'address': '789 Medical Plaza, Boston, MA 02115',
                'year_founded': 2020,
                'employees_count': 42,
                'short_description': 'AI-powered telemedicine platform connecting patients in rural areas with specialized healthcare providers.',
                'status': 'APPROVED',
                'founders': [
                    {
                        'full_name': 'Dr. Lisa Park',
                        'linkedin_url': 'https://linkedin.com/in/lisapark',
                        'email': 'lisa@healthbridge.com',
                        'phone': '+1-617-555-0301',
                        'role_title': 'CEO & Co-Founder',
                    },
                    {
                        'full_name': 'Dr. Michael Chen',
                        'linkedin_url': 'https://linkedin.com/in/michaelchen',
                        'email': 'michael@healthbridge-demo.com',
                        'phone': '+1-617-555-0302',
                        'role_title': 'CMO & Co-Founder',
                    },
                ],
                'team_members': [
                    {
                        'name': 'Amanda Foster',
                        'role_title': 'Head of Clinical Operations',
                        'description': 'Former VP at Mayo Clinic',
                        'linkedin_url': 'https://linkedin.com/in/amandafoster',
                    },
                ],
                'needs': [
                    {
                        'need_type': 'FINANCE',
                        'finance_size_range': '$5M - $10M',
                        'finance_objectives': 'Expand to 20 states, hire clinical team',
                    },
                    {
                        'need_type': 'MARKET_ACCESS',
                        'target_markets': ['Rural Healthcare', 'Medicare/Medicaid'],
                    },
                ],
                'pitch_deck': {
                    'problem_statement': '60 million Americans in rural areas lack access to specialized healthcare. Travel costs and time prevent regular care.',
                    'solution_description': 'HealthBridge connects rural patients with specialists via AI-assisted telemedicine, reducing travel time by 90% and costs by 70%.',
                    'target_market': 'Rural healthcare systems, Medicare/Medicaid providers, and underserved communities.',
                    'traction_metrics': {
                        'patients': '25,000',
                        'providers': 450,
                        'revenue': '$4.5M ARR',
                        'satisfaction': '4.8/5',
                    },
                    'funding_amount': '$7M',
                    'funding_stage': 'SERIES_A',
                    'use_of_funds': '45% Clinical Expansion, 30% Technology, 15% Marketing, 10% Operations',
                },
            },
            {
                'user': ventures[3],
                'name': 'FinTech Solutions',
                'industry_sector': 'FinTech',
                'website': 'https://fintech-solutions.io',
                'linkedin_url': 'https://linkedin.com/company/fintech-solutions',
                'address': '321 Finance Tower, New York, NY 10004',
                'year_founded': 2023,
                'employees_count': 12,
                'short_description': 'Blockchain-based payment processing for small businesses, reducing transaction fees by 50%.',
                'status': 'APPROVED',
                'founders': [
                    {
                        'full_name': 'David Kim',
                        'linkedin_url': 'https://linkedin.com/in/davidkim',
                        'email': 'david@fintech-solutions.io',
                        'phone': '+1-212-555-0401',
                        'role_title': 'CEO & Co-Founder',
                    },
                ],
                'team_members': [],
                'needs': [
                    {
                        'need_type': 'FINANCE',
                        'finance_size_range': '$500K - $1.5M',
                        'finance_objectives': 'Product development, regulatory compliance',
                    },
                ],
                'pitch_deck': {
                    'problem_statement': 'Small businesses pay 2.9% + $0.30 per transaction. High fees eat into thin profit margins.',
                    'solution_description': 'FinTech Solutions uses blockchain to process payments at 1.5% flat rate, saving small businesses thousands monthly.',
                    'target_market': 'Small businesses, restaurants, retail stores processing $50K-$500K monthly.',
                    'traction_metrics': {
                        'merchants': 320,
                        'transaction_volume': '$2.5M/month',
                        'growth_rate': '40% MoM',
                    },
                    'funding_amount': '$1M',
                    'funding_stage': 'SEED',
                    'use_of_funds': '40% Product, 30% Compliance, 20% Sales, 10% Operations',
                },
            },
            {
                'user': ventures[4],
                'name': 'EduTech Platform',
                'industry_sector': 'EdTech',
                'website': 'https://edtech-platform.com',
                'linkedin_url': 'https://linkedin.com/company/edtech-platform',
                'address': '555 Education Ave, Seattle, WA 98101',
                'year_founded': 2022,
                'employees_count': 8,
                'short_description': 'Personalized learning platform using AI to adapt curriculum to each student\'s learning style.',
                'status': 'SUBMITTED',
                'founders': [
                    {
                        'full_name': 'Emily Watson',
                        'linkedin_url': 'https://linkedin.com/in/emilywatson',
                        'email': 'emily@edtech-platform.com',
                        'phone': '+1-206-555-0501',
                        'role_title': 'CEO & Founder',
                    },
                ],
                'team_members': [],
                'needs': [
                    {
                        'need_type': 'FINANCE',
                        'finance_size_range': '$500K - $1M',
                        'finance_objectives': 'Content development, user acquisition',
                    },
                ],
                'pitch_deck': {
                    'problem_statement': 'One-size-fits-all education fails 40% of students. Personalized learning is expensive and hard to scale.',
                    'solution_description': 'EduTech Platform uses AI to create personalized learning paths, improving outcomes by 35% at 1/10th the cost of tutors.',
                    'target_market': 'K-12 schools, homeschooling families, and online learning platforms.',
                    'traction_metrics': {
                        'students': '5,000',
                        'schools': 45,
                        'revenue': '$180K ARR',
                        'improvement_rate': '35%',
                    },
                    'funding_amount': '$750K',
                    'funding_stage': 'PRE_SEED',
                    'use_of_funds': '50% Content, 30% Marketing, 20% Product',
                },
            },
        ]

        products = []
        for data in products_data:
            product, created = VentureProduct.objects.get_or_create(
                user=data['user'],
                name=data['name'],
                defaults={
                    'industry_sector': data['industry_sector'],
                    'website': data['website'],
                    'linkedin_url': data['linkedin_url'],
                    'address': data['address'],
                    'year_founded': data['year_founded'],
                    'employees_count': data['employees_count'],
                    'short_description': data['short_description'],
                    'status': data['status'],
                    'is_active': True,
                    'submitted_at': timezone.now() - timedelta(days=random.randint(5, 30)),
                    'approved_at': timezone.now() - timedelta(days=random.randint(1, 20)) if data['status'] == 'APPROVED' else None,
                }
            )

            if created:
                # Create founders
                for founder_data in data.get('founders', []):
                    Founder.objects.create(
                        product=product,
                        **founder_data
                    )

                # Create team members
                for team_data in data.get('team_members', []):
                    TeamMember.objects.create(
                        product=product,
                        **team_data
                    )

                # Create needs
                for need_data in data.get('needs', []):
                    VentureNeed.objects.create(
                        product=product,
                        **need_data
                    )

                # Create pitch deck document (simulated)
                pitch_data = data.get('pitch_deck', {})
                if pitch_data:
                    # Note: We can't create actual files, but we can create the document record
                    # In production, you'd upload actual PDF files
                    VentureDocument.objects.create(
                        product=product,
                        document_type='PITCH_DECK',
                        file='ventures/documents/demo_pitch_deck.pdf',  # Placeholder
                        file_size=2048000,  # 2MB
                        mime_type='application/pdf',
                        problem_statement=pitch_data.get('problem_statement'),
                        solution_description=pitch_data.get('solution_description'),
                        target_market=pitch_data.get('target_market'),
                        traction_metrics=pitch_data.get('traction_metrics'),
                        funding_amount=pitch_data.get('funding_amount'),
                        funding_stage=pitch_data.get('funding_stage'),
                        use_of_funds=pitch_data.get('use_of_funds'),
                    )

                self.stdout.write(self.style.SUCCESS(f'  ✓ Created product: {data["name"]}'))
            products.append(product)

        return products

    def create_investor_profiles(self, investors):
        """Create investor profiles."""
        profiles_data = [
            {
                'user': investors[0],
                'full_name': 'Sarah Chen',
                'organization_name': 'TechVentures Capital',
                'linkedin_or_website': 'https://techventures.com',
                'email': 'sarah.chen@techventures.com',
                'phone': '+1-415-555-1001',
                'investment_experience_years': 15,
                'deals_count': 45,
                'stage_preferences': ['SEED', 'SERIES_A'],
                'industry_preferences': ['AI/ML', 'SaaS', 'FinTech'],
                'average_ticket_size': '$250K - $1M',
                'visible_to_ventures': True,
                'status': 'APPROVED',
            },
            {
                'user': investors[1],
                'full_name': 'Sarah Johnson',
                'organization_name': 'Innovation Partners',
                'linkedin_or_website': 'https://innovationpartners.com',
                'email': 'marcus@greentech-ventures.com',
                'phone': '+1-212-555-1002',
                'investment_experience_years': 12,
                'deals_count': 32,
                'stage_preferences': ['SEED', 'SERIES_A', 'SERIES_B'],
                'industry_preferences': ['HealthTech', 'CleanTech', 'EdTech'],
                'average_ticket_size': '$500K - $2M',
                'visible_to_ventures': True,
                'status': 'APPROVED',
            },
            {
                'user': investors[2],
                'full_name': 'Dr. Lisa Park',
                'organization_name': 'Future Fund',
                'linkedin_or_website': 'https://futurefund.com',
                'email': 'lisa@innovation-angels.com',
                'phone': '+1-650-555-1003',
                'investment_experience_years': 8,
                'deals_count': 18,
                'stage_preferences': ['PRE_SEED', 'SEED'],
                'industry_preferences': ['AI/ML', 'FinTech'],
                'average_ticket_size': '$100K - $500K',
                'visible_to_ventures': False,  # Incognito investor
                'status': 'APPROVED',
            },
            {
                'user': investors[3],
                'full_name': 'David Rodriguez',
                'organization_name': 'Angel Investors Network',
                'linkedin_or_website': 'https://angelinvestors.com',
                'email': 'john@futurefund.com',
                'phone': '+1-310-555-1004',
                'investment_experience_years': 10,
                'deals_count': 28,
                'stage_preferences': ['PRE_SEED', 'SEED'],
                'industry_preferences': ['CleanTech', 'EdTech'],
                'average_ticket_size': '$50K - $250K',
                'visible_to_ventures': True,
                'status': 'APPROVED',
            },
            {
                'user': investors[4],
                'full_name': 'Maria Garcia',
                'organization_name': 'Seed Ventures',
                'linkedin_or_website': 'https://seedventures.com',
                'email': 'maria@seed-demo.com',
                'phone': '+1-512-555-1005',
                'investment_experience_years': 6,
                'deals_count': 15,
                'stage_preferences': ['SEED'],
                'industry_preferences': ['SaaS', 'HealthTech'],
                'average_ticket_size': '$200K - $750K',
                'visible_to_ventures': True,
                'status': 'APPROVED',
            },
        ]

        profiles = []
        for data in profiles_data:
            profile, created = InvestorProfile.objects.get_or_create(
                user=data['user'],
                defaults={
                    **{k: v for k, v in data.items() if k != 'user'},
                    'submitted_at': timezone.now() - timedelta(days=random.randint(10, 60)),
                    'approved_at': timezone.now() - timedelta(days=random.randint(1, 30)),
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'  ✓ Created investor profile: {data["full_name"]}'))
            profiles.append(profile)

        return profiles

    def create_mentor_profiles(self, mentors):
        """Create mentor profiles."""
        profiles_data = [
            {
                'user': mentors[0],
                'full_name': 'James Wilson',
                'job_title': 'Former VP of Product',
                'company': 'Stripe',
                'linkedin_or_website': 'https://linkedin.com/in/jameswilson',
                'contact_email': 'james@stripe.com',
                'phone': '+1-415-555-2001',
                'expertise_fields': ['Product Development', 'Go-to-Market Strategy', 'Scaling'],
                'experience_overview': '15+ years building products at Stripe, Google, and startups. Helped scale 3 companies from 0 to $100M+ ARR.',
                'industries_of_interest': ['SaaS', 'FinTech', 'AI/ML'],
                'engagement_type': 'BOTH',
                'paid_rate_type': 'HOURLY',
                'paid_rate_amount': Decimal('300.00'),
                'availability_types': ['1-on-1 Sessions', 'Workshops', 'Advisory'],
                'preferred_engagement': 'VIRTUAL',
                'visible_to_ventures': True,
                'status': 'APPROVED',
            },
            {
                'user': mentors[1],
                'full_name': 'Sarah Thompson',
                'job_title': 'Former CMO',
                'company': 'Salesforce',
                'linkedin_or_website': 'https://linkedin.com/in/sarahthompson',
                'contact_email': 'sarah@startupmentor.io',
                'phone': '+1-650-555-2002',
                'expertise_fields': ['Marketing', 'Brand Strategy', 'Growth'],
                'experience_overview': '20+ years in marketing. Led marketing at Salesforce, HubSpot, and multiple successful exits.',
                'industries_of_interest': ['SaaS', 'B2B', 'Enterprise'],
                'engagement_type': 'PRO_BONO',
                'paid_rate_type': None,
                'paid_rate_amount': None,
                'availability_types': ['1-on-1 Sessions', 'Advisory'],
                'preferred_engagement': 'BOTH',
                'visible_to_ventures': True,
                'status': 'APPROVED',
            },
            {
                'user': mentors[2],
                'full_name': 'Robert Martinez',
                'job_title': 'Former CTO',
                'company': 'Microsoft',
                'linkedin_or_website': 'https://linkedin.com/in/robertmartinez',
                'contact_email': 'robert@tech-mentor.com',
                'phone': '+1-206-555-2003',
                'expertise_fields': ['Technical Architecture', 'Engineering Leadership', 'AI/ML'],
                'experience_overview': '18+ years building scalable systems. Former CTO at Microsoft Azure, led engineering at 2 unicorns.',
                'industries_of_interest': ['AI/ML', 'Cloud', 'Enterprise Software'],
                'engagement_type': 'PAID',
                'paid_rate_type': 'HOURLY',
                'paid_rate_amount': Decimal('400.00'),
                'availability_types': ['1-on-1 Sessions', 'Technical Reviews'],
                'preferred_engagement': 'VIRTUAL',
                'visible_to_ventures': True,
                'status': 'APPROVED',
            },
            {
                'user': mentors[3],
                'full_name': 'Jennifer Lee',
                'job_title': 'Former VP of Sales',
                'company': 'HubSpot',
                'linkedin_or_website': 'https://linkedin.com/in/jenniferlee',
                'contact_email': 'jennifer@growth-mentor.com',
                'phone': '+1-617-555-2004',
                'expertise_fields': ['Sales Strategy', 'Revenue Operations', 'Customer Success'],
                'experience_overview': '12+ years scaling sales teams. Built sales orgs from 0 to 100+ reps, generating $50M+ ARR.',
                'industries_of_interest': ['SaaS', 'B2B', 'Enterprise'],
                'engagement_type': 'BOTH',
                'paid_rate_type': 'HOURLY',
                'paid_rate_amount': Decimal('250.00'),
                'availability_types': ['1-on-1 Sessions', 'Sales Training'],
                'preferred_engagement': 'VIRTUAL',
                'visible_to_ventures': True,
                'status': 'APPROVED',
            },
        ]

        profiles = []
        for data in profiles_data:
            profile, created = MentorProfile.objects.get_or_create(
                user=data['user'],
                defaults={
                    **{k: v for k, v in data.items() if k != 'user'},
                    'submitted_at': timezone.now() - timedelta(days=random.randint(10, 60)),
                    'approved_at': timezone.now() - timedelta(days=random.randint(1, 30)),
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'  ✓ Created mentor profile: {data["full_name"]}'))
            profiles.append(profile)

        return profiles

    def create_conversations_and_messages(self, ventures, investors, mentors, products, investor_profiles):
        """Create realistic conversations and messages."""
        from django.utils import timezone
        from datetime import timedelta

        # Conversation 1: Investor interested in TechFlow AI
        conv1 = Conversation.objects.create()
        conv1.participants.add(ventures[0], investors[0])
        conv1.created_at = timezone.now() - timedelta(days=5)
        conv1.save()

        messages1 = [
            {
                'conversation': conv1,
                'sender': investors[0],
                'body': 'Hi Sarah, I came across TechFlow AI and I\'m very interested. Your traction metrics are impressive - 25% MoM growth is outstanding. Would you be open to discussing a potential investment?',
                'created_at': timezone.now() - timedelta(days=5, hours=2),
            },
            {
                'conversation': conv1,
                'sender': ventures[0],
                'body': 'Hi John, thank you for reaching out! We\'d love to discuss this further. Are you available for a call this week? I\'m free Thursday or Friday afternoon.',
                'created_at': timezone.now() - timedelta(days=5, hours=1),
                'read_at': timezone.now() - timedelta(days=5),
            },
            {
                'conversation': conv1,
                'sender': investors[0],
                'body': 'Perfect! Let\'s schedule for Thursday at 2 PM PST. I\'ll send a calendar invite. Looking forward to learning more about your go-to-market strategy.',
                'created_at': timezone.now() - timedelta(days=4, hours=12),
            },
            {
                'conversation': conv1,
                'sender': ventures[0],
                'body': 'Sounds great! I\'ll send over our detailed pitch deck and financial projections before the call. Looking forward to it!',
                'created_at': timezone.now() - timedelta(days=4, hours=11),
                'read_at': timezone.now() - timedelta(days=4),
            },
        ]

        for msg_data in messages1:
            Message.objects.create(**msg_data)

        conv1.last_message_at = messages1[-1]['created_at']
        conv1.save()

        # Conversation 2: Investor interested in HealthBridge (incognito investor)
        conv2 = Conversation.objects.create()
        conv2.participants.add(ventures[2], investors[2])
        conv2.created_at = timezone.now() - timedelta(days=3)
        conv2.save()

        # Grant visibility (incognito investor initiated conversation)
        # investors[2] corresponds to investor_profiles[2] (Dr. Lisa Park - Future Fund, incognito)
        if len(investor_profiles) > 2 and not investor_profiles[2].visible_to_ventures:
            InvestorVisibleToVenture.objects.get_or_create(
                investor=investor_profiles[2],
                venture_user=ventures[2]
            )

        messages2 = [
            {
                'conversation': conv2,
                'sender': investors[2],
                'body': 'Hello Dr. Park, I\'m Dr. Lisa Park from Future Fund. HealthBridge addresses a critical need in rural healthcare. I\'d like to learn more about your expansion plans.',
                'created_at': timezone.now() - timedelta(days=3, hours=3),
            },
            {
                'conversation': conv2,
                'sender': ventures[2],
                'body': 'Hi Michael, thank you for your interest! We\'re currently expanding to 5 new states and have strong partnerships with rural health systems. Happy to discuss our Series A round.',
                'created_at': timezone.now() - timedelta(days=3, hours=2),
                'read_at': timezone.now() - timedelta(days=3),
            },
            {
                'conversation': conv2,
                'sender': investors[2],
                'body': 'Excellent. What\'s your timeline for closing the round? We typically move quickly on healthcare deals.',
                'created_at': timezone.now() - timedelta(days=2, hours=8),
            },
        ]

        for msg_data in messages2:
            Message.objects.create(**msg_data)

        conv2.last_message_at = messages2[-1]['created_at']
        conv2.save()

        # Conversation 3: Mentor helping GreenSpace
        conv3 = Conversation.objects.create()
        conv3.participants.add(ventures[1], mentors[0])
        conv3.created_at = timezone.now() - timedelta(days=7)
        conv3.save()

        messages3 = [
            {
                'conversation': conv3,
                'sender': ventures[1],
                'body': 'Hi James, I saw your profile and would love to get your advice on our go-to-market strategy for GreenSpace. We\'re ready to scale but need guidance on enterprise sales.',
                'created_at': timezone.now() - timedelta(days=7, hours=4),
            },
            {
                'conversation': conv3,
                'sender': mentors[0],
                'body': 'Hi Marcus, happy to help! I\'ve worked with several CleanTech companies. Let\'s schedule a session to discuss your sales playbook and pricing strategy.',
                'created_at': timezone.now() - timedelta(days=7, hours=3),
                'read_at': timezone.now() - timedelta(days=7),
            },
            {
                'conversation': conv3,
                'sender': ventures[1],
                'body': 'That would be amazing! Are you available next week? I can send over our current sales materials for review.',
                'created_at': timezone.now() - timedelta(days=6, hours=10),
            },
            {
                'conversation': conv3,
                'sender': mentors[0],
                'body': 'Perfect! Let\'s do Tuesday at 10 AM PST. Send over the materials and I\'ll review them beforehand.',
                'created_at': timezone.now() - timedelta(days=6, hours=9),
                'read_at': timezone.now() - timedelta(days=6),
            },
        ]

        for msg_data in messages3:
            Message.objects.create(**msg_data)

        conv3.last_message_at = messages3[-1]['created_at']
        conv3.save()

        # Conversation 4: Multiple investors interested in TechFlow
        conv4 = Conversation.objects.create()
        conv4.participants.add(ventures[0], investors[1])
        conv4.created_at = timezone.now() - timedelta(days=2)
        conv4.save()

        messages4 = [
            {
                'conversation': conv4,
                'sender': investors[1],
                'body': 'Hi Sarah, Innovation Partners here. We\'re very interested in TechFlow AI. Your AI/ML focus aligns perfectly with our portfolio. Can we schedule a call?',
                'created_at': timezone.now() - timedelta(days=2, hours=5),
            },
            {
                'conversation': conv4,
                'sender': ventures[0],
                'body': 'Hi Marcus, absolutely! We\'re currently in discussions with a few investors for our Series A. I\'d be happy to share more details. When works for you?',
                'created_at': timezone.now() - timedelta(days=2, hours=4),
                'read_at': timezone.now() - timedelta(days=2),
            },
        ]

        for msg_data in messages4:
            Message.objects.create(**msg_data)

        conv4.last_message_at = messages4[-1]['created_at']
        conv4.save()

        # Conversation 5: Mentor helping with sales
        conv5 = Conversation.objects.create()
        conv5.participants.add(ventures[3], mentors[3])
        conv5.created_at = timezone.now() - timedelta(days=1)
        conv5.save()

        messages5 = [
            {
                'conversation': conv5,
                'sender': ventures[3],
                'body': 'Hi Jennifer, I\'m David from FinTech Solutions. We\'re struggling with our sales process for small businesses. Would you be available for a consultation?',
                'created_at': timezone.now() - timedelta(days=1, hours=6),
            },
            {
                'conversation': conv5,
                'sender': mentors[3],
                'body': 'Hi David, I\'d be happy to help! Small business sales requires a different approach than enterprise. Let\'s discuss your current process and I can share some frameworks that have worked well.',
                'created_at': timezone.now() - timedelta(days=1, hours=5),
                'read_at': timezone.now() - timedelta(days=1),
            },
        ]

        for msg_data in messages5:
            Message.objects.create(**msg_data)

        conv5.last_message_at = messages5[-1]['created_at']
        conv5.save()

        self.stdout.write(self.style.SUCCESS(f'  ✓ Created 5 conversations with {sum([len(m) for m in [messages1, messages2, messages3, messages4, messages5]])} messages'))
