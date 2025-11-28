# 🚀 Running Parent AI App

## Current Status

✅ **Backend Server**: Running on http://localhost:3000  
✅ **MongoDB**: Connected  
✅ **Firebase**: Integrated and working  
✅ **Firestore**: 3 collections with sample data  

## Running the App

### 1. Backend Server (Already Running)

The backend is currently running on port 3000.

**To restart if needed:**
```bash
cd /Users/sheeyaofoong/Development/parent-ai
npm run dev
```

**Test it:**
```bash
# Health check
curl http://localhost:3000/health

# Get Firestore stats
curl http://localhost:3000/api/test/firestore-stats
```

### 2. Mobile App (React Native/Expo)

**First time setup:**
```bash
# Navigate to mobile directory
cd /Users/sheeyaofoong/Development/parent-ai/mobile

# Install dependencies
npm install
```

**Run the mobile app:**

**Option A: Start Expo Dev Server**
```bash
cd mobile
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

**Option B: Direct Launch**
```bash
# iOS
cd mobile
npm run ios

# Android
cd mobile
npm run android
```

### 3. Access Points

Once running, you'll have:

- **Backend API**: http://localhost:3000
- **Expo DevTools**: http://localhost:19002 (when mobile app starts)
- **Firebase Console**: https://console.firebase.google.com/project/parent-ai-cf603

## Testing the App

### Test Backend API

```bash
# Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Parent",
    "email": "test@example.com",
    "password": "password123"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Get Firestore data
curl http://localhost:3000/api/test/firestore-stats
```

### Test Mobile App

1. **Open the app** in simulator/emulator
2. **Register** a new account
3. **Login** with your credentials
4. **Add a child** profile
5. **View dashboard** with statistics
6. **Check activities** tab
7. **View notifications** tab

## App Features

### For Parents (Mobile App)

1. **Dashboard**
   - View activity statistics
   - See recent alerts
   - Monitor children's screen time

2. **Activities**
   - View all monitored activities
   - Filter by safe/flagged content
   - See AI analysis results

3. **Notifications**
   - Real-time alerts for inappropriate content
   - Severity levels (low, medium, high, critical)
   - Mark as read

4. **Settings**
   - Adjust content thresholds
   - Enable/disable monitoring
   - Manage notification preferences

5. **Children Management**
   - Add multiple children
   - Assign devices
   - View per-child statistics

### Backend API Features

- **Authentication**: JWT-based user auth
- **AI Content Analysis**: OpenAI GPT-4 Vision
- **Activity Monitoring**: Real-time content analysis
- **Push Notifications**: Firebase Cloud Messaging
- **Firebase Integration**: Firestore + Storage
- **MongoDB Support**: Dual database option

## Troubleshooting

### Backend Issues

**Port already in use:**
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9
npm run dev
```

**MongoDB connection error:**
```bash
# Start MongoDB
brew services start mongodb-community

# Check if running
brew services list
```

**Firebase errors:**
- Check `.env` file has correct paths
- Verify service account key exists at specified path
- Ensure Firestore is created in Firebase Console

### Mobile App Issues

**Metro bundler error:**
```bash
cd mobile
npx expo start -c  # Clear cache
```

**Dependencies error:**
```bash
cd mobile
rm -rf node_modules
npm install
```

**iOS simulator not opening:**
```bash
# Open Xcode and install iOS simulator
xcode-select --install
```

**Android emulator not opening:**
- Open Android Studio
- Go to AVD Manager
- Create/start an emulator

## Environment Configuration

### Backend (.env)
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/parent-ai
JWT_SECRET=your-secret-key
OPENAI_API_KEY=your-openai-key
FIREBASE_SERVICE_ACCOUNT_PATH=/Users/sheeyaofoong/.firebase/parent-ai-serviceAccountKey.json
FIREBASE_STORAGE_BUCKET=parent-ai-cf603.appspot.com
FIREBASE_PROJECT_ID=parent-ai-cf603
```

### Mobile App (mobile/src/services/api.js)
```javascript
const API_URL = 'http://localhost:3000/api';
```

**For physical device testing**, change to your computer's IP:
```javascript
const API_URL = 'http://192.168.1.XXX:3000/api';
```

## Quick Commands Reference

```bash
# Backend
npm run dev              # Start backend server
npm start               # Start backend (production)

# Mobile
cd mobile && npm start  # Start Expo dev server
cd mobile && npm run ios     # Run on iOS
cd mobile && npm run android # Run on Android

# Testing
curl http://localhost:3000/health  # Backend health check
curl http://localhost:3000/api/test/firestore-stats  # Firestore data

# Firebase
firebase login          # Login to Firebase CLI
firebase deploy         # Deploy security rules
```

## Next Steps

1. ✅ Backend running
2. ⏳ Start mobile app
3. ⏳ Test registration/login
4. ⏳ Add child profile
5. ⏳ Test activity monitoring
6. ⏳ Verify notifications

## Development Workflow

1. **Start backend**: `npm run dev`
2. **Start mobile app**: `cd mobile && npm start`
3. **Make changes** to code
4. **Backend auto-reloads** (nodemon)
5. **Mobile hot-reloads** (Expo)
6. **Test in simulator/emulator**
7. **View logs** in terminal

## Production Deployment

When ready for production:

1. **Backend**: Deploy to Heroku/DigitalOcean/AWS
2. **Mobile**: Build with Expo and submit to App Store/Play Store
3. **Firebase**: Deploy security rules
4. **Environment**: Update production API URLs

See `DEPLOYMENT.md` for detailed deployment instructions.

---

**Ready to test?** Start the mobile app and try creating an account!

