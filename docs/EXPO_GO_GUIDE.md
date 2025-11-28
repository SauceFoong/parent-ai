# 📱 Running Parent AI on Your Phone with Expo Go

## Step-by-Step Guide

### Step 1: Install Expo Go on Your Phone ✅

**iPhone (iOS):**
- Open App Store
- Search for "Expo Go"
- Install the app

**Android:**
- Open Google Play Store
- Search for "Expo Go"
- Install the app

### Step 2: Update API URL for Phone Access

Since your phone needs to connect to your computer's backend, we need to update the API URL.

**Find your computer's IP address:**

**On Mac:**
```bash
ipconfig getifaddr en0
```

Or go to: System Settings → Network → Wi-Fi → Details

**Example IP**: `192.168.1.100`

**Update the mobile app:**
Edit `mobile/src/services/api.js` and change:
```javascript
const API_URL = 'http://localhost:3000/api';
```

To your computer's IP:
```javascript
const API_URL = 'http://192.168.1.XXX:3000/api';  // Replace XXX with your IP
```

### Step 3: Start the Mobile App

Open a new terminal and run:
```bash
cd /Users/sheeyaofoong/Development/parent-ai/mobile
ulimit -n 65536
npm start
```

### Step 4: Scan QR Code

1. Wait for the QR code to appear in terminal
2. Open **Expo Go** app on your phone
3. **iPhone**: Tap "Scan QR Code" and scan
4. **Android**: Tap "Scan QR Code" and scan

The app will build and load on your phone!

### Step 5: Test the App

1. Register a new account
2. Add a child profile
3. View the dashboard
4. Check activities and notifications

## Important Notes

✅ **Same WiFi**: Make sure your phone and computer are on the same WiFi network  
✅ **Backend Running**: Keep the backend server running (http://localhost:3000)  
✅ **Firewall**: If it doesn't work, check your Mac's firewall settings  

## Troubleshooting

### Can't Connect to Backend

1. **Check IP address is correct** in `api.js`
2. **Verify same WiFi network**
3. **Test backend from phone's browser**: Open `http://YOUR_IP:3000/health`
4. **Check Mac firewall**: System Settings → Network → Firewall (should allow Node)

### QR Code Not Scanning

- Make sure Expo Go app is updated
- Try typing the URL manually in Expo Go
- Look for the URL in terminal output

### App Won't Load

```bash
# Clear cache and restart
cd mobile
npx expo start -c
```

---

**Ready to start!** 🚀

