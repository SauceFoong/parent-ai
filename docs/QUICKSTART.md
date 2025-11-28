# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies

```bash
# Install backend dependencies
npm install

# Install mobile app dependencies
cd mobile && npm install
```

### Step 2: Set Up Environment

```bash
# Copy environment template
cp .env.example .env
```

Edit `.env` file with your credentials:
```env
MONGODB_URI=mongodb://localhost:27017/parent-ai
JWT_SECRET=your-random-secret-here
OPENAI_API_KEY=sk-your-openai-key
```

### Step 3: Start MongoDB

```bash
# macOS
brew services start mongodb-community

# Or use MongoDB Atlas (cloud)
# Get connection string from atlas.mongodb.com
```

### Step 4: Start Backend

```bash
# From project root
npm run dev
```

Backend will start at: http://localhost:3000

### Step 5: Start Mobile App

```bash
# From mobile directory
cd mobile
npm start

# Then press:
# 'i' for iOS simulator
# 'a' for Android emulator
```

## 🎯 First Time Setup

### Create Parent Account

1. Open mobile app
2. Click "Sign up"
3. Enter name, email, password
4. Click "Sign Up"

### Add Your First Child

1. Go to Dashboard
2. Click "➕ Add Child"
3. Enter child's name and age
4. Click "Add Child"

### Configure Settings

1. Go to Settings tab
2. Enable "Monitoring" and "Push Notifications"
3. Adjust content threshold sensitivity
4. Save settings

## 📱 Testing the App

### Simulate Activity Monitoring

You can test the monitoring system by submitting test activities through the API:

```bash
# Get authentication token first
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'

# Submit test activity
curl -X POST http://localhost:3000/api/monitoring/activity \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "childName": "John",
    "activityType": "video",
    "contentTitle": "Test Video",
    "contentDescription": "This is a test video about violence and fighting"
  }'
```

### Check Dashboard

1. Go to Dashboard tab
2. View statistics
3. Check recent alerts
4. View activity history in Activities tab

## 🔍 Verification Checklist

- [ ] Backend server running on http://localhost:3000
- [ ] MongoDB connected (check server logs)
- [ ] Mobile app opened in simulator/emulator
- [ ] User account created successfully
- [ ] Child profile added
- [ ] Test activity appears in dashboard
- [ ] Notifications received (if content is flagged)

## 🆘 Common Issues

**"MongoDB connection error"**
→ Make sure MongoDB is running: `brew services start mongodb-community`

**"OpenAI API error"**
→ Verify your API key in `.env` file

**"Cannot connect to backend from mobile app"**
→ Update API_URL in `mobile/src/services/api.js` to your computer's IP address

**"Push notifications not working"**
→ Push notifications don't work in simulators, use a physical device

## 🎓 Next Steps

1. Review the full README.md for detailed documentation
2. Customize content thresholds in Settings
3. Explore the Activities and Notifications screens
4. Review API documentation for integration
5. Set up Firebase for production push notifications

## 📚 Resources

- **Backend API**: http://localhost:3000
- **API Health Check**: http://localhost:3000/health
- **Expo DevTools**: http://localhost:19002
- **MongoDB Compass**: mongodb://localhost:27017

---

**Need Help?** Check the main README.md for troubleshooting and detailed documentation.

