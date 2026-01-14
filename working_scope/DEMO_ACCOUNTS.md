# Demo Accounts Reference

## Documentation Standards

**IMPORTANT RULE**: Minimize the creation of new markdown (MD) documentation files unless explicitly requested. All project documentation, instructions, and updates should be consolidated into existing documentation files rather than creating new ones. This rule applies to all development work and documentation practices across the entire application.

---

## Overview
Demo accounts are available for testing the platform. These accounts are created automatically when the Docker container starts for the first time.

## Demo Account Credentials

**All demo accounts use the password: `demo123`**

### Venture Accounts

1. **TechFlow AI**
   - Email: `sarah@techflow.ai`
   - Role: Venture
   - Company: TechFlow AI
   - Sector: AI/ML

2. **GreenSpace**
   - Email: `marcus@greenspace.co`
   - Role: Venture
   - Company: GreenSpace
   - Sector: CleanTech

3. **HealthBridge**
   - Email: `lisa@healthbridge.com`
   - Role: Venture
   - Company: HealthBridge
   - Sector: HealthTech

4. **FinTech Solutions**
   - Email: `david@fintech-solutions.io`
   - Role: Venture
   - Company: FinTech Solutions
   - Sector: FinTech

### Investor Accounts

1. **TechVentures Capital**
   - Email: `sarah.chen@techventures.com`
   - Role: Investor
   - Organization: TechVentures Capital
   - Type: Firm

2. **GreenTech Ventures**
   - Email: `marcus@greentech-ventures.com`
   - Role: Investor
   - Organization: GreenTech Ventures
   - Type: Firm

3. **Innovation Angels**
   - Email: `lisa@innovation-angels.com`
   - Role: Investor
   - Organization: Innovation Angels
   - Type: Individual

### Mentor Accounts

1. **James Wilson**
   - Email: `james@stripe.com`
   - Role: Mentor
   - Company: Stripe
   - Expertise: Go-to-Market, Sales

2. **Sarah Johnson**
   - Email: `sarah@startupmentor.io`
   - Role: Mentor
   - Company: Startup Mentor
   - Expertise: Product, Strategy

## Superuser Account

**Admin Account:**
- Email: `admin@venturelink.com`
- Password: `admin123`
- Role: Admin
- Access: Full administrative access + Django Admin Panel

## Creating Demo Accounts

Demo accounts are automatically created when the Docker container starts via the `create_demo_accounts` management command in `entrypoint.sh`.

To manually create demo accounts:
```bash
docker-compose exec web python manage.py create_demo_accounts
```

## Notes

- All demo accounts are automatically email-verified
- Demo accounts are for testing purposes only
- In production, these accounts should be removed or secured
- Demo accounts use simple passwords for easy testing
