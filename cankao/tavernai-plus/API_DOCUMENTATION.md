# Universal UX System API Documentation

**Version**: 1.0.0
**Base URL**: `http://localhost:3001` (development) | `https://api.yourdomain.com` (production)
**Authentication**: JWT Bearer Token

---

## Table of Contents

1. [Authentication](#authentication)
2. [Feature Management](#feature-management)
3. [Onboarding](#onboarding)
4. [Tutorials](#tutorials)
5. [Notifications](#notifications)
6. [Gamification](#gamification)
7. [Creator Studio](#creator-studio)
8. [Admin Console](#admin-console)
9. [WebSocket Events](#websocket-events)
10. [Error Handling](#error-handling)

---

## Authentication

All API endpoints require JWT authentication unless otherwise specified.

### Request Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Token Refresh
Tokens expire after 15 minutes. Use the refresh token to obtain a new access token.

---

## Feature Management

### List All Features

**GET** `/api/v1/features`

Returns all available features in the system.

**Response** `200 OK`:
```json
{
  "success": true,
  "data": [
    {
      "id": "F1",
      "name": "Progressive Feature Disclosure",
      "description": "Gradual UI element revelation based on user level",
      "category": "core",
      "icon": "eye",
      "enabled": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### Get User Feature Unlocks

**GET** `/api/v1/features/unlocks`

Returns all features unlocked by the authenticated user.

**Response** `200 OK`:
```json
{
  "success": true,
  "data": [
    {
      "id": "unlock-123",
      "userId": "user-456",
      "featureId": "F1",
      "unlockMethod": "default",
      "metadata": {},
      "unlockedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### Unlock a Feature

**POST** `/api/v1/features/unlock`

Unlocks a feature for the authenticated user.

**Request Body**:
```json
{
  "featureId": "F5",
  "unlockMethod": "achievement",
  "metadata": {
    "achievementId": "first_chat"
  }
}
```

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "id": "unlock-789",
    "userId": "user-456",
    "featureId": "F5",
    "unlockMethod": "achievement",
    "metadata": {
      "achievementId": "first_chat"
    },
    "unlockedAt": "2024-01-02T10:30:00.000Z"
  }
}
```

**Error** `409 Conflict`:
```json
{
  "success": false,
  "error": "Feature already unlocked for this user"
}
```

---

### Check Feature Access

**GET** `/api/v1/features/:featureId/check`

Checks if the authenticated user has access to a specific feature.

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "unlocked": true,
    "unlockedAt": "2024-01-01T00:00:00.000Z",
    "unlockMethod": "default"
  }
}
```

---

## Onboarding

### Get Onboarding Status

**GET** `/api/v1/onboarding/status`

Returns the onboarding status for the authenticated user.

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "completed": false,
    "currentStep": 2,
    "totalSteps": 5,
    "mbtiType": null,
    "interests": [],
    "startedAt": "2024-01-01T08:00:00.000Z"
  }
}
```

---

### Complete Onboarding

**POST** `/api/v1/onboarding/complete`

Marks onboarding as complete and saves user preferences.

**Request Body**:
```json
{
  "mbtiType": "INTJ",
  "interests": ["fantasy", "sci-fi", "mystery"],
  "preferredGenres": ["adventure", "romance"],
  "preferences": {
    "complexity": "medium",
    "interactionStyle": "narrative"
  }
}
```

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "onboardingCompleted": true,
    "mbtiType": "INTJ",
    "recommendations": [
      {
        "characterId": "char-123",
        "name": "Sherlock Holmes",
        "matchScore": 95
      }
    ]
  }
}
```

---

## Tutorials

### List Available Tutorials

**GET** `/api/v1/tutorials`

Returns all available tutorials.

**Response** `200 OK`:
```json
{
  "success": true,
  "data": [
    {
      "id": "chat-basics",
      "title": "Chat Basics",
      "description": "Learn how to chat with characters",
      "steps": 5,
      "estimatedDuration": 120,
      "category": "beginner"
    }
  ]
}
```

---

### Complete Tutorial

**POST** `/api/v1/tutorials/:tutorialId/complete`

Marks a tutorial as completed.

**Request Body**:
```json
{
  "completedSteps": ["step1", "step2", "step3"],
  "duration": 95
}
```

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "tutorialId": "chat-basics",
    "completed": true,
    "completedAt": "2024-01-02T12:00:00.000Z",
    "reward": {
      "xp": 100,
      "achievement": "tutorial_complete"
    }
  }
}
```

---

### Get Tutorial Progress

**GET** `/api/v1/tutorials/progress`

Returns progress for all tutorials.

**Response** `200 OK`:
```json
{
  "success": true,
  "data": [
    {
      "tutorialId": "chat-basics",
      "completed": true,
      "currentStep": 5,
      "completedSteps": ["step1", "step2", "step3", "step4", "step5"],
      "startedAt": "2024-01-02T11:00:00.000Z",
      "completedAt": "2024-01-02T12:00:00.000Z"
    }
  ]
}
```

---

## Notifications

### List Notifications

**GET** `/api/v1/notifications`

Returns paginated notifications for the authenticated user.

**Query Parameters**:
- `page` (number, default: 1): Page number
- `limit` (number, default: 20): Items per page
- `read` (boolean): Filter by read status
- `type` (string): Filter by type (info, success, warning, error)
- `priority` (string): Filter by priority (normal, high, urgent)

**Response** `200 OK`:
```json
{
  "success": true,
  "data": [
    {
      "id": "notif-123",
      "title": "New Achievement",
      "message": "You unlocked the 'First Chat' achievement!",
      "type": "success",
      "priority": "normal",
      "read": false,
      "readAt": null,
      "createdAt": "2024-01-02T14:30:00.000Z",
      "metadata": {
        "achievementId": "first_chat"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalPages": 3,
    "totalCount": 50
  }
}
```

---

### Get Unread Count

**GET** `/api/v1/notifications/unread/count`

Returns the count of unread notifications.

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

---

### Mark as Read

**PATCH** `/api/v1/notifications/:id/read`

Marks a notification as read.

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "id": "notif-123",
    "read": true,
    "readAt": "2024-01-02T15:00:00.000Z"
  }
}
```

---

### Mark All as Read

**POST** `/api/v1/notifications/mark-all-read`

Marks all notifications as read.

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "count": 12
  }
}
```

---

## Gamification

### Get Overview

**GET** `/api/v1/gamification/overview`

Returns gamification overview for the authenticated user.

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "level": 12,
    "experience": 2500,
    "nextLevelExp": 3000,
    "totalAchievements": 50,
    "unlockedAchievements": 23,
    "totalQuests": 10,
    "completedQuests": 7,
    "averageAffinity": 6.5,
    "highestProficiency": 35
  }
}
```

---

### Get Affinity List

**GET** `/api/v1/gamification/affinity`

Returns character affinity relationships.

**Query Parameters**:
- `limit` (number): Max results
- `sortBy` (string): Sort field (level, experience, lastInteraction)
- `order` (string): Sort order (asc, desc)

**Response** `200 OK`:
```json
{
  "success": true,
  "data": [
    {
      "characterId": "char-123",
      "characterName": "Alice",
      "level": 8,
      "experience": 1200,
      "nextLevelExp": 1500,
      "lastInteraction": "2024-01-02T14:00:00.000Z",
      "totalInteractions": 45
    }
  ]
}
```

---

### Get Achievements

**GET** `/api/v1/gamification/achievements`

Returns achievements for the authenticated user.

**Query Parameters**:
- `unlocked` (boolean): Filter by unlock status
- `category` (string): Filter by category

**Response** `200 OK`:
```json
{
  "success": true,
  "data": [
    {
      "id": "first_chat",
      "name": "First Contact",
      "description": "Complete your first chat",
      "icon": "chat",
      "category": "beginner",
      "unlocked": true,
      "unlockedAt": "2024-01-02T10:00:00.000Z",
      "progress": 1,
      "maxProgress": 1,
      "reward": {
        "xp": 100
      }
    }
  ]
}
```

---

### Get Daily Quests

**GET** `/api/v1/gamification/quests`

Returns daily quests for the authenticated user.

**Query Parameters**:
- `completed` (boolean): Filter by completion status

**Response** `200 OK`:
```json
{
  "success": true,
  "data": [
    {
      "id": "daily-chat-3",
      "title": "Chat Master",
      "description": "Complete 3 conversations today",
      "progress": 2,
      "maxProgress": 3,
      "completed": false,
      "reward": 150,
      "expiresAt": "2024-01-03T00:00:00.000Z"
    }
  ]
}
```

---

## Creator Studio

### Get Dashboard

**GET** `/api/v1/creator-studio/dashboard`

Returns creator studio dashboard data.

**Authorization**: Requires `creator` or `admin` role

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "totalCharacters": 15,
    "totalScenarios": 8,
    "publishedWorks": 20,
    "totalRevenue": 125.50,
    "totalViews": 5420,
    "totalDownloads": 892,
    "recentActivity": [
      {
        "type": "character_published",
        "characterId": "char-456",
        "timestamp": "2024-01-02T10:00:00.000Z"
      }
    ]
  }
}
```

---

### Get Analytics

**GET** `/api/v1/creator-studio/analytics`

Returns creator analytics data.

**Query Parameters**:
- `timeRange` (string): Time range (7d, 30d, 90d)

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "views": [
      { "date": "2024-01-01", "count": 125 },
      { "date": "2024-01-02", "count": 138 }
    ],
    "downloads": [
      { "date": "2024-01-01", "count": 23 },
      { "date": "2024-01-02", "count": 29 }
    ],
    "revenue": [
      { "date": "2024-01-01", "amount": 15.50 },
      { "date": "2024-01-02", "amount": 18.75 }
    ],
    "totalPublished": 23
  }
}
```

---

## Admin Console

### Get Dashboard

**GET** `/api/v1/admin-console/dashboard`

Returns admin console dashboard metrics.

**Authorization**: Requires `admin` role

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "totalUsers": 1250,
    "activeUsers": 420,
    "totalContent": 5680,
    "pendingModeration": 12,
    "systemHealth": "healthy",
    "lastBackup": "2024-01-02T03:00:00.000Z"
  }
}
```

---

### Get Monitoring Metrics

**GET** `/api/v1/admin-console/monitoring`

Returns real-time system metrics.

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "usersOnline": 89,
    "apiRequests": 12450,
    "totalErrors": 3,
    "avgResponseTime": 145,
    "aiTokensUsed": 125000,
    "aiCost": 2.50,
    "dbConnections": 12,
    "dbPoolSize": 20
  }
}
```

---

### Get Alerts

**GET** `/api/v1/admin-console/alerts`

Returns system alerts.

**Query Parameters**:
- `severity` (string): Filter by severity (info, warning, error, critical)
- `timeRange` (string): Filter by time range (24h, 7d, 30d)

**Response** `200 OK`:
```json
{
  "success": true,
  "data": [
    {
      "id": "alert-123",
      "title": "High API Error Rate",
      "message": "Error rate exceeded 1% threshold",
      "severity": "warning",
      "createdAt": "2024-01-02T14:00:00.000Z",
      "resolved": false
    }
  ]
}
```

---

## WebSocket Events

### Connection

**URL**: `ws://localhost:3001` (development)

**Authentication**:
```javascript
socket.emit('authenticate', { token: 'your-jwt-token' });
```

---

### Events (Server → Client)

#### notification:new
New notification received
```json
{
  "notification": {
    "id": "notif-456",
    "title": "New Message",
    "message": "You have a new message from Alice",
    "type": "info",
    "priority": "normal",
    "createdAt": "2024-01-02T15:30:00.000Z"
  },
  "timestamp": "2024-01-02T15:30:00.000Z"
}
```

#### notification:read
Notification marked as read
```json
{
  "notificationId": "notif-456"
}
```

#### system:alert
System-wide alert
```json
{
  "message": "System maintenance in 10 minutes",
  "severity": "warning"
}
```

---

## Error Handling

### Error Response Format

All errors follow this format:
```json
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE",
  "details": {}
}
```

### HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 400 | Bad Request | Invalid input, missing required fields |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Insufficient permissions, role check failed |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists, duplicate operation |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |
| 503 | Service Unavailable | External service (AI, database) unavailable |

### Common Error Codes

| Code | Description |
|------|-------------|
| `AUTH_REQUIRED` | Authentication required |
| `INVALID_TOKEN` | JWT token invalid or expired |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions |
| `FEATURE_NOT_FOUND` | Feature ID doesn't exist |
| `FEATURE_ALREADY_UNLOCKED` | Feature already unlocked for user |
| `TUTORIAL_NOT_FOUND` | Tutorial ID doesn't exist |
| `NOTIFICATION_NOT_FOUND` | Notification ID doesn't exist |
| `INVALID_MBTI_TYPE` | MBTI type must be valid 4-letter code |
| `RATE_LIMIT_EXCEEDED` | Too many requests |

---

## Rate Limits

| Endpoint Group | Limit |
|----------------|-------|
| Authentication | 10 requests/minute |
| Feature Management | 100 requests/minute |
| Notifications | 50 requests/minute |
| Gamification | 100 requests/minute |
| Creator Studio | 50 requests/minute |
| Admin Console | 200 requests/minute |
| WebSocket | 1000 messages/minute |

Rate limits are per user/IP address. Exceeding limits returns `429 Too Many Requests`.

---

## Versioning

The API uses URL versioning (`/api/v1/`). Breaking changes will increment the major version.

Current Version: **v1.0.0**

---

**Last Updated**: 2025-10-02
**Maintained By**: Development Team
