# Cascade REST API Documentation

> **Last Updated:** 2025-11-20

Complete API reference for accessing Cascade programmatically from CLI tools, AI agents, and external integrations.

## Base URL

```
Production: https://your-domain.com
Development: http://localhost:5173
```

## Authentication

All API requests require an API key passed in the `Authorization` header:

```bash
Authorization: Bearer sk_casc_your_api_key_here
```

### Generating API Keys

1. Log in to Cascade
2. Go to Settings → API Keys
3. Click "Generate New API Key"
4. Name your key (e.g., "CLI Tool", "GitHub Actions")
5. Select scopes (permissions)
6. Optional: Restrict to specific project
7. Save the generated key (shown only once!)

### API Key Format

```
sk_casc_<32_random_characters>
```

Example: `sk_casc_AbCdEfGh1234567890IjKlMnOpQrSt`

### Scopes (Permissions)

API keys require specific scopes to access endpoints:

| Scope | Description |
|-------|-------------|
| `issues:read` | Read issues and their details |
| `issues:write` | Create and update issues |
| `issues:delete` | Delete issues |
| `projects:read` | Read project information |
| `projects:write` | Create and update projects |
| `comments:read` | Read issue comments |
| `comments:write` | Add comments to issues |
| `documents:read` | Read documents |
| `documents:write` | Create and edit documents |
| `search:read` | Search across projects |

### Rate Limiting

- **Default Limit:** 100 requests per minute per API key
- **Custom Limits:** Configurable per key (contact admin)
- **Response Headers:**
  - `X-RateLimit-Limit`: Total requests allowed per window
  - `X-RateLimit-Remaining`: Requests remaining in current window
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

When rate limited:
```json
{
  "error": {
    "code": 429,
    "message": "Rate limit exceeded",
    "retryAfter": 45
  }
}
```

---

## Issues API

### List Issues

Get a list of issues for a project.

```http
GET /api/issues?projectId=<id>
```

**Query Parameters:**
- `projectId` (required): Project ID
- `status`: Filter by status (e.g., "todo", "in-progress")
- `assigneeId`: Filter by assignee user ID
- `sprintId`: Filter by sprint ID
- `limit`: Number of results (default: 100, max: 1000)
- `offset`: Pagination offset (default: 0)

**Required Scope:** `issues:read`

**Example Request:**
```bash
curl https://your-domain.com/api/issues?projectId=abc123 \
  -H "Authorization: Bearer sk_casc_your_key"
```

**Example Response:**
```json
{
  "data": [
    {
      "_id": "issue_id_123",
      "key": "PROJ-42",
      "title": "Fix login bug",
      "description": "Users can't log in with email",
      "type": "bug",
      "status": "todo",
      "priority": "high",
      "assigneeId": "user_id_456",
      "reporterId": "user_id_789",
      "createdAt": 1699564800000,
      "updatedAt": 1699651200000
    }
  ],
  "pagination": {
    "total": 42,
    "limit": 100,
    "offset": 0,
    "hasMore": false
  }
}
```

---

### Get Single Issue

Get details for a specific issue by its key.

```http
GET /api/issues/:key
```

**Path Parameters:**
- `key` (required): Issue key (e.g., "PROJ-42")

**Required Scope:** `issues:read`

**Example Request:**
```bash
curl https://your-domain.com/api/issues/PROJ-42 \
  -H "Authorization: Bearer sk_casc_your_key"
```

**Example Response:**
```json
{
  "data": {
    "_id": "issue_id_123",
    "key": "PROJ-42",
    "title": "Fix login bug",
    "description": "Users can't log in with email",
    "type": "bug",
    "status": "todo",
    "priority": "high",
    "assignee": {
      "_id": "user_id_456",
      "name": "Jane Doe",
      "email": "jane@example.com"
    },
    "reporter": {
      "_id": "user_id_789",
      "name": "John Smith",
      "email": "john@example.com"
    },
    "comments": [],
    "activity": [],
    "createdAt": 1699564800000,
    "updatedAt": 1699651200000
  }
}
```

---

### Create Issue

Create a new issue.

```http
POST /api/issues
Content-Type: application/json
```

**Required Scope:** `issues:write`

