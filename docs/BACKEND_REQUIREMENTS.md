# Backend Requirements Summary

## Video Upload System

### What Frontend Does:

1. **Records TWO Separate Videos:**
   - **Camera Video**: Front-facing camera at 720p (1280x720)
   - **Screen Video**: Screen capture at 720p (1280x720)
   - Both recorded simultaneously throughout the olympiad

2. **Full Screen Sharing Validation:**
   - Validates that user shares entire screen (not just window/tab)
   - Rejects window/tab sharing
   - User must select "Entire Screen" option

3. **Interaction Blocking:**
   - Blocks all question inputs until recording starts
   - User cannot answer questions until both camera and screen are recording

4. **Automatic Upload:**
   - Uploads both videos when olympiad ends
   - Shows loading progress for each video

### Backend Endpoint Required:

**`POST /api/olympiads/upload-video`**

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Request Body (FormData):**
- `video`: File (WebM video file)
- `olympiadId`: String
- `videoType`: String (`'camera'` or `'screen'`)

**Notes:**
- Frontend makes **2 separate API calls** - one for camera, one for screen
- Both videos have same specs: 720p, WebM, VP9 codec, 30fps

**Example Implementation (Node.js/Express):**

```javascript
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, 'uploads', 'videos');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const userId = req.user._id;
    const olympiadId = req.body.olympiadId;
    const videoType = req.body.videoType; // 'camera' or 'screen'
    const timestamp = Date.now();
    const filename = `${olympiadId}_${userId}_${videoType}_${timestamp}.webm`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'video/webm') {
      cb(null, true);
    } else {
      cb(new Error('Only WebM video files are allowed'), false);
    }
  }
});

// Endpoint
router.post(
  '/upload-video',
  authenticate, // Your JWT auth middleware
  upload.single('video'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No video file provided'
        });
      }

      const { olympiadId, videoType } = req.body;
      const userId = req.user._id;

      // Validate required fields
      if (!olympiadId || !videoType) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'Olympiad ID and video type are required'
        });
      }

      if (!['camera', 'screen'].includes(videoType)) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'Video type must be "camera" or "screen"'
        });
      }

      // Save to database (example with Mongoose)
      const videoRecord = await VideoRecording.create({
        olympiadId,
        userId,
        videoType,
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype,
        uploadedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Video uploaded successfully',
        videoId: videoRecord._id,
        videoType,
        filename: req.file.filename,
        size: req.file.size
      });

    } catch (error) {
      console.error('Video upload error:', error);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({
        success: false,
        message: 'Failed to upload video',
        error: error.message
      });
    }
  }
);
```

### Database Schema Example:

```javascript
{
  olympiadId: ObjectId,
  userId: ObjectId,
  videoType: String, // 'camera' or 'screen'
  filename: String,
  path: String,
  size: Number,
  mimetype: String,
  uploadedAt: Date
}
```

### Summary:

✅ Frontend sends **2 videos** (camera + screen)  
✅ Both at **720p resolution**  
✅ Format: **WebM (VP9 codec)**  
✅ Frontend blocks interactions until recording starts  
✅ Frontend validates full screen sharing  
✅ Backend needs to accept and store both videos

---

## Exit Screenshot System

### What Frontend Does:

1. **Automatic Capture on Tab Leave/Close:**
   - Detects when user switches tabs (`visibilitychange` event)
   - Detects when user closes/navigates away (`beforeunload` event)
   - Captures last frame from both camera and screen videos before exit
   - Sends screenshot immediately using `keepalive: true` for reliability

2. **Screenshot Details:**
   - Captures last visible frame from camera video
   - Captures last visible frame from screen video
   - JPEG format (80% quality)
   - Filenames: `exit-camera-{olympiadId}-{timestamp}.jpg` and `exit-screen-{olympiadId}-{timestamp}.jpg`

3. **Exit Types Tracked:**
   - `tab_switch`: User switched to another tab/window
   - `close`: User is closing the page
   - `navigate`: User is navigating away

### Backend Endpoint Required:

