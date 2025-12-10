# 🎯 SIMPLE FIX - Follow These 5 Steps

## The Error You're Seeing
```
Error 400: redirect_uri_mismatch
```

## ✅ The Fix (5 Minutes)

### Step 1: Open Google Cloud Console
👉 **Click this link**: https://console.cloud.google.com/apis/credentials

### Step 2: Find Your OAuth Client
1. Look for this Client ID: `780692716304-p2k6rmk2gtlrhrrf1ltncl986b1hqgrf.apps.googleusercontent.com`
2. **Click on the NAME** (the blue text, not any icons)

### Step 3: Add Redirect URI
1. Scroll down to **"Authorized redirect URIs"**
2. Click the **"+ ADD URI"** button
3. Type exactly: `http://localhost:5173`
4. Press Enter
5. Click **"+ ADD URI"** again
6. Type exactly: `http://localhost:5173/` (with trailing slash)
7. Press Enter

### Step 4: Add JavaScript Origin
1. Scroll up to **"Authorized JavaScript origins"**
2. Click **"+ ADD URI"**
3. Type exactly: `http://localhost:5173`
4. Press Enter

### Step 5: Save and Wait
1. Scroll to the bottom
2. Click the blue **"SAVE"** button
3. **Wait 5 minutes** (set a timer!)
4. Clear browser cache (Ctrl+Shift+Delete)
5. Try again

---

## 📋 What Should Be Configured

After Step 5, you should see:

**Authorized JavaScript origins:**
```
http://localhost:5173
```

**Authorized redirect URIs:**
```
http://localhost:5173
http://localhost:5173/
```

---

## ⚠️ Common Mistakes

- ❌ Forgetting to click SAVE
- ❌ Not waiting 5 minutes
- ❌ Using `https://` instead of `http://`
- ❌ Missing the port `:5173`
- ❌ Not clearing browser cache

---

## 🔍 Still Not Working?

1. **Check browser console** (F12 → Console tab)
2. Look for the debug message that shows the exact URI
3. Make sure that EXACT URI is in Google Cloud Console
4. Wait longer (up to 10 minutes)
5. Try in Incognito mode (Ctrl+Shift+N)

---

## 📸 Visual Guide

```
Google Cloud Console
  ↓
APIs & Services → Credentials
  ↓
Click: 780692716304-p2k6rmk2gtlrhrrf1ltncl986b1hqgrf...
  ↓
Scroll to "Authorized redirect URIs"
  ↓
Click "+ ADD URI"
  ↓
Type: http://localhost:5173
  ↓
Click "+ ADD URI" again
  ↓
Type: http://localhost:5173/
  ↓
Scroll to "Authorized JavaScript origins"
  ↓
Click "+ ADD URI"
  ↓
Type: http://localhost:5173
  ↓
Scroll down → Click "SAVE"
  ↓
Wait 5 minutes
  ↓
Clear cache → Try again
```

---

## ✅ Success!

Once configured correctly, Google login will work! The code is already correct - this is just a Google Cloud Console configuration step.

