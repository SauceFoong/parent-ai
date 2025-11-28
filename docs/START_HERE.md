# 🚀 Quick Start - Parent AI

## The App is Ready! Here's How to Run It:

### ✅ What's Already Running:
- **Backend Server**: http://localhost:3000 ✅
- **MongoDB**: Connected ✅
- **Firebase**: Integrated ✅

### 📱 Start the Mobile App:

**Option 1: Using Terminal (Recommended)**

Open a new terminal and run:

```bash
cd /Users/sheeyaofoong/Development/parent-ai/mobile
ulimit -n 65536
npm start
```

Then press:
- `i` for iOS simulator
- `a` for Android emulator
- Scan QR code for physical device

**Option 2: Fix File Limit Permanently (One-time)**

If you keep getting "too many open files" error:

```bash
# Run these commands once (requires password)
echo "kern.maxfiles=65536" | sudo tee -a /etc/sysctl.conf
echo "kern.maxfilesperproc=65536" | sudo tee -a /etc/sysctl.conf

# Restart your Mac
sudo reboot
```

After restart, you won't need `ulimit -n 65536` anymore.

### 🧪 Test the Backend (While Mobile App Loads):

```bash
# Health check
curl http://localhost:3000/health

# Get Firebase data
curl http://localhost:3000/api/test/firestore-stats

# Register a test user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Parent","email":"test@example.com","password":"password123"}'
```

### 📊 View Your Data:

- **Backend API**: http://localhost:3000
- **Firebase Console**: https://console.firebase.google.com/project/parent-ai-cf603
- **Firestore Data**: https://console.firebase.google.com/project/parent-ai-cf603/firestore/data

### 🎯 What to Test in the Mobile App:

1. **Register/Login** - Create your parent account
2. **Add Child** - Add a child profile
3. **Dashboard** - View statistics (will show sample data)
4. **Activities** - See monitored activities
5. **Notifications** - Check alerts
6. **Settings** - Adjust thresholds

### 💡 Quick Tips:

- **Backend logs**: Check the terminal where backend is running
- **Mobile logs**: Will appear in Expo terminal
- **Firebase data**: View in Firebase Console
- **API testing**: Use curl commands above

### 🆘 If Mobile App Won't Start:

```bash
# Clear cache and try again
cd mobile
rm -rf node_modules .expo
npm install
ulimit -n 65536
npm start
```

### 📚 Documentation:

- **Complete Overview**: `COMPLETE_SUMMARY.md`
- **Running Guide**: `RUNNING_THE_APP.md`
- **API Reference**: `API_DOCUMENTATION.md`
- **Firebase Guide**: `FIREBASE_INTEGRATION.md`

---

## 🎉 You're All Set!

**Backend**: ✅ Running  
**Firebase**: ✅ Connected  
**Mobile App**: ⏳ Ready to start

**Next**: Start the mobile app and test the features!

Ask me if you need help with anything! 🚀

