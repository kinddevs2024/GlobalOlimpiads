# Backend Video Upload Implementation Guide

## Overview

The frontend records **TWO SEPARATE VIDEOS** at 720p resolution and sends them to the backend:
1. **Camera Video** - Front-facing camera recording
2. **Screen Video** - Screen capture recording

Both videos are uploaded automatically when the olympiad ends. The backend needs to implement an endpoint to receive and store both video files.

## Frontend Behavior

### What the Frontend Does:

1. **Requests Permissions**: When user starts olympiad, requests both camera and screen permissions
2. **Records Two Separate Videos**: 
   - **Camera Video**: Records front-facing camera at 720p
   - **Screen Video**: Records screen capture at 720p
   - Both videos recorded simultaneously
   - Format: **WebM (VP9 codec)**
   - Frame rate: **30fps**
   - Bitrate: **2.5 Mbps**
3. **Continuous Recording**: Records both videos throughout the entire olympiad session
4. **Automatic Upload**: When olympiad ends or user navigates away:
   - Stops both recordings
   - Creates video blobs from recorded chunks
   - Uploads **both videos separately** to backend
   - Shows loading progress for each video during upload

### Video Specifications:

- **Resolution**: 1280x720 (720p) for both videos
- **Format**: WebM container
- **Codec**: VP9
- **Frame Rate**: 30fps
- **Bitrate**: 2.5 Mbps each
- **File Extension**: `.webm`
- **Types**: `camera` and `screen` (sent as separate uploads)

## Backend Requirements

### 1. API Endpoint

**Endpoint**: `POST /api/olympiads/upload-video`

**Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Request Body (FormData)**:
- `video`: File object (WebM video file)
- `olympiadId`: String (the olympiad ID)
- `videoType`: String (`'camera'` or `'screen'`) - **NEW: Identifies which video this is**

**Example Request (Camera Video)**:
```javascript
const formData = new FormData();
formData.append('video', cameraVideoFile); // Camera video File object
formData.append('olympiadId', 'olympiad_id_123');
formData.append('videoType', 'camera'); // Identifies this as camera video
```

**Example Request (Screen Video)**:
```javascript
const formData = new FormData();
formData.append('video', screenVideoFile); // Screen video File object
formData.append('olympiadId', 'olympiad_id_123');
formData.append('videoType', 'screen'); // Identifies this as screen video
```

**Note**: The frontend will make **TWO separate API calls** - one for camera video, one for screen video.

### 2. Backend Implementation Steps

#### Step 1: Set up File Upload Middleware

Use a file upload library like `multer` (for Node.js/Express) or similar:

```javascript
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads', 'videos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename: olympiadId_userId_videoType_timestamp.webm
    const userId = req.user._id; // From JWT token
    const olympiadId = req.body.olympiadId;
    const videoType = req.body.videoType || 'video'; // 'camera' or 'screen'
    const timestamp = Date.now();
    const filename = `${olympiadId}_${userId}_${videoType}_${timestamp}.webm`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500 MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept only video/webm files
    if (file.mimetype === 'video/webm') {
      cb(null, true);
    } else {
      cb(new Error('Only WebM video files are allowed'), false);
    }
  }
});
```

#### Step 2: Create the Upload Endpoint

```javascript
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth'); // Your auth middleware

router.post(
  '/upload-video',
  authenticate, // Require authentication
  upload.single('video'), // Handle single file upload
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No video file provided'
        });
      }

      const { olympiadId, videoType } = req.body;
      const userId = req.user._id; // From JWT token
      const videoFile = req.file;

      // Validate videoType
      if (!videoType || !['camera', 'screen'].includes(videoType)) {
        if (videoFile) fs.unlinkSync(videoFile.path);
        return res.status(400).json({
          success: false,
          message: 'Video type must be "camera" or "screen"'
        });
      }

      // Validate olympiadId
      if (!olympiadId) {
        // Delete uploaded file if validation fails
        fs.unlinkSync(videoFile.path);
        return res.status(400).json({
          success: false,
          message: 'Olympiad ID is required'
        });
      }

      // Optional: Verify user has access to this olympiad
      // const olympiad = await Olympiad.findById(olympiadId);
      // if (!olympiad) {
      //   fs.unlinkSync(videoFile.path);
      //   return res.status(404).json({ message: 'Olympiad not found' });
      // }

      // Save video metadata to database
      const videoRecord = await VideoRecording.create({
        olympiadId: olympiadId,
        userId: userId,
        videoType: videoType, // 'camera' or 'screen'
        filename: videoFile.filename,
        path: videoFile.path,
        size: videoFile.size,
        mimetype: videoFile.mimetype,
        uploadedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Video uploaded successfully',
        videoId: videoRecord._id,
        filename: videoFile.filename,
        size: videoFile.size
      });

    } catch (error) {
      console.error('Video upload error:', error);
      
      // Clean up uploaded file on error
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

#### Step 3: Create Video Model (MongoDB/Mongoose Example)

```javascript
const mongoose = require('mongoose');

