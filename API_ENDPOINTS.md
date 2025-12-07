# Backend API Endpoints Documentation

This document lists all API endpoints that the frontend expects from the backend.

**Base URL**: `http://localhost:3000/api` (or as configured in `.env`)

**Authentication**: All endpoints (except auth endpoints) require a Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

---

## 🔐 Authentication Endpoints

### POST `/api/auth/register`

Register a new user.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
```

**Response:**

```json
{
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "student"
  }
}
```

---

### POST `/api/auth/login`

Login user.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "student"
  }
}
```

---

### GET `/api/auth/me`

Get current authenticated user information.

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "_id": "user_id",
  "email": "user@example.com",
  "name": "User Name",
  "role": "student",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### POST `/api/auth/google`

Login or register user with Google OAuth.

**Request Body:**

```json
{
  "token": "google_access_token_here"
}
```

**Response:**

```json
{
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "student"
  }
}
```

**Note:** The backend should verify the Google access token using the Google Client Secret and then create/login the user.

---

## 🏆 Olympiad Endpoints (Public/Student)

### GET `/api/olympiads`

Get all olympiads.

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
[
  {
    "_id": "olympiad_id",
    "title": "Math Olympiad 2024",
    "description": "Annual math competition",
    "type": "test",
    "subject": "math",
    "startTime": "2024-02-01T10:00:00.000Z",
    "endTime": "2024-02-01T12:00:00.000Z",
    "duration": 7200,
    "status": "upcoming",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### GET `/api/olympiads/:id`

Get a specific olympiad by ID with questions.

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "_id": "olympiad_id",
  "title": "Math Olympiad 2024",
  "description": "Annual math competition",
  "type": "test",
  "subject": "math",
  "startTime": "2024-02-01T10:00:00.000Z",
  "endTime": "2024-02-01T12:00:00.000Z",
  "duration": 7200,
  "questions": [
    {
      "_id": "question_id",
      "question": "What is 2 + 2?",
      "type": "multiple-choice",
      "options": ["2", "3", "4", "5"],
      "points": 10
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### POST `/api/olympiads/:id/submit`

Submit olympiad answers.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body (for test type):**

```json
{
  "answers": {
    "question_id_1": "option_a",
    "question_id_2": "option_b"
  }
}
```

**Request Body (for essay type):**

```json
{
  "essay": "Essay content here..."
}
```

**Response:**

```json
{
  "message": "Submission successful",
  "submissionId": "submission_id"
}
```

---

### GET `/api/olympiads/results`

Get results for a specific olympiad. Returns the user's specific result, top 5 participants, and total participants count.

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `olympiadId` (required): The ID of the olympiad
- `userId` (optional): The ID of the user

**Example Request:**

```
GET /api/olympiads/results?olympiadId=olympiad_id&userId=user_id
```

**Response:**

```json
{
  "success": true,
  "olympiadId": "olympiad_id",
  "olympiadTitle": "Math Olympiad 2024",
  "olympiadType": "test",
  "userResult": {
    "rank": 3,
    "position": "🥉 3rd Place",
    "score": 85,
    "totalPoints": 100,
    "percentage": 85,
    "submittedAt": "2025-12-07T21:13:39.076Z",
    "answers": {
      "question_id_1": "option_a",
      "question_id_2": "option_b"
    },
    "correctAnswers": {
      "question_id_1": "option_a",
      "question_id_2": "option_c"
    },
    "submissionDetails": {}
  },
  "topFive": [
    {
      "rank": 1,
      "position": "🥇 1st Place",
      "userId": "user_id_1",
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "score": 95,
      "totalPoints": 100,
      "percentage": 95,
      "completedAt": "2024-02-01T11:30:00.000Z"
    },
    {
      "rank": 2,
      "position": "🥈 2nd Place",
      "userId": "user_id_2",
      "userName": "Jane Smith",
      "userEmail": "jane@example.com",
      "score": 90,
      "totalPoints": 100,
      "percentage": 90,
      "completedAt": "2024-02-01T11:25:00.000Z"
    },
    {
      "rank": 3,
      "position": "🥉 3rd Place",
      "userId": "user_id_3",
      "userName": "Bob Johnson",
      "userEmail": "bob@example.com",
      "score": 85,
      "totalPoints": 100,
      "percentage": 85,
      "completedAt": "2024-02-01T11:20:00.000Z"
    }
  ],
  "totalParticipants": 10
}
```

**Note:** The endpoint returns the requesting user's result (`userResult`), the top 5 participants (`topFive`), and the total number of participants in a single response. The `position` field includes emoji and text (e.g., "🥇 1st Place").

---

### POST `/api/olympiads/camera-capture`

Upload camera capture during olympiad.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (FormData):**

```
olympiadId: "olympiad_id"
captureType: "camera" | "screen"
image: <File>
```

**Response:**

```json
{
  "message": "Capture uploaded successfully",
  "captureId": "capture_id"
}
```

---

## 👨‍💼 Admin Endpoints

### GET `/api/admin/olympiads`

Get all olympiads (admin view - includes drafts).

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
[
  {
    "_id": "olympiad_id",
    "title": "Math Olympiad 2024",
    "description": "Annual math competition",
    "type": "test",
    "subject": "Mathematics",
    "startTime": "2024-02-01T10:00:00.000Z",
    "endTime": "2024-02-01T12:00:00.000Z",
    "duration": 7200,
    "status": "draft",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### GET `/api/admin/olympiads/:id`

Get olympiad by ID (admin view with questions).

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "olympiad_id",
    "title": "Math Olympiad 2024",
    "description": "Annual math competition",
    "type": "test",
    "subject": "Mathematics",
    "startTime": "2024-02-01T10:00:00.000Z",
    "endTime": "2024-02-01T12:00:00.000Z",
    "duration": 7200,
    "questions": [...],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### POST `/api/admin/olympiads`

Create a new olympiad (Admin only).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "title": "Math Olympiad 2024",
  "description": "Annual math competition",
  "type": "test",
  "subject": "math",
  "startTime": "2024-02-01T10:00:00.000Z",
  "endTime": "2024-02-01T12:00:00.000Z",
  "duration": 7200
}
```

**Response:**

```json
{
  "_id": "olympiad_id",
  "title": "Math Olympiad 2024",
  "description": "Annual math competition",
  "type": "test",
  "subject": "math",
  "startTime": "2024-02-01T10:00:00.000Z",
  "endTime": "2024-02-01T12:00:00.000Z",
  "duration": 7200,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### PUT `/api/admin/olympiads/:id`

Update an olympiad (Admin only).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "startTime": "2024-02-01T10:00:00.000Z",
  "endTime": "2024-02-01T12:00:00.000Z"
}
```

**Response:**

```json
{
  "_id": "olympiad_id",
  "title": "Updated Title",
  "description": "Updated description",
  ...
}
```

---

### DELETE `/api/admin/olympiads/:id`

Delete an olympiad (Admin only).

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "message": "Olympiad deleted successfully"
}
```

---

### GET `/api/admin/questions`

Get all questions (Admin only).

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `olympiadId` (optional): Filter by olympiad ID

**Response:**

```json
[
  {
    "_id": "question_id",
    "olympiadId": "olympiad_id",
    "question": "What is 2 + 2?",
    "type": "multiple-choice",
    "options": ["2", "3", "4", "5"],
    "correctAnswer": "4",
    "points": 10,
    "order": 1,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### POST `/api/admin/questions`

Add a question to an olympiad (Admin only).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body (for multiple choice):**

```json
{
  "olympiadId": "olympiad_id",
  "question": "What is 2 + 2?",
  "type": "multiple-choice",
  "options": ["2", "3", "4", "5"],
  "correctAnswer": "4",
  "points": 10
}
```

**Request Body (for essay):**

```json
{
  "olympiadId": "olympiad_id",
  "question": "Explain the concept of gravity.",
  "type": "essay",
  "points": 20
}
```

**Response:**

```json
{
  "_id": "question_id",
  "olympiadId": "olympiad_id",
  "question": "What is 2 + 2?",
  "type": "multiple-choice",
  "options": ["2", "3", "4", "5"],
  "correctAnswer": "4",
  "points": 10,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### GET `/api/admin/submissions`

Get all submissions (Admin only).

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `olympiadId` (optional): Filter by olympiad ID
- `userId` (optional): Filter by user ID

**Response:**

```json
[
  {
    "_id": "submission_id",
    "olympiadId": "olympiad_id",
    "userId": "user_id",
    "user": {
      "name": "User Name",
      "email": "user@example.com"
    },
    "answers": {
      "question_id_1": "option_a"
    },
    "score": 85,
    "totalPoints": 100,
    "submittedAt": "2024-02-01T11:30:00.000Z"
  }
]
```

---

### GET `/api/admin/camera-captures/:olympiadId`

Get camera captures for an olympiad (Admin only).

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
[
  {
    "_id": "capture_id",
    "olympiadId": "olympiad_id",
    "userId": "user_id",
    "user": {
      "name": "User Name",
      "email": "user@example.com"
    },
    "imageUrl": "https://example.com/captures/image.jpg",
    "timestamp": "2024-02-01T11:00:00.000Z",
    "createdAt": "2024-02-01T11:00:00.000Z"
  }
]
```

---

## 👑 Owner Endpoints

### GET `/api/owner/analytics`

Get platform analytics (Owner only).

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "totalUsers": 150,
  "totalAdmins": 5,
  "totalStudents": 145,
  "totalOlympiads": 20,
  "totalSubmissions": 500,
  "activeOlympiads": 3,
  "upcomingOlympiads": 5,
  "completedOlympiads": 12
}
```

---

### PUT `/api/owner/users/:id/role`

Change user role (Owner only).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "role": "admin"
}
```

**Response:**

```json
{
  "_id": "user_id",
  "email": "user@example.com",
  "name": "User Name",
  "role": "admin",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### GET `/api/owner/reports`

Get platform reports (Owner only).

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `olympiadId` (optional): Get detailed report for specific olympiad

**Response:**

Without `olympiadId`: Array of reports for all olympiads

With `olympiadId`: Detailed report with results and summary

```json
[
  {
    "type": "performance",
    "data": {...}
  }
]
```

---

## 🔌 Socket.io Events

**Socket URL**: `http://localhost:3000`

**Authentication**: Token is sent in the connection auth:

```javascript
socket = io(SOCKET_URL, {
  auth: {
    token: "jwt_token_here",
  },
});
```

### Events the Frontend Listens To:

#### `connect`

Emitted when socket connects successfully.

#### `disconnect`

Emitted when socket disconnects.

#### `timer-update`

Real-time timer updates during olympiad.

**Data:**

```json
{
  "olympiadId": "olympiad_id",
  "timeRemaining": 3600,
  "status": "active"
}
```

#### `leaderboard-update`

Real-time leaderboard updates.

**Data:**

```json
{
  "olympiadId": "olympiad_id",
  "leaderboard": [
    {
      "userId": "user_id",
      "name": "User Name",
      "score": 95,
      "rank": 1
    }
  ]
}
```

---

## 🏥 Health Check Endpoint

### GET `/api/health`

Health check endpoint (optional, used for connection testing).

**Response:**

```json
{
  "status": "ok",
  "message": "Server is running"
}
```

---

## 📝 Notes

1. **Error Responses**: All endpoints should return errors in this format:

   ```json
   {
     "message": "Error message here",
     "error": "Error details (optional)"
   }
   ```

2. **Status Codes**:

   - `200` - Success
   - `201` - Created
   - `400` - Bad Request
   - `401` - Unauthorized
   - `403` - Forbidden
   - `404` - Not Found
   - `500` - Server Error

3. **CORS**: Backend must allow requests from `http://localhost:5173` (frontend URL)

4. **File Uploads**: Camera capture endpoint accepts `multipart/form-data` with image files

5. **Pagination**: Consider adding pagination for endpoints that return arrays (users, submissions, etc.)
