# Deployment Guide

This guide covers deploying FlowWave to production.

## Deployment Options

1. [Docker (Recommended)](#docker)
2. [VPS/Bare Metal](#vps)
3. [Vercel + Railway](#vercel-railway)
4. [Kubernetes](#kubernetes)

---

## Docker

The easiest way to deploy FlowWave.

### Prerequisites
- Docker 20+
- Docker Compose 2+

### Deployment

```bash
# Clone repository
git clone https://github.com/yourusername/flowwave.git
cd flowwave

# Create production environment
cp .env.example .env.production

# Edit environment variables
nano .env.production
```

**Required Environment Variables:**
```env
NODE_ENV=production
DATABASE_URL=file:/data/flowwave.db
JWT_SECRET=<generate-strong-secret>
JWT_REFRESH_SECRET=<generate-another-secret>
```

**Start Services:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Production Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: docker/Dockerfile.prod
    ports:
      - "80:3000"
      - "3001:3001"
    volumes:
      - flowwave_data:/data
    environment:
      - NODE_ENV=production
    restart: always
    
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: always

volumes:
  flowwave_data:
  redis_data:
```

---

## VPS

### Prerequisites
- Ubuntu 22.04+ or similar
- Node.js 18+
- nginx (optional, for reverse proxy)

### Installation

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and build
git clone https://github.com/yourusername/flowwave.git
cd flowwave
npm install
npm run build

# Setup database
npx prisma db push --schema=packages/database/prisma/schema.prisma

# Install PM2
npm install -g pm2

# Start with PM2
pm2 start npm --name "flowwave" -- run start
pm2 save
pm2 startup
```

### Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/flowwave
server {
    listen 80;
    server_name flowwave.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
    }
}
```

---

## Vercel + Railway

### Frontend (Vercel)

1. Push to GitHub
2. Import in Vercel
3. Set environment variables:
   - `VITE_API_URL=https://your-railway-api.up.railway.app`

### Backend (Railway)

1. Create new project in Railway
2. Connect GitHub repository
3. Set root directory: `apps/server`
4. Add environment variables
5. Deploy

---

## Kubernetes

### Helm Chart

```yaml
# helm/values.yaml
replicaCount: 2

image:
  repository: flowwave/app
  tag: latest
  
service:
  type: ClusterIP
  port: 3000

ingress:
  enabled: true
  hosts:
    - host: flowwave.yourdomain.com
      paths:
        - path: /
          
redis:
  enabled: true
  
persistence:
  enabled: true
  size: 10Gi
```

### Deploy

```bash
helm install flowwave ./helm -f values.yaml
```

---

## SSL/TLS

### With Let's Encrypt (Certbot)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d flowwave.yourdomain.com
```

### With Cloudflare

1. Add site to Cloudflare
2. Enable "Full (strict)" SSL
3. Use Cloudflare's Origin Certificate

---

## Monitoring

### Health Check

```bash
curl http://localhost:3001/health
```

### Logs

```bash
# Docker
docker-compose logs -f app

# PM2
pm2 logs flowwave
```

### Metrics

Consider adding:
- Prometheus + Grafana
- Sentry for error tracking
- Uptime monitoring (UptimeRobot)

---

## Backup

### Manual Backup

```bash
# SQLite database
cp /data/flowwave.db /backup/flowwave-$(date +%Y%m%d).db
```

### Automated Backup

```bash
# /etc/cron.daily/flowwave-backup
#!/bin/bash
cp /data/flowwave.db /backup/flowwave-$(date +%Y%m%d).db
find /backup -name "flowwave-*.db" -mtime +7 -delete
```

---

## Scaling

### Horizontal Scaling

1. Use Redis for BullMQ (instead of in-memory)
2. Deploy multiple app instances behind load balancer
3. Use shared database (PostgreSQL recommended)

### Performance Tips

1. Enable GZIP compression in nginx
2. Use CDN for static assets
3. Enable SQLite WAL mode for better concurrency
