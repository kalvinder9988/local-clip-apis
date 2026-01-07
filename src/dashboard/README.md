# Dashboard API

The Dashboard module provides comprehensive statistics and analytics for the admin panel.

## Endpoints

### 1. Get Overall Dashboard Statistics
```
GET /dashboard/stats
```

**Response:**
```json
{
  "totalUsers": 150,
  "totalMerchants": 45,
  "totalCoupons": 320,
  "activeCoupons": 280,
  "totalCategories": 12,
  "totalPlans": 4
}
```

---

### 2. Get User Statistics
```
GET /dashboard/users
```

**Response:**
```json
{
  "totalUsers": 150,
  "activeUsers": 150,
  "newUsersToday": 5,
  "newUsersThisWeek": 23,
  "newUsersThisMonth": 87,
  "usersByPlan": [
    {
      "planName": "Premium",
      "count": 45
    },
    {
      "planName": "Basic",
      "count": 105
    }
  ]
}
```

---

### 3. Get Merchant Statistics
```
GET /dashboard/merchants
```

**Response:**
```json
{
  "totalMerchants": 45,
  "activeMerchants": 42,
  "newMerchantsToday": 2,
  "newMerchantsThisWeek": 8,
  "newMerchantsThisMonth": 15,
  "merchantsByCategory": [
    {
      "categoryName": "Restaurant",
      "count": 15
    },
    {
      "categoryName": "Retail",
      "count": 12
    }
  ]
}
```

---

### 4. Get Coupon Statistics
```
GET /dashboard/coupons
```

**Response:**
```json
{
  "totalCoupons": 320,
  "activeCoupons": 280,
  "expiredCoupons": 40,
  "newCouponsToday": 8,
  "newCouponsThisWeek": 35,
  "newCouponsThisMonth": 120,
  "couponsByType": [
    {
      "type": "flat",
      "count": 180
    },
    {
      "type": "percentage",
      "count": 140
    }
  ],
  "topCouponsByLikes": [
    {
      "id": 1,
      "couponName": "50% Off Summer Sale",
      "couponCode": "SUMMER50",
      "totalLikes": 350,
      "totalShared": 125
    }
  ],
  "topCouponsByShares": [
    {
      "id": 2,
      "couponName": "Free Delivery",
      "couponCode": "FREEDEL",
      "totalShared": 220,
      "totalLikes": 180
    }
  ]
}
```

---

### 5. Get Recent Activity
```
GET /dashboard/activity?limit=10
```

**Query Parameters:**
- `limit` (optional): Number of activities to return (default: 10)

**Response:**
```json
[
  {
    "type": "user",
    "title": "New User Registered",
    "description": "John Doe joined",
    "timestamp": "2025-12-26T10:30:00.000Z",
    "id": 150
  },
  {
    "type": "coupon",
    "title": "New Coupon Created",
    "description": "50% Off (SUMMER50)",
    "timestamp": "2025-12-26T09:15:00.000Z",
    "id": 320
  },
  {
    "type": "merchant",
    "title": "New Merchant Added",
    "description": "Acme Store was added",
    "timestamp": "2025-12-26T08:45:00.000Z",
    "id": 45
  }
]
```

---

### 6. Get Growth Statistics
```
GET /dashboard/growth
```

Returns growth data for the last 7 days.

**Response:**
```json
[
  {
    "period": "2025-12-20",
    "users": 145,
    "merchants": 42,
    "coupons": 305
  },
  {
    "period": "2025-12-21",
    "users": 147,
    "merchants": 43,
    "coupons": 312
  },
  {
    "period": "2025-12-22",
    "users": 148,
    "merchants": 43,
    "coupons": 315
  },
  {
    "period": "2025-12-23",
    "users": 149,
    "merchants": 44,
    "coupons": 318
  },
  {
    "period": "2025-12-24",
    "users": 149,
    "merchants": 44,
    "coupons": 319
  },
  {
    "period": "2025-12-25",
    "users": 150,
    "merchants": 45,
    "coupons": 320
  },
  {
    "period": "2025-12-26",
    "users": 150,
    "merchants": 45,
    "coupons": 320
  }
]
```

---

## Usage in Frontend

### Example: Fetch Dashboard Stats
```typescript
const response = await fetch('http://localhost:9001/dashboard/stats', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
const stats = await response.json();
```

### Example: Fetch Recent Activity
```typescript
const response = await fetch('http://localhost:9001/dashboard/activity?limit=20', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
const activities = await response.json();
```

---

## Features

✅ **Overall Statistics**: Quick overview of key metrics  
✅ **User Analytics**: User registration trends and plan distribution  
✅ **Merchant Analytics**: Merchant growth and category breakdown  
✅ **Coupon Analytics**: Coupon performance, types, and engagement  
✅ **Recent Activity**: Real-time activity feed across all entities  
✅ **Growth Trends**: 7-day historical data for trend visualization  

---

## Authentication

All dashboard endpoints require JWT authentication. Include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```
