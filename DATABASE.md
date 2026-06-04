# Mufar Commerce — Database Schema

## Platform: MongoDB Atlas (Free Tier — 512MB)

---

## Collection: `users`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| _id | ObjectId | auto | |
| storeName | String | No | Client's store/business name |
| ownerName | String | No | Client's owner name |
| name | String | No | Staff user's name |
| email | String | Yes | Unique, lowercase, indexed |
| mobile | String | Yes | |
| alternateMobile | String | No | |
| password | String | Yes | bcrypt hashed |
| role | String | Yes | Enum: super_admin, admin, manager, sales_executive, client |
| gstNumber | String | No | |
| address | String | No | |
| city | String | No | |
| state | String | No | |
| country | String | No | |
| pincode | String | No | |
| profileImage | String | No | Cloudinary URL |
| isActive | Boolean | Yes | Default: true |
| isLocked | Boolean | Yes | Default: false |
| mustChangePassword | Boolean | Yes | Default: true for new users |
| loginAttempts | Number | Yes | Default: 0 |
| lockUntil | Date | No | Lock expiration |
| lastLogin | Date | No | |
| refreshToken | String | No | Hashed refresh token |
| createdAt | Date | auto | |
| updatedAt | Date | auto | |

**Indexes:** `email` (unique), `role`, `isActive`

---

## Collection: `categories`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| _id | ObjectId | auto | |
| name | String | Yes | |
| slug | String | Yes | Auto-generated, unique |
| description | String | No | |
| parent | ObjectId | No | Self-reference to parent category |
| image | String | No | Cloudinary URL |
| isActive | Boolean | Yes | Default: true |
| sortOrder | Number | Yes | Default: 0 |
| createdAt | Date | auto | |
| updatedAt | Date | auto | |

**Indexes:** `slug` (unique), `parent`, `isActive`

---

## Collection: `products`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| _id | ObjectId | auto | |
| name | String | Yes | |
| sku | String | Yes | Unique, uppercase |
| category | ObjectId | Yes | Ref → categories |
| brand | String | No | |
| description | String | No | |
| price | Number | Yes | Min: 0 |
| offerPrice | Number | No | Must be < price |
| images | [String] | No | Cloudinary URLs |
| stockQuantity | Number | Yes | Min: 0, Default: 0 |
| lowStockThreshold | Number | Yes | Default: 10 |
| isActive | Boolean | Yes | Default: true |
| salesCount | Number | Yes | Default: 0 |
| createdAt | Date | auto | |
| updatedAt | Date | auto | |

**Indexes:** `sku` (unique), `name` (text), `category`, `isActive`, `brand`

---

## Collection: `orders`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| _id | ObjectId | auto | |
| orderNumber | String | Yes | Unique, format: ORD-YYMMDD-XXXX |
| invoiceNumber | String | Yes | Unique, format: INV-YYMMDD-XXXX |
| client | ObjectId | Yes | Ref → users |
| items | [Object] | Yes | Embedded subdocuments |
| deliveryAddress | String | Yes | |
| contactNumber | String | Yes | |
| notes | String | No | |
| status | String | Yes | Enum: 8 statuses |
| rejectionReason | String | No | Required if rejected |
| holdReason | String | No | Required if on_hold |
| expectedDeliveryDate | Date | No | Required if accepted |
| approvedAt | Date | No | |
| dispatchedAt | Date | No | |
| deliveredAt | Date | No | |
| cancelledAt | Date | No | |
| cancellationReason | String | No | |
| subtotal | Number | Yes | Sum of item totals |
| discount | Number | Yes | Default: 0 |
| tax | Number | Yes | 18% GST |
| total | Number | Yes | subtotal + tax - discount |
| timeline | [Object] | Yes | Status history |

### OrderItem Subdocument

| Field | Type | Notes |
|-------|------|-------|
| product | ObjectId | Ref → products |
| productName | String | Snapshot at order time |
| sku | String | Snapshot at order time |
| quantity | Number | |
| price | Number | Unit price |
| total | Number | quantity × price |

### TimelineEntry Subdocument

| Field | Type | Notes |
|-------|------|-------|
| status | String | Order status at that point |
| note | String | Optional note |
| timestamp | Date | |
| updatedBy | ObjectId | Ref → users |

**Indexes:** `orderNumber` (unique), `invoiceNumber` (unique), `client`, `status`, `createdAt`

---

## Collection: `carts`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| _id | ObjectId | auto | |
| client | ObjectId | Yes | Ref → users, unique |
| items | [Object] | No | Cart items |

### CartItem Subdocument

| Field | Type | Notes |
|-------|------|-------|
| product | ObjectId | Ref → products |
| productName | String | |
| sku | String | |
| price | Number | |
| offerPrice | Number | |
| quantity | Number | |
| image | String | |
| stockQuantity | Number | |

**Index:** `client` (unique)

---

## Collection: `notifications`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| _id | ObjectId | auto | |
| user | ObjectId | Yes | Ref → users |
| type | String | Yes | Enum: 7 notification types |
| title | String | Yes | |
| message | String | Yes | |
| isRead | Boolean | Yes | Default: false |
| referenceId | ObjectId | No | Related entity ID |
| referenceModel | String | No | Related collection name |
| createdAt | Date | auto | |

**Indexes:** `user`, `isRead`, `createdAt`

---

## Collection: `inventorylogs`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| _id | ObjectId | auto | |
| product | ObjectId | Yes | Ref → products |
| action | String | Yes | Enum: stock_in, stock_out, adjustment, order_deduction |
| quantity | Number | Yes | Positive for stock in, negative for out |
| previousStock | Number | Yes | |
| newStock | Number | Yes | |
| referenceId | ObjectId | No | Related order etc. |
| referenceModel | String | No | |
| performedBy | ObjectId | Yes | Ref → users |
| notes | String | No | |
| createdAt | Date | auto | |

**Indexes:** `product`, `createdAt`, `action`

---

## Collection: `activitylogs`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| _id | ObjectId | auto | |
| user | ObjectId | Yes | Ref → users |
| action | String | Yes | Enum: login, logout, create, update, delete, etc. |
| resource | String | Yes | Resource type (user, product, order, etc.) |
| resourceId | ObjectId | No | |
| details | String | No | JSON string with details |
| ipAddress | String | No | |
| userAgent | String | No | |
| createdAt | Date | auto | |

**Indexes:** `user`, `action`, `createdAt`, `resource`

---

## Collection: `settings`

Singleton collection (only one document expected).

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| _id | ObjectId | auto | |
| companyName | String | Yes | |
| logo | String | No | Cloudinary URL |
| contactNumber | String | Yes | |
| email | String | Yes | |
| address | String | Yes | |
| gstNumber | String | No | |
| invoicePrefix | String | Yes | Default: INV |
| lowStockThreshold | Number | Yes | Default: 10 |
| createdAt | Date | auto | |
| updatedAt | Date | auto | |

---

## Relationships Diagram

```
users ──┬──> orders (client)
         └──> carts (client)
         └──> notifications (user)
         └──> activitylogs (user)

products ──┬──> orders.items (product)
           └──> carts.items (product)
           └──> inventorylogs (product)
           └──> categories (category)

categories ──> categories (parent) [self-referencing]
```
