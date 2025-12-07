# ✅ EXACT Steps to Fix redirect_uri_mismatch

## 🎯 The Solution (Follow These Steps Exactly)

### Step 1: Open Google Cloud Console
1. Go to: **https://console.cloud.google.com/apis/credentials**
2. Make sure you're in project: **nomadic-genre-444713-c8**

### Step 2: Edit Your OAuth Client
1. Find: `780692716304-p2k6rmk2gtlrhrrf1ltncl986b1hqgrf.apps.googleusercontent.com`
2. **Click on the name** (not the edit icon, click the actual name)

### Step 3: Configure Authorized JavaScript Origins
1. Scroll to **"Authorized JavaScript origins"**
2. Click **"+ ADD URI"**
3. Type exactly: `http://localhost:5173`
4. Press Enter
5. If it's not there, add it again

### Step 4: Configure Authorized Redirect URIs (THIS IS CRITICAL!)
1. Scroll to **"Authorized redirect URIs"**
2. Click **"+ ADD URI"**
3. Type exactly: `http://localhost:5173`
4. Press Enter
5. Click **"+ ADD URI"** again
6. Type exactly: `http://localhost:5173/`
7. Press Enter
8. Click **"+ ADD URI"** one more time
9. Type exactly: `http://127.0.0.1:5173`
10. Press Enter

**Why multiple URIs?** The library might use different formats, so we cover all possibilities.

### Step 5: Save
1. Scroll to the very bottom
2. Click the blue **"SAVE"** button
3. Wait for confirmation: "Client saved"

### Step 6: Wait and Clear Cache
1. **Wait 5 full minutes** (set a timer!)
2. Close ALL browser windows
3. Clear browser cache:
   - Chrome: `Ctrl+Shift+Delete` → Select "All time" → Check "Cached images and files" → Clear
4. Or use **Incognito mode** (Ctrl+Shift+N)

### Step 7: Restart Everything
1. Stop your dev server (Ctrl+C in terminal)
2. Start it again: `npm run dev`
3. Open browser to: `http://localhost:5173/auth`
4. Try Google login

## 🔍 Debug: Check What URI is Being Used

If it still doesn't work:

1. Open browser console (F12)
2. Go to Console tab
3. Try Google login
4. Look for error messages
5. The error will show the exact redirect URI being rejected
6. **Copy that exact URI** and add it to Google Cloud Console

## ⚠️ Common Issues

### Issue 1: "I added it but it still doesn't work"
- **Solution**: Wait longer (up to 10 minutes)
- **Solution**: Make sure you clicked SAVE
- **Solution**: Check for typos (localhost not localhos)

### Issue 2: "I'm using a different port"
- **Solution**: Replace `5173` with your actual port number
- **Solution**: Check your terminal: `Local: http://localhost:XXXX`

### Issue 3: "I'm using 127.0.0.1 instead of localhost"
- **Solution**: Add both `http://localhost:5173` AND `http://127.0.0.1:5173`

### Issue 4: "The error shows a different URI"
- **Solution**: Add that EXACT URI to Authorized redirect URIs
- **Solution**: Copy-paste it exactly (don't type it)

## 📸 What It Should Look Like

After configuration, your Google Cloud Console should show:

**Authorized JavaScript origins:**
```
http://localhost:5173
```

**Authorized redirect URIs:**
```
http://localhost:5173
http://localhost:5173/
http://127.0.0.1:5173
```

## ✅ Success Checklist

- [ ] Added `http://localhost:5173` to JavaScript origins
- [ ] Added `http://localhost:5173` to redirect URIs
- [ ] Added `http://localhost:5173/` to redirect URIs (with slash)
- [ ] Added `http://127.0.0.1:5173` to redirect URIs
- [ ] Clicked SAVE button
- [ ] Waited 5 minutes
- [ ] Cleared browser cache
- [ ] Restarted dev server
- [ ] Tried in Incognito mode

## 🆘 Still Not Working?

If you've done ALL of the above and it still doesn't work:

1. **Check the browser console** (F12) for the exact error
2. **Take a screenshot** of the error message
3. **Check what redirect URI** is shown in the error
4. **Verify your dev server port** matches what you configured

The code is correct - this is purely a Google Cloud Console configuration issue.

