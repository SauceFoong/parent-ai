# 🛡️ Parent AI

> AI-powered parental control mobile app that monitors children's screen activity and alerts parents about inappropriate content in real-time.

![Expo SDK](https://img.shields.io/badge/Expo-SDK%2054-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

- **🤖 AI Content Analysis** - GPT-4 Vision analyzes screenshots for inappropriate content
- **📱 Real-Time Monitoring** - Background service tracks device activity continuously
- **🔔 Smart Notifications** - Push alerts when violence, adult, or inappropriate content is detected
- **📊 Dashboard** - View activity history, statistics, and alerts at a glance
- **⚙️ Customizable Thresholds** - Adjust sensitivity for different content categories
- **👨‍👩‍👧‍👦 Multi-Child Support** - Monitor multiple children from one parent account

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Node.js, Express, Firebase Admin SDK |
| **Database** | Firebase Firestore |
| **Storage** | Firebase Storage |
| **AI** | OpenAI GPT-4 Vision API |
| **Mobile** | React Native (Expo SDK 54) |
| **Auth** | JWT + Bcrypt |
| **Notifications** | Firebase Cloud Messaging |

## 📁 Project Structure

```
parent-ai/
├── backend/
│   ├── config/          # Firebase & database config
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Auth middleware
│   ├── models/          # Data models
│   ├── routes/          # API routes
│   ├── services/        # Business logic (AI, Firestore, notifications)
│   └── server.js        # Entry point
├── mobile/
│   ├── src/
│   │   ├── context/     # Auth context
│   │   ├── navigation/  # React Navigation setup
│   │   ├── screens/     # App screens
│   │   └── services/    # API client & services
│   ├── App.js           # Mobile entry point
│   └── app.json         # Expo config
├── docs/                # Documentation
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Firebase Project with Firestore enabled
- OpenAI API Key
- Expo Go app (iOS/Android) or simulator

### 1. Clone & Install

```bash
git clone https://github.com/SauceFoong/parent-ai.git
cd parent-ai

# Install backend dependencies
npm install

# Install mobile dependencies
cd mobile && npm install
```

### 2. Configure Environment

```bash
# Copy example env file
cp env.example .env
```

Edit `.env` with your credentials:

```env
# Server
PORT=3000
NODE_ENV=development

# Authentication
JWT_SECRET=your-super-secret-key
JWT_EXPIRE=7d

# Firebase (from service account JSON)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com

# OpenAI
OPENAI_API_KEY=sk-...

# Content Thresholds (0-1)
VIOLENCE_THRESHOLD=0.6
INAPPROPRIATE_THRESHOLD=0.7
ADULT_CONTENT_THRESHOLD=0.8
```

### 3. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select existing
3. Enable **Firestore Database** (Production mode)
4. Enable **Storage**
5. Go to Project Settings → Service Accounts
6. Generate new private key and add credentials to `.env`

### 4. Run the App

**Terminal 1 - Backend:**
```bash
npm run dev
# Server runs on http://localhost:3000
```

**Terminal 2 - Mobile:**
```bash
cd mobile
npx expo start
# Scan QR code with Expo Go app
```

## 📱 Mobile App Screens

| Screen | Description |
|--------|-------------|
| **Login/Register** | User authentication |
| **Dashboard** | Activity overview & stats |
| **Activities** | Detailed activity history |
| **Notifications** | Alert center for flagged content |
| **Settings** | Configure preferences |
| **Add Child** | Create child profiles |

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/settings` | Update settings |
| POST | `/api/auth/children` | Add child profile |

### Monitoring
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/monitoring/activity` | Submit activity |
| GET | `/api/monitoring/activities` | Get activity history |
| GET | `/api/monitoring/stats` | Get statistics |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get all notifications |
| PUT | `/api/notifications/:id/read` | Mark as read |

## 🤖 AI Content Analysis

The system analyzes content for:

| Category | Threshold | Examples |
|----------|-----------|----------|
| **Violence** | 0.6 | Weapons, fighting, blood |
| **Adult** | 0.8 | Sexual content, nudity |
| **Inappropriate** | 0.7 | Drugs, profanity, dangerous activities |

Scores range from 0 (safe) to 1 (highly inappropriate).

## 🔒 Security

- ✅ JWT token authentication
- ✅ Bcrypt password hashing
- ✅ Firestore security rules
- ✅ HTTPS in production
- ✅ Environment variable secrets

## 🛠️ Development

### Backend Commands
```bash
npm run dev      # Development with nodemon
npm start        # Production
```

### Mobile Commands
```bash
npx expo start           # Start dev server
npx expo start --clear   # Clear cache & start
npm run ios              # iOS simulator
npm run android          # Android emulator
```

### Health Check
```bash
curl http://localhost:3000/health
```

## 🐛 Troubleshooting

### "EMFILE: too many open files"
```bash
# macOS fix
ulimit -n 65536
brew install watchman
```

### "Network Error" on mobile
- Ensure backend is running on `0.0.0.0:3000`
- For simulator: use `localhost`
- For physical device: use your computer's IP address

### Firestore permission denied
- Check Firebase security rules
- Ensure service account credentials are correct

## 📚 Documentation

See the [`docs/`](./docs/) folder for detailed guides:

- [Quick Start Guide](./docs/QUICKSTART.md)
- [API Documentation](./docs/API_DOCUMENTATION.md)
- [Firebase Setup](./docs/FIREBASE_INTEGRATION.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Expo Go Guide](./docs/EXPO_GO_GUIDE.md)

## 🗺️ Roadmap

- [ ] Web dashboard for parents
- [ ] Screen time limits
- [ ] App blocking
- [ ] Location tracking
- [ ] Detailed analytics
- [ ] Multi-language support

## ⚖️ Legal Notice

This app is designed for **parental monitoring purposes only**. Ensure compliance with local laws regarding child monitoring before deployment. Implement proper consent mechanisms and privacy policies.

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🙏 Acknowledgments

- [OpenAI](https://openai.com) - GPT-4 Vision API
- [Firebase](https://firebase.google.com) - Backend services
- [Expo](https://expo.dev) - React Native tooling

---

<p align="center">
  Made with ❤️ for safer digital experiences
</p>
