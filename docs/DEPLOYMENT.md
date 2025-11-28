# Deployment Guide

## Overview

This guide covers deploying the Parent AI application to production environments.

---

## Prerequisites

- Domain name (optional but recommended)
- SSL certificate
- MongoDB instance (cloud or self-hosted)
- OpenAI API key with sufficient quota
- Firebase project with Cloud Messaging enabled
- Server with Node.js support

---

## Backend Deployment Options

### Option 1: Heroku (Easiest)

#### 1. Prepare Your Application

```bash
# Create Procfile in project root
echo "web: node backend/server.js" > Procfile

# Make sure your package.json has the start script
```

#### 2. Deploy to Heroku

```bash
# Install Heroku CLI
brew install heroku/brew/heroku

# Login to Heroku
heroku login

# Create new app
heroku create parent-ai-backend

# Add MongoDB addon
heroku addons:create mongolab:sandbox

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set OPENAI_API_KEY=your-openai-key
heroku config:set FIREBASE_PROJECT_ID=your-project-id
heroku config:set FIREBASE_PRIVATE_KEY="your-private-key"
heroku config:set FIREBASE_CLIENT_EMAIL=your-client-email
heroku config:set VIOLENCE_THRESHOLD=0.6
heroku config:set INAPPROPRIATE_THRESHOLD=0.7
heroku config:set ADULT_CONTENT_THRESHOLD=0.8

# Deploy
git push heroku main

# Check logs
heroku logs --tail
```

---

### Option 2: DigitalOcean/AWS/VPS

#### 1. Server Setup

```bash
# SSH into your server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt update
apt install -y mongodb-org
systemctl start mongod
systemctl enable mongod

# Install PM2 for process management
npm install -g pm2
```

#### 2. Deploy Application

```bash
# Clone repository
cd /var/www
git clone https://github.com/yourusername/parent-ai.git
cd parent-ai

# Install dependencies
npm install --production

# Create .env file
nano .env
# Paste your production environment variables

# Start application with PM2
pm2 start backend/server.js --name parent-ai
pm2 save
pm2 startup
```

#### 3. Configure Nginx (Reverse Proxy)

```bash
# Install Nginx
apt install -y nginx

# Create Nginx config
nano /etc/nginx/sites-available/parent-ai
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/parent-ai /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# Install SSL with Let's Encrypt
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com

# Auto-renewal
systemctl enable certbot.timer
```

---

### Option 3: Docker Deployment

#### 1. Create Dockerfile

Create `Dockerfile` in project root:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY backend ./backend
COPY .env ./.env

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "backend/server.js"]
```

#### 2. Create docker-compose.yml

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    restart: always
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: secure_password

  backend:
    build: .
    restart: always
    ports:
      - "3000:3000"
    depends_on:
      - mongodb
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://admin:secure_password@mongodb:27017/parent-ai?authSource=admin
      - JWT_SECRET=${JWT_SECRET}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
      - FIREBASE_PRIVATE_KEY=${FIREBASE_PRIVATE_KEY}
      - FIREBASE_CLIENT_EMAIL=${FIREBASE_CLIENT_EMAIL}

volumes:
  mongodb_data:
```

#### 3. Deploy with Docker

```bash
# Build and start
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## Mobile App Deployment

### iOS Deployment

#### 1. Prepare for iOS

```bash
cd mobile

# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure
```

#### 2. Build iOS App

```bash
# Build for App Store
eas build --platform ios

# Build for TestFlight
eas submit --platform ios
```

#### 3. App Store Submission

1. Download IPA from Expo
2. Upload to App Store Connect using Transporter
3. Fill in app information
4. Submit for review

---

### Android Deployment

#### 1. Build Android App

```bash
# Build for Google Play
eas build --platform android

# Build APK for testing
eas build --platform android --profile preview
```

#### 2. Google Play Submission

1. Create app in Google Play Console
2. Upload AAB file
3. Fill in store listing
4. Set up pricing and distribution
5. Submit for review

---

## Production Configuration

### Environment Variables

Create `.env` file with production values:

```env
# Server
PORT=3000
NODE_ENV=production

# Database (Use MongoDB Atlas for production)
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/parent-ai?retryWrites=true&w=majority

# Security
JWT_SECRET=<generate-strong-random-string>
JWT_EXPIRE=7d

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Firebase
FIREBASE_PROJECT_ID=parent-ai-prod
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@parent-ai-prod.iam.gserviceaccount.com

