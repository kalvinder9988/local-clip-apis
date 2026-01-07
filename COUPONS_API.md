# Coupons API Documentation

## Overview
Complete CRUD API for managing coupons with support for likes, dislikes, shares, and status management.

## Base URL
```
http://localhost:9001/coupons
```

## Authentication
All endpoints require Bearer token authentication in the header:
```
Authorization: Bearer <your_jwt_token>
```

## Coupon Entity Fields

| Field | Type | Description | Required | Unique |
|-------|------|-------------|----------|--------|
| id | number | Auto-generated primary key | Auto | Yes |
| merchant_business_id | number | Foreign key to merchant business | Yes | No |
| coupon_name | string(255) | Name of the coupon | Yes | No |
| coupon_code | string(100) | Unique coupon code | Yes | Yes |
| type | enum | 'flat' or 'percentage' | Yes | No |
| coupon_value | decimal(10,2) | Value of coupon (amount or %) | Yes | No |
| description | text | Coupon description | No | No |
| total_likes | number | Number of likes | Auto (0) | No |
| total_dislikes | number | Number of dislikes | Auto (0) | No |
| total_shared | number | Number of times shared | Auto (0) | No |
| valid_from | date | Start date (YYYY-MM-DD) | Yes | No |
| valid_to | date | End date (YYYY-MM-DD) | Yes | No |
| status | boolean | Active/Inactive status | Auto (true) | No |
| created_at | timestamp | Creation timestamp | Auto | No |
| updated_at | timestamp | Last update timestamp | Auto | No |

## API Endpoints

### 1. Create Coupon
**POST** `/coupons`

Creates a new coupon.

**Request Body:**
```json
{
  "merchant_business_id": 1,
  "coupon_name": "Summer Sale",
  "coupon_code": "SUMMER2024",
  "type": "percentage",
  "coupon_value": 20.00,
  "description": "Get 20% off on all items",
  "valid_from": "2024-06-01",
  "valid_to": "2024-08-31",
  "status": true
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "merchant_business_id": 1,
  "coupon_name": "Summer Sale",
  "coupon_code": "SUMMER2024",
  "type": "percentage",
  "coupon_value": 20.00,
  "description": "Get 20% off on all items",
  "total_likes": 0,
  "total_dislikes": 0,
  "total_shared": 0,
  "valid_from": "2024-06-01",
  "valid_to": "2024-08-31",
  "status": true,
  "created_at": "2024-12-26T10:00:00.000Z",
  "updated_at": "2024-12-26T10:00:00.000Z"
}
```

**Errors:**
- `409 Conflict` - Coupon code already exists
- `400 Bad Request` - valid_to must be after valid_from

---

### 2. Get All Coupons
**GET** `/coupons`

Returns all coupons ordered by creation date (newest first).

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "merchant_business_id": 1,
    "coupon_name": "Summer Sale",
    "coupon_code": "SUMMER2024",
    "type": "percentage",
    "coupon_value": 20.00,
    "description": "Get 20% off on all items",
    "total_likes": 15,
    "total_dislikes": 2,
    "total_shared": 8,
    "valid_from": "2024-06-01",
    "valid_to": "2024-08-31",
    "status": true,
    "created_at": "2024-12-26T10:00:00.000Z",
    "updated_at": "2024-12-26T10:00:00.000Z",
    "merchant_business": {
      "id": 1,
      "business_name": "ABC Store"
    }
  }
]
```

---

### 3. Get Coupons by Merchant Business
**GET** `/coupons?merchant_business_id=1`

Returns all coupons for a specific merchant business.

**Query Parameters:**
- `merchant_business_id` (required): ID of the merchant business

**Response:** `200 OK`
Same as Get All Coupons, but filtered by merchant business.

---

### 4. Get Single Coupon
**GET** `/coupons/:id`

Returns a specific coupon by ID.

**Parameters:**
- `id` (required): Coupon ID

**Response:** `200 OK`
```json
{
  "id": 1,
  "merchant_business_id": 1,
  "coupon_name": "Summer Sale",
  "coupon_code": "SUMMER2024",
  "type": "percentage",
  "coupon_value": 20.00,
  "description": "Get 20% off on all items",
  "total_likes": 15,
  "total_dislikes": 2,
  "total_shared": 8,
  "valid_from": "2024-06-01",
  "valid_to": "2024-08-31",
  "status": true,
  "created_at": "2024-12-26T10:00:00.000Z",
  "updated_at": "2024-12-26T10:00:00.000Z",
  "merchant_business": {
    "id": 1,
    "business_name": "ABC Store"
  }
}
```

**Errors:**
- `404 Not Found` - Coupon not found

---

### 5. Get Coupon by Code
**GET** `/coupons/code/:code`

Returns a coupon by its unique coupon code.

**Parameters:**
- `code` (required): Coupon code

**Example:** `/coupons/code/SUMMER2024`

**Response:** `200 OK`
Same structure as Get Single Coupon.

**Errors:**
- `404 Not Found` - Coupon code not found

---

### 6. Update Coupon
**PATCH** `/coupons/:id`

Updates a coupon. All fields are optional.

**Parameters:**
- `id` (required): Coupon ID

**Request Body:**
```json
{
  "coupon_name": "Updated Summer Sale",
  "coupon_value": 25.00,
  "status": false
}
```

**Response:** `200 OK`
Returns the updated coupon with all fields.

**Errors:**
- `404 Not Found` - Coupon not found
- `409 Conflict` - Coupon code already exists (if updating code)
- `400 Bad Request` - Invalid date range

---

### 7. Increment Likes
**PATCH** `/coupons/:id/like`

Increments the total_likes counter by 1.

**Parameters:**
- `id` (required): Coupon ID

**Response:** `200 OK`
Returns the updated coupon.

---

### 8. Increment Dislikes
**PATCH** `/coupons/:id/dislike`

Increments the total_dislikes counter by 1.

**Parameters:**
- `id` (required): Coupon ID

**Response:** `200 OK`
Returns the updated coupon.

---

### 9. Increment Shared
**PATCH** `/coupons/:id/share`

Increments the total_shared counter by 1.

**Parameters:**
- `id` (required): Coupon ID

**Response:** `200 OK`
Returns the updated coupon.

---

### 10. Toggle Status
**PATCH** `/coupons/:id/toggle-status`

Toggles the status between true and false.

**Parameters:**
- `id` (required): Coupon ID

**Response:** `200 OK`
Returns the updated coupon.

---

### 11. Delete Coupon
**DELETE** `/coupons/:id`

Deletes a coupon permanently.

**Parameters:**
- `id` (required): Coupon ID

**Response:** `204 No Content`

**Errors:**
- `404 Not Found` - Coupon not found

---

## Validation Rules

### Create/Update Coupon:
- `merchant_business_id`: Must be a valid integer
- `coupon_name`: Max 255 characters
- `coupon_code`: Max 100 characters, must be unique
- `type`: Must be either 'flat' or 'percentage'
- `coupon_value`: Must be a number with max 2 decimal places, minimum 0
- `valid_from`: Must be a valid date string (YYYY-MM-DD)
- `valid_to`: Must be a valid date string (YYYY-MM-DD), must be after valid_from
- `total_likes`, `total_dislikes`, `total_shared`: Non-negative integers

---

## Example Usage with cURL

### Create a Coupon:
```bash
curl -X POST http://localhost:9001/coupons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "merchant_business_id": 1,
    "coupon_name": "Winter Special",
    "coupon_code": "WINTER2024",
    "type": "flat",
    "coupon_value": 10.00,
    "description": "Flat $10 off",
    "valid_from": "2024-12-01",
    "valid_to": "2025-02-28"
  }'
```

### Get All Coupons:
```bash
curl -X GET http://localhost:9001/coupons \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Coupons for Specific Merchant:
```bash
curl -X GET "http://localhost:9001/coupons?merchant_business_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Increment Likes:
```bash
curl -X PATCH http://localhost:9001/coupons/1/like \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Delete Coupon:
```bash
curl -X DELETE http://localhost:9001/coupons/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Database Migration

After creating/updating the coupon entity, run the following to sync the database:

```bash
# If using TypeORM CLI
npm run typeorm migration:generate -- -n CreateCouponsTable
npm run typeorm migration:run

# Or let TypeORM auto-sync (development only)
# Already configured in app.module.ts with synchronize: true
```

The `coupons` table will be automatically created with all fields and constraints.

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "valid_to must be after valid_from",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Invalid or expired token",
  "error": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Coupon with ID 123 not found",
  "error": "Not Found"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Coupon code \"SUMMER2024\" already exists",
  "error": "Conflict"
}
```
