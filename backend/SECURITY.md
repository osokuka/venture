# Security Configuration for VentureUP Link

## Documentation Standards

**IMPORTANT RULE**: Minimize the creation of new markdown (MD) documentation files unless explicitly requested. All project documentation, instructions, and updates should be consolidated into existing documentation files rather than creating new ones. This rule applies to all development work and documentation practices across the entire application.

---

## Session Security

### Django Session Configuration

The application uses database-backed sessions with enhanced security:

- **Session Engine**: Database-backed (`django.contrib.sessions.backends.db`)
- **HttpOnly Cookies**: Enabled to prevent JavaScript access
- **SameSite**: `Lax` (development) / `Strict` (production)
- **Secure Cookies**: Enabled in production (HTTPS only)
- **Session Timeout**: 24 hours (development) / 1 hour (production)
- **Session Refresh**: On every request in production

### Session Security Settings

**Development (`base.py`)**:
```python
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_AGE = 86400  # 24 hours
```

**Production (`production.py`)**:
```python
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Strict'
SESSION_COOKIE_AGE = 3600  # 1 hour
SESSION_SAVE_EVERY_REQUEST = True
```

## TLS/SSL Configuration

### TLS 1.3+ Enforcement

**Note**: Nginx is configured separately (not in Docker stack). The example nginx configuration in `docker/nginx/nginx.conf` enforces TLS 1.3 or higher:

```nginx
ssl_protocols TLSv1.3 TLSv1.2;
ssl_prefer_server_ciphers on;
ssl_ciphers 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256';
```

Configure your external nginx to proxy to the Django/Gunicorn service on port 8000.

### Security Headers

**HSTS (HTTP Strict Transport Security)**:
- Max age: 1 year (31536000 seconds)
- Include subdomains: Yes
- Preload: Enabled

**Other Security Headers**:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy`: Configured for XSS protection

## JWT Token Security

### Token Configuration

- **Access Token Lifetime**: 15 minutes
- **Refresh Token Lifetime**: 7 days
- **Token Rotation**: Enabled
- **Blacklist After Rotation**: Enabled
- **Algorithm**: HS256

### Token Storage

**Current Implementation**: Tokens stored in `localStorage`
- **Pros**: Easy to implement, works across tabs
- **Cons**: Vulnerable to XSS attacks

**Recommended for Production**: Consider using httpOnly cookies for refresh tokens
- Store refresh token in httpOnly cookie (set by backend)
- Store access token in memory (not localStorage)
- Implement token refresh mechanism

## CSRF Protection

- **CSRF Cookie**: HttpOnly and Secure (production)
- **SameSite**: `Lax` (development) / `Strict` (production)
- **CSRF Token**: Included in all state-changing requests

## Database Security

- **Connection Pooling**: Enabled in production
- **Password Validation**: Enforced (minimum 8 characters, complexity requirements)
- **Encrypted Connections**: Use SSL for database connections in production

## File Upload Security

- **Max File Size**: 10MB
- **File Type Validation**: Enforced server-side
- **Virus Scanning**: Recommended for production (not implemented in MVP)

## API Security

- **Rate Limiting**: Recommended for auth endpoints (not implemented in MVP)
- **CORS**: Configured with specific allowed origins
- **Authentication**: JWT required for all protected endpoints
- **Authorization**: Role-based permissions enforced server-side

## Production Deployment Checklist

- [ ] External nginx configured and running
- [ ] SSL/TLS certificates configured in nginx
- [ ] TLS 1.3+ enforced in nginx
- [ ] HSTS headers enabled in nginx
- [ ] Security headers configured in nginx
- [ ] Nginx proxying to Django/Gunicorn on port 8000
- [ ] Static files served by nginx from `/app/staticfiles`
- [ ] Session cookies secure
- [ ] CSRF protection enabled
- [ ] Database SSL connections enabled
- [ ] Environment variables secured
- [ ] Debug mode disabled
- [ ] Error messages sanitized
- [ ] Logging configured (no sensitive data)
- [ ] Regular security updates scheduled

## Security Best Practices

1. **Never commit secrets** to version control
2. **Use environment variables** for sensitive configuration
3. **Regular security audits** of dependencies
4. **Keep dependencies updated** with security patches
5. **Monitor for security vulnerabilities** (e.g., GitHub Dependabot)
6. **Implement rate limiting** for authentication endpoints
7. **Use HTTPS everywhere** in production
8. **Regular backups** with encrypted storage
9. **Access logging** for security monitoring
10. **Incident response plan** documented
