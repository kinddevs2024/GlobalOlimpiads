# Filename Format Documentation

## Overview

All video and screenshot files now include the olympiad name, date, and time in their filenames for better organization and identification.

## Video Filenames

**Format**: `{userId}_{date}_{olympiad-name}_{type}.webm`

**Structure**:
- User ID: The ID of the user who recorded the video (from JWT token)
- Date: `YYYY-MM-DD` (date of recording)
- Olympiad Name: Sanitized (spaces → dashes, lowercase, special chars removed)
- Type: `camera` or `screen`

**Example**:
```
12345_2024-02-15_math-olympiad-2024_camera.webm
12345_2024-02-15_math-olympiad-2024_screen.webm
```

**When Created**:
- Videos are named when recording stops and upload begins
- Date reflects when the video was recorded
- User ID identifies which participant recorded the video

## Exit Screenshot Filenames

**Format**: `{olympiad-name}_{date}_{time}_exit-{type}.jpg`

**Structure**:
- Olympiad Name: Sanitized (spaces → dashes, lowercase, special chars removed)
- Date: `YYYY-MM-DD`
- Time: `HH-MM-SS` (time when exit occurred)
- Type: `exit-camera` or `exit-screen`

**Example**:
```
math-olympiad-2024_2024-02-15_14-30-45_exit-camera.jpg
math-olympiad-2024_2024-02-15_14-30-45_exit-screen.jpg
```

**When Created**:
- Screenshots are named when the participant leaves the page/tab
- Date/time reflects when the exit occurred (when screenshot was captured)

## Filename Sanitization

Olympiad names are automatically sanitized for safe filenames:

- Special characters removed: `!@#$%^&*()+=[]{}|;:'",<>?/`
- Spaces converted to dashes: `Math Olympiad` → `math-olympiad`
- Multiple dashes collapsed: `Math---Olympiad` → `math-olympiad`
- Converted to lowercase
- Limited to 50 characters

**Examples**:
- `"Math Olympiad 2024!"` → `math-olympiad-2024`
- `"Science & Technology Competition"` → `science-technology-competition`
- `"English Test (Final)"` → `english-test-final`

## Implementation

### Utility Functions

Located in `src/utils/helpers.js`:

- `sanitizeForFilename(str)` - Sanitizes strings for filename use
- `formatDateTimeForFilename(date)` - Formats date/time as `YYYY-MM-DD_HH-MM-SS`
- `formatDateForFilename(date)` - Formats date as `YYYY-MM-DD`
- `generateVideoFilename(userId, title, type, date)` - Generates video filename with userId first
- `generateExitScreenshotFilename(title, type, date)` - Generates exit screenshot filename

### Component Usage

**ProctoringMonitor** component now accepts `olympiadTitle` prop:

```jsx
<ProctoringMonitor 
  olympiadId={id} 
  userId={user?._id}
  olympiadTitle={olympiad?.title}
  onRecordingStatusChange={setIsRecording}
/>
```

## Backend Storage

Backend should save files with these exact filenames:

- **Videos**: Saved to video storage directory
- **Exit Screenshots**: Saved to `uploads/users/{userId}/`

Backend can optionally:
- Validate filename format
- Extract olympiad name, date, time from filename
- Organize files by olympiad name or date

## Benefits

✅ **Easy Identification**: Immediately see which olympiad and when  
✅ **Better Organization**: Files sorted chronologically by date/time  
✅ **Unique Names**: Date/time prevents filename collisions  
✅ **Human Readable**: Clear format for administrators  
✅ **Searchable**: Easy to find files by olympiad name or date

## Example File Structure

```
uploads/
  users/
    12345/
      math-olympiad-2024_2024-02-15_14-30-45_exit-camera.jpg
      math-olympiad-2024_2024-02-15_14-30-45_exit-screen.jpg
  videos/
    12345_2024-02-15_math-olympiad-2024_camera.webm
    12345_2024-02-15_math-olympiad-2024_screen.webm
```

