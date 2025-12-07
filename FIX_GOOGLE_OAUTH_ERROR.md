# 🔧 Quick Fix: Google OAuth Origin Mismatch Error

## The Problem

You're seeing an error like:

- `Error 400: redirect_uri_mismatch`
- `origin_mismatch`
- `The redirect URI in the request does not match the ones authorized`

## The Solution (5 Minutes)

### Step 1: Open Google Cloud Console

1. Go to: **https://console.cloud.google.com/apis/credentials**
2. Make sure you're in the correct project

### Step 2: Edit Your OAuth Client

1. Find your OAuth 2.0 Client ID: `780692716304-p2k6rmk2gtlrhrrf1ltncl986b1hqgrf.apps.googleusercontent.com`
2. **Click on it** to open the edit page

### Step 3: Add Authorized JavaScript Origins

1. Scroll down to **"Authorized JavaScript origins"**
2. Click **"+ ADD URI"**
3. Add: `http://localhost:5173`
   - ⚠️ **Important:**
     - Use `http://` (not `https://`)
     - No trailing slash
     - Include the port number `:5173`
4. Click **"+ ADD URI"** again if you need to add more:
   - `http://localhost:3000` (if testing from backend)
   - Your production URL when deploying

### Step 4: Add Authorized Redirect URIs (CRITICAL!)

1. Scroll down to **"Authorized redirect URIs"**
2. Click **"+ ADD URI"**
3. Add: `http://localhost:5173`
   - ⚠️ **This is required!** The library needs this for the OAuth flow
   - Use `http://` (not `https://`)
   - No trailing slash
   - Include the port number `:5173`
4. Also add: `http://localhost:5173/auth` (if needed)
5. For production, add your production domain

### Step 5: Save

1. Scroll to the bottom
2. Click **"SAVE"**
3. Wait 2-5 minutes for changes to take effect

### Step 6: Test

1. Clear your browser cache (Ctrl+Shift+Delete)
2. Restart your dev server: `npm run dev`
3. Try Google login again

## Visual Guide

```
Google Cloud Console → APIs & Services → Credentials
  ↓
Click on your OAuth 2.0 Client ID
  ↓
Scroll to "Authorized JavaScript origins"
  ↓
Click "+ ADD URI"
  ↓
Type: http://localhost:5173
  ↓
Click "SAVE"
```

## Still Not Working?

1. **Check the exact error message** in browser console (F12)
2. **Verify the origin** matches exactly:
   - Protocol: `http://` or `https://`
   - Domain: `localhost` or your domain
   - Port: `:5173` (must match your dev server port)
3. **Wait longer**: Changes can take up to 5 minutes
4. **Try incognito mode**: Rules out cache issues
5. **Check OAuth consent screen**: Make sure it's configured

## Reference

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow#authorization-errors-origin-mismatch)
