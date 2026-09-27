# PROJECT: Multi-Vendor Marketplace — Backend (Build From Scratch, Clean Architecture)

You are a senior backend engineer. Build a clean, production-grade, low-bug REST API. No placeholder logic — everything must work and be tested before moving to the next section.

## Stack (fixed)
- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- JWT auth (jsonwebtoken + bcryptjs)
- Multer (local disk uploads: product images + seller KYC documents)
- Zod for all input validation
- No payment gateway of any kind. No WhatsApp naming, branding, or links anywhere in the code, comments, or responses — this product does not reference WhatsApp at all.

## Roles
1. **Admin** — single seeded account. Approves seller KYC + seller status, manages categories, approves stock requests.
2. **Support** — seeded account(s), role=SUPPORT. Handles order coordination via support tickets, separate from Admin (different login, different permissions — cannot manage sellers/categories).
3. **Seller** — registers with name, email, password, whatsapp number → uploads KYC document (ID card/passport/license) → Admin approves KYC → Admin approves seller status → seller gets dashboard access. Can either list original products (if a "demo" platform-owned account) or clone products from the shared catalog to their own store.
4. **Buyer** — guest only, no account. Adds to cart, checks out with name/whatsapp/address, no login.

## Exact File Structure to Create
```
src/
├── app.ts                          # Express app, middleware, static /uploads serving
├── server.ts                       # Entry point
├── config/
│   ├── env.ts                      # Zod-validated env vars
│   └── prisma.ts                   # PrismaClient singleton
├── middlewares/
│   ├── auth.middleware.ts          # JWT verify + role guard (ADMIN, SUPPORT, SELLER)
│   ├── error.middleware.ts         # Centralized error handler
│   ├── upload.middleware.ts        # Multer config (images + KYC docs, 5MB, jpeg/png/webp)
│   └── validate.middleware.ts      # Zod validation middleware
├── utils/
│   ├── errors.ts                   # AppError classes (400/401/403/404/409)
│   └── jwt.ts                      # sign/verify helpers
├── validators/
│   ├── auth.schema.ts
│   ├── admin.schema.ts
│   ├── seller.schema.ts
│   ├── product.schema.ts
│   ├── cart.schema.ts
│   ├── order.schema.ts
│   └── support.schema.ts
├── services/
│   ├── auth.service.ts
│   ├── admin.service.ts
│   ├── category.service.ts
│   ├── product.service.ts          # includes catalog clone logic
│   ├── stock-request.service.ts
│   ├── cart.service.ts
│   ├── checkout.service.ts
│   ├── order.service.ts            # status transitions + balance hold/release
│   └── support.service.ts
├── controllers/                    # one per service above, thin — delegate only
├── routes/
│   ├── index.ts
│   ├── auth.routes.ts
│   ├── admin.routes.ts
│   ├── seller.routes.ts
│   ├── support.routes.ts
│   └── public.routes.ts
prisma/
├── schema.prisma
└── seed.ts                         # seeds: 1 admin, 1-2 support agents, 4-5 demo sellers with real-looking products, 6 categories
scripts/
└── test-e2e.ts
```

## Data Model (prisma/schema.prisma)

**Enums:** Role (ADMIN, SUPPORT, SELLER, BUYER) · SellerStatus (PENDING, APPROVED, BLOCKED) · KycStatus (NOT_SUBMITTED, PENDING, APPROVED, REJECTED) · OrderStatus (BOOKED, PROCESSING, SHIPPING, DELIVERED) · StockRequestStatus (PENDING, APPROVED, REJECTED) · TicketStatus (OPEN, IN_PROGRESS, RESOLVED) · SenderRole (SELLER, SUPPORT)

- **User**: id, name, email (unique, nullable), passwordHash (nullable), whatsapp, role, sellerStatus (nullable, seller-only), kycDocumentUrl (nullable), kycStatus (default NOT_SUBMITTED), availableStock (Int, default 0), balanceOnHold (Decimal, default 0), balanceAvailable (Decimal, default 0), isDemoAccount (Boolean, default false), timestamps
- **Category**: id, name, slug (unique)
- **Product**: id, title, description, price (Decimal), imageUrl, stock, isActive, sellerId, categoryId, clonedFromProductId (nullable, self-relation)
- **StockRequest**: id, sellerId, quantity, note (nullable), status
- **CartItem**: id, sessionId, productId, quantity, timestamps
- **Order**: id, productId, sellerId, buyerName, buyerWhatsApp, buyerAddress, quantity, totalPrice (Decimal), status (default BOOKED), statusUpdatedAt
- **SupportTicket**: id, sellerId, orderId (nullable), subject, status (default OPEN), timestamps
- **SupportMessage**: id, ticketId, senderRole, message (Text), createdAt

## Business Logic Rules

