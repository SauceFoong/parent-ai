# Parent AI API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### Register User
Create a new parent account.

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d5ec49f1b2c72b8c8e4a1b",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "parent"
  }
}
```

---

### Login User
Authenticate and receive access token.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d5ec49f1b2c72b8c8e4a1b",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "parent",
    "children": [],
    "settings": {
      "violenceThreshold": 0.6,
      "inappropriateThreshold": 0.7,
      "adultContentThreshold": 0.8,
      "notificationsEnabled": true,
      "monitoringEnabled": true
    }
  }
}
```

---

### Get Current User
Get authenticated user's information.

**Endpoint:** `GET /auth/me`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "user": {
    "id": "60d5ec49f1b2c72b8c8e4a1b",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "parent",
    "children": [
      {
        "name": "Alice",
        "age": 10,
        "deviceId": "device-123"
      }
    ],
    "settings": {
      "violenceThreshold": 0.6,
      "inappropriateThreshold": 0.7,
      "adultContentThreshold": 0.8,
      "notificationsEnabled": true,
      "monitoringEnabled": true
    }
  }
}
```

---

### Update Settings
Update user monitoring settings.

**Endpoint:** `PUT /auth/settings`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "violenceThreshold": 0.5,
  "notificationsEnabled": true,
  "monitoringEnabled": true
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "settings": {
    "violenceThreshold": 0.5,
    "inappropriateThreshold": 0.7,
    "adultContentThreshold": 0.8,
    "notificationsEnabled": true,
    "monitoringEnabled": true
  }
}
```

---

### Add Device Token
Register device for push notifications.

**Endpoint:** `POST /auth/device-token`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Device token added successfully"
}
```

---

### Add Child
Add a child profile for monitoring.

**Endpoint:** `POST /auth/children`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Alice",
  "age": 10,
  "deviceId": "device-123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "children": [
    {
      "name": "Alice",
      "age": 10,
      "deviceId": "device-123"
    }
  ]
}
```

---

## Monitoring Endpoints

### Submit Activity
Submit a new activity for monitoring and AI analysis.

**Endpoint:** `POST /monitoring/activity`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "childName": "Alice",
  "deviceId": "device-123",
  "activityType": "video",
  "contentTitle": "Example Video Title",
  "contentDescription": "Video description here",
  "appName": "YouTube",
  "url": "https://example.com/video",
  "screenshot": "base64-encoded-image-or-url"
}
```

**Activity Types:** `video`, `game`, `app`, `website`

**Response:** `201 Created`
```json
{
  "success": true,
  "activity": {
    "id": "60d5ec49f1b2c72b8c8e4a1c",
    "flagged": true,
    "aiAnalysis": {
      "isInappropriate": true,
      "violenceScore": 0.75,
      "adultContentScore": 0.2,
      "inappropriateScore": 0.3,
      "detectedCategories": ["Violence", "Fighting"],
      "summary": "Content contains violent imagery and fighting scenes",
      "confidence": 0.9
    }
  }
}
```

---

### Get Activities
Retrieve activity history with optional filters.

**Endpoint:** `GET /monitoring/activities`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `childName` (optional): Filter by child name
- `activityType` (optional): Filter by type (video, game, app, website)
- `flagged` (optional): Filter by flagged status (true/false)
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `limit` (optional): Number of results (default: 50)
- `skip` (optional): Pagination offset (default: 0)

**Example:** `GET /monitoring/activities?flagged=true&limit=10`

**Response:** `200 OK`
```json
{
  "success": true,
  "count": 10,
  "activities": [
    {
      "_id": "60d5ec49f1b2c72b8c8e4a1c",
      "childName": "Alice",
      "deviceId": "device-123",
      "activityType": "video",
      "contentTitle": "Example Video",
      "contentDescription": "Video description",
      "appName": "YouTube",
      "url": "https://example.com/video",
      "aiAnalysis": {
        "isInappropriate": true,
        "violenceScore": 0.75,
        "adultContentScore": 0.2,
        "inappropriateScore": 0.3,
        "detectedCategories": ["Violence"],
        "summary": "Content contains violent imagery",
        "confidence": 0.9
      },
      "flagged": true,
      "notificationSent": true,
      "timestamp": "2023-11-26T10:30:00.000Z",
      "duration": 300
    }
  ]
}
```

---

### Get Activity Statistics
Get aggregated statistics for dashboard.

**Endpoint:** `GET /monitoring/stats`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `childName` (optional): Filter by child name
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Example:** `GET /monitoring/stats?startDate=2023-11-01`

**Response:** `200 OK`
```json
{
  "success": true,
  "stats": {
    "totalActivities": 150,
    "flaggedActivities": 12,
    "safeActivities": 138,
    "flagRate": "8.00",
    "activitiesByType": [
      {
        "_id": "video",
        "count": 80
      },
      {
        "_id": "game",
        "count": 50
      },
      {
        "_id": "app",
        "count": 20
      }
    ],
    "recentFlags": [
      {
        "_id": "60d5ec49f1b2c72b8c8e4a1c",
        "contentTitle": "Flagged Video",
        "childName": "Alice",
        "timestamp": "2023-11-26T10:30:00.000Z",
        "aiAnalysis": {
          "summary": "Content contains inappropriate elements"
        }
      }
    ]
  }
}
```

---

### Update Activity Duration
Update the duration of an ongoing activity.

**Endpoint:** `PUT /monitoring/activity/:id/duration`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "duration": 300
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "activity": {
    "_id": "60d5ec49f1b2c72b8c8e4a1c",
    "duration": 300
  }
}
```

---

## Notification Endpoints

### Get Notifications
Retrieve unread notifications.

**Endpoint:** `GET /notifications`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "count": 5,
  "notifications": [
    {
      "_id": "60d5ec49f1b2c72b8c8e4a1d",
      "title": "⚠️ Alert: Alice's video activity",
      "message": "Alice is watching 'Video Title' which may contain Violence. Content contains violent imagery.",
      "severity": "high",
      "read": false,
      "sent": true,
      "sentAt": "2023-11-26T10:30:00.000Z",
      "createdAt": "2023-11-26T10:30:00.000Z",
      "activityId": {
        "_id": "60d5ec49f1b2c72b8c8e4a1c",
        "contentTitle": "Video Title",
        "childName": "Alice"
      }
    }
  ]
}
```

---

### Mark Notification as Read
Mark a notification as read.

**Endpoint:** `PUT /notifications/:id/read`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "notification": {
    "_id": "60d5ec49f1b2c72b8c8e4a1d",
    "read": true
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Server error"
}
```

---

## Rate Limiting

Currently not implemented. For production, consider:
- 100 requests per 15 minutes for general endpoints
- 10 requests per minute for activity submission
- Unlimited for authenticated health checks

---

## WebSocket Support (Future Enhancement)

Real-time notifications via WebSocket will be available in future versions.

---

## Postman Collection

Import this into Postman for easy API testing:

```json
{
  "info": {
    "name": "Parent AI API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000/api"
    },
    {
      "key": "token",
      "value": ""
    }
  ]
}
```

Set the `token` variable after logging in to automatically include it in protected requests.

