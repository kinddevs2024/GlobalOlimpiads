# Exit Screenshot Feature

## Overview

The exit screenshot feature automatically captures the last frame from both camera and screen videos when a participant leaves the test page. This is essential for proctoring to detect suspicious behavior.

## Features

✅ **Automatic capture on tab leave/close**  
✅ **User-specific folders** — screenshots saved to `uploads/users/{userId}/`  
✅ **Username tracking** — optional username field for identification  
✅ **Reliable upload** — uses `keepalive: true` to ensure upload completes  
✅ **Error handling** — handles failures gracefully  

## When Screenshots Are Captured

1. **Tab Switch**: When user switches to another tab or window
   - Exit type: `tab_switch`
   - Triggered by `visibilitychange` event

2. **Page Close**: When user closes the browser tab/window
   - Exit type: `close`
   - Triggered by `beforeunload` event

3. **Navigation**: When user navigates to another page
   - Exit type: `navigate`
   - Triggered by `pagehide` event

## Frontend Implementation

### Location
- File: `src/components/ProctoringMonitor.jsx`

### How It Works

1. **Detection**: Listens to browser events:
   - `visibilitychange` - detects tab switching
   - `beforeunload` - detects page closure
   - `pagehide` - detects navigation

2. **Capture**: Synchronously captures last frame:
   - Gets current frame from camera video element
   - Gets current frame from screen video element
   - Converts to JPEG (80% quality)

3. **Upload**: Sends to backend using:
   - `fetch()` API with `keepalive: true`
   - FormData with all required fields
   - JWT token in Authorization header

### Request Format

**Endpoint**: `POST /api/olympiads/exit-screenshot`

**FormData Fields:**
```
olympiadId: String (required)
exitType: String (required) - 'tab_switch' | 'close' | 'navigate'
timestamp: String (required) - ISO 8601 format
username: String (optional) - User email/name
cameraImage: File (optional) - JPEG image
screenImage: File (optional) - JPEG image
```

## Backend Requirements

### Endpoint
- **URL**: `/api/olympiads/exit-screenshot`
- **Method**: `POST`
- **Auth**: Required (JWT token)

### File Storage

1. **Location**: `uploads/users/{userId}/`
   - Backend extracts `userId` from JWT token
   - Creates folder if it doesn't exist

2. **Filename Format**:
   - Camera: `exit-camera-{olympiadId}-{timestamp}.jpg`
   - Screen: `exit-screen-{olympiadId}-{timestamp}.jpg`

3. **File Details**:
   - Format: JPEG
   - Quality: 80%
   - Max size: ~10 MB per image

### Response Format

```json
{
  "success": true,
  "message": "Exit screenshot saved successfully",
  "screenshotId": "screenshot_id",
  "savedTo": "uploads/users/{userId}/"
}
```

## Testing

### Manual Testing

1. **Test Tab Switch**:
   - Start an olympiad
   - Switch to another tab
   - Check console for "Page became hidden - capturing exit screenshot"
   - Verify screenshot saved in backend

2. **Test Page Close**:
   - Start an olympiad
   - Close the browser tab
   - Check backend for screenshot

3. **Test Navigation**:
   - Start an olympiad
   - Navigate to another page
   - Check backend for screenshot

### Console Messages

- ✅ `"Page became hidden - capturing exit screenshot"`
- ✅ `"Exit screenshot sent successfully - saved to uploads/users/{userId}/"`
- ❌ `"No frames captured for exit screenshot"` (if videos not ready)
- ❌ `"Failed to send exit screenshot: [error]"` (if upload fails)

## Security Considerations

1. **Authentication**: All requests require valid JWT token
2. **User Isolation**: Screenshots saved in user-specific folders
3. **Validation**: Backend validates olympiadId and exitType
4. **Error Handling**: Failed uploads don't crash the system

## Troubleshooting

### Screenshot Not Sent

1. Check browser console for errors
2. Verify camera/screen videos are active
3. Check network tab for failed requests
4. Verify JWT token is valid

### Screenshot Saved But Empty

1. Videos may not have loaded yet
2. Check video element `readyState >= 2`
3. Verify canvas capture is working

### Multiple Screenshots on Same Exit

- System uses `exitScreenshotSentRef` to prevent duplicate sends
- If page doesn't actually unload, flag resets for next exit

## Notes

- Screenshots are captured **synchronously** to ensure they're captured before page unloads
- Uses `keepalive: true` to ensure upload completes even if page closes
- Only captures when recording is active (`isRecording === true`)
- Works with both camera and screen videos (captures both if available)

