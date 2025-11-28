# 🔥 FIREWALL FIX - Enable Network Access to Backend

## ✅ Server is Running!

Your backend is running on **0.0.0.0:3000** (all network interfaces), but macOS firewall is blocking external connections.

## 🔓 Fix the Firewall (2 Options)

### Option 1: Allow Node.js in Firewall (Recommended)

1. Open **System Settings** (System Preferences on older macOS)
2. Go to **Network** → **Firewall** (or **Security & Privacy** → **Firewall**)
3. Click **Options** or **Firewall Options**
4. Look for **"node"** in the list
5. Make sure it's set to **"Allow incoming connections"**
6. If not there, click **+** and add: `/opt/homebrew/bin/node` or `/usr/local/bin/node`
7. Click **OK**

### Option 2: Temporarily Disable Firewall (For Testing)

1. Open **System Settings**
2. Go to **Network** → **Firewall**
3. **Turn Off** firewall temporarily
4. Test the app
5. **Turn On** again after testing

## 🧪 Test After Fix

Run this command to test:

```bash
curl http://192.168.1.4:3000/health
```

Should return:
```json
{"success":true,"message":"Server is running",...}
```

## 📱 Then Test Registration

1. Open the app in simulator
2. Click "Sign up"
3. Fill in:
   - Name: Test Parent
   - Email: test@example.com
   - Password: password123
   - Confirm Password: password123
4. Click "Sign Up"

You should now see detailed error messages if something fails!

## ✅ What's Fixed:

1. ✅ Server binds to 0.0.0.0 (all interfaces)
2. ✅ MongoDB errors don't crash server
3. ✅ Firestore is primary database
4. ✅ Better error messages in mobile app
5. ✅ Console logging for debugging

## 📋 Quick Status Check:

```bash
# Check if server is running
curl http://localhost:3000/health

# Check network access (after firewall fix)
curl http://192.168.1.4:3000/health

# Check what's on port 3000
lsof -i:3000
```

---

**Fix the firewall, then try registering in the app!** 🚀

The error messages will now show in the app if there are any connection issues.

