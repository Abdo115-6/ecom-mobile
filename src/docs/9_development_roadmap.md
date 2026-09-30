# 9. Development Roadmap (Phases 1 through 11)

This project is delivered using the structured 11-phase roadmap:

| Phase | Milestone | Scope & Deliverables |
| :--- | :--- | :--- |
| **Phase 1** | **Foundations & Architecture** | Project Architecture, PostgreSQL DDL (24+ tables), Docker compose, Spring Boot structure, Security & JWT specs, Environment template. |
| **Phase 2** | **Catalog & Storefront Core** | Category tree, Product model with variants & WebP galleries, real-time search with typo tolerance, faceted filters, Cart state with guest session merge. |
| **Phase 3** | **Checkout & Order Processing** | 4-step mobile-first checkout, inventory reservation, COD & Card payment gateways, Order tracking timeline (Pending -> Delivered). |
| **Phase 4** | **Admin Back Office (RBAC)** | Role-based dashboard (Super Admin, Order Manager, Analyst, etc.), Product CRUD with variant matrix, Category management, Inventory movement ledger with audit history. |
| **Phase 5** | **Promotions & Content CMS** | Coupon engine (percentage, fixed, free shipping, min spend, usage limits), Homepage modular sections builder, Banner scheduling, Review moderation queue. |
| **Phase 6** | **Event Tracking Engine** | Unified Event Pipeline with deterministic `event_id`, browser dataLayer & GA4/GTM dispatches, persistent UTM campaign journey attribution. |
| **Phase 7** | **Multi-Platform Conversions API** | Meta CAPI integration, TikTok Events API, Snapchat Conversions API, server-to-browser deduplication inspector to eliminate double counting. |
| **Phase 8** | **WhatsApp Business Integration** | WhatsApp Web & Cloud API integration, click-to-chat with product prefill, automated order confirmations, shipment alerts, and support desk. |
| **Phase 9** | **Data Warehouse & BI** | BigQuery event stream buffer, conversion funnel drop-off analysis, traffic attribution ROI charts. |
| **Phase 10** | **Data Mining & Recommendations**| Automated RFM customer scoring (1-5), behavioral customer segmentation clusters, Market Basket Analysis ("Frequently bought together", "You may also like"). |
| **Phase 11** | **Optimization, SEO & PWA** | PWA manifest, service worker offline handling, OpenGraph cards, Product Schema.org JSON-LD, multi-currency (MAD, EUR, USD), multilingual i18n (FR, AR with RTL, EN). |
