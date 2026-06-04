# Mufar Commerce — Enterprise Distribution & Order Management Platform

> **Powered by Mufar Technologies** — Modern B2B & B2C distribution management for wholesalers, distributors, retailers, dealers, manufacturers, and local supply businesses.

---

## Architecture Overview

```
mufar-commerce/
├── mobile-app/        # React Native + Expo (Client App)
├── admin-panel/       # Next.js App Router (Admin Dashboard)
├── backend/           # Node.js + Express + MongoDB
├── shared/            # Shared TypeScript types, enums, validators
└── .github/           # CI/CD pipelines
```

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend (Web)** | Next.js 14, TypeScript, Tailwind CSS, ShadCN UI, TanStack Query |
| **Mobile** | React Native, Expo, NativeWind, Zustand, React Navigation |
| **Backend** | Node.js, Express.js, TypeScript |
| **Database** | MongoDB Atlas (Free Tier) via Mongoose |
| **Auth** | JWT + Refresh Tokens + bcrypt + Account Locking |
| **Storage** | Cloudinary (Free Tier) |
| **Email** | Gmail SMTP (Nodemailer) |
| **PDF** | PDFKit (Invoice Generation) |
| **CI/CD** | GitHub Actions |
| **Deploy (Web)** | Vercel (Free Tier) |
| **Deploy (API)** | Render (Free Tier) |

---

## Quick Start

### Prerequisites

- Node.js 20+
- MongoDB Atlas account (free tier)
- Cloudinary account (free tier)
- Gmail account (for SMTP)

### 1. Clone & Install

```bash
git clone https://github.com/mufar-technologies/mufar-commerce.git
cd mufar-commerce

# Install all dependencies
cd shared && npm install && npm run build && cd ..
cd backend && npm install && cd ..
cd admin-panel && npm install && cd ..
cd mobile-app && npm install && cd ..
```

### 2. Environment Variables

Copy `.env.example` to `.env` in each package:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your credentials:

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret for access tokens |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `SMTP_USER` | Gmail address for emails |
| `SMTP_PASS` | Gmail app password |

### 3. Run Development Servers

```bash
# Terminal 1 — Backend API
cd backend && npm run dev

# Terminal 2 — Admin Panel
cd admin-panel && npm run dev

# Terminal 3 — Mobile App
cd mobile-app && npm start
```

---

## User Roles

| Role | Permissions |
|------|------------|
| **Super Admin** | Full platform control, user management, settings |
| **Admin** | Business management, products, orders, clients |
| **Manager** | Order management, reporting |
| **Sales Executive** | Customer management |
| **Client** | Product ordering, order tracking, invoices |

### Client Registration

> **No self-signup.** Only Admins can create client accounts. Clients receive a temporary password and must change it on first login.

---

## Features

### Product Management
- Create, edit, delete, activate/deactivate products
- SKU, category, brand, pricing (with offer price), stock tracking
- Multiple product images via Cloudinary
- Low stock alerts

### Category Management
- Unlimited dynamic categories and subcategories
- Nested tree structure
- Example: Child Care → Newborn, Small, Medium, Large

### Order Management
- Full lifecycle: Pending → Accepted/On Hold/Rejected → Ready → Dispatched → Delivered
- Order number & invoice number auto-generation
- Status transition validation
- Timeline tracking

### Cart
- Persistent cart (survives browser refresh and app restart)
- Add, remove, update quantity
- Synced with backend

### Invoices
- Professional PDF invoices via PDFKit
- View, download, and print
- Company details, customer info, taxes, discounts

### WhatsApp Integration
- Share order details via WhatsApp deep link (no paid API required)

### Inventory
- Real-time stock tracking
- Automatic deduction on order acceptance
- Stock adjustment logs
- Low stock notifications

### Notifications
- In-app notifications for all order events
- Email notifications via Gmail SMTP

### Reporting
- Sales reports (daily, weekly, monthly, yearly)
- Inventory reports (low stock, out of stock)
- Customer reports (purchase history, top customers)
- Export to CSV

### Security
- bcrypt password hashing
- JWT access + refresh tokens
- Helmet security headers
- Rate limiting
- CORS protection
- Input validation (Zod)
- XSS & NoSQL injection protection
- Account locking after failed attempts
- Audit logging

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with email & password |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout (clear refresh token) |
| POST | `/api/auth/change-password` | Change password |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |
| GET | `/api/auth/me` | Get current user profile |

### Users (Admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List users (paginated) |
| POST | `/api/users` | Create user/client |
| GET | `/api/users/:id` | Get user details |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Deactivate user |
| PUT | `/api/users/:id/toggle-status` | Activate/deactivate |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List categories |
| GET | `/api/categories/tree` | Get category tree |
| POST | `/api/categories` | Create category |
| GET | `/api/categories/:id` | Get single category |
| PUT | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products (filtered, sorted, paginated) |
| POST | `/api/products` | Create product |
| GET | `/api/products/search` | Search products |
| GET | `/api/products/low-stock` | Low stock products |
| GET | `/api/products/:id` | Get product details |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |
| PUT | `/api/products/:id/toggle-status` | Activate/deactivate |
| POST | `/api/products/:id/images` | Upload images |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | List orders (filtered, paginated) |
| POST | `/api/orders` | Create order |
| GET | `/api/orders/my-orders` | Get current client's orders |
| GET | `/api/orders/:id` | Get order details |
| PUT | `/api/orders/:id/status` | Update order status |
| GET | `/api/orders/:id/invoice` | Download invoice PDF |
| GET | `/api/orders/:id/tracking` | Get order timeline |
| POST | `/api/orders/:id/cancel` | Cancel order |

### Cart
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart` | Get cart |
| POST | `/api/cart/items` | Add item to cart |
| PUT | `/api/cart/items/:productId` | Update quantity |
| DELETE | `/api/cart/items/:productId` | Remove item |
| DELETE | `/api/cart` | Clear cart |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/admin` | Admin dashboard stats |
| GET | `/api/dashboard/client` | Client dashboard |
| GET | `/api/dashboard/revenue-trend` | Revenue trend data |
| GET | `/api/dashboard/order-trend` | Order trend data |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/sales` | Sales report |
| GET | `/api/reports/inventory` | Inventory report |
| GET | `/api/reports/customers` | Customer report |
| GET | `/api/reports/export` | Export report (CSV) |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get notifications |
| PUT | `/api/notifications/:id/read` | Mark as read |
| PUT | `/api/notifications/read-all` | Mark all as read |
| GET | `/api/notifications/unread-count` | Unread count |

### Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings` | Get settings |
| PUT | `/api/settings` | Update settings |
| POST | `/api/settings/logo` | Upload logo |

### Inventory
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory/logs` | Inventory change logs |
| POST | `/api/inventory/adjust` | Adjust stock |

---

## Database Collections

| Collection | Description |
|------------|-------------|
| `users` | All users (admins, staff, clients) |
| `products` | Product catalog |
| `categories` | Dynamic nested categories |
| `orders` | Order documents with items & timeline |
| `orderitems` | Order line items |
| `carts` | Client shopping carts |
| `notifications` | In-app notifications |
| `inventorylogs` | Stock change audit trail |
| `activitylogs` | User activity audit trail |
| `settings` | Global platform settings (singleton) |

---

## Deployment

### Backend (Render Free Tier)

1. Push code to GitHub
2. Create a new **Web Service** on Render
3. Connect your repository
4. Set:
   - **Build Command**: `cd backend && npm install && npm run build`
   - **Start Command**: `cd backend && node dist/server.js`
   - **Plan**: Free
5. Add all environment variables from `.env.example`

### Admin Panel (Vercel Free Tier)

1. Push code to GitHub
2. Import `admin-panel` as a new Vercel project
3. Set:
   - **Framework**: Next.js
   - **Root Directory**: `admin-panel`
   - **Build Command**: `npm run build`
4. Add environment variables:
   - `NEXT_PUBLIC_API_URL=https://your-render-app.onrender.com/api`

### Mobile App (Expo + EAS)

```bash
cd mobile-app
npx eas build --platform all --profile preview
npx eas submit --platform all
```

---

## Security Features

- **bcrypt** password hashing (12 salt rounds)
- **JWT** access tokens (15min) + refresh tokens (7 days)
- **Account Locking** after 5 failed login attempts (30min lockout)
- **Helmet** security headers
- **Rate Limiting** — 100 requests/15min general, 5/15min for auth
- **CORS** — Whitelisted origins only
- **Input Validation** — Zod schemas on all endpoints
- **XSS Protection** — `xss-clean` middleware
- **NoSQL Injection** — `express-mongo-sanitize`
- **Audit Logs** — All user activities logged

---

## Mufar Ecosystem Integration

| Product | Purpose |
|---------|---------|
| **Mufar Forms** | Lead capture |
| **Mufar CRM** | Customer management |
| **Mufar Tasks** | Order follow-ups |
| **Mufar Billing** | Invoicing & payments |
| **Mufar AI** (Future) | Demand forecasting, inventory prediction, customer insights |

---

## License

UNLICENSED — Proprietary. All rights reserved. Mufar Technologies.

---

*Built with ❤️ by Mufar Technologies*
