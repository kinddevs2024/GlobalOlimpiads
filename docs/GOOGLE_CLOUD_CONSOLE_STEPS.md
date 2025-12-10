# 🔧 Step-by-Step: Fix Google OAuth redirect_uri_mismatch Error

## Quick Fix (Copy-Paste Ready)

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client ID: `780692716304-p2k6rmk2gtlrhrrf1ltncl986b1hqgrf.apps.googleusercontent.com`
3. Add to **"Authorized JavaScript origins"**: `http://localhost:5173`
4. Add to **"Authorized redirect URIs"**: `http://localhost:5173`
5. Click **SAVE**
6. Wait 2-5 minutes
7. Clear browser cache and try again

---

## Detailed Steps with Screenshots Guide

### Step 1: Open Google Cloud Console

1. Visit: **https://console.cloud.google.com/apis/credentials**
2. Make sure you're logged in with the correct Google account
3. Select the project: **nomadic-genre-444713-c8** (or your project)

### Step 2: Find Your OAuth Client

1. Look for **"OAuth 2.0 Client IDs"** section
2. Find the client with ID: `780692716304-p2k6rmk2gtlrhrrf1ltncl986b1hqgrf.apps.googleusercontent.com`
3. **Click on the client name** (not the edit icon, click the name itself)

### Step 3: Add Authorized JavaScript Origins

1. Scroll down to **"Authorized JavaScript origins"**
2. Click the **"+ ADD URI"** button
3. In the text field that appears, type exactly: `http://localhost:5173`
   - ✅ Correct: `http://localhost:5173`
   - ❌ Wrong: `https://localhost:5173` (don't use https)
   - ❌ Wrong: `http://localhost:5173/` (no trailing slash)
   - ❌ Wrong: `localhost:5173` (must include http://)
4. Press Enter or click outside the field
5. The URI should appear in the list

### Step 4: Add Authorized Redirect URIs (THIS IS THE KEY FIX!)

1. Scroll down to **"Authorized redirect URIs"** section
2. Click the **"+ ADD URI"** button
3. In the text field, type exactly: `http://localhost:5173`
   - Same format as above: `http://localhost:5173`
   - No trailing slash
   - Include the protocol `http://`
4. Press Enter or click outside the field
5. The URI should appear in the list

### Step 5: Save Your Changes

1. Scroll all the way to the bottom of the page
2. Click the blue **"SAVE"** button
3. Wait for the confirmation message: "Client saved"

### Step 6: Wait for Propagation

- Google's changes can take **2-5 minutes** to propagate
- Don't test immediately - wait at least 2 minutes

### Step 7: Clear Browser Cache

1. Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
2. Select "Cached images and files"
3. Click "Clear data"
4. Or use **Incognito/Private mode** for testing

### Step 8: Test Again

1. Restart your dev server: `npm run dev`
2. Go to: `http://localhost:5173/auth`
3. Click "Continue with Google"
4. It should work now! ✅

---

## What Should Be Configured

After following these steps, your OAuth client should have:

**Authorized JavaScript origins:**

- `http://localhost:5173`

**Authorized redirect URIs:**

- `http://localhost:5173`

---

## Still Getting the Error?

### Check These:

1. **Exact Match Required:**

   - The URI must match EXACTLY (case-sensitive, no trailing slash)
   - Check for typos: `localhost` not `localhos` or `local host`

2. **Wait Longer:**

   - Sometimes it takes up to 10 minutes for changes to propagate
   - Try again after waiting

3. **Check Browser Console:**

   - Press F12 → Console tab
   - Look for the exact redirect URI being used
   - Make sure it matches what you configured

4. **Try Incognito Mode:**

   - Rules out browser cache issues
   - Open a new incognito window and test

5. **Verify Your Dev Server Port:**

   - Make sure your app is running on port 5173
   - Check the terminal: `Local: http://localhost:5173/`
   - If it's a different port, update the URIs accordingly

6. **Check OAuth Consent Screen:**
   - Go to: APIs & Services → OAuth consent screen
   - Make sure it's configured (at least in Testing mode)

---

## For Production

When you deploy to production, add:

- **Authorized JavaScript origins:** `https://yourdomain.com`
- **Authorized redirect URIs:** `https://yourdomain.com`

Replace `yourdomain.com` with your actual domain.

---

## Need Help?

If it's still not working:

1. Check the browser console (F12) for the exact error
2. Verify the redirect URI in the error message matches what you configured
3. Make sure you saved the changes in Google Cloud Console
4. Wait at least 5 minutes and try again
