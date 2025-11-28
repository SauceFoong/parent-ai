# 🔒 Firebase Security Rules Setup

## ⚠️ Important: Production Mode Requires Security Rules

Since you created Firestore in **production mode**, you need to set up security rules to allow your backend to access the database.

## Problem

Currently, your backend uses the Firebase Admin SDK with a service account, which has **full access** to Firestore. However, if you want to access Firestore from the mobile app directly (which is more efficient), you'll need proper security rules.

## Solution Options

### Option 1: Backend-Only Access (Current Setup - Recommended)

Keep using Firebase Admin SDK from backend only:
- ✅ Backend has full access via service account
- ✅ Mobile app communicates with backend API
- ✅ Backend validates and controls all data access
- ✅ More secure and controlled

**No additional setup needed!** Your current setup works with this approach.

### Option 2: Direct Mobile Access (Requires Firebase Auth)

Allow mobile app to access Firestore directly:
- Requires Firebase Authentication
- Requires security rules
- More complex but more scalable

## Current Status

✅ **Your backend can access Firestore** because it uses Firebase Admin SDK with service account  
✅ **Security rules created** in `firestore.rules` and `storage.rules`  
⏳ **Rules need to be deployed** (only if you want direct mobile access)

## Deploying Security Rules (Optional)

If you want to deploy the security rules:

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Login to Firebase

```bash
firebase login
```

### 3. Initialize Firebase in your project

```bash
cd /Users/sheeyaofoong/Development/parent-ai
firebase init
```

Select:
- ✅ Firestore
- ✅ Storage
- Choose existing project: `parent-ai-cf603`
- Use `firestore.rules` for Firestore rules
- Use `storage.rules` for Storage rules

### 4. Deploy Rules

```bash
firebase deploy --only firestore:rules,storage:rules
```

## Manual Deployment (Easier)

You can also deploy rules manually through Firebase Console:

### Firestore Rules

1. Go to: https://console.firebase.google.com/project/parent-ai-cf603/firestore/rules
2. Copy contents from `firestore.rules`
3. Paste into the editor
4. Click "Publish"

### Storage Rules

1. Go to: https://console.firebase.google.com/project/parent-ai-cf603/storage/rules
2. Copy contents from `storage.rules`
3. Paste into the editor
4. Click "Publish"

## Temporary Solution for Testing

If you want to test without authentication, you can temporarily use these rules:

### Firestore (Test Mode - INSECURE)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // WARNING: Open to all!
    }
  }
}
```

### Storage (Test Mode - INSECURE)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true; // WARNING: Open to all!
    }
  }
}
```

⚠️ **WARNING**: Test mode rules allow anyone to read/write your data. Only use for development!

## What's in the Security Rules?

### Firestore Rules (`firestore.rules`)

- **Users**: Can only read/write their own user document
- **Activities**: Can only access activities belonging to them
- **Notifications**: Can only access their own notifications
- **Authentication**: All operations require Firebase Authentication

### Storage Rules (`storage.rules`)

- **Screenshots**: Organized by userId, max 10MB, images only
- **Profiles**: User avatars, max 5MB, images only
- **Temp**: Temporary uploads, auto-delete after 24 hours
- **Test**: Development folder (remove in production)

## Next Steps

### For Backend-Only Access (Recommended)
✅ **Nothing to do!** Your backend already works with Firebase Admin SDK.

### For Direct Mobile Access
1. Set up Firebase Authentication in mobile app
2. Deploy security rules
3. Update mobile app to use Firebase SDK directly
4. Test authentication and data access

## Testing Current Setup

Test that backend can still access Firestore:

```bash
# Get Firestore statistics
curl http://localhost:3000/api/test/firestore-stats

# Should return data successfully
```

## Resources

- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Storage Security Rules](https://firebase.google.com/docs/storage/security)
- [Firebase CLI](https://firebase.google.com/docs/cli)

---

**Recommendation**: Stick with backend-only access for now. It's simpler and more secure. You can add direct mobile access later if needed.

