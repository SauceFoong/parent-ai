# 📱 FINAL INSTRUCTIONS - Run Mobile App with Expo Go

## ✅ Everything is Ready!

### Your Setup:
- ✅ Backend running on: http://192.168.1.4:3000
- ✅ Mobile app configured to connect to: http://192.168.1.4:3000/api
- ✅ Firebase integrated and working
- ✅ Sample data in Firestore

## 🚀 Start the Mobile App (Choose One Method)

### Method 1: Use the Start Script (Easiest)

Open a **new terminal window** and run:

```bash
cd /Users/sheeyaofoong/Development/parent-ai
./start-mobile.sh
```

### Method 2: Manual Start

Open a **new terminal window** and run:

```bash
cd /Users/sheeyaofoong/Development/parent-ai/mobile
ulimit -n 65536
npx expo start --clear
```

### Method 3: Install Watchman (Permanent Fix)

If the above methods still show file limit errors:

```bash
# Install Watchman (file watching service)
brew install watchman

# Then start normally
cd mobile
npm start
```

## 📱 On Your Phone

1. **Download Expo Go**
   - iPhone: App Store → Search "Expo Go" → Install
   - Android: Play Store → Search "Expo Go" → Install

2. **Connect to Same WiFi**
   - Make sure your phone is on the **same WiFi network** as your computer

3. **Scan QR Code**
   - Open Expo Go app
   - Tap "Scan QR Code"
   - Scan the QR code from your terminal
   - Wait for app to build (first time takes 1-2 minutes)

## 🧪 Test the App

Once loaded on your phone:

1. **Register** - Create a parent account
   - Name: Your name
   - Email: your@email.com
   - Password: (minimum 6 characters)

2. **Add Child** - Tap "Add Child" on dashboard
   - Name: Child's name
   - Age: Child's age

3. **View Dashboard** - See statistics (demo data from Firestore)

4. **Check Activities** - Tap Activities tab
   - View all monitored activities
   - Filter by safe/flagged content

5. **Notifications** - Tap Notifications tab
   - See alerts for inappropriate content

6. **Settings** - Tap Settings tab
   - Adjust content thresholds
   - Enable/disable monitoring

## 🔍 Troubleshooting

### "Couldn't connect to server"

**Check backend is running:**
```bash
curl http://192.168.1.4:3000/health
```

Should return: `{"success":true,"message":"Server is running"...}`

**If not working:**
1. Make sure backend terminal is still running
2. Restart backend: `npm run dev`

### "Network request failed" in app

1. **Verify same WiFi**: Phone and computer must be on same network
2. **Check IP address**: Open phone browser, go to `http://192.168.1.4:3000/health`
3. **Firewall**: System Settings → Network → Firewall → Allow Node.js

### QR Code Won't Scan

- Make sure Expo Go app is updated
- Try entering the URL manually in Expo Go
- Look for the exp:// URL in terminal

### App Crashes on Load

```bash
# Clear cache and rebuild
cd mobile
rm -rf .expo
npx expo start --clear
```

## 📊 What to Expect

### Dashboard Screen
- Total activities count
- Safe vs flagged content
- Activity breakdown by type
- Recent alerts
- Children list

### Activities Screen
- List of all monitored activities
- Color-coded severity (green=safe, red=flagged)
- AI analysis summary
- Filter by type or status

### Notifications Screen
- Real-time alerts
- Severity levels
- Mark as read functionality

### Settings Screen
- Account information
- Monitoring toggle
- Notification preferences
- Content threshold sliders

## 💡 Tips

- **First Load**: Takes 1-2 minutes to build
- **Hot Reload**: Changes auto-reload during development
- **Shake Phone**: Opens developer menu
- **Logs**: Check terminal for errors

## 🎯 Next Steps After Testing

1. **Add OpenAI API Key** to `.env` for real AI analysis
2. **Enable Firebase Storage** for screenshot uploads
3. **Test with real content** monitoring
4. **Deploy backend** to production server
5. **Build standalone app** for App Store/Play Store

## 📚 Documentation

- **API Reference**: `API_DOCUMENTATION.md`
- **Firebase Guide**: `FIREBASE_INTEGRATION.md`
- **Complete Summary**: `COMPLETE_SUMMARY.md`
- **Deployment**: `DEPLOYMENT.md`

---

## 🎉 You're All Set!

**Backend**: ✅ http://192.168.1.4:3000  
**Mobile App**: ⏳ Ready to start  
**Expo Go**: ⏳ Install on your phone  

**Run the start script or manual commands above, then scan the QR code with Expo Go!** 📱

Need help? Just ask! 🚀

