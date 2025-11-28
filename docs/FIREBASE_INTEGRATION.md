# Firebase Integration for Parent AI

This document explains how to use Firebase (Firestore + Storage) alongside or instead of MongoDB in your Parent AI application.

## Architecture Options

### Option 1: Hybrid (Recommended for Migration)
- Keep MongoDB for existing data
- Use Firestore for new features
- Use Firebase Storage for screenshots and media
- Gradually migrate to full Firebase

### Option 2: Full Firebase
- Replace MongoDB with Firestore completely
- Use Firebase Storage for all files
- Use Firebase Authentication
- Simplify infrastructure

## Services Created

### 1. FirebaseAdmin (`backend/config/firebaseAdmin.js`)
Central Firebase initialization and admin SDK access.

```javascript
const { initializeFirebase, getFirestore, getStorage, getAuth } = require('./config/firebaseAdmin');

// Initialize Firebase
initializeFirebase();

// Get services
const db = getFirestore();
const storage = getStorage();
const auth = getAuth();
```

### 2. FirestoreService (`backend/services/firestoreService.js`)
High-level Firestore operations.

```javascript
const firestoreService = require('./services/firestoreService');

// Create document
await firestoreService.createDocument('users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// Query documents
const users = await firestoreService.queryDocuments('users', {
  where: [['role', '==', 'parent']],
  orderBy: ['createdAt', 'desc']
}, { limit: 10 });

// Get document
const user = await firestoreService.getDocument('users', 'user123');

// Update document
await firestoreService.updateDocument('users', 'user123', {
  name: 'Jane Doe'
});

// Delete document
await firestoreService.deleteDocument('users', 'user123');
```

### 3. FirebaseStorageService (`backend/services/firebaseStorageService.js`)
File upload and management.

```javascript
const storageService = require('./services/firebaseStorageService');

// Upload from buffer
await storageService.uploadFile('screenshots/activity123.png', buffer, {
  contentType: 'image/png',
  public: true
});

// Upload from URL
await storageService.uploadFromURL('screenshots/activity123.png', 'https://example.com/image.png');

// Get download URL
const url = await storageService.getDownloadURL('screenshots/activity123.png');

// List files
const files = await storageService.listFiles('screenshots/');

// Delete file
await storageService.deleteFile('screenshots/activity123.png');
```

## Firestore Collections Structure

### users
```javascript
{
  id: "auto-generated",
  email: "parent@example.com",
  name: "Parent Name",
  role: "parent",
  children: [
    {
      name: "Child Name",
      age: 10,
      deviceId: "device-123"
    }
  ],
  settings: {
    violenceThreshold: 0.6,
    inappropriateThreshold: 0.7,
    adultContentThreshold: 0.8,
    notificationsEnabled: true,
    monitoringEnabled: true
  },
  deviceTokens: ["token1", "token2"],
  createdAt: "2024-11-27T00:00:00.000Z",
  updatedAt: "2024-11-27T00:00:00.000Z"
}
```

### activities
```javascript
{
  id: "auto-generated",
  userId: "user-id",
  childName: "Child Name",
  deviceId: "device-123",
  activityType: "video", // video, game, app, website
  contentTitle: "Video Title",
  contentDescription: "Description",
  appName: "YouTube",
  url: "https://example.com",
  screenshot: "gs://bucket/screenshots/activity123.png", // Firebase Storage path
  screenshotURL: "https://storage.googleapis.com/...", // Public URL
  aiAnalysis: {
    isInappropriate: false,
    violenceScore: 0.2,
    adultContentScore: 0.1,
    inappropriateScore: 0.15,
    detectedCategories: ["Educational"],
    summary: "Safe educational content",
    confidence: 0.95
  },
  flagged: false,
  notificationSent: false,
  timestamp: "2024-11-27T10:30:00.000Z",
  duration: 300 // seconds
}
```

### notifications
```javascript
{
  id: "auto-generated",
  userId: "user-id",
  activityId: "activity-id",
  title: "Alert: Inappropriate Content",
  message: "Your child is watching...",
  severity: "high", // low, medium, high, critical
  read: false,
  sent: true,
  sentAt: "2024-11-27T10:30:00.000Z",
  createdAt: "2024-11-27T10:30:00.000Z"
}
```

## Firebase Storage Structure