**Request Body:**
```json
{
  "projectId": "project_id_123",
  "title": "New issue title",
  "description": "Detailed description",
  "type": "task",
  "status": "todo",
  "priority": "medium",
  "assigneeId": "user_id_456",
  "labels": ["bug", "urgent"],
  "estimatedHours": 4
}
```

**Required Fields:**
- `projectId`: Project ID
- `title`: Issue title
- `type`: One of: `task`, `bug`, `story`, `epic`, `subtask`

**Optional Fields:**
- `description`: Issue description
- `status`: Workflow state ID (defaults to first "todo" state)
- `priority`: One of: `lowest`, `low`, `medium`, `high`, `highest`
- `assigneeId`: User ID to assign to
- `labels`: Array of label strings
- `estimatedHours`: Estimated time in hours
- `sprintId`: Sprint to add issue to
- `epicId`: Parent epic ID

**Example Request:**
```bash
curl -X POST https://your-domain.com/api/issues \
  -H "Authorization: Bearer sk_casc_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "abc123",
    "title": "Implement dark mode",
    "type": "task",
    "priority": "high"
  }'
```

**Example Response:**
```json
{
  "data": {
    "_id": "issue_id_new",
    "key": "PROJ-43",
    "title": "Implement dark mode",
    "type": "task",
    "status": "todo",
    "priority": "high",
    "createdAt": 1699738200000,
    "updatedAt": 1699738200000
  }
}
```

---

### Update Issue

Update an existing issue.

```http
PATCH /api/issues/:key
Content-Type: application/json
```

**Path Parameters:**
- `key` (required): Issue key (e.g., "PROJ-42")

**Required Scope:** `issues:write`

**Request Body** (all fields optional):
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "in-progress",
  "priority": "highest",
  "assigneeId": "user_id_789",
  "labels": ["bug", "critical"]
}
```

**Example Request:**
```bash
curl -X PATCH https://your-domain.com/api/issues/PROJ-42 \
  -H "Authorization: Bearer sk_casc_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "done",
    "priority": "low"
  }'
```

**Example Response:**
```json
{
  "data": {
    "_id": "issue_id_123",
    "key": "PROJ-42",
    "title": "Fix login bug",
    "status": "done",
    "priority": "low",
    "updatedAt": 1699824600000
  }
}
```

---

### Delete Issue

Delete an issue permanently.

```http
DELETE /api/issues/:key
```

**Path Parameters:**
- `key` (required): Issue key (e.g., "PROJ-42")

**Required Scope:** `issues:delete`

**Example Request:**
```bash
curl -X DELETE https://your-domain.com/api/issues/PROJ-42 \
  -H "Authorization: Bearer sk_casc_your_key"
```

**Example Response:**
```
HTTP/1.1 204 No Content
```

---

## Projects API

### List Projects

Get all projects the API key has access to.

```http
GET /api/projects
```

**Required Scope:** `projects:read`

**Example Request:**
```bash
curl https://your-domain.com/api/projects \
  -H "Authorization: Bearer sk_casc_your_key"
```

**Example Response:**
```json
{
  "data": [
    {
      "_id": "project_id_123",
      "name": "My Project",
      "key": "PROJ",
      "description": "Project description",
      "boardType": "kanban",
      "isPublic": false,
      "createdAt": 1699564800000
    }
  ]
}
```

---

## Comments API

### Add Comment

Add a comment to an issue.

```http
POST /api/issues/:key/comments
Content-Type: application/json
```

**Path Parameters:**
- `key` (required): Issue key (e.g., "PROJ-42")

**Required Scope:** `comments:write`

**Request Body:**
```json
{
  "content": "This is my comment"
}
```

**Example Request:**
```bash
curl -X POST https://your-domain.com/api/issues/PROJ-42/comments \
  -H "Authorization: Bearer sk_casc_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Fixed in latest commit"
  }'
```

---

## Search API

### Global Search

Search across issues, documents, and projects.

```http
GET /api/search?q=<query>
```

**Query Parameters:**
- `q` (required): Search query
- `type`: Filter by type (`issue`, `document`, `project`)
- `projectId`: Limit to specific project
- `limit`: Number of results (default: 50, max: 100)

**Required Scope:** `search:read`

**Example Request:**
```bash
curl 'https://your-domain.com/api/search?q=login+bug&type=issue' \
  -H "Authorization: Bearer sk_casc_your_key"
