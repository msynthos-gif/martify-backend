# 🧠 MARTIFY COLLECTION — FULL SYSTEM ARCHITECTURE & AGENT KNOWLEDGE BASE

> **NOTICE FOR AI AGENTS (ChatGPT, Claude, Cursor, Custom GPTs, etc.):**
> This file is the **Single Source of Truth** for the entire `mves` (Martify Collection Multi-Vendor Marketplace) project.
> When the user asks you to write a prompt for fixing a bug or adding a feature, **consult this document first**.
> Understand every database model, backend route, service function, frontend page, component, and business invariant before generating the prompt.

---

## 📌 TABLE OF CONTENTS
1. [Agent System Prompt & Instructions](#1-agent-system-prompt--instructions)
2. [Project Overview & Business Model](#2-project-overview--business-model)
3. [Tech Stack & Architecture](#3-tech-stack--architecture)
4. [Critical Business Invariants (Hard Rules)](#4-critical-business-invariants-hard-rules)
5. [Database Models & Prisma Schema (Deep Dive)](#5-database-models--prisma-schema-deep-dive)
6. [Backend: Complete Directory & File-by-File Logic](#6-backend-complete-directory--file-by-file-logic)
7. [Frontend: Complete Directory & File-by-File Logic](#7-frontend-complete-directory--file-by-file-logic)
8. [Page-by-Page & Section-by-Section Breakdown](#8-page-by-page--section-by-section-breakdown)
9. [End-to-End Data & Business Lifecycles](#9-end-to-end-data--business-lifecycles)
10. [Environment Variables & Seed Credentials](#10-environment-variables--seed-credentials)
11. [Prompt Generation Guide for the Agent](#11-prompt-generation-guide-for-the-agent)

---

## 1. AGENT SYSTEM PROMPT & INSTRUCTIONS

```text
YOU ARE AN EXPERT SOFTWARE ARCHITECT AND TECH LEAD FOR THE "MARTIFY COLLECTION" PROJECT.
YOUR ROLE:
1. Deeply understand every component, file, business rule, and data flow of this multi-vendor marketplace.
2. When the user reports an issue or requests a change, diagnose the exact files, functions, lines, and database interactions involved.
3. Formulate an exact, detailed, and unambiguous prompt for Antigravity (the coding assistant) that specifies:
   - Exactly which files to edit (frontend, backend, schema, types).
   - What logic needs to change.
   - Edge cases to guard against.
   - Any Prisma transaction or Zod validation required.
   - How to ensure no business invariants (Stock Cap, KYC Gate, Sequential Orders, Balance Hold/Release) are broken.
```

---

## 2. PROJECT OVERVIEW & BUSINESS MODEL

- **Brand Name**: Martify Collection
- **Domain**: Multi-Vendor Dropshipping & B2B/B2C Marketplace
- **Core Concept**:
  - The platform operates an official catalog store (`isDemoAccount: true`, named `Martify Collection Official Store`) containing platform-curated, authentic products.
  - Independent **Sellers** register, upload identity documents (KYC: CNIC / Passport / License), get reviewed and approved by an **Admin**, request wholesale inventory quota (**Stock Cap**), and either list their own products or **clone** items from the official catalog into their custom store with their own markup prices.
  - **Buyers** visit as guests (no registration or login required). They can search, filter by category, browse seller storefronts, add items to a guest cart (persisted via `sessionId` in `localStorage`), and checkout with their contact & delivery address.
  - **No external payment gateway** is connected. Checkout books an order (Cash on Delivery / Offline Coordination).
  - The company central fulfillment team processes deliveries. **Support Agents** advance orders sequentially (`BOOKED` ➔ `PROCESSING` ➔ `SHIPPING` ➔ `DELIVERED`).
  - When an order is booked, the seller's earnings are placed in `balanceOnHold`. The moment the order is marked `DELIVERED`, funds atomically transfer from `balanceOnHold` into `balanceAvailable`.
  - Sellers and Support Agents communicate directly through an integrated, continuous, live messaging system styled like a modern chat interface with real-time audio chimes and read receipts.

---

## 3. TECH STACK & ARCHITECTURE

### 3.1 Backend (`/src`)
- **Runtime**: Node.js with TypeScript (`tsx` for dev watch, `tsc` for production build).
- **Framework**: Express.js (REST API, modular routers, thin controllers, rich service layer).
- **Database**: PostgreSQL with Prisma ORM (`@prisma/client`, `prisma`).
- **Authentication**: JWT (`jsonwebtoken`) + Password Hashing (`bcryptjs`).
- **File Uploads**: `multer` with local disk storage in `/uploads` (served statically at `/uploads`).
- **Input Validation**: `zod` schemas executed on body, query, and params via centralized middleware.
- **Precision Math**: Prisma `Decimal` used for all monetary values (`balanceOnHold`, `balanceAvailable`, `price`, `totalPrice`). Zero floating-point rounding bugs.

### 3.2 Frontend (`/frontend`)
- **Framework**: React 19 (SPA) with TypeScript and Vite.
- **Routing**: `react-router-dom` v7 with declarative routes and instant global scroll-to-top on navigation.
- **Styling**: Tailwind CSS v4 with custom navy & white brand palette, orange/yellow accents, and responsive breakpoints (Mobile 375px, Tablet 768px, Desktop 1280px).
- **Icons**: `lucide-react`.
- **HTTP Client**: `axios` instance (`apiClient`) with request token injection, response error normalization, and custom event dispatching (`auth:unauthorized`).
- **State Management**: React Context (`AuthContext` for auth & token lifecycle; `CartContext` for guest cart state & live counts).

---

## 4. CRITICAL BUSINESS INVARIANTS (HARD RULES)

These rules are enforced server-side with Prisma transactions and must **NEVER** be bypassed:

1. **Rule 1: Seller Approval Gate**
   - A seller's `sellerStatus` can **only** be changed to `APPROVED` if their `kycStatus` is already `APPROVED`.
   - Enforced in `src/services/admin.service.ts` (`updateSellerStatus`).

2. **Rule 2: Stock Cap Constraint**
   - The total active stock across all of a seller's products (`sum(stock)` where `isActive = true`) can **never** exceed the seller's `availableStock`.
   - Enforced in `src/services/product.service.ts` on product creation, updates, and single/batch catalog cloning. If breached, the server throws a `400 Bad Request`.

3. **Rule 3: Catalog Cloning Rule**
   - The public catalog (`GET /api/products/catalog`) only serves products belonging to `isDemoAccount: true` sellers.
   - Approved sellers can clone products via `POST /api/seller/products/clone` or `POST /api/seller/products/batch-clone`.
   - Cloned products duplicate title, description, category, and images, but link to the original via `clonedFromProductId` and allow custom pricing and stock (checked against the seller's stock cap).

4. **Rule 4: Guest Cart & Checkout Isolation**
   - Guest cart is keyed strictly by a client-generated UUID `sessionId` stored in `localStorage`. No login required.
   - `POST /api/checkout` validates stock, decrements inventory, creates one `Order` per cart item with status `BOOKED`, credits the seller's `balanceOnHold` with the item total price, and clears the cart items. Everything runs inside an atomic `prisma.$transaction`.

5. **Rule 5: Strict Sequential Order Lifecycle**
   - Order status transitions are one-way and strictly sequential:
     $$\text{BOOKED} \longrightarrow \text{PROCESSING} \longrightarrow \text{SHIPPING} \longrightarrow \text{DELIVERED}$$
   - No skips, backward transitions, or transitions beyond `DELIVERED` are permitted.
   - Only `ADMIN` or `SUPPORT` roles can change order status. Sellers have read-only access to their orders.

6. **Rule 6: Atomic Balance Release on DELIVERED**
   - In `src/services/order.service.ts`, when status becomes `DELIVERED`, an atomic transaction executes:
     - `seller.balanceOnHold = balanceOnHold - order.totalPrice`
     - `seller.balanceAvailable = balanceAvailable + order.totalPrice`

7. **Rule 7: Single Continuous Support Thread**
   - Each seller has a single, persistent `SupportTicket` thread (subject: "Support Conversation").
   - Seller messages have `senderRole: SELLER`. Support/Admin messages have `senderRole: SUPPORT`.
   - Supports unread message counters, read timestamps (`isRead`, `readAt`), auto-refresh polling (3.5s), and browser Web Audio chime on new incoming messages.

8. **Rule 8: High-Resolution Real Photography (No Broken SVGs)**
   - The platform uses curated Unsplash photography. `getProductImageUrl` in `src/utils/formatters.ts` guards against blank, invalid, or raw SVG placeholders, falling back to rich category-specific photography.

---

## 5. DATABASE MODELS & PRISMA SCHEMA (DEEP DIVE)

**File**: `prisma/schema.prisma`

### 5.1 Enums
- `Role`: `ADMIN`, `SUPPORT`, `SELLER`, `BUYER`
- `SellerStatus`: `PENDING`, `APPROVED`, `BLOCKED`
- `KycStatus`: `NOT_SUBMITTED`, `PENDING`, `APPROVED`, `REJECTED`
- `OrderStatus`: `BOOKED`, `PROCESSING`, `SHIPPING`, `DELIVERED`
- `StockRequestStatus`: `PENDING`, `APPROVED`, `REJECTED`
- `TicketStatus`: `OPEN`, `IN_PROGRESS`, `RESOLVED`
- `SenderRole`: `SELLER`, `SUPPORT`

### 5.2 Model Details

#### `User` (Table: `users`)
- `id` (String, UUID, PK)
- `name` (String)
- `email` (String?, Unique)
- `passwordHash` (String?)
- `phone` (String)
- `role` (Role, Default: `SELLER`)
- `sellerStatus` (SellerStatus?, Nullable for non-sellers)
- `kycDocumentUrl` (String?, stores uploaded file path or JSON string of multiple files)
- `kycStatus` (KycStatus, Default: `NOT_SUBMITTED`)
- `availableStock` (Int, Default: `0` — quota allocated to seller)
- `balanceOnHold` (Decimal(10, 2), Default: `0.00`)
- `balanceAvailable` (Decimal(10, 2), Default: `0.00`)
- `isDemoAccount` (Boolean, Default: `false` — `true` marks platform official store)
- `storeName` (String?, Custom storefront display name)
- `storeDescription` (Text?, Store bio/description)
- `storeImageUrl` (String?, Custom storefront logo/avatar)
- `createdAt`, `updatedAt` (DateTime)
- *Relations*: `products` (Product[]), `stockRequests` (StockRequest[]), `orders` (Order[]), `ticket` (SupportTicket?)

#### `Category` (Table: `categories`)
- `id` (String, UUID, PK)
- `name` (String, e.g., "Electronics")
- `slug` (String, Unique, e.g., "electronics")
- `products` (Product[])
- `createdAt`, `updatedAt` (DateTime)

#### `Product` (Table: `products`)
- `id` (String, UUID, PK)
- `title` (String)
- `description` (Text)
- `price` (Decimal(10, 2))
- `imageUrl` (String — Primary thumbnail URL)
- `stock` (Int, Default: `0`)
- `isActive` (Boolean, Default: `true`)
- `sellerId` (String, FK ➔ `User.id`, `onDelete: Cascade`)
- `categoryId` (String, FK ➔ `Category.id`, `onDelete: Restrict`)
- `clonedFromProductId` (String?, FK ➔ `Product.id`, `onDelete: SetNull`)
- `attributes` (Json?, Variant options like `{"Color": ["Black", "Silver"], "Size": ["M", "L"]}`)
- *Relations*: `images` (ProductImage[]), `cartItems` (CartItem[]), `orders` (Order[]), `clonedFromProduct` (Product?), `clonedProducts` (Product[])

#### `ProductImage` (Table: `product_images`)
- `id` (String, UUID, PK)
- `url` (String)
- `sortOrder` (Int, Default: `0`)
- `productId` (String, FK ➔ `Product.id`, `onDelete: Cascade`)
- `createdAt` (DateTime)

#### `StockRequest` (Table: `stock_requests`)
- `id` (String, UUID, PK)
- `sellerId` (String, FK ➔ `User.id`, `onDelete: Cascade`)
- `quantity` (Int)
- `note` (String?)
- `status` (StockRequestStatus, Default: `PENDING`)
- `createdAt`, `updatedAt` (DateTime)

#### `CartItem` (Table: `cart_items`)
- `id` (String, UUID, PK)
- `sessionId` (String — Guest session UUID)
- `productId` (String, FK ➔ `Product.id`, `onDelete: Cascade`)
- `quantity` (Int)
- `selectedAttributes` (Json?, Selected options e.g. `{"Color": "Black", "Size": "M"}`)
- `createdAt`, `updatedAt` (DateTime)
- *Unique Constraint*: `@@unique([sessionId, productId])`

#### `Order` (Table: `orders`)
- `id` (String, UUID, PK)
- `productId` (String, FK ➔ `Product.id`, `onDelete: Restrict`)
- `sellerId` (String, FK ➔ `User.id`, `onDelete: Restrict`)
- `buyerName` (String)
- `buyerEmail` (String?)
- `buyerPhone` (String)
- `buyerAddress` (String — Full formatted shipping line)
- `country`, `company`, `address`, `apartment`, `city`, `state`, `zipCode` (Detailed address fields)
- `quantity` (Int)
- `totalPrice` (Decimal(10, 2))
- `selectedAttributes` (Json?)
- `status` (OrderStatus, Default: `BOOKED`)
- `statusUpdatedAt` (DateTime)
- `createdAt`, `updatedAt` (DateTime)
- *Relations*: `product` (Product), `seller` (User), `tickets` (SupportTicket[])

#### `SupportTicket` (Table: `support_tickets`)
- `id` (String, UUID, PK)
- `sellerId` (String, Unique, FK ➔ `User.id`, `onDelete: Cascade`)
- `orderId` (String?, FK ➔ `Order.id`, `onDelete: SetNull`)
- `subject` (String, Default: "Support Conversation")
- `status` (TicketStatus, Default: `OPEN`)
- `messages` (SupportMessage[])
- `createdAt`, `updatedAt` (DateTime)

#### `SupportMessage` (Table: `support_messages`)
- `id` (String, UUID, PK)
- `ticketId` (String, FK ➔ `SupportTicket.id`, `onDelete: Cascade`)
- `senderRole` (SenderRole: `SELLER` or `SUPPORT`)
- `message` (Text)
- `isRead` (Boolean, Default: `false`)
- `readAt` (DateTime?)
- `createdAt` (DateTime)

---

## 6. BACKEND: COMPLETE DIRECTORY & FILE-BY-FILE LOGIC

```text
src/
├── app.ts                  # Express application setup, middlewares, static uploads route
├── server.ts               # Server startup, listens on PORT (default: 5000)
├── config/
│   ├── env.ts              # Zod schema validation of process.env (PORT, DATABASE_URL, JWT_SECRET, CORS_ORIGIN)
│   └── prisma.ts           # PrismaClient singleton instance
├── middlewares/
│   ├── auth.middleware.ts  # authenticate (JWT verify), requireRole(...), requireApprovedSeller
│   ├── error.middleware.ts # Central error handler, formats AppError & Zod errors into standard JSON
│   ├── upload.middleware.ts# Multer storage configuration for /uploads (Images & KYC docs)
│   └── validate.middleware.ts # Validates req.body, req.query, or req.params against Zod schemas
├── utils/
│   ├── errors.ts           # Custom AppError classes: BadRequestError (400), UnauthorizedError (401),
│   │                       # ForbiddenError (403), NotFoundError (404), ConflictError (409)
│   └── jwt.ts              # signToken, verifyToken
├── validators/
│   ├── admin.schema.ts     # Zod validation for seller status/KYC updates, categories, stock requests
│   ├── auth.schema.ts      # Zod validation for login & seller registration
│   ├── cart.schema.ts      # Zod validation for addToCart, getCart, removeFromCart
│   ├── order.schema.ts     # Zod validation for checkout form & order status transitions
│   ├── product.schema.ts   # Zod validation for product CRUD, cloning, batch cloning, and queries
│   ├── seller.schema.ts    # Zod validation for KYC submission, stock requests, store profile
│   └── support.schema.ts   # Zod validation for support tickets, messages, status
├── services/
│   ├── admin.service.ts    # Admin seller management, KYC approval, seller status gate
│   ├── auth.service.ts     # Registration, login with password verification, JWT generation
│   ├── cart.service.ts     # Session cart management, inventory verification, subtotal calculation
│   ├── category.service.ts # Category CRUD with slug generation and product counting
│   ├── checkout.service.ts # Atomic checkout transaction: inventory decrement, order creation, balance hold
│   ├── order.service.ts    # Sequential order progression, atomic balance release to balanceAvailable
│   ├── product.service.ts  # Product CRUD, stock cap validation, catalog cloning, multi-images, search
│   ├── seller.service.ts   # Seller KYC submission, profile fetching, store customization
│   ├── stock-request.service.ts # Stock request creation, admin approval with atomic quota increment
│   └── support.service.ts  # Continuous chat thread, message persistence, unread counter, read receipts
├── controllers/            # Thin controllers delegating directly to services
│   ├── admin.controller.ts
│   ├── auth.controller.ts
│   ├── cart.controller.ts
│   ├── category.controller.ts
│   ├── checkout.controller.ts
│   ├── order.controller.ts
│   ├── product.controller.ts
│   ├── seller.controller.ts
│   ├── stock-request.controller.ts
│   └── support.controller.ts
└── routes/
    ├── index.ts            # Root API router mounting /auth, /seller, /admin, /orders, /support, /public
    ├── auth.routes.ts      # POST /register, POST /login
    ├── public.routes.ts    # Categories, products, catalog, cart, checkout, search
    ├── seller.routes.ts    # Seller profile, KYC, stock requests, product CRUD, clone, orders
    ├── admin.routes.ts     # Admin seller oversight, KYC decisions, categories, stock requests
    ├── order.routes.ts     # Order viewing and status progression (Admin/Support only)
    └── support.routes.ts   # Continuous conversation and ticket management
```

### Key API Endpoints Summary

| Method | Endpoint | Auth / Role | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Seller registration (name, email, password, phone) |
| `POST` | `/api/auth/login` | Public | Multi-role login (`ADMIN`, `SUPPORT`, `SELLER`) |
| `GET` | `/api/categories` | Public | List all categories with product counts |
| `GET` | `/api/products` | Public | List active products (supports `?category=slug`, `?sort=`, `?page=`) |
| `GET` | `/api/products/:id` | Public | Get product details with gallery, attributes, seller info |
| `GET` | `/api/products/catalog` | Public | Official company catalog (`isDemoAccount=true`) for cloning |
| `GET` | `/api/sellers/:id/products` | Public | Public storefront for a specific seller |
| `GET` | `/api/search?q=...` | Public | Global search returning matched products and stores |
| `POST` | `/api/cart` | Public (Session) | Add product to cart with selected attributes |
| `GET` | `/api/cart/:sessionId` | Public (Session) | Get cart items, subtotal, and stock availability |
| `DELETE`| `/api/cart/:sessionId/:productId` | Public (Session) | Remove item from cart |
| `POST` | `/api/checkout` | Public (Session) | Book order, decrement stock, credit `balanceOnHold` |
| `GET` | `/api/seller/me` | Seller | Get seller profile, stock cap, and balance summary |
| `PATCH`| `/api/seller/kyc` | Seller | Submit verification document URL(s) (sets `PENDING`) |
| `PATCH`| `/api/seller/profile` | Seller | Update store name, bio, and logo image |
| `POST` | `/api/seller/products` | Approved Seller | Create new product (checked against Stock Cap) |
| `POST` | `/api/seller/products/clone` | Approved Seller | Clone product from official catalog with custom price/stock |
| `POST` | `/api/seller/products/batch-clone` | Approved Seller | Bulk clone multiple products from official catalog |
| `POST` | `/api/seller/stock-requests` | Approved Seller | Request additional stock quota from Admin |
| `GET` | `/api/seller/orders` | Approved Seller | View orders placed for seller's products (read-only) |
| `GET` | `/api/support/conversation` | Seller | Get continuous support chat thread & mark incoming as read |
| `POST` | `/api/support/conversation/messages` | Seller | Send message to Support team |
| `GET` | `/api/admin/sellers` | Admin | View all sellers, their verification status, and metrics |
| `PATCH`| `/api/admin/sellers/:id/kyc` | Admin | Approve or reject seller KYC |
| `PATCH`| `/api/admin/sellers/:id` | Admin | Update seller status (`APPROVED` requires approved KYC) |
| `CRUD` | `/api/admin/categories` | Admin | Create, edit, and delete categories |
| `PATCH`| `/api/admin/stock-requests/:id` | Admin | Approve/reject quota request (approval increments stock) |
| `GET` | `/api/orders` | Admin / Support | View all platform orders |
| `PATCH`| `/api/orders/:id/status` | Admin / Support | Advance order lifecycle (triggers balance release on `DELIVERED`) |
| `GET` | `/api/support/tickets` | Admin / Support | View all seller support conversations with unread counters |
| `POST` | `/api/support/tickets/:id/messages` | Admin / Support | Send message to seller |

---

## 7. FRONTEND: COMPLETE DIRECTORY & FILE-BY-FILE LOGIC

```text
frontend/src/
├── main.tsx                # React DOM entry point
├── App.tsx                 # App layout, AuthProvider, CartProvider, BrowserRouter, Routes
├── index.css               # Tailwind CSS v4 directives, custom font imports, custom color variables
├── App.css                 # Supplemental layout styling
├── types/
│   └── index.ts            # Complete TypeScript interfaces (User, Product, Order, SupportTicket, etc.)
├── utils/
│   └── formatters.ts       # getProductImageUrl, getMediaUrl, parseDocumentUrls, formatPrice, deduplicateProducts
├── context/
│   ├── AuthContext.tsx     # Provides user, role, token, login, logout, updateUser, multi-token sync
│   └── CartContext.tsx     # Provides sessionId (UUID in localStorage), items, itemCount, subtotal, addToCart, clearCartState
├── api/
│   ├── client.ts           # Axios instance with baseURL, request token injection, response error normalization
│   ├── auth.api.ts         # login, registerSeller
│   ├── public.api.ts       # getCategories, getProducts, getProductById, getCatalogProducts, getSellerStorefront,
│   │                       # search, addToCart, getCart, removeFromCart, checkout
│   ├── seller.api.ts       # getProfile, updateStoreProfile, uploadStoreImage, submitKyc, uploadKycDocument,
│   │                       # getProducts, createProduct, updateProduct, deleteProduct, cloneProduct, batchCloneProducts,
│   │                       # getStockRequests, createStockRequest, getOrders, uploadProductImage
│   ├── admin.api.ts        # getSellers, getSellerById, updateSellerKyc, updateSellerStatus,
│   │                       # getCategories, createCategory, updateCategory, deleteCategory,
│   │                       # getStockRequests, updateStockRequestStatus
│   └── support.api.ts      # getSellerConversation, sendSellerMessage, getTickets, getTicketById,
│                           # addMessage, updateTicketStatus, getOrders, updateOrderStatus
├── components/
│   ├── common/
│   │   ├── Header.tsx      # Sticky navbar: Announcement bar, Logo, Global search input, Categories dropdown,
│   │   │                   # Cart drawer icon with badge, Auth buttons / User dropdown
│   │   ├── Footer.tsx      # Comprehensive footer: Store directory, category links, trust badges, copyright
│   │   ├── Badge.tsx       # Standardized status badges (PENDING, APPROVED, REJECTED, BOOKED, DELIVERED, etc.)
│   │   ├── LoadingSpinner.tsx # Reusable animated loading state
│   │   └── ErrorState.tsx  # Standardized error box with retry button
│   ├── product/
│   │   ├── ProductCard.tsx # Product tile: high-res image, category tag, title, price, compare price, Add to Cart
│   │   └── ProductGrid.tsx # Responsive grid container for product cards
│   └── chat/
│       └── WhatsAppChat.tsx# Modern messaging interface: Chat bubbles, emoji picker, attachment placeholders,
│                           # date headers, timestamps, audio chimes, order context cards
└── pages/
    ├── HomePage.tsx        # Hero banner, category grid, live search with instant dropdown, featured products
    ├── SearchPage.tsx      # Search results page: Split sections for matching stores and products
    ├── ProductListingPage.tsx # Category / full catalog browsing with sort (price, newest) and filters
    ├── ProductDetailPage.tsx # Image gallery slider, attribute selectors (Color/Size), stock indicator, Add to Cart
    ├── SellerStorefrontPage.tsx # Seller public store: Store banner, bio, logo, and active inventory
    ├── CartPage.tsx        # Full cart review: Item list, quantity edit, item removal, order summary, checkout button
    ├── CheckoutPage.tsx    # Shopify-style 2-column checkout: Contact & shipping inputs, order summary, confirmation modal
    ├── SellerRegisterPage.tsx # Seller onboarding form with instant KYC upload and pending status instructions
    ├── SellerLoginPage.tsx # Seller login screen
    ├── SellerDashboardPage.tsx # 3-tab Seller command center: My Products (CRUD & Catalog Clone Modal), My Orders, Live Support Chat
    ├── AdminLoginPage.tsx  # Dedicated Admin login screen
    ├── AdminDashboardPage.tsx # Admin control panel: Seller management, KYC document viewer/decision, Category CRUD
    ├── SupportLoginPage.tsx# Support agent login screen
    └── SupportDashboardPage.tsx # Support console: Real-time seller conversations list, active chat, Order status progression
```

---

## 8. PAGE-BY-PAGE & SECTION-BY-SECTION BREAKDOWN

### 8.1 Header (`src/components/common/Header.tsx`)
- **Top Promo Bar**: Navy blue background (`#020617`), social icons, utility link ("Support").
- **Main Nav**:
  - Logo: "MARTIFY" in bold navy lettering with accent icon.
  - Search Bar: Real-time search input with live query submission navigating to `/search?q=...`.
  - Links: "Home", "Products", "Categories" dropdown (populated dynamically via `GET /api/categories`), "Become a Seller".
  - Right Utilities:
    - User Account Dropdown: Displays role-specific dashboard link or "Sign In" / "Register".
    - Cart Button: Displays live item count from `CartContext`.

### 8.2 HomePage (`src/pages/HomePage.tsx`)
- **Hero Banner**: High-impact navy gradient with prominent CTA to browse collections and become a vendor.
- **Instant Search Box**: Floating search input with debounced 200ms live lookup displaying instant suggestions for both stores and products.
- **Category Showcase**: Visual grid of all 6 categories with real background photography.
- **Trust Badges Row**: "Guaranteed Authentic", "Fast Secure Delivery", "Dedicated Support", "Verified Vendors".
- **Featured Products**: Carousel and grid of trending products with hover zoom and quick add-to-cart.

### 8.3 Product Listing Page (`src/pages/ProductListingPage.tsx`)
- Handles both `/products` and `/categories/:slug`.
- Displays dynamic breadcrumbs, category titles, total product count, and sorting options (Newest, Price: Low to High, Price: High to Low).
- Integrates `ProductGrid` and `ProductCard` with automatic product deduplication.

### 8.4 Product Detail Page (`src/pages/ProductDetailPage.tsx`)
- **Left Column**: Multi-image gallery with large preview and clickable thumbnails.
- **Right Column**:
  - Product title, category badge, and seller store link.
  - Price display with strikethrough comparison price.
  - Dynamic Attribute Variant Selectors (e.g., Color pills, Size buttons) populated from `product.attributes`.
  - Quantity counter (`-` / `+`) bounded by `product.stock`.
  - "Add to Cart" button with instant feedback and stock limit validation.
- **Bottom Section**: Tabbed product description, technical specifications, and shipping/delivery terms, plus "Related Products" recommendation row.

### 8.5 Seller Storefront Page (`src/pages/SellerStorefrontPage.tsx`)
- Route: `/sellers/:id`.
- Custom branded banner, store logo, verified badge, store bio/description, and direct seller inventory grid.

### 8.6 Cart Page (`src/pages/CartPage.tsx`)
- Route: `/cart`.
- Lists all cart items for the current `sessionId`.
- Displays item thumbnail, title, selected variant attributes, unit price, quantity increment/decrement, and remove button.
- Right Column: Order summary with subtotal, estimated shipping calculation, and "Proceed to Checkout" button.

### 8.7 Checkout Page (`src/pages/CheckoutPage.tsx`)
- Route: `/checkout`.
- Clean 2-column e-commerce layout:
  - Left: Customer contact information (email, marketing opt-in) and Shipping Address (First Name, Last Name, Address, Apartment, City, State, ZIP, Phone).
  - Right: Cart item breakdown with mini thumbnails, subtotal, shipping cost, and grand total.
- Submitting triggers `publicApi.checkout`.
- On success: Cart is cleared, and an "Order Successfully Booked" confirmation card renders with the generated order IDs and delivery notice.

### 8.8 Seller Dashboard (`src/pages/SellerDashboardPage.tsx`)
- Route: `/seller/dashboard` (Protected: `SELLER` role).
- **Top Header**: Store profile info, KYC verification banner (showing `PENDING`, `APPROVED`, or `REJECTED`), and "Edit Store Profile" modal trigger.
- **Metric Cards**:
  - Available Stock Quota (`availableStock` vs used stock).
  - Balance On Hold (`balanceOnHold`).
  - Available Balance (`balanceAvailable`).
- **Tabs**:
  1. **My Products**:
     - Product table with status toggles, stock, price, and actions (Edit, Delete).
     - **Role-Based Product Action**:
       - **Official Store (`isDemoAccount: true`)**: Sees the dedicated **"Add Product"** button which opens a full product creation modal with direct device multi-image upload (1 to 5 images), title, description, price, stock, category, and variant attributes. The Official Store is the source of the catalog and does *not* see "Add from Official Store".
       - **Regular Sellers (`isDemoAccount: false`)**: Sees **only** the single **"Add from Official Store"** button which opens the official catalog modal for single or batch-cloning. Freeform product creation from scratch is restricted to the Official Store.
  2. **My Orders**:
     - Lists all customer orders for this seller's products.
     - Displays 4-step visual tracker (`BOOKED` ➔ `PROCESSING` ➔ `SHIPPING` ➔ `DELIVERED`).
  3. **Support Chat**:
     - Embeds `WhatsAppChat` connected to the seller's continuous support thread.

### 8.9 Admin Dashboard (`src/pages/AdminDashboardPage.tsx`)
- Route: `/admin` (Protected: `ADMIN` role).
- **Tabs**:
  1. **Sellers**: Table of all registered vendors with metrics, stock quota, and status controls (Approve / Block).
  2. **KYC Review**: Displays uploaded identity documents (supports multi-image previews and downloads). Admin can click "Approve" or "Reject".
  3. **Categories**: Create new categories (with auto-slug generation), edit names, or delete existing categories.
  4. **Stock Requests**: Review seller stock quota requests with instant "Approve" (increments quota) or "Reject".

### 8.10 Support Dashboard (`src/pages/SupportDashboardPage.tsx`)
- Route: `/support` (Protected: `SUPPORT` or `ADMIN` role).
- **Tabs**:
  1. **Support Tickets / Messages**:
     - Left Sidebar: List of all seller conversations with search, last message snippet, timestamp, and unread badge.
     - Right Panel: Full `WhatsAppChat` thread with the selected seller. Supports instant message sending and live 3.5s background polling.
  2. **Order Lifecycle Control**:
     - Table of all platform orders with search.
     - Support agents can click "Advance Status" to transition orders through `BOOKED` ➔ `PROCESSING` ➔ `SHIPPING` ➔ `DELIVERED`.
     - Advancing to `DELIVERED` automatically releases the funds to the seller's available balance.

---

## 9. END-TO-END DATA & BUSINESS LIFECYCLES

### 9.1 Seller Onboarding & KYC Flow
```text
1. User registers at /seller/register (Name, Email, Password, Phone, KYC file).
2. Backend creates User with role=SELLER, sellerStatus=PENDING, kycStatus=PENDING.
3. Admin logs into /admin -> Navigates to "KYC Review" tab.
4. Admin reviews document -> clicks "Approve KYC" (kycStatus becomes APPROVED).
5. Admin navigates to "Sellers" tab -> clicks "Approve Seller" (sellerStatus becomes APPROVED).
   * Note: Backend rejects approval if KYC is not yet APPROVED (Rule 1).
6. Seller now has full access to create products and clone from the official catalog.
```

### 9.2 Catalog Cloning & Stock Cap Flow
```text
1. Platform seeds official catalog products under Martify Collection Official Store (isDemoAccount=true).
2. Seller opens Dashboard -> clicks "Browse Official Store Catalog".
3. Seller checks desired products -> clicks "Batch Clone".
4. Backend verifies that sum of seller's current active stock + cloned stock <= seller.availableStock (Rule 2).
5. Backend creates new Product records linked via clonedFromProductId (Rule 3).
```

### 9.3 Guest Order & Financial Lifecycle
```text
1. Buyer adds items to cart (CartItem stored in DB with guest sessionId).
2. Buyer completes Checkout form -> calls POST /api/checkout.
3. Backend atomic transaction:
   a. Checks each product's stock availability.
   b. Decrements product stock.
   c. Creates Order (status = BOOKED).
   d. Increments seller.balanceOnHold by order.totalPrice (Rule 4).
   e. Deletes cart items for sessionId.
4. Support Agent views order in Support Console (/support).
5. Support Agent advances status:
   BOOKED ➔ PROCESSING ➔ SHIPPING ➔ DELIVERED (Rule 5).
6. When DELIVERED is reached, backend atomic transaction:
   a. Decrements seller.balanceOnHold by order.totalPrice.
   b. Increments seller.balanceAvailable by order.totalPrice (Rule 6).
```

---

## 10. ENVIRONMENT VARIABLES & SEED CREDENTIALS

### 10.1 Backend `.env`
```env
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mves_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
CORS_ORIGIN="http://localhost:5173"
NODE_ENV="development"
```

### 10.2 Frontend `.env`
```env
VITE_API_URL="http://localhost:5000/api"
VITE_API_URL_BASE="http://localhost:5000"
```

### 10.3 Default Seed Accounts (`prisma/seed.ts`)
| Role | Email | Password | Purpose |
|---|---|---|---|
| **Admin** | `admin@nayyar.com` | `admin!#$123@` | System administrator |
| **Support** | `support1@nayyar.com` | `nayyar123@#$` | Primary customer support agent |
| **Official Store** | `official@martifycollection.com` | `SellerPass123!` | Demo catalog owner (`isDemoAccount: true`) |

---

## 11. PROMPT GENERATION GUIDE FOR THE AGENT

When the user asks you to write a prompt for Antigravity, **use this exact structured format**:

```markdown
### 🎯 OBJECTIVE
[Concise 1-2 sentence description of the task: Bug Fix or Feature Addition]

### 📂 AFFECTED FILES
- Backend:
  - `src/...`
- Frontend:
  - `frontend/src/...`
- Schema / DB (if applicable):
  - `prisma/schema.prisma`

### 🔍 PROBLEM STATEMENT / FEATURE SPECIFICATION
[Detailed explanation of the issue or feature requirement]

### ⚙️ EXACT IMPLEMENTATION INSTRUCTIONS
1. **Database & Types**:
   - [Specify any Prisma schema changes, migrations, or shared TypeScript types in frontend/src/types/index.ts]
2. **Backend Logic**:
   - [Specify updates in services, validators (Zod), controllers, and routes]
   - [Mention transactions, atomic operations, or error handling using AppError]
3. **Frontend Implementation**:
   - [Specify API client methods, context updates, component structure, and UI behavior]
   - [Mention Tailwind styling consistent with navy/white/orange palette]

### 🛡️ INVARIANT CHECKLIST (MUST NOT BREAK)
- [ ] Rule 1: Seller approval gate remains enforced.
- [ ] Rule 2: Stock cap calculation (`sum(stock) <= availableStock`) remains intact.
- [ ] Rule 3: Catalog cloning continues to reference `isDemoAccount: true` items.
- [ ] Rule 4: Guest checkout creates `BOOKED` orders and credits `balanceOnHold`.
- [ ] Rule 5: Order status transitions remain strictly sequential.
- [ ] Rule 6: `DELIVERED` status atomically transfers funds to `balanceAvailable`.

### 🧪 VERIFICATION STEPS
1. Run backend build: `npx tsc --noEmit`
2. Run frontend build: `cd frontend && npx tsc --noEmit`
3. [Specify browser or endpoint test to verify fix]
```