1. **Seller approval gate**: `sellerStatus` can only move to APPROVED if `kycStatus` is already APPROVED. Enforce server-side, not just UI.
2. **Stock cap**: sum of a seller's active product stock (including cloned products) can never exceed `availableStock`. Reject with 400 on breach, on both create and update.
3. **Catalog clone**: `GET /api/products/catalog` returns products only from `isDemoAccount=true` sellers. `POST /api/seller/products/clone` lets an approved seller copy title/description/image/category from a catalog product, set their own price, and assign stock within their cap. Sets `clonedFromProductId` for traceability.
4. **Cart & Checkout**: guest cart keyed by client-generated `sessionId` (no login). `POST /api/checkout` creates one Order per cart item, status BOOKED, adds `totalPrice` to that order's seller's `balanceOnHold`, clears matching cart items. No payment collection of any kind happens server-side — this only confirms the order exists.
5. **Order status control**: only ADMIN or SUPPORT can call the order status update endpoint (sellers cannot — the company handles delivery, not sellers). Sequential only: BOOKED→PROCESSING→SHIPPING→DELIVERED, no skips, no backward moves, no moves past DELIVERED.
6. **Balance release**: the moment an order's status is set to DELIVERED, atomically (Prisma transaction) subtract `totalPrice` from that seller's `balanceOnHold` and add it to `balanceAvailable`.
7. **Support tickets**: a seller opens a ticket (optionally tied to an order), both seller and support can post messages to it, support can change ticket status.

## Endpoints (full list)

**Auth:** `POST /api/auth/register` (seller) · `POST /api/auth/login` (admin/support/seller)

**Seller (JWT, APPROVED sellers unless noted):**
- `PATCH /api/seller/kyc` (any pending seller, sets kycStatus=PENDING)
- CRUD `/api/seller/products` (ownership + stock cap enforced)
- `POST /api/seller/products/clone`
- `POST /api/seller/stock-requests`, `GET /api/seller/stock-requests`
- `GET /api/seller/orders` (read-only for seller)
- `POST /api/upload` (product images)
- `POST /api/support/tickets`, `GET /api/support/tickets` (own only), `POST/GET /api/support/tickets/:id/messages`

**Admin (JWT, ADMIN only):**
- `GET/PATCH /api/admin/sellers`, `/api/admin/sellers/:id` (status)
- `PATCH /api/admin/sellers/:id/kyc` (approve/reject)
- CRUD `/api/admin/categories`
- `GET/PATCH /api/admin/stock-requests`, `/api/admin/stock-requests/:id`

**Support (JWT, SUPPORT or ADMIN):**
- `GET /api/support/tickets` (all), `POST /api/support/tickets/:id/messages`, `PATCH /api/support/tickets/:id` (status)
- `PATCH /api/orders/:id/status` (advance order lifecycle)

**Public (no auth):**
- `GET /api/categories`
- `GET /api/products` (filter `?category=slug`)
- `GET /api/products/:id`
- `GET /api/products/catalog`
- `GET /api/sellers/:id/products`
- `POST /api/cart`, `GET /api/cart/:sessionId`, `DELETE /api/cart/:sessionId/:productId`
- `POST /api/checkout`

## Hard Rules (bug-reduction focus)
- Every input validated server-side with Zod — never trust the client.
- Thin controllers, all logic in services.
- Meaningful HTTP status codes and specific error messages, never generic 500s.
- All money fields use Prisma `Decimal`, never floating point math.
- All multi-step DB writes (approvals, checkout, delivery balance release) wrapped in `prisma.$transaction`.
- CORS enabled for the frontend origin (I'll provide the URL).

## Seed Data (prisma/seed.ts)
- 1 Admin, 1 Support agent, 6 categories
- 4-5 demo seller accounts (`isDemoAccount: true`, pre-approved, KYC approved) each with 3-4 realistic products with real generated images

## Delivery Process
Build and verify **one section at a time** in this order: (1) schema+seed, (2) auth+KYC, (3) admin panel endpoints, (4) seller products+stock requests+catalog clone, (5) cart+checkout+balance logic, (6) order status+support tickets. After each section, run `npx tsc --noEmit` and relevant tests, show me the result, and wait for confirmation before continuing.

Final deliverable: `scripts/test-e2e.ts` covering every rule above, run `npx ts-node scripts/test-e2e.ts`, report full pass/fail results.

---

## Design Theme (for later frontend phase)
Navy blue + white as base colors, with vibrant/eye-catching accent colors (orange, yellow) — not dull or muted. Professional but attention-grabbing.

## Frontend Notes (for later phase)
- Cart + guest checkout (no login required for buyers)
- No WhatsApp branding/naming anywhere in the UI
- Seller dashboard shows: On Hold balance, Available balance, 4-step order tracker (Booked → Processing → Shipping → Delivered)
- Separate Customer Support page/login (not part of Admin panel) with ticket-based messaging
- Product catalog clone flow for new sellers (browse catalog → clone → set own price/stock)