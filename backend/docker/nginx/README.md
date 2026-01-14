# Nginx Configuration for External Setup

## Documentation Standards

**IMPORTANT RULE**: Minimize the creation of new markdown (MD) documentation files unless explicitly requested. All project documentation, instructions, and updates should be consolidated into existing documentation files rather than creating new ones. This rule applies to all development work and documentation practices across the entire application.

---

## Overview

**Note**: Nginx is NOT included in the Docker stack. These configuration files are provided as examples for setting up nginx separately on your host or a separate server.

## Configuration Files

- `nginx.conf` - Production configuration with TLS 1.3+ enforcement
- `nginx.dev.conf` - Development configuration (HTTP only)

## Setup Instructions

### 1. Install Nginx

On your host server:
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install nginx

# CentOS/RHEL
sudo yum install nginx
```

### 2. Copy Configuration

Copy the appropriate configuration file to your nginx sites:
```bash
# Production
sudo cp nginx.conf /etc/nginx/sites-available/ventureuplink
sudo ln -s /etc/nginx/sites-available/ventureuplink /etc/nginx/sites-enabled/

# Development
sudo cp nginx.dev.conf /etc/nginx/sites-available/ventureuplink-dev
```

### 3. Update Configuration

**Important**: Update the following in the configuration:

1. **Upstream server**: Change `localhost:8000` to your Docker host IP and port
   ```nginx
   upstream django {
       server YOUR_DOCKER_HOST_IP:8000;  # or localhost:8000 if nginx is on same host
   }
   ```

2. **Server name**: Update `server_name` to your domain
   ```nginx
   server_name yourdomain.com www.yourdomain.com;
   ```

3. **SSL Certificates** (production only):
   ```nginx
   ssl_certificate /path/to/your/cert.pem;
   ssl_certificate_key /path/to/your/key.pem;
   ```

4. **Static/Media file paths**: Update paths to match your Docker volumes
   ```nginx
   location /static/ {
       alias /path/to/docker/volume/staticfiles/;
   }
   
   location /media/ {
       alias /path/to/docker/volume/media/;
   }
   ```

### 4. Test and Reload

```bash
# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

## Docker Volume Access

If nginx is on the same host as Docker, you can access volumes directly:
- Static files: Mount point from `static_volume` in docker-compose
- Media files: Mount point from `media_volume` in docker-compose

If nginx is on a different server, you'll need to:
- Use network file system (NFS)
- Sync files via rsync
- Or serve static/media from Django (not recommended for production)

## Security Notes

- TLS 1.3+ is enforced in production configuration
- HSTS headers are enabled
- Security headers are configured
- Make sure to use valid SSL certificates from a trusted CA

## Troubleshooting

- Check nginx error logs: `sudo tail -f /var/log/nginx/error.log`
- Verify Docker service is accessible: `curl http://localhost:8000`
- Check firewall rules for ports 80 and 443
- Verify SSL certificates are valid and accessible
