# Parent AI - Parental Control Mobile App

A comprehensive AI-powered parental control mobile application that monitors children's screen activity in real-time and alerts parents about inappropriate content.

## 🌟 Features

- **AI-Powered Content Analysis**: Uses OpenAI GPT-4 Vision to analyze screenshots and text content
- **Real-Time Monitoring**: Background service continuously monitors device activity
- **Smart Notifications**: Parents receive push notifications when inappropriate content is detected
- **Comprehensive Dashboard**: View activity history, statistics, and recent alerts
- **Customizable Thresholds**: Adjust sensitivity levels for violence, adult content, and general inappropriateness
- **Multi-Child Support**: Monitor multiple children's devices from one account
- **Activity Tracking**: Track screen time and content consumption patterns

## 📋 Prerequisites

- Node.js v16+ and npm/yarn
- MongoDB (local or cloud instance)
- OpenAI API key
- Firebase account (for push notifications)
- Expo CLI (for mobile app development)
- iOS Simulator or Android Emulator (for testing)

## 🚀 Installation

### 1. Clone the Repository

```bash
cd /Users/sheeyaofoong/Development/parent-ai
```

### 2. Backend Setup

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your credentials:
# - MONGODB_URI: Your MongoDB connection string
# - JWT_SECRET: Random secret string for JWT tokens
# - OPENAI_API_KEY: Your OpenAI API key
# - FIREBASE_* : Your Firebase credentials
```

### 3. Mobile App Setup

```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# Update API URL in src/services/api.js
# Change 'http://localhost:3000/api' to your backend URL
```

### 4. Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Cloud Messaging
3. Download service account key (JSON)
4. Add Firebase credentials to `.env` file:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_CLIENT_EMAIL`

### 5. MongoDB Setup

**Option A: Local MongoDB**
```bash
# Install MongoDB locally
brew install mongodb-community  # macOS
# Or download from https://www.mongodb.com/try/download/community

# Start MongoDB
brew services start mongodb-community
```

**Option B: MongoDB Atlas (Cloud)**
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

## 🏃 Running the Application

### Start Backend Server

```bash
# From project root
npm run dev

# Or for production
npm start
```

The server will start on `http://localhost:3000`

### Start Mobile App

```bash
# From mobile directory
cd mobile

# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

## 📱 How It Works

### For Parents:

1. **Sign Up**: Create an account using email and password
2. **Add Children**: Add profiles for each child you want to monitor
3. **Configure Settings**: Adjust content detection thresholds and notification preferences
4. **Monitor**: View real-time activity and receive alerts when inappropriate content is detected

### For Monitoring:

1. **Background Service**: The app runs in the background on children's devices
2. **Content Capture**: Captures screenshots and app information periodically
3. **AI Analysis**: Sends data to backend for AI-powered content analysis
4. **Alert System**: Parents receive push notifications for flagged content
5. **Activity Log**: All activities are logged and available in the dashboard

## 🔒 Security & Privacy

- **Encrypted Communication**: All API calls use HTTPS
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt hashing for password storage
- **Private Data**: Screenshots and activity data are only accessible to parent accounts
- **Secure Storage**: Sensitive data stored securely in MongoDB

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/settings` - Update settings
- `POST /api/auth/device-token` - Add device token
- `POST /api/auth/children` - Add child profile

### Monitoring
- `POST /api/monitoring/activity` - Submit new activity
- `GET /api/monitoring/activities` - Get activity history
- `GET /api/monitoring/stats` - Get activity statistics
- `PUT /api/monitoring/activity/:id/duration` - Update activity duration

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark notification as read

## 🎨 Mobile App Screens

1. **Login/Register** - User authentication
2. **Dashboard** - Overview of monitoring statistics
3. **Activities** - Detailed activity history with filtering
4. **Notifications** - Alert center for flagged content
5. **Settings** - Configure monitoring preferences
6. **Add Child** - Create new child profiles

## 🤖 AI Content Analysis

The system uses OpenAI GPT-4 Vision API to analyze:

- **Violence**: Weapons, fighting, blood, aggressive behavior
- **Adult Content**: Sexual content, nudity, explicit material
- **Inappropriate Content**: Drugs, alcohol, profanity, dangerous activities

Each category receives a score from 0 (safe) to 1 (highly inappropriate).