# Monitoring Thresholds
VIOLENCE_THRESHOLD=0.6
INAPPROPRIATE_THRESHOLD=0.7
ADULT_CONTENT_THRESHOLD=0.8
```

### Generate Secure JWT Secret

```bash
openssl rand -base64 64
```

---

## MongoDB Atlas Setup

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster (free tier available)
3. Configure network access (add your server IP)
4. Create database user
5. Get connection string
6. Update `MONGODB_URI` in `.env`

---

## Firebase Setup for Production

1. Go to https://console.firebase.google.com
2. Create new project
3. Enable Cloud Messaging
4. Generate service account key:
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
5. Add credentials to `.env`

---

## Mobile App Configuration

### Update API URL

Edit `mobile/src/services/api.js`:

```javascript
const API_URL = 'https://your-domain.com/api'; // Production URL
```

### Update app.json

```json
{
  "expo": {
    "name": "Parent AI",
    "slug": "parent-ai",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourcompany.parentai",
      "buildNumber": "1"
    },
    "android": {
      "package": "com.yourcompany.parentai",
      "versionCode": 1
    }
  }
}
```

---

## Security Checklist

- [ ] Strong JWT secret generated
- [ ] MongoDB authentication enabled
- [ ] Database access restricted by IP
- [ ] HTTPS/SSL enabled
- [ ] Environment variables secured
- [ ] API rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] CORS properly configured
- [ ] Security headers added
- [ ] Regular dependency updates
- [ ] Error messages don't expose sensitive info
- [ ] Logs don't contain sensitive data

---

## Monitoring & Maintenance

### Setup Monitoring

#### 1. Application Monitoring

```bash
# Install PM2 monitoring
pm2 install pm2-logrotate

# Set up log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

#### 2. Error Tracking

Consider integrating:
- Sentry for error tracking
- LogRocket for user session replay
- New Relic for performance monitoring

### Backup Strategy

```bash
# Automated MongoDB backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="mongodb://localhost:27017/parent-ai" --out="/backups/mongodb_$DATE"
find /backups -type d -mtime +7 -exec rm -rf {} \;
```

### Health Checks

Set up monitoring for:
- Backend API endpoint: `GET /health`
- MongoDB connectivity
- OpenAI API availability
- Firebase connectivity
- Disk space usage
- Memory usage
- CPU usage

---

## Scaling Considerations

### Load Balancing

Use Nginx for load balancing:

```nginx
upstream backend {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    location / {
        proxy_pass http://backend;
    }
}
```

### Database Scaling

- Enable MongoDB replica sets for high availability
- Set up read replicas for read-heavy operations
- Implement database sharding for large datasets

### Caching

Implement Redis for:
- Session management
- API response caching
- Rate limiting

---

## Update Deployment

### Backend Updates

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install --production

# Restart application
pm2 restart parent-ai
```

### Mobile App Updates

```bash
# Increment version in app.json
# Build new version
eas build --platform all

# Submit to stores
eas submit --platform all
```

---

## Rollback Procedure

### Backend Rollback

```bash
# Revert to previous commit
git revert HEAD

# Or checkout specific version
git checkout <commit-hash>

# Restart application
pm2 restart parent-ai
```

### Mobile App Rollback

- Use App Store/Play Store console to revert to previous version
- Or submit new build with previous codebase

---

## Cost Estimation

### Monthly Costs (Approximate)

- **DigitalOcean Droplet**: $12-50/month
- **MongoDB Atlas**: $0-57/month (free tier available)
- **OpenAI API**: Variable ($0.03 per 1K tokens)
- **Firebase**: Free tier usually sufficient
- **Domain + SSL**: $10-15/year
- **App Store**: $99/year (iOS), $25 one-time (Android)

**Total**: ~$25-100/month + store fees

---

## Support & Troubleshooting

### Common Production Issues

**High Memory Usage**
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" node backend/server.js
```

**MongoDB Connection Pool Exhausted**
```javascript
// Increase pool size in database.js
mongoose.connect(uri, {
  maxPoolSize: 50,
  minPoolSize: 10
});
```

**API Rate Limit Exceeded**
- Implement caching
- Batch requests
- Upgrade OpenAI plan

---

## Legal Compliance

Before launching:

1. **Privacy Policy**: Detail what data is collected and how it's used
2. **Terms of Service**: Define usage terms and limitations
3. **COPPA Compliance**: If users under 13, implement parental consent
4. **GDPR Compliance**: If EU users, implement data rights features
5. **Data Retention**: Define and implement data retention policies
6. **User Consent**: Implement proper consent mechanisms

---

## Post-Deployment

- [ ] Test all features in production
- [ ] Verify push notifications work
- [ ] Check AI analysis accuracy
- [ ] Monitor error logs
- [ ] Set up alerts for downtime
- [ ] Create backup schedule
- [ ] Document production procedures
- [ ] Train support team
- [ ] Prepare incident response plan

---

For questions or issues, refer to the main README.md or create an issue in the repository.

