# Mufar Commerce API Documentation

Base URL: `https://<your-render-app>.onrender.com/api`

---

## Authentication

All protected endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

### POST /auth/login
Authenticate user and receive JWT tokens.

**Request:**
```json
{
  "email": "client@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "_id": "664a...",
      "storeName": "My Store",
      "email": "client@example.com",
      "role": "client",
      "mustChangePassword": false,
      "isActive": true
    }
  }
}
```

**Response with mustChangePassword (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "user": {
      "_id": "664a...",
      "email": "client@example.com",
      "role": "client",
      "mustChangePassword": true
    }
  },
  "message": "You must change your password before accessing the dashboard"
}
```

**Error (401):**
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

### POST /auth/refresh
Refresh the access token using a refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "new-access-token",
    "refreshToken": "new-refresh-token"
  }
}
```

### POST /auth/change-password
Change current user's password.

**Request:**
```json
{
  "currentPassword": "oldpass123",
  "newPassword": "newpass456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### GET /auth/me
Get current authenticated user's profile.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "664a...",
    "storeName": "My Store",
    "ownerName": "John Doe",
    "email": "client@example.com",
    "mobile": "9876543210",
    "role": "client",
    "isActive": true,
    "address": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra"
  }
}
```

---

## Users (Admin Only)

### GET /users
List all users. Supports pagination and role filtering.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 10) |
| role | string | Filter by role |
| isActive | boolean | Filter by active status |
| search | string | Search by name, email, mobile |

**Response (200):**
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

### POST /users
Create a new user (client).

**Request:**
```json
{
  "storeName": "New Store",
  "ownerName": "Owner Name",
  "mobile": "9876543210",
  "email": "newclient@example.com",
  "role": "client",
  "password": "temporary123"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": { ... },
  "message": "User created successfully"
}
```

---

## Categories

### GET /categories
List all categories. Supports parent/child tree.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "664a...",
      "name": "Child Care",
      "slug": "child-care",
      "description": "Child care products",
      "isActive": true,
      "children": [
        {
          "_id": "664b...",
          "name": "Newborn",
          "slug": "newborn",
          "parent": "664a...",
          "isActive": true
        }
      ]
    }
  ]
}
```

### POST /categories
Create a new category.

**Request:**
```json
{
  "name": "Adult Care",
  "description": "Adult care products",
  "parent": "optional-parent-id",
  "sortOrder": 1
}
```

---

## Products

### GET /products
List products with filtering, sorting, and pagination.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| page | number | Page number |
| limit | number | Items per page |
| search | string | Search name, SKU, brand |
| category | string | Category ID |
| brand | string | Brand name |
| minPrice | number | Minimum price |
| maxPrice | number | Maximum price |
| isActive | boolean | Active status |
| sortBy | string | Field to sort by |
| sortOrder | asc/desc | Sort direction |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "664c...",
      "name": "Baby Diaper Size M",
      "sku": "DIA-M-001",
      "category": { "_id": "664b...", "name": "Medium" },
      "brand": "Pampers",
      "price": 899,
      "offerPrice": 749,
      "stockQuantity": 150,
      "images": ["https://res.cloudinary.com/..."],
      "isActive": true
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 120, "totalPages": 12 }
}
```

### POST /products
Create a new product.

**Request:**
```json
{
  "name": "Baby Diaper Size M",
  "sku": "DIA-M-001",
  "category": "664b...",
  "brand": "Pampers",
  "description": "Extra absorbent baby diapers",
  "price": 899,
  "offerPrice": 749,
  "stockQuantity": 150,
  "lowStockThreshold": 20,
  "images": ["https://res.cloudinary.com/..."]
}
```

### GET /products/low-stock
Get products with stock below their low stock threshold.

---

## Orders

### POST /orders
Create a new order.

**Request:**
```json
{
  "deliveryAddress": "123 Main St, Mumbai",
  "contactNumber": "9876543210",
  "notes": "Handle with care",
  "items": [
    { "product": "664c...", "quantity": 5 },
    { "product": "664d...", "quantity": 3 }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "664e...",
    "orderNumber": "ORD-240601-7A3F",
    "invoiceNumber": "INV-240601-7A3F",
    "status": "pending",
    "subtotal": 6740,
    "tax": 1213.2,
    "total": 7953.2,
    "items": [...],
    "timeline": [
      {
        "status": "pending",
        "timestamp": "2026-06-01T12:00:00.000Z",
        "updatedBy": "664a..."
      }
    ]
  },
  "message": "Order placed successfully"
}
```

### PUT /orders/:id/status
Update order status (Admin/Manager only).

**Request (Accepted):**
```json
{
  "status": "accepted",
  "expectedDeliveryDate": "2026-06-10"
}
```

**Request (Rejected):**
```json
{
  "status": "rejected",
  "rejectionReason": "Product unavailable in requested quantity"
}
```

**Request (On Hold):**
```json
{
  "status": "on_hold",
  "holdReason": "Awaiting stock from supplier"
}
```

### GET /orders/:id/invoice
Download invoice as PDF.

**Response:** `application/pdf` binary stream.

---

## Dashboard

### GET /dashboard/admin
Admin dashboard statistics.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalClients": 45,
    "totalProducts": 120,
    "totalCategories": 15,
    "totalOrders": 340,
    "revenue": 2850000,
    "pendingOrders": 12,
    "deliveredOrders": 280,
    "lowStockProducts": 8,
    "revenueTrend": [
      { "date": "2026-01-01", "amount": 85000 },
      { "date": "2026-02-01", "amount": 92000 }
    ],
    "orderTrend": [
      { "date": "2026-01-01", "count": 45 },
      { "date": "2026-02-01", "count": 52 }
    ]
  }
}
```

### GET /dashboard/client
Client dashboard.

---

## Common Response Format

All API responses follow this structure:

### Success:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Error:
```json
{
  "success": false,
  "error": "Error message",
  "errors": {
    "fieldName": ["Field-specific error message"]
  }
}
```

---

## HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized |
| 403 | Forbidden (insufficient role) |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 422 | Unprocessable Entity |
| 429 | Too Many Requests (rate limit) |
| 500 | Internal Server Error |

---

## Testing with cURL

```bash
# Login
curl -X POST https://api.mufar-commerce.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Get products (authenticated)
curl -X GET https://api.mufar-commerce.com/api/products?page=1&limit=20 \
  -H "Authorization: Bearer <token>"

# Create order
curl -X POST https://api.mufar-commerce.com/api/orders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "deliveryAddress": "123 Main St, Mumbai",
    "contactNumber": "9876543210",
    "items": [{"product": "664c...", "quantity": 5}]
  }'
```
