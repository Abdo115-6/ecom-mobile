# 3. API Specification (Spring Boot REST)

## Base URLs
- Public Storefront: `/api/v1`
- Admin Panel: `/api/v1/admin`

All responses follow the unified envelope:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2026-09-29T18:30:00Z"
}
```

---

## 1. Authentication & Customer Identity
- `POST /api/v1/auth/register` : Create customer account with email, password, phone, name.
- `POST /api/v1/auth/login` : Authenticate user & return JWT token (15m expiry) + refresh token (7d).
- `POST /api/v1/auth/refresh` : Exchange refresh token for fresh access token.
- `POST /api/v1/auth/logout` : Revoke refresh token and invalidate Redis session.
- `GET /api/v1/auth/me` : Retrieve current authenticated user profile & permissions.

## 2. Catalog & Products
- `GET /api/v1/products` : List published products with query params:
  - `page`, `size`, `sort` (`price_asc`, `price_desc`, `rating`, `newest`)
  - `category` (slug or UUID)
  - `brand`
  - `min_price`, `max_price`
  - `search` (typo-tolerant search term)
- `GET /api/v1/products/{slug}` : Retrieve full product details, variants, gallery images, rating summary, and SEO meta.
- `GET /api/v1/products/{id}/related` : Machine learning / MBA recommendations ("Frequently bought together" and "You may also like").
- `GET /api/v1/categories` : List category hierarchy (categories + nested subcategories).

## 3. Cart & Anonymous Sessions
- `GET /api/v1/cart` : Retrieve active cart by Bearer token or `X-Session-ID` header.
- `POST /api/v1/cart/items` : Add item to cart (validates inventory in Redis/DB).
  - Body: `{ "productId": "...", "variantId": "...", "quantity": 1 }`
- `PUT /api/v1/cart/items/{itemId}` : Update quantity (checks max stock limit).
- `DELETE /api/v1/cart/items/{itemId}` : Remove item from cart.
- `POST /api/v1/cart/merge` : Merge anonymous session cart into customer cart upon login.
- `POST /api/v1/cart/apply-coupon` : Validate and apply promo code (checks min spend, expiry, usage limit).
- `DELETE /api/v1/cart/coupon` : Remove applied coupon.

## 4. Checkout & Orders
- `POST /api/v1/checkout/calculate` : Calculate totals (subtotal, shipping, tax, discount) based on address and cart items.
- `POST /api/v1/orders` : Create order (transactional: reserves stock, records payment intent, attaches UTM tracking metadata).
  - Returns: `{ "orderId": "...", "orderNumber": "ORD-2026-9481", "total": 849.00, "status": "PENDING" }`
- `GET /api/v1/orders/{orderNumber}/tracking` : Public order tracking with phone verification.
- `GET /api/v1/customer/orders` : Order history for authenticated customer.

## 5. Reviews & Engagement
- `GET /api/v1/products/{productId}/reviews` : List approved reviews for product with rating distribution.
- `POST /api/v1/products/{productId}/reviews` : Submit customer review (created with status `PENDING` for moderation).
- `GET /api/v1/wishlist` : Get customer's saved products.
- `POST /api/v1/wishlist/{productId}` : Toggle product in wishlist.

## 6. Marketing Event Ingestion Pipeline
- `POST /api/v1/events` : Ingest frontend tracking event.
  - Body:
    ```json
    {
      "eventId": "evt_01H9A...",
      "eventName": "add_to_cart",
      "sessionId": "ses_92819",
      "anonymousId": "anon_38102",
      "utmSource": "meta",
      "utmCampaign": "summer2026",
      "currency": "MAD",
      "value": 499.00,
      "items": [{ "productId": "p1", "price": 499.00, "quantity": 1 }]
    }
    ```
  - Backend persists event, dispatches to Meta CAPI, TikTok Events API, and buffers for BigQuery stream.

---

## 7. Back Office Admin Endpoints (RBAC Enforced)

### Products (`hasAuthority('products:read|write')`)
- `GET /api/v1/admin/products` : Filterable & sortable list of all products (including Draft & Archived).
- `POST /api/v1/admin/products` : Create product with variants, pricing, SEO, and images.
- `PUT /api/v1/admin/products/{id}` : Update product details.
- `DELETE /api/v1/admin/products/{id}` : Soft delete or archive product.
- `POST /api/v1/admin/products/upload-images` : Multi-image upload to Object Storage (returns WebP/AVIF URLs).

### Categories (`hasAuthority('categories:write')`)
- `POST /api/v1/admin/categories` : Create new category or subcategory.
- `PUT /api/v1/admin/categories/{id}` : Update category metadata and hierarchy.
- `DELETE /api/v1/admin/categories/{id}` : Remove category.

### Inventory & Stock Movements (`hasAuthority('inventory:write')`)
- `GET /api/v1/admin/inventory` : Stock levels (available, reserved, sold, low stock alerts).
- `POST /api/v1/admin/inventory/adjust` : Record stock movement (`IN`, `OUT`, `ADJUSTMENT`, `RETURN`) with reason and audit trail.

### Orders Management (`hasAuthority('orders:read|update')`)
- `GET /api/v1/admin/orders` : Filter by status (`PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`).
- `PUT /api/v1/admin/orders/{id}/status` : Transition order status & trigger automated WhatsApp/Email notification.
- `GET /api/v1/admin/orders/{id}` : Comprehensive view (customer, items, payments, shipment tracking, UTM attribution).
- `GET /api/v1/admin/orders/export` : Export orders to CSV/Excel.

### Reviews Moderation (`hasAuthority('reviews:moderate')`)
- `GET /api/v1/admin/reviews` : Queue of pending, approved, and rejected reviews.
- `PUT /api/v1/admin/reviews/{id}/status` : Approve or Reject review.
- `POST /api/v1/admin/reviews/{id}/reply` : Submit official store reply.

### Marketing, Coupons & CMS (`hasAuthority('marketing:manage')`)
- `GET|POST|PUT|DELETE /api/v1/admin/coupons` : Full coupon lifecycle management.
- `GET|PUT /api/v1/admin/homepage/sections` : Reorder and configure homepage modular blocks.
- `GET|POST|PUT|DELETE /api/v1/admin/banners` : Promotional hero & mobile banners.

### Analytics, Data Mining & BI (`hasAuthority('analytics:read')`)
- `GET /api/v1/admin/analytics/dashboard` : Real-time KPIs (Revenue, Orders, AOV, Conversion Rate, Funnel).
- `GET /api/v1/admin/analytics/rfm` : RFM segmentation matrix and customer clusters.
- `GET /api/v1/admin/analytics/recommendations` : Product co-occurrence association rules.
- `GET /api/v1/admin/events/live` : Real-time stream of ingested tracking events with deduplication status.

### Users & Audit Logs (`hasAuthority('users:admin')`)
- `GET|POST|PUT /api/v1/admin/users` : Admin user management & RBAC assignment.
- `GET /api/v1/admin/audit-logs` : Immutable log of all administrative actions.
- `GET|PUT /api/v1/admin/settings` : Store settings (WhatsApp number, Pixel IDs, default currency, tax).
