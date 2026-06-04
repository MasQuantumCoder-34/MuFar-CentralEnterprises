# Mufar Commerce — Security Implementation

## Authentication

### Password Hashing
- Algorithm: bcrypt
- Salt Rounds: 12
- All passwords hashed via Mongoose pre-save hook
- Passwords never returned in API responses (sanitized)

### JWT Tokens
- **Access Token**: 15-minute expiry, signed with JWT_SECRET
- **Refresh Token**: 7-day expiry, signed with JWT_REFRESH_SECRET
- Token rotation on refresh (old refresh tokens invalidated)
- Stored in httpOnly cookies + Authorization header support

### Account Locking
- Max 5 failed login attempts
- 30-minute lockout duration
- Lockout tracked per-user in database
- Failed attempts reset on successful login

### Password Reset
- Time-limited reset token (1 hour)
- Token hashed before storage
- Email notification on reset

## API Security

### Headers (Helmet)
- Content-Security-Policy
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security

### Rate Limiting
- General: 100 requests per 15 minutes per IP
- Auth endpoints: 5 requests per 15 minutes per IP
- Configurable via RATE_LIMIT constants

### Input Validation
- All inputs validated with Zod schemas
- Whitelist validation approach
- Sanitized before database operations

### Protection Middleware
- `xss-clean`: Sanitizes user input from XSS
- `express-mongo-sanitize`: Prevents NoSQL injection ($ operators)
- `cors`: Whitelisted origins only
- `helmet`: Security headers

## Data Security

### Database
- MongoDB Atlas with IP whitelist
- TLS/SSL encryption in transit
- Connection string with credentials (never committed)

### Storage (Cloudinary)
- Secure uploads with API authentication
- Image transformation URLs with signed delivery

### Email (SMTP)
- Gmail SMTP with app-specific password
- No sensitive data in email bodies

## Audit Logging

All sensitive operations are logged:

| Action | Logged |
|--------|--------|
| Login/Logout | ✓ |
| User creation/deletion | ✓ |
| Product CRUD | ✓ |
| Order status changes | ✓ |
| Inventory adjustments | ✓ |
| Settings changes | ✓ |

Audit logs include: user, action, resource, IP address, user agent, and timestamp.

## RBAC (Role-Based Access Control)

| Resource | Super Admin | Admin | Manager | Sales Exec | Client |
|----------|:-----------:|:-----:|:-------:|:----------:|:------:|
| Users | CRUD | CRUD | — | — | — |
| Products | CRUD | CRUD | Read | Read | Read |
| Categories | CRUD | CRUD | Read | Read | Read |
| Orders | All | All | Manage | Read | Own |
| Clients | CRUD | CRUD | Read | CRUD | — |
| Reports | All | All | Sales | — | — |
| Settings | CRUD | CRUD | — | — | — |
| Inventory | All | All | Read | Read | — |

## Environment Variables (Never Commit)

```
backend/.env, admin-panel/.env.local
```

All secrets stored as environment variables in deployment platforms (Render, Vercel).