### Fallback Analysis

If AI API is unavailable, the system uses keyword-based analysis as a fallback.

## 🔧 Configuration

### Content Thresholds

Default thresholds (can be customized per user):
- Violence: 0.6 (60%)
- Inappropriate Content: 0.7 (70%)
- Adult Content: 0.8 (80%)

### Notification Severity Levels

- **Low**: Score 0.6-0.69
- **Medium**: Score 0.7-0.79
- **High**: Score 0.8-0.89
- **Critical**: Score 0.9-1.0

## 🧪 Testing

### Test Backend

```bash
# Start MongoDB
brew services start mongodb-community

# Start backend
npm run dev

# Test API endpoints using curl or Postman
curl http://localhost:3000/health
```

### Test Mobile App

```bash
# Start Expo
cd mobile
npm start

# Press 'i' for iOS simulator
# Press 'a' for Android emulator
```

## 🚨 Troubleshooting

### Backend Issues

**MongoDB Connection Error**
```bash
# Check if MongoDB is running
brew services list

# Restart MongoDB
brew services restart mongodb-community
```

**OpenAI API Error**
- Verify API key in `.env`
- Check API quota at https://platform.openai.com/usage

### Mobile App Issues

**Metro Bundler Error**
```bash
# Clear cache
cd mobile
npx expo start -c
```

**Push Notifications Not Working**
- Verify Firebase configuration
- Test on physical device (notifications don't work on simulators)
- Check device token is registered in backend

## 📦 Production Deployment

### Backend Deployment

**Option 1: Heroku**
```bash
heroku create parent-ai-backend
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set JWT_SECRET=your-secret
heroku config:set OPENAI_API_KEY=your-api-key
git push heroku main
```

**Option 2: DigitalOcean/AWS**
- Deploy using Docker
- Set up MongoDB instance
- Configure environment variables
- Set up SSL/HTTPS

### Mobile App Deployment

**iOS**
```bash
cd mobile
expo build:ios
# Follow Expo's instructions to submit to App Store
```

**Android**
```bash
cd mobile
expo build:android
# Follow Expo's instructions to submit to Google Play
```

## 🔄 Background Monitoring

The app uses Expo's Background Fetch API to monitor content even when the app is in the background:

- Minimum interval: 60 seconds
- Persists across device restarts
- Low battery impact

## 📝 Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/parent-ai

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

# OpenAI
OPENAI_API_KEY=sk-...

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Thresholds
VIOLENCE_THRESHOLD=0.6
INAPPROPRIATE_THRESHOLD=0.7
ADULT_CONTENT_THRESHOLD=0.8
```

## 🤝 Contributing

This is a demonstration project. For production use:
- Add comprehensive error handling
- Implement rate limiting
- Add input validation
- Set up logging and monitoring
- Implement data retention policies
- Add GDPR compliance features

## ⚖️ Legal & Privacy Considerations

**Important**: This app is designed for parental monitoring purposes only. Before deploying:

1. Ensure compliance with local laws regarding child monitoring
2. Implement proper consent mechanisms
3. Add privacy policy and terms of service
4. Consider age restrictions and parental consent requirements
5. Implement data retention and deletion policies
6. Ensure COPPA, GDPR, and other privacy regulation compliance

## 🛠️ Technology Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- OpenAI GPT-4 Vision API
- Firebase Admin SDK
- JWT Authentication
- Winston (Logging)

### Mobile App
- React Native (Expo)
- React Navigation
- Axios (API calls)
- AsyncStorage (Local storage)
- Expo Notifications
- Expo Background Fetch

## 📄 License

This project is provided as-is for educational and demonstration purposes.

## 🙏 Acknowledgments

- OpenAI for GPT-4 Vision API
- Firebase for push notifications
- Expo for React Native development tools
- MongoDB for database solution

---

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check logs in `logs/` directory
4. Verify environment variables are set correctly

## 🎯 Future Enhancements

- [ ] Web dashboard for parents
- [ ] Screen time limits and scheduling
- [ ] App blocking capabilities
- [ ] Location tracking
- [ ] Social media monitoring
- [ ] Detailed analytics and reports
- [ ] Multi-language support
- [ ] Family sharing features
- [ ] AI model fine-tuning for better accuracy
- [ ] Offline monitoring capabilities

