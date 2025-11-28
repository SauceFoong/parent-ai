# Firebase Setup - Final Steps

## ⚠️ Important: Firestore Database Setup Required

You need to create the Firestore database in the Firebase Console before it can be used.

### Step 1: Create Firestore Database

1. Go to [Firebase Console - Firestore](https://console.firebase.google.com/project/parent-ai-cf603/firestore)
2. Click **"Create database"**
3. Choose a mode:
   - **Test mode** (Recommended for development):
     - Allows all reads/writes for 30 days
     - Good for testing and development
     - You can add security rules later
   
   - **Production mode**:
     - Requires security rules from the start
     - More secure but requires configuration

4. Select location: Choose **`asia-southeast1` (Singapore)** or closest to you
5. Click **"Enable"**
6. Wait 1-2 minutes for database creation

### Step 2: Enable Firebase Storage

1. Go to [Firebase Console - Storage](https://console.firebase.google.com/project/parent-ai-cf603/storage)
2. Click **"Get started"**
3. Choose **Test mode** for development
4. Use same location as Firestore
5. Click **"Done"**

### Step 3: Test Firebase Integration

Once Firestore is created, test the integration:

```bash
# Test Firestore
curl -X POST http://localhost:3000/api/test/init-firestore

# Test Storage
curl -X POST http://localhost:3000/api/test/storage \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello Firebase!", "fileName": "test.txt"}'

# Get Firestore stats
curl http://localhost:3000/api/test/firestore-stats
```

### Step 4: Verify in Firebase Console

After running the init script, check Firebase Console:

1. **Firestore**: You should see 3 collections:
   - `users` (1 document)
   - `activities` (1 document)
   - `notifications` (1 document)

2. **Storage**: You should see a `test` folder (if storage test was run)

## Current Status

✅ Firebase Admin SDK installed  
✅ Firebase MCP configured  
✅ Service account key secured  
✅ Backend code updated with Firebase services  
✅ Test endpoints created  
✅ Server running on port 3000  

⏳ **Waiting for**: Firestore database creation in Firebase Console  
⏳ **Waiting for**: Firebase Storage initialization  

## What's Been Built

### Backend Services

1. **`backend/config/firebaseAdmin.js`**
   - Firebase Admin SDK initialization
   - Provides access to Firestore, Storage, Auth, Messaging

2. **`backend/services/firestoreService.js`**
   - CRUD operations for Firestore
   - Query and batch operations
   - Collection statistics

3. **`backend/services/firebaseStorageService.js`**
   - File upload/download
   - URL-based uploads
   - File metadata and management

4. **`backend/routes/test.js`**
   - Test endpoints for Firebase
   - Sample data initialization
   - Health checks

### Test Endpoints

- `POST /api/test/init-firestore` - Create sample data
- `GET /api/test/firestore-stats` - View database statistics
- `GET /api/test/firestore` - Test Firestore connection
- `POST /api/test/storage` - Test Storage upload

### Environment Configuration

Your `.env` file is configured with:
- Firebase service account path
- Storage bucket name
- Project ID

## Next Steps After Firestore Creation

1. **Initialize Sample Data**:
   ```bash
   curl -X POST http://localhost:3000/api/test/init-firestore
   ```

2. **View Data in Console**:
   - Check Firestore collections
   - Verify documents were created

3. **Test Storage**:
   ```bash
   curl -X POST http://localhost:3000/api/test/storage \
     -H "Content-Type: application/json" \
     -d '{"content": "Test file content", "fileName": "test.txt"}'
   ```

4. **Add Security Rules** (Production):
   See `FIREBASE_INTEGRATION.md` for security rules examples

5. **Integrate with Mobile App**:
   - Update mobile app to use Firebase
   - Test end-to-end flow
   - Deploy to production

## Troubleshooting

### "5 NOT_FOUND" Error
This means Firestore database hasn't been created yet. Follow Step 1 above.

### "PERMISSION_DENIED" Error
- Check service account key path in `.env`
- Verify service account has proper permissions
- Ensure Firestore API is enabled

### Server Won't Start
- Check MongoDB is running: `brew services start mongodb-community`
- Verify all dependencies installed: `npm install`
- Check logs in `logs/` directory

## Resources

- [Firebase Console](https://console.firebase.google.com/project/parent-ai-cf603)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Storage Documentation](https://firebase.google.com/docs/storage)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

---

**Ready to continue?** Once you've created the Firestore database, let me know and we'll test the integration!

