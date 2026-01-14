# Email Configuration

## Documentation Standards

**IMPORTANT RULE**: Minimize the creation of new markdown (MD) documentation files unless explicitly requested. All project documentation, instructions, and updates should be consolidated into existing documentation files rather than creating new ones. This rule applies to all development work and documentation practices across the entire application.

---

## SMTP Settings

The application is configured to use the following SMTP server:

- **SMTP Server**: `mail.prosolutions-ks.com`
- **SMTP Port**: `465` (SSL/TLS)
- **Username**: `ventures@prosolutions-ks.com`
- **Password**: `ventures_APP!@`
- **From Email**: `ventures@prosolutions-ks.com`

## Configuration

### Development Environment

In development, emails are sent to the console by default (see `development.py`). To use real SMTP in development, set in `.env`:

```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
```

### Production Environment

Production uses SMTP by default. Ensure your `.env` file contains:

```env
EMAIL_HOST=mail.prosolutions-ks.com
EMAIL_PORT=465
EMAIL_USE_SSL=True
EMAIL_HOST_USER=ventures@prosolutions-ks.com
EMAIL_HOST_PASSWORD=ventures_APP!@
DEFAULT_FROM_EMAIL=ventures@prosolutions-ks.com
```

## Testing Email

### Using Django Shell

```bash
docker-compose exec web python manage.py shell
```

Then in the shell:
```python
from django.core.mail import send_mail

send_mail(
    'Test Subject',
    'Test message body',
    'ventures@prosolutions-ks.com',
    ['recipient@example.com'],
    fail_silently=False,
)
```

### Using Management Command

Create a test email command:
```bash
docker-compose exec web python manage.py sendtestemail recipient@example.com
```

## Email Templates

Email templates are used for:
- Email verification
- Password reset
- Approval notifications
- Rejection notifications

Templates can be customized in the respective app directories.

## Troubleshooting

### Email Not Sending

1. **Check SMTP credentials**: Verify username and password are correct
2. **Check port**: Port 465 requires SSL, not TLS
3. **Check firewall**: Ensure port 465 is not blocked
4. **Check logs**: View Django logs for SMTP errors
   ```bash
   docker-compose logs web | grep -i email
   ```

### Common Errors

- **Authentication failed**: Check username/password
- **Connection refused**: Check SMTP server and port
- **SSL errors**: Ensure EMAIL_USE_SSL=True for port 465

## Security Notes

⚠️ **Important**: Never commit `.env` file with real credentials to version control.

The `.env.example` file contains placeholder values. Always use environment variables for sensitive information in production.
