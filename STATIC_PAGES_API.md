# Static Pages API Documentation

## Overview
The Static Pages API allows you to manage static content pages like Terms & Conditions, Privacy Policy, and About Us.

## Endpoints

### 1. Create Static Page
**POST** `/static-pages`

**Auth Required:** Yes (JWT)

**Request Body:**
```json
{
  "title": "Terms and Conditions",
  "content": "Full terms and conditions content here...",
  "type": "terms-conditions",
  "status": "active"
}
```

**Response:**
```json
{
  "id": 1,
  "title": "Terms and Conditions",
  "slug": "terms-and-conditions",
  "content": "Full terms and conditions content here...",
  "type": "terms-conditions",
  "status": "active",
  "created_at": "2025-12-26T10:00:00.000Z",
  "updated_at": "2025-12-26T10:00:00.000Z"
}
```

**Notes:**
- `slug` is auto-generated from `title`
- `type` must be unique (only one page per type)
- Valid types: `terms-conditions`, `privacy-policy`, `about-us`
- `status` defaults to `active` if not provided

---

### 2. Get All Static Pages
**GET** `/static-pages`

**Auth Required:** No

**Response:**
```json
[
  {
    "id": 1,
    "title": "Terms and Conditions",
    "slug": "terms-and-conditions",
    "content": "...",
    "type": "terms-conditions",
    "status": "active",
    "created_at": "2025-12-26T10:00:00.000Z",
    "updated_at": "2025-12-26T10:00:00.000Z"
  },
  {
    "id": 2,
    "title": "Privacy Policy",
    "slug": "privacy-policy",
    "content": "...",
    "type": "privacy-policy",
    "status": "active",
    "created_at": "2025-12-26T10:00:00.000Z",
    "updated_at": "2025-12-26T10:00:00.000Z"
  }
]
```

---

### 3. Get Static Page by ID
**GET** `/static-pages/:id`

**Auth Required:** No

**Example:** `GET /static-pages/1`

**Response:**
```json
{
  "id": 1,
  "title": "Terms and Conditions",
  "slug": "terms-and-conditions",
  "content": "Full content...",
  "type": "terms-conditions",
  "status": "active",
  "created_at": "2025-12-26T10:00:00.000Z",
  "updated_at": "2025-12-26T10:00:00.000Z"
}
```

---

### 4. Get Static Page by Type
**GET** `/static-pages/type/:type`

**Auth Required:** No

**Example:** `GET /static-pages/type/privacy-policy`

**Valid Types:**
- `terms-conditions`
- `privacy-policy`
- `about-us`

**Response:**
```json
{
  "id": 2,
  "title": "Privacy Policy",
  "slug": "privacy-policy",
  "content": "Full content...",
  "type": "privacy-policy",
  "status": "active",
  "created_at": "2025-12-26T10:00:00.000Z",
  "updated_at": "2025-12-26T10:00:00.000Z"
}
```

---

### 5. Get Static Page by Slug
**GET** `/static-pages/slug/:slug`

**Auth Required:** No

**Example:** `GET /static-pages/slug/terms-and-conditions`

**Response:**
```json
{
  "id": 1,
  "title": "Terms and Conditions",
  "slug": "terms-and-conditions",
  "content": "Full content...",
  "type": "terms-conditions",
  "status": "active",
  "created_at": "2025-12-26T10:00:00.000Z",
  "updated_at": "2025-12-26T10:00:00.000Z"
}
```

---

### 6. Update Static Page
**PATCH** `/static-pages/:id`

**Auth Required:** Yes (JWT)

**Request Body (all fields optional):**
```json
{
  "title": "Updated Terms and Conditions",
  "content": "Updated content...",
  "status": "inactive"
}
```

**Response:**
```json
{
  "id": 1,
  "title": "Updated Terms and Conditions",
  "slug": "updated-terms-and-conditions",
  "content": "Updated content...",
  "type": "terms-conditions",
  "status": "inactive",
  "created_at": "2025-12-26T10:00:00.000Z",
  "updated_at": "2025-12-26T10:30:00.000Z"
}
```

**Notes:**
- If `title` changes, `slug` is automatically regenerated
- `type` can be changed if no other page uses that type

---

### 7. Toggle Status
**PATCH** `/static-pages/:id/toggle-status`

**Auth Required:** Yes (JWT)

**Example:** `PATCH /static-pages/1/toggle-status`

**Response:**
```json
{
  "id": 1,
  "title": "Terms and Conditions",
  "slug": "terms-and-conditions",
  "content": "Full content...",
  "type": "terms-conditions",
  "status": "inactive",
  "created_at": "2025-12-26T10:00:00.000Z",
  "updated_at": "2025-12-26T10:35:00.000Z"
}
```

**Notes:**
- Toggles between `active` and `inactive`
- No request body needed

---

### 8. Delete Static Page
**DELETE** `/static-pages/:id`

**Auth Required:** Yes (JWT)

**Example:** `DELETE /static-pages/1`

**Response:**
```json
{
  "message": "Static page with ID 1 has been deleted"
}
```

---

## Error Responses

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Static page with ID 1 not found",
  "error": "Not Found"
}
```

### 409 Conflict (Duplicate Type)
```json
{
  "statusCode": 409,
  "message": "A static page with type 'terms-conditions' already exists",
  "error": "Conflict"
}
```

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": ["title should not be empty", "content should not be empty"],
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

---

## Features

✅ **Automatic Slug Generation**: Slugs are auto-generated from titles  
✅ **Unique Type Constraint**: Only one page per type allowed  
✅ **Unique Slug Constraint**: Auto-increments if duplicate (e.g., `terms-1`, `terms-2`)  
✅ **Status Management**: Toggle between active/inactive  
✅ **Multiple Retrieval Methods**: By ID, slug, or type  
✅ **Protected Routes**: Create, update, and delete require authentication  
✅ **Public Access**: Read operations are public (no auth required)  

---

## Usage Examples

### Create Terms & Conditions Page
```bash
curl -X POST http://localhost:9001/static-pages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Terms and Conditions",
    "content": "By using our service, you agree to...",
    "type": "terms-conditions"
  }'
```

### Get Privacy Policy by Type (Public)
```bash
curl http://localhost:9001/static-pages/type/privacy-policy
```

### Update About Us Page
```bash
curl -X PATCH http://localhost:9001/static-pages/3 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Updated about us content..."
  }'
```

---

## Database Schema

```sql
CREATE TABLE static_pages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  type ENUM('terms-conditions', 'privacy-policy', 'about-us') UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```
