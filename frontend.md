# PROJECT: Multi-Vendor Marketplace — Frontend (React, Clean Architecture)

You are a senior frontend engineer. Build a clean, production-grade, low-bug React SPA that consumes the already-built and fully tested Express backend API. Do not modify backend logic. No placeholder/lorem-ipsum content — use real seeded/backend data everywhere.

## Stack (fixed)
- React + Vite + TypeScript
- React Router for routing
- Tailwind CSS
- Axios for API calls, shared client with interceptors
- No WhatsApp naming, branding, icons, or links anywhere in the UI, copy, code, or comments.
- No payment gateway name anywhere — checkout only confirms an order (manual/offline payment, never mention any gateway).

## Design Theme
- Base colors: navy blue (e.g. #0A1F44 or similar deep navy) + white
- Accent colors: vibrant, eye-catching — orange and/or yellow (NOT dull/muted tones)
- Bold, confident typography; clean modern ecommerce look; fully responsive (375px, 768px, 1280px)

## Roles & Flows to Support
1. **Buyer** (guest only, no login): browse catalog, add to cart, checkout with name/phone/address — no payment gateway, order just gets confirmed.
2. **Seller**: registers (name, email, password, phone) → uploads KYC document (ID/passport/license) → waits for Admin approval (KYC then seller status) → once approved: requests wholesale stock, lists own products OR clones products from the shared demo catalog, views orders (read-only status), tracks balance (On Hold vs Available), opens support tickets.
3. **Admin**: approves/rejects seller KYC, approves/blocks sellers, manages categories, approves/rejects stock requests.
4. **Support**: views/manages support tickets, messages sellers, updates order status through the 4-stage lifecycle (Booked → Processing → Shipping → Delivered), which triggers balance release on Delivered.

## Exact File Structure
```
frontend/
├── .env                              # VITE_API_URL=http://localhost:<port>/api
├── src/
│   ├── main.tsx
│   ├── App.tsx                       # Routes + layout wrapper
│   ├── index.css                     # Design tokens (navy/white/orange-yellow), Tailwind config
│   ├── api/
│   │   ├── client.ts                 # Axios instance, JWT interceptor, error handling
│   │   ├── auth.api.ts
│   │   ├── public.api.ts             # categories, products, catalog, cart, checkout
│   │   ├── seller.api.ts             # products, kyc, stock-requests, orders (read), me
│   │   ├── admin.api.ts              # sellers, kyc approval, categories, stock-requests
│   │   └── support.api.ts            # tickets, messages, order status
│   ├── context/
│   │   ├── AuthContext.tsx           # user/token/role state, login/logout
│   │   └── CartContext.tsx           # sessionId (localStorage), cart state, add/remove/refresh
│   ├── types/
│   │   └── index.ts                  # shared interfaces mirroring backend responses
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.tsx            # sticky nav, dynamic categories, cart icon+count, Become a Seller, Sign In
│   │   │   ├── Footer.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── ErrorState.tsx
│   │   ├── product/
│   │   │   ├── ProductCard.tsx       # image, title, price, "Add to Cart" button
│   │   │   └── ProductGrid.tsx
│   │   ├── cart/
│   │   │   ├── CartDrawer.tsx        # slide-out cart summary
│   │   │   └── CartItemRow.tsx
│   │   ├── seller/
│   │   │   ├── KycUploadForm.tsx
│   │   │   ├── ProductForm.tsx       # create/edit, used in dashboard
│   │   │   ├── StockRequestForm.tsx
│   │   │   ├── BalanceCard.tsx       # On Hold vs Available display
│   │   │   ├── OrderTracker.tsx      # 4-step visual tracker (Booked/Processing/Shipping/Delivered)
│   │   │   └── CatalogBrowser.tsx    # browse + clone from shared catalog
│   │   ├── support/
│   │   │   ├── TicketList.tsx
│   │   │   └── TicketChat.tsx        # message thread + input
│   │   └── admin/
│   │       ├── SellerApprovalCard.tsx
│   │       ├── KycReviewCard.tsx
│   │       ├── CategoryForm.tsx
│   │       └── StockRequestCard.tsx
│   └── pages/
│       ├── HomePage.tsx
│       ├── CategoryPage.tsx
│       ├── ProductDetailPage.tsx
│       ├── SellerStorefrontPage.tsx
│       ├── CartPage.tsx
│       ├── CheckoutPage.tsx
│       ├── SellerRegister.tsx
│       ├── SellerLogin.tsx
│       ├── SellerDashboard.tsx       # tabs: My Products, My Stock, Catalog (clone), My Orders, Balance, Support
│       ├── AdminLogin.tsx
│       ├── AdminDashboard.tsx        # tabs: Sellers, KYC Review, Categories, Stock Requests
│       ├── SupportLogin.tsx
│       └── SupportDashboard.tsx      # tickets list + chat, order status control
```

## Pages — Build Order (one at a time, strict)

1. **HomePage** (`/`) — hero banner, 6-category showcase, featured products row (from `GET /api/products`), navy/white/accent theme
2. **CategoryPage** (`/categories/:slug`) — product grid filtered by category
3. **ProductDetailPage** (`/products/:id`) — image, price, description, seller link, "Add to Cart" (quantity selector)
4. **SellerStorefrontPage** (`/sellers/:id`) — seller info + their active products
5. **CartPage** (`/cart`) — list of cart items (qty edit, remove), subtotal, "Proceed to Checkout"
6. **CheckoutPage** (`/checkout`) — form: buyerName, buyerPhone, buyerAddress → calls `POST /api/checkout` → on success, clear cart, show order confirmation (order IDs, no payment step, no gateway mention)
7. **SellerRegister** (`/seller/register`) + **SellerLogin** (`/seller/login`) — auth forms; after register, show "pending KYC + approval" messaging
8. **SellerDashboard** (`/seller/dashboard`) — protected, tabs:
   - **My Products**: CRUD with image upload, stock cap indicator
   - **My Stock**: availableStock, request more (form + history)
   - **Catalog**: browse demo-seller catalog, "Clone to my store" (set price + stock)
   - **My Orders**: list with current status (read-only, `OrderTracker` component)
   - **Balance**: On Hold vs Available amounts (`BalanceCard`)
   - **Support**: create ticket, view/reply to own tickets
   - If KYC not yet approved, show a clear pending/rejected banner blocking product management
9. **AdminLogin** (`/admin/login`) + **AdminDashboard** (`/admin`) — protected, tabs: Sellers (approve/block), KYC Review (approve/reject documents), Categories (CRUD), Stock Requests (approve/reject)
10. **SupportLogin** (`/support/login`) + **SupportDashboard** (`/support`) — protected, tickets list + chat (`TicketChat`), and order status control (advance BOOKED→PROCESSING→SHIPPING→DELIVERED) — this is the ONLY place order status can be changed

After each page: run `npx tsc --noEmit`, take a screenshot, confirm with me before proceeding to the next page. Do not build multiple pages silently in one pass.

## Cart Behavior (critical)
- Guest cart, no login. Generate a `sessionId` (UUID) on first visit, store in `localStorage`, reuse on every cart/checkout call.
- Cart persists across page reloads via that stored `sessionId`.
- Header shows live cart item count (from `CartContext`).

## Hard Rules
- TypeScript throughout, typed API responses matching backend shapes exactly (check actual response shapes, don't guess).
- Small reusable components — no giant page files.
- Loading and error states on every data-fetching view.
- Protected routes (seller/admin/support dashboards) redirect to the correct login if unauthenticated or wrong role.
- Never reference WhatsApp or any payment gateway anywhere — including code comments, alt text, and copy.

## Deliverable
Build pages in the exact order listed above, one at a time, with confirmation after each.