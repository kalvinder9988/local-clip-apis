# Coupons API - Quick Test Examples

## Prerequisites
1. Backend server running on http://localhost:9001
2. Valid JWT authentication token
3. At least one merchant business in the database

## Get Your Token
First, login to get a token:
```bash
curl -X POST http://localhost:9001/admin-users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your_password"
  }'
```

Save the `access_token` from the response and use it in the commands below.

---

## Test 1: Create a Coupon

### Percentage Discount Example:
```bash
curl -X POST http://localhost:9001/coupons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "merchant_business_id": 1,
    "coupon_name": "Black Friday Sale",
    "coupon_code": "BLACKFRIDAY2024",
    "type": "percentage",
    "coupon_value": 30.00,
    "description": "Get 30% off on all items during Black Friday!",
    "valid_from": "2024-11-25",
    "valid_to": "2024-11-30",
    "status": true
  }'
```

### Flat Discount Example:
```bash
curl -X POST http://localhost:9001/coupons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "merchant_business_id": 1,
    "coupon_name": "New Customer Discount",
    "coupon_code": "WELCOME10",
    "type": "flat",
    "coupon_value": 10.00,
    "description": "First time customer? Get $10 off!",
    "valid_from": "2025-01-01",
    "valid_to": "2025-12-31",
    "status": true
  }'
```

---

## Test 2: Get All Coupons
```bash
curl -X GET http://localhost:9001/coupons \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Test 3: Get Coupons for Specific Merchant
```bash
curl -X GET "http://localhost:9001/coupons?merchant_business_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Test 4: Get Coupon by ID
```bash
curl -X GET http://localhost:9001/coupons/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Test 5: Get Coupon by Code
```bash
curl -X GET http://localhost:9001/coupons/code/BLACKFRIDAY2024 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Test 6: Update Coupon
```bash
curl -X PATCH http://localhost:9001/coupons/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "coupon_value": 35.00,
    "description": "Updated: Get 35% off on all items!"
  }'
```

---

## Test 7: Increment Likes
```bash
curl -X PATCH http://localhost:9001/coupons/1/like \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Test 8: Increment Dislikes
```bash
curl -X PATCH http://localhost:9001/coupons/1/dislike \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Test 9: Increment Shared Count
```bash
curl -X PATCH http://localhost:9001/coupons/1/share \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Test 10: Toggle Status (Active/Inactive)
```bash
curl -X PATCH http://localhost:9001/coupons/1/toggle-status \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Test 11: Delete Coupon
```bash
curl -X DELETE http://localhost:9001/coupons/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Expected Error Scenarios

### Duplicate Coupon Code (409 Conflict):
```bash
# Try creating a coupon with an existing code
curl -X POST http://localhost:9001/coupons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "merchant_business_id": 1,
    "coupon_name": "Another Sale",
    "coupon_code": "BLACKFRIDAY2024",
    "type": "percentage",
    "coupon_value": 20.00,
    "valid_from": "2024-12-01",
    "valid_to": "2024-12-31"
  }'
```

Expected Response:
```json
{
  "statusCode": 409,
  "message": "Coupon code \"BLACKFRIDAY2024\" already exists",
  "error": "Conflict"
}
```

### Invalid Date Range (400 Bad Request):
```bash
curl -X POST http://localhost:9001/coupons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "merchant_business_id": 1,
    "coupon_name": "Invalid Dates",
    "coupon_code": "INVALID",
    "type": "percentage",
    "coupon_value": 20.00,
    "valid_from": "2024-12-31",
    "valid_to": "2024-12-01"
  }'
```

Expected Response:
```json
{
  "statusCode": 400,
  "message": "valid_to must be after valid_from",
  "error": "Bad Request"
}
```

### Coupon Not Found (404 Not Found):
```bash
curl -X GET http://localhost:9001/coupons/99999 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Expected Response:
```json
{
  "statusCode": 404,
  "message": "Coupon with ID 99999 not found",
  "error": "Not Found"
}
```

---

## Using Postman

### Setup:
1. Create a new collection named "Coupons API"
2. Set collection-level authorization:
   - Type: Bearer Token
   - Token: {{access_token}}
3. Add environment variable `access_token` after login

### Requests to Add:

1. **Create Coupon** - POST `/coupons`
2. **Get All Coupons** - GET `/coupons`
3. **Get Merchant Coupons** - GET `/coupons?merchant_business_id=1`
4. **Get Coupon by ID** - GET `/coupons/:id`
5. **Get by Code** - GET `/coupons/code/:code`
6. **Update Coupon** - PATCH `/coupons/:id`
7. **Like Coupon** - PATCH `/coupons/:id/like`
8. **Dislike Coupon** - PATCH `/coupons/:id/dislike`
9. **Share Coupon** - PATCH `/coupons/:id/share`
10. **Toggle Status** - PATCH `/coupons/:id/toggle-status`
11. **Delete Coupon** - DELETE `/coupons/:id`

---

## Database Verification

Check the coupons table was created:
```sql
SHOW TABLES LIKE 'coupons';
DESCRIBE coupons;
SELECT * FROM coupons;
```

Check relationships:
```sql
SELECT 
  c.id,
  c.coupon_name,
  c.coupon_code,
  c.type,
  c.coupon_value,
  mb.business_name as merchant_name,
  c.total_likes,
  c.total_shared,
  c.status
FROM coupons c
JOIN merchant_businesses mb ON c.merchant_business_id = mb.id;
```