```
parent-ai-cf603.appspot.com/
├── screenshots/
│   ├── {userId}/
│   │   ├── {activityId}.png
│   │   └── {activityId}.jpg
├── profiles/
│   └── {userId}/
│       └── avatar.jpg
└── temp/
    └── uploads/
```

## Environment Variables

Add to your `.env` file:

```env
# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_PATH=/Users/sheeyaofoong/.firebase/parent-ai-serviceAccountKey.json
FIREBASE_STORAGE_BUCKET=parent-ai-cf603.appspot.com
FIREBASE_PROJECT_ID=parent-ai-cf603
```

## Migration from MongoDB to Firestore

### Step 1: Dual Write (Transition Period)

```javascript
// Example: Create user in both databases
async function createUser(userData) {
  // Write to MongoDB (existing)
  const mongoUser = await User.create(userData);
  
  // Write to Firestore (new)
  await firestoreService.createDocument('users', {
    ...userData,
    mongoId: mongoUser._id.toString() // Keep reference
  });
  
  return mongoUser;
}
```

### Step 2: Migrate Existing Data

```javascript
// Migration script
const User = require('./models/User');
const firestoreService = require('./services/firestoreService');

async function migrateUsers() {
  const users = await User.find({});
  
  for (const user of users) {
    await firestoreService.createDocument('users', {
      mongoId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      children: user.children,
      settings: user.settings,
      deviceTokens: user.deviceTokens,
      createdAt: user.createdAt.toISOString()
    });
  }
  
  console.log(`Migrated ${users.length} users`);
}
```

### Step 3: Switch Read Operations

```javascript
// Read from Firestore instead of MongoDB
async function getUser(userId) {
  // Old: const user = await User.findById(userId);
  // New:
  const user = await firestoreService.getDocument('users', userId);
  return user;
}
```

### Step 4: Remove MongoDB

Once all data is migrated and tested:
1. Remove MongoDB dependencies from `package.json`
2. Delete MongoDB models
3. Remove MongoDB connection code
4. Update all database operations to use Firestore

## Security Rules

Create Firestore security rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Activities belong to users
    match /activities/{activityId} {
      allow read: if request.auth != null && 
                     resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
                               resource.data.userId == request.auth.uid;
    }
    
    // Notifications belong to users
    match /notifications/{notificationId} {
      allow read, update: if request.auth != null && 
                             resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
    }
  }
}
```

## Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Screenshots can be uploaded by authenticated users
    match /screenshots/{userId}/{fileName} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId
                   && request.resource.size < 10 * 1024 * 1024; // 10MB limit
    }
    
    // Profile images
    match /profiles/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024; // 5MB limit
    }
  }
}
```

## Testing Firebase Integration

```bash
# Set environment variables
export FIREBASE_SERVICE_ACCOUNT_PATH=/Users/sheeyaofoong/.firebase/parent-ai-serviceAccountKey.json
export FIREBASE_STORAGE_BUCKET=parent-ai-cf603.appspot.com

# Run backend
npm run dev

# Test Firestore
curl -X POST http://localhost:3000/api/test/firestore

# Test Storage
curl -X POST http://localhost:3000/api/test/storage \
  -H "Content-Type: application/json" \
  -d '{"content": "test data", "fileName": "test.txt"}'
```

## Benefits of Firebase

1. **Real-time Updates**: Firestore supports real-time listeners
2. **Scalability**: Auto-scales with your app
3. **Offline Support**: Built-in offline capabilities
4. **Security**: Declarative security rules
5. **Integration**: Works seamlessly with Firebase Auth, Storage, etc.
6. **Cost**: Free tier is generous, pay-as-you-go pricing
7. **No Server Management**: Fully managed service

## Cost Considerations

### Firestore Pricing (Free Tier)
- 1 GB storage
- 50,000 reads/day
- 20,000 writes/day
- 20,000 deletes/day

### Storage Pricing (Free Tier)
- 5 GB storage
- 1 GB/day downloads
- 20,000 uploads/day

For your Parent AI app with moderate usage, the free tier should be sufficient initially.

## Next Steps

1. ✅ Firebase services created
2. ⏳ Test Firestore operations
3. ⏳ Test Storage uploads
4. ⏳ Create security rules
5. ⏳ Migrate existing data (if any)
6. ⏳ Update API endpoints to use Firebase
7. ⏳ Deploy and monitor