**`POST /api/olympiads/exit-screenshot`**

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Request Body (FormData):**
- `olympiadId`: String (required)
- `exitType`: String (required) - `'tab_switch'`, `'close'`, or `'navigate'`
- `timestamp`: String (required) - ISO 8601 timestamp
- `username`: String (optional) - User's email/name for identification
- `cameraImage`: File (optional) - JPEG image of last camera frame
- `screenImage`: File (optional) - JPEG image of last screen frame

**Response:**
```json
{
  "success": true,
  "message": "Exit screenshot saved successfully",
  "screenshotId": "screenshot_id",
  "path": "uploads/users/{userId}/exit-camera-{timestamp}.jpg"
}
```

### Backend Implementation Requirements:

1. **Save to User-Specific Folder:**
   - Screenshots should be saved to: `uploads/users/{userId}/`
   - Backend extracts `userId` from JWT token
   - Create folder if it doesn't exist

2. **File Naming:**
   - Camera: `exit-camera-{olympiadId}-{timestamp}.jpg`
   - Screen: `exit-screen-{olympiadId}-{timestamp}.jpg`

3. **Features:**
   - Automatic capture on tab leave/close
   - User-specific folders — screenshots saved to `uploads/users/{userId}/`
   - Username tracking — optional username field for identification
   - Reliable upload — uses `keepalive: true` to ensure upload completes
   - Error handling — handles failures gracefully

### Example Backend Implementation:

```javascript
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Storage configuration for exit screenshots
const screenshotStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user._id.toString(); // From JWT token
    const uploadPath = path.join(__dirname, 'uploads', 'users', userId);
    
    // Create user folder if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const olympiadId = req.body.olympiadId;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fieldName = file.fieldname; // 'cameraImage' or 'screenImage'
    const type = fieldName === 'cameraImage' ? 'camera' : 'screen';
    const filename = `exit-${type}-${olympiadId}-${timestamp}.jpg`;
    cb(null, filename);
  }
});

const uploadScreenshots = multer({
  storage: screenshotStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max per image
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
}).fields([
  { name: 'cameraImage', maxCount: 1 },
  { name: 'screenImage', maxCount: 1 }
]);

// Endpoint
router.post(
  '/exit-screenshot',
  authenticate, // JWT auth middleware
  uploadScreenshots,
  async (req, res) => {
    try {
      const { olympiadId, exitType, timestamp, username } = req.body;
      const userId = req.user._id;
      const files = req.files;

      // Validate required fields
      if (!olympiadId || !exitType) {
        return res.status(400).json({
          success: false,
          message: 'Olympiad ID and exit type are required'
        });
      }

      // Save screenshot metadata to database
      const screenshotRecord = await ExitScreenshot.create({
        olympiadId,
        userId,
        username: username || req.user.email,
        exitType, // 'tab_switch', 'close', 'navigate'
        timestamp: timestamp || new Date(),
        cameraImagePath: files.cameraImage ? files.cameraImage[0].path : null,
        screenImagePath: files.screenImage ? files.screenImage[0].path : null,
        cameraImageName: files.cameraImage ? files.cameraImage[0].filename : null,
        screenImageName: files.screenImage ? files.screenImage[0].filename : null
      });

      res.json({
        success: true,
        message: 'Exit screenshot saved successfully',
        screenshotId: screenshotRecord._id,
        savedTo: `uploads/users/${userId}/`
      });

    } catch (error) {
      console.error('Exit screenshot error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save exit screenshot',
        error: error.message
      });
    }
  }
);
```

### Database Schema Example:

```javascript
{
  olympiadId: ObjectId,
  userId: ObjectId,
  username: String, // Optional: email/name for identification
  exitType: String, // 'tab_switch', 'close', 'navigate'
  timestamp: Date,
  cameraImagePath: String, // Path to camera screenshot
  screenImagePath: String, // Path to screen screenshot
  cameraImageName: String, // Filename
  screenImageName: String, // Filename
  createdAt: Date
}
```

### Summary:

✅ Frontend automatically captures last frame when user leaves tab/close  
✅ Screenshots saved to `uploads/users/{userId}/` folder  
✅ Optional username tracking for identification  
✅ Uses `keepalive: true` for reliable upload during page unload  
✅ Backend extracts userId from JWT token  
✅ Handles both camera and screen screenshots