const videoRecordingSchema = new mongoose.Schema({
  olympiadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Olympiad',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  videoType: {
    type: String,
    enum: ['camera', 'screen'],
    required: true,
    index: true // Index for faster queries
  },
  filename: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  size: {
    type: Number, // in bytes
    required: true
  },
  mimetype: {
    type: String,
    default: 'video/webm'
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for faster queries (find all videos for a user's olympiad)
videoRecordingSchema.index({ olympiadId: 1, userId: 1, videoType: 1 });

module.exports = mongoose.model('VideoRecording', videoRecordingSchema);
```

#### Step 4: Optional - Video Serving Endpoint

If you want to serve videos back to admins:

```javascript
router.get('/videos/:videoId', authenticate, async (req, res) => {
  try {
    const video = await VideoRecording.findById(req.params.videoId);
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Optional: Check if user has permission to view this video
    // (e.g., admin, owner, or the user who recorded it)

    const videoPath = video.path;
    
    // Check if file exists
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ message: 'Video file not found' });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', 'video/webm');
    res.setHeader('Content-Disposition', `inline; filename="${video.filename}"`);

    // Stream the video file
    const videoStream = fs.createReadStream(videoPath);
    videoStream.pipe(res);

  } catch (error) {
    console.error('Video serving error:', error);
    res.status(500).json({ message: 'Failed to serve video' });
  }
});
```

### 3. Response Format

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Video uploaded successfully",
  "videoId": "video_id_123",
  "videoType": "camera",
  "filename": "olympiad_123_user_456_camera_1234567890.webm",
  "size": 52428800
}
```

**Note**: Frontend will receive this response **twice** - once for camera video, once for screen video.

**Error Responses**:

**400 Bad Request** (No file):
```json
{
  "success": false,
  "message": "No video file provided"
}
```

**400 Bad Request** (Missing olympiadId):
```json
{
  "success": false,
  "message": "Olympiad ID is required"
}
```

**413 Payload Too Large** (File too big):
```json
{
  "success": false,
  "message": "File size exceeds maximum limit"
}
```

**500 Internal Server Error**:
```json
{
  "success": false,
  "message": "Failed to upload video",
  "error": "Error details here"
}
```

### 4. File Storage Structure

Recommended directory structure:
```
uploads/
  videos/
    olympiadId_userId_timestamp.webm
    olympiadId_userId_timestamp.webm
    ...
```

Example filename: `olympiad_123_user_456_1703123456789.webm`

### 5. Security Considerations

1. **Authentication**: Always verify JWT token before accepting upload
2. **File Size Limits**: Set reasonable limits (e.g., 500 MB)
3. **File Type Validation**: Only accept `video/webm` files
4. **Filename Sanitization**: Sanitize filenames to prevent path traversal
5. **Access Control**: Verify user has permission to upload for the olympiad
6. **Rate Limiting**: Prevent abuse with rate limiting
7. **Virus Scanning**: Consider scanning uploaded files (optional)

### 6. Additional Notes

- **WebM Format**: The frontend sends WebM format. If you need MP4, you can:
  - Convert on upload using FFmpeg
  - Keep as WebM (supported by modern browsers)
  - Convert on-demand when serving

- **File Size**: Videos can be large (50-500 MB depending on duration). Ensure:
  - Sufficient disk space
  - Proper timeout settings for large uploads
  - Progress tracking (frontend already does this)

- **Database Storage**: Store metadata in database, actual files on disk/filesystem

- **Cleanup**: Consider implementing cleanup job to delete old videos after retention period

## Frontend API Calls

The frontend makes **TWO separate calls** - one for camera, one for screen:

```javascript
// Upload Camera Video
const cameraFormData = new FormData();
cameraFormData.append('video', cameraVideoFile); // Camera video File object (WebM)
cameraFormData.append('olympiadId', olympiadId);
cameraFormData.append('videoType', 'camera');

await api.post('/olympiads/upload-video', cameraFormData, {
  headers: { 'Content-Type': 'multipart/form-data' },
  onUploadProgress: (progressEvent) => {
    // Track camera upload progress
  }
});

// Upload Screen Video
const screenFormData = new FormData();
screenFormData.append('video', screenVideoFile); // Screen video File object (WebM)
screenFormData.append('olympiadId', olympiadId);
screenFormData.append('videoType', 'screen');

await api.post('/olympiads/upload-video', screenFormData, {
  headers: { 'Content-Type': 'multipart/form-data' },
  onUploadProgress: (progressEvent) => {
    // Track screen upload progress
  }
});
```

Both uploads happen in parallel for faster upload times.

## Summary

**What Backend Needs to Do:**

1. ✅ Create `POST /api/olympiads/upload-video` endpoint
2. ✅ Accept multipart/form-data with:
   - `video` file (WebM video)
   - `olympiadId` (string)
   - `videoType` (string: `'camera'` or `'screen'`) - **NEW**
3. ✅ Verify JWT authentication
4. ✅ Validate `videoType` is either 'camera' or 'screen'
5. ✅ Save video file to disk/storage with videoType in filename
6. ✅ Store video metadata in database (including `videoType` field)
7. ✅ Return success/error response with videoType
8. ✅ Handle file size limits and validation
9. ✅ Clean up files on error

**Important Notes:**
- Frontend sends **TWO separate videos** (camera + screen)
- Backend will receive **2 API calls** per olympiad session
- Both videos have same specs: 720p, WebM, VP9 codec
- Use `videoType` to distinguish and organize videos
- Store both videos separately in database and filesystem

The frontend handles all recording (two separate streams) and uploading automatically!