```

**Example Response:**
```json
{
  "data": {
    "issues": [
      {
        "key": "PROJ-42",
        "title": "Fix login bug",
        "snippet": "Users can't **login** with email due to validation **bug**"
      }
    ],
    "documents": [],
    "projects": []
  },
  "total": 1
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": 400,
    "message": "Human-readable error message",
    "details": {}
  }
}
```

### Common Error Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid API key |
| 403 | Forbidden | API key lacks required scope or project access |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

---

## CLI Examples

### Bash/cURL

```bash
# Set your API key
export CASCADE_API_KEY="sk_casc_your_key"

# List issues
curl "https://your-domain.com/api/issues?projectId=abc123" \
  -H "Authorization: Bearer $CASCADE_API_KEY"

# Create issue
curl -X POST https://your-domain.com/api/issues \
  -H "Authorization: Bearer $CASCADE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "abc123",
    "title": "New task from CLI",
    "type": "task"
  }'

# Update issue
curl -X PATCH https://your-domain.com/api/issues/PROJ-42 \
  -H "Authorization: Bearer $CASCADE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"status": "done"}'
```

### Python

```python
import requests

API_KEY = "sk_casc_your_key"
BASE_URL = "https://your-domain.com"
HEADERS = {"Authorization": f"Bearer {API_KEY}"}

# List issues
response = requests.get(
    f"{BASE_URL}/api/issues",
    headers=HEADERS,
    params={"projectId": "abc123"}
)
issues = response.json()["data"]

# Create issue
response = requests.post(
    f"{BASE_URL}/api/issues",
    headers=HEADERS,
    json={
        "projectId": "abc123",
        "title": "New task from Python",
        "type": "task",
        "priority": "high"
    }
)
new_issue = response.json()["data"]
print(f"Created: {new_issue['key']}")
```

### Node.js

```javascript
const axios = require('axios');

const API_KEY = 'sk_casc_your_key';
const BASE_URL = 'https://your-domain.com';
const headers = { 'Authorization': `Bearer ${API_KEY}` };

// List issues
const listIssues = async (projectId) => {
  const { data } = await axios.get(`${BASE_URL}/api/issues`, {
    headers,
    params: { projectId }
  });
  return data.data;
};

// Create issue
const createIssue = async (issueData) => {
  const { data } = await axios.post(`${BASE_URL}/api/issues`, issueData, { headers });
  return data.data;
};

// Usage
(async () => {
  const issues = await listIssues('abc123');
  console.log(`Found ${issues.length} issues`);

  const newIssue = await createIssue({
    projectId: 'abc123',
    title: 'New task from Node.js',
    type: 'task'
  });
  console.log(`Created: ${newIssue.key}`);
})();
```

---

## CLI AI Agent Integration

Perfect for connecting Claude Code or other CLI AI agents:

```bash
# Claude Code can make API calls directly
claude "Create a new bug issue in PROJ titled 'Fix auth timeout'"

# Your Claude Code integration script:
#!/bin/bash
TITLE="$1"
CASCADE_API_KEY="your_key"

curl -X POST https://your-domain.com/api/issues \
  -H "Authorization: Bearer $CASCADE_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"projectId\": \"your_project_id\",
    \"title\": \"$TITLE\",
    \"type\": \"bug\",
    \"priority\": \"high\"
  }"
```

---

## Best Practices

1. **Keep API Keys Secure**
   - Never commit keys to version control
   - Use environment variables: `export CASCADE_API_KEY=...`
   - Rotate keys periodically

2. **Handle Rate Limits**
   - Implement exponential backoff
   - Respect `retryAfter` in 429 responses
   - Cache responses when possible

3. **Error Handling**
   - Always check response status codes
   - Parse error messages for debugging
   - Log failed requests for monitoring

4. **Pagination**
   - Use `limit` and `offset` for large datasets
   - Check `hasMore` in pagination response

5. **Project-Scoped Keys**
   - Use project-scoped keys when integrating single project
   - Reduces security risk if key is compromised

---

## Support

- **Documentation**: https://docs.cascade.app/api
- **Status**: https://status.cascade.app
- **Issues**: support@cascade.app

For questions or feature requests, contact your Cascade administrator.
