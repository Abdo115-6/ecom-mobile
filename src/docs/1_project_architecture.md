# 1. Project Architecture

## High-Level Architecture Overview

```text
                           [ MOBILE CUSTOMER / CLIENT ]
                                        │
                       HTTPS / REST / PWA / Service Worker
                                        │
                                        ▼
    ┌────────────────────────────────────────────────────────────────────────┐
    │                      API GATEWAY / REVERSE PROXY                       │
    │                              (NGINX / CDN)                             │
    └───────────────────────────────────┬────────────────────────────────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    │                                       │
                    ▼                                       ▼
       [ NEXT.JS / REACT FRONTEND ]            [ SPRING BOOT 3 (JAVA 21) ]
         - Mobile-first Storefront               - REST Controllers & DTOs
         - Admin Dashboard (RBAC)                - Spring Security + JWT
         - Client Event Tracker (DataLayer)      - Spring Data JPA
         - PWA Offline Fallback                  - Inventory & Order Service
                    │                            - Redis Caching Layer
                    │                                       │
                    │                   ┌───────────────────┼───────────────────┐
                    │                   ▼                   ▼                   ▼
                    │             [ POSTGRESQL 16 ]     [ REDIS 7 ]      [ OBJECT STORAGE ]
                    │             - Relational ACID     - Cart Cache       (MinIO / S3)
                    │             - Row-level lock      - Session Cache    - WebP/AVIF Images
                    │             - Audit Logs          - Rate Limiting    - Static Assets
                    │
                    └───────────────────┬───────────────────┘
                                        │
                                        ▼
                     [ UNIFIED EVENT TRACKING PIPELINE ]
                                        │
             ┌──────────────────────────┴──────────────────────────┐
             ▼                                                     ▼
    [ BROWSER PIXELS (Client-side) ]             [ SERVER-SIDE CONVERSIONS APIS ]
     - Google Analytics 4 (gtag)                  - Meta Conversions API (CAPI)
     - Meta Pixel                                 - TikTok Events API
     - TikTok Pixel                               - Snapchat Conversions API
     - Snap Pixel                                 - Deduplication via `event_id`
             │                                                     │
             └──────────────────────────┬──────────────────────────┘
                                        │
                                        ▼
                             [ DATA WAREHOUSE & BI ]
                              (Google BigQuery)
                                        │
                        ┌───────────────┴───────────────┐
                        ▼                               ▼
               [ DATA MINING ENGINE ]          [ BUSINESS INTELLIGENCE ]
               - RFM Scoring Engine            - Real-time Dashboards
               - Behavioral Customer Clusters  - Attribution Modeling
               - Product Recommendation (MBA)  - Marketing ROI Analysis
```

## Core Architectural Decisions

1. **Separation of Concerns**:
   - The Storefront handles high-performance, mobile-first presentation, client-side event collection, and fast responsive navigation.
   - The Spring Boot backend acts as the single source of truth for business logic, catalog inventory, orders, discount calculation, and server-side tracking dispatch.
   - PostgreSQL handles transactional consistency (ACID) for orders, stock movements, and financial integrity.
   - Redis offloads anonymous cart sessions, fast product caching, and rate limiting.
   - BigQuery handles analytical batch queries, RFM segmentation, and machine learning pipelines without straining the transactional database.

2. **Deduplicated Multi-Channel Tracking**:
   - Each interaction (e.g. `add_to_cart`, `purchase`) generates a deterministic UUID `event_id` (e.g., `evt_01H...`).
   - The event is fired concurrently via browser pixel (for immediate cookie-based matching) and via Server CAPI (for ad-blocker resilience).
   - Ad platforms match both occurrences by `event_id` and discard the duplicate, preventing double-counting while achieving 99%+ attribution accuracy.

3. **RBAC & Admin Isolation**:
   - Admin routes and API endpoints are strictly secured with role-based authorities (e.g. `products.write`, `orders.update`, `analytics.read`).
   - Sensitive business endpoints require authenticated bearer tokens and record immutable audit logs.
