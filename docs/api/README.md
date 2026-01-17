# FlowWave API Reference

Base URL: `http://localhost:3001/api`

## Authentication

All authenticated endpoints require a Bearer token:

```
Authorization: Bearer <access_token>
```

## Endpoints

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-16T00:00:00.000Z"
}
```

---

### Workflows

#### List Workflows

```http
GET /api/workflows
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "My Workflow",
    "description": "Description",
    "nodes": [...],
    "edges": [...],
    "createdAt": "2026-01-16T00:00:00.000Z",
    "updatedAt": "2026-01-16T00:00:00.000Z"
  }
]
```

#### Get Workflow

```http
GET /api/workflows/:id
```

**Response:**
```json
{
  "id": "uuid",
  "name": "My Workflow",
  "nodes": [...],
  "edges": [...],
  "metadata": {}
}
```

#### Create Workflow

```http
POST /api/workflows
Content-Type: application/json

{
  "name": "My Workflow",
  "description": "Optional description",
  "nodes": [
    {
      "id": "node-1",
      "type": "http-request",
      "position": { "x": 0, "y": 0 },
      "data": { "url": "https://api.example.com" }
    }
  ],
  "edges": []
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "My Workflow",
  "createdAt": "2026-01-16T00:00:00.000Z"
}
```

#### Delete Workflow

```http
DELETE /api/workflows/:id
```

**Response:**
```json
{
  "success": true,
  "id": "uuid"
}
```

---

### Executions

#### Execute Workflow

```http
POST /api/workflows/:id/execute
Content-Type: application/json

{
  "input": {
    "key": "value"
  }
}
```

**Response:**
```json
{
  "status": "queued",
  "workflowId": "uuid"
}
```

#### List Executions

```http
GET /api/executions
```

**Response:**
```json
[
  {
    "id": "uuid",
    "workflowId": "uuid",
    "status": "completed",
    "startedAt": "2026-01-16T00:00:00.000Z",
    "completedAt": "2026-01-16T00:00:01.000Z",
    "duration": 1000,
    "logs": [...],
    "output": {}
  }
]
```

---

### Webhooks

#### Trigger Webhook

```http
POST /api/webhooks/:path
X-FlowWave-Signature: sha256=<signature>

{
  "event": "data",
  "payload": {}
}
```

**Response:**
```json
{
  "received": true,
  "executionId": "uuid"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error Type",
  "message": "Descriptive message"
}
```

### Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

## Rate Limiting

- **Unauthenticated**: 60 requests/minute
- **Authenticated**: 1000 requests/minute
