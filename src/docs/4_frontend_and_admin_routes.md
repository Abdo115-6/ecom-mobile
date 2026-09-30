# 4. Frontend & Admin Route Structure

## Storefront Route Map (Mobile-First)

```text
/                                   -> Homepage (Hero, Categories, Best Sellers, Flash Sale, WhatsApp CTA)
/catalog                            -> Product Catalog with multi-filter (Categories, Brands, Price, Sort)
/catalog/:categorySlug              -> Category filtered catalog
/products/:productSlug              -> Product detail view (Gallery, Variants, Stock, Reviews, WhatsApp Inquiry)
/cart                               -> Cart drawer / page (Quantity, Stock verify, Coupon code, Free Shipping bar)
/checkout                           -> 4-step mobile checkout (Address, Shipping, Payment, Confirmation)
/order-confirmation/:orderNumber    -> Order success page with WhatsApp notification & tracking link
/track-order                        -> Guest & customer live shipment lookup
/wishlist                           -> Customer saved items
/account                            -> Customer profile & address book
/account/orders                     -> Customer order history & timeline
/account/reviews                    -> Customer submitted reviews
/about                              -> Store info & WhatsApp contact hub
/legal/privacy                      -> GDPR / Privacy policy & cookie preferences
/legal/terms                        -> Terms of service
```

## Admin Panel Route Map (RBAC Controlled)

```text
/admin                              -> Admin Dashboard (Sales KPIs, Funnel, Recent Activity)
/admin/catalog/products             -> Product management (Filterable table, Search, Status badges)
/admin/catalog/products/new         -> Product Creator (Variants matrix, Image uploader, SEO metadata)
/admin/catalog/products/:id/edit    -> Product Editor
/admin/catalog/categories           -> Category hierarchy manager & display ordering
/admin/catalog/inventory            -> Stock levels & Inventory movements audit ledger (IN/OUT/ADJUSTMENT)
/admin/orders                       -> Order management (Filter by Pending, Processing, Shipped, Delivered)
/admin/orders/:id                   -> Order inspector (Customer details, Payment, Courier tracking, UTM source)
/admin/customers                    -> Customer list & RFM segment tags
/admin/reviews                      -> Review moderation queue (Pending, Approved, Rejected, Replies)
/admin/marketing/coupons            -> Discount coupons & promotional rules
/admin/marketing/banners            -> Hero & Mobile banners scheduler
/admin/marketing/homepage           -> Modular homepage sections layout manager
/admin/tracking/inspector           -> Live Event Stream inspector (Event ID, GA4, Meta CAPI, Deduplication)
/admin/analytics/sales              -> Revenue, AOV, Conversion funnels, Traffic sources
/admin/analytics/data-mining        -> RFM segmentation & Market Basket Analysis (Association rules)
/admin/whatsapp                     -> WhatsApp Business configuration & automated template messages
/admin/users                        -> Admin users & Role assignments (RBAC)
/admin/audit-logs                   -> System audit trail (Action, Entity, Diff, IP, User)
/admin/settings                     -> Store settings (Currencies, Languages, Pixels & CAPI tokens)
```
