# Aarvya Backend

Production-ready Fastify backend for the Aarvya storefront.

## Stack

- Node.js + Fastify
- PostgreSQL / NeonDB
- Raw parameterized SQL through `pg`
- JWT access and refresh tokens stored in 7-day HttpOnly cookies by default
- bcrypt password hashing
- Cloudinary image and video uploads
- Razorpay orders, verification, history, and webhook endpoint
- Zod validation
- Swagger UI at `/docs`

## Setup

1. Copy `.env.example` to `.env` and fill NeonDB, JWT, Razorpay, and Cloudinary values.
2. Install dependencies:

```bash
npm install
```

3. Apply schema and seed:

```bash
npm run db:schema
npm run db:seed
```

4. Start the API:

```bash
npm run dev
```

The API runs on `http://localhost:4000` by default. Configure the frontend with:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

## Routes

- Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/refresh-token`, `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/auth/change-password`, `/api/auth/me`
- Catalog: `/api/catalog/home`, `/api/catalog/products`, `/api/catalog/products/:id`, `/api/catalog/categories`, `/api/catalog/filters`, `/api/catalog/stock-notifications`
- Users: `/api/users/me`, `/api/users/me/addresses`, `/api/users/me/preferences`
- Orders/promos: `/api/cart/promos/validate`, `/api/orders`
- Payments: `/api/payments/orders`, `/api/payments/verify`, `/api/payments/history`, `/api/payments/webhook`
- Uploads: `/api/uploads/images`, `/api/uploads/videos`, `/api/uploads/:id`
- Admin-ready: `/api/admin/products`, `/api/admin/users`, `/api/admin/orders`

All responses use:

```json
{ "success": true, "message": "Success", "data": {} }
```

Errors use:

```json
{ "success": false, "message": "Error Message" }
```
