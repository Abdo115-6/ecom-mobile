# 5. Authentication & RBAC Design

## 1. Authentication Lifecycle
- **Stateless JWT Tokens**:
  - `access_token`: Short-lived (15 minutes), signed using HMAC-SHA256 (or RS256 in clustered environments). Contains `sub` (user_id), `email`, and `roles` claims.
  - `refresh_token`: Long-lived (7 days), stored securely in HttpOnly, SameSite=Strict cookies (or Redis whitelist) with automatic rotation on reuse.
- **Spring Security Filter Chain**:
  - `JwtAuthenticationFilter`: Extracts Bearer token, validates cryptographic signature and expiry, hydrates `SecurityContextHolder`.
  - Rate Limiter filter powered by Redis Token Bucket algorithm (10 requests/second per IP for sensitive endpoints).
  - CSRF protection enabled for cookie-based stateful flows.

## 2. RBAC Permissions Matrix

| Role | Catalog (Products/Categories) | Inventory | Orders | Reviews | Marketing (Coupons/Banners) | Analytics & Data Mining | Admin Users & Roles | Audit Logs |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **SUPER_ADMIN** | Full (CRUD) | Full (CRUD) | Full (CRUD) | Full (CRUD) | Full (CRUD) | Full (Read) | Full (CRUD) | Full (Read) |
| **ADMIN** | Full (CRUD) | Full (CRUD) | Full (CRUD) | Full (CRUD) | Full (CRUD) | Full (Read) | View Only | Full (Read) |
| **MANAGER** | Full (CRUD) | Full (CRUD) | Full (CRUD) | Moderate | Full (CRUD) | Full (Read) | No Access | Read Only |
| **PRODUCT_MANAGER** | Full (CRUD) | Update Stock | Read Only | Moderate | Read Only | Product Stats | No Access | No Access |
| **ORDER_MANAGER** | Read Only | Adjust Stock | Full (Update status) | Read Only | Read Only | Order Stats | No Access | No Access |
| **MARKETING_MANAGER**| Read Only | No Access | Read Only | Read Only | Full (CRUD) | Full (Read) | No Access | No Access |
| **SUPPORT** | Read Only | Read Only | Read & Note | Reply | No Access | No Access | No Access | No Access |
| **ANALYST** | Read Only | Read Only | Read (Anonymized)| Read Only | Read Only | Full (Read + Export)| No Access | Read Only |

## 3. Password Policy & Hashing
- Passwords hashed using Argon2id / BCrypt with cost factor 12.
- Password requirements: minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number, and 1 special symbol.
- Optional Multi-Factor Authentication (TOTP via Google Authenticator) for administrative roles.
