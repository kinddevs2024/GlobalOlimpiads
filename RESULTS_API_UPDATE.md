# Results API Update

## Overview

The Results API endpoint has been updated to work with a new backend format that accepts both `olympiadId` and `userId` as query parameters and returns a full list of results.

## Changes

### Frontend Changes

1. **API Endpoint Updated** (`src/services/api.js`):
   - Changed from: `GET /api/olympiads/:id/results`
   - Changed to: `GET /api/olympiads/results?olympiadId=xxx&userId=xxx`
   - The endpoint now accepts both `olympiadId` and `userId` as query parameters

2. **Results Page Updated** (`src/pages/Results.jsx`):
   - Added validation to ensure `olympiadId` and `userId` are present
   - Sends both `olympiadId` and `userId` to the backend
   - Receives full list of results from backend
   - Filters the list on the frontend to find the specific person's result
   - Added error handling for undefined IDs

3. **Leaderboard Page Updated** (`src/pages/Leaderboard.jsx`):
   - Updated to use the new API format
   - Only sends `olympiadId` to get all results for the leaderboard

### Backend Requirements

The backend must implement the following endpoint:

#### GET `/api/olympiads/results`

**Query Parameters:**
- `olympiadId` (required): The ID of the olympiad
- `userId` (optional): The ID of the user (can be used for backend filtering, but frontend will also filter)

**Headers:**
```
Authorization: Bearer <token>
```

**Response Format:**

```json
{
  "olympiad": {
    "_id": "olympiad_id",
    "title": "Math Olympiad 2024",
    "totalPoints": 100,
    "description": "Annual math competition",
    "type": "test",
    "subject": "Mathematics"
  },
  "results": [
    {
      "_id": "result_id_1",
      "user": {
        "_id": "user_id_1",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "olympiadId": "olympiad_id",
      "totalScore": 85,
      "rank": 1,
      "completedAt": "2024-02-01T11:30:00.000Z",
      "answers": {
        "question_id_1": "option_a",
        "question_id_2": "option_b"
      }
    },
    {
      "_id": "result_id_2",
      "user": {
        "_id": "user_id_2",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "olympiadId": "olympiad_id",
      "totalScore": 80,
      "rank": 2,
      "completedAt": "2024-02-01T11:25:00.000Z",
      "answers": {
        "question_id_1": "option_a",
        "question_id_2": "option_c"
      }
    }
  ]
}
```

**Backend Implementation Notes:**

1. **Full List Return**: The backend should return ALL results for the specified olympiad, not just one user's result.

2. **User Identification**: Each result in the list should include user information, either:
   - `user` object with `_id`, `name`, `email`
   - OR `userId` field directly on the result

3. **Ranking**: Results should be sorted by `totalScore` (descending) and include a `rank` field.

4. **Olympiad Data**: The response should include the olympiad information (title, totalPoints, etc.) so the frontend doesn't need a separate call.

5. **Error Handling**: 
   - Return 404 if olympiad not found
   - Return 400 if `olympiadId` is missing
   - Return 401 if not authenticated

## Frontend Filtering Logic

The frontend receives the full list of results and filters it to find the specific user's result:

```javascript
const userResult = allResults.find(r => {
  const resultUserId = r.user?._id || r.userId || r.user;
  return resultUserId === user._id || resultUserId === user._id.toString();
});
```

This handles different possible formats for user identification in the result objects.

## Migration Notes

### Old Endpoint (Deprecated)
```
GET /api/olympiads/:id/results
```

### New Endpoint (Current)
```
GET /api/olympiads/results?olympiadId=xxx&userId=xxx
```

The backend should implement the new endpoint format and can optionally keep the old one for backward compatibility, but the frontend now uses the new format.

## Testing

To test the new endpoint:

1. **With both parameters:**
   ```
   GET /api/olympiads/results?olympiadId=123&userId=456
   Authorization: Bearer <token>
   ```

2. **With only olympiadId (for leaderboard):**
   ```
   GET /api/olympiads/results?olympiadId=123
   Authorization: Bearer <token>
   ```

The frontend will handle filtering the results list to find the specific user's result.

