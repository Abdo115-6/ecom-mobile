# 6. Event Tracking & Marketing Intelligence Specification

## 1. Unified Event Schema

Every event produced across the user journey adheres to a unified JSON contract:

```typescript
export interface UnifiedTrackingEvent {
  event_id: string;              // Unique UUIDv4 (e.g., 'evt_01H9M...') for deduplication
  event_name: TrackingEventName; // Standardized name: 'page_view', 'view_item', 'add_to_cart', etc.
  anonymous_id: string;          // Persistent 1st-party cookie ID for guest users
  user_id?: string;              // Registered customer ID (hashed when dispatched to pixels)
  session_id: string;            // Current browser session identifier
  timestamp: string;             // ISO-8601 UTC timestamp
  page_url: string;              // Current full URL
  page_title: string;            // Document title
  referrer?: string;             // HTTP referrer or previous page
  user_agent: string;            // Client User-Agent string
  ip_address?: string;           // Client IP (hashed for GDPR compliance)
  
  // Marketing Attribution
  utm: {
    source?: string;             // e.g., 'meta', 'tiktok', 'google', 'whatsapp'
    medium?: string;             // e.g., 'cpc', 'story', 'organic'
    campaign?: string;           // e.g., 'summer_sale_2026'
    content?: string;            // Ad creative identifier
    term?: string;               // Search keyword
    fbclid?: string;             // Meta Click ID
    ttclid?: string;             // TikTok Click ID
    gclid?: string;              // Google Ads Click ID
  };

  // E-commerce Payload
  ecommerce?: {
    currency: string;            // 'MAD', 'EUR', 'USD'
    value?: number;              // Monetary total
    coupon?: string;             // Applied coupon code
    order_id?: string;           // Order number for purchase
    shipping_tier?: string;      // Express vs Standard
    payment_type?: string;       // COD, Card
    items: Array<{
      item_id: string;           // Product SKU / UUID
      item_name: string;         // Product Title
      item_category?: string;    // Category name
      price: number;             // Unit price
      quantity: number;          // Quantity
      item_variant?: string;     // Size/Color
    }>;
  };
}
```

## 2. Platform Mapping & Deduplication Strategy

When a user triggers an event (e.g. `purchase` or `add_to_cart`):
1. **Client Browser**:
   - Dispatches browser event to Google Tag Manager / GA4 (`dataLayer.push`), Meta Pixel (`fbq('track', 'Purchase', payload, { eventID: event_id })`), TikTok Pixel (`ttq.track('CompletePayment', payload, { event_id: event_id })`), and Snapchat Pixel.
   - Forwards the exact same `event_id` to the Backend Event API (`POST /api/v1/events`).
2. **Backend Server**:
   - Receives event and immediately fires Server-to-Server Conversions APIs (Meta CAPI, TikTok Events API, Snapchat CAPI) with the matching `event_id`.
   - Ad platforms match both occurrences by `event_id`. If ad-blockers block the client pixel, the server event ensures 100% conversion delivery. If both arrive, the platform deduplicates them within 48 hours.

| Event Name | Google Analytics 4 | Meta Pixel & CAPI | TikTok Events API | Snapchat CAPI |
| :--- | :--- | :--- | :--- | :--- |
| `page_view` | `page_view` | `PageView` | `PageView` | `PAGE_VIEW` |
| `view_item` | `view_item` | `ViewContent` | `ViewContent` | `VIEW_CONTENT` |
| `view_category` | `view_item_list` | `ViewContent` (category)| `ViewContent` | `VIEW_CONTENT` |
| `search` | `search` | `Search` | `Search` | `SEARCH` |
| `add_to_cart` | `add_to_cart` | `AddToCart` | `AddToCart` | `ADD_CART` |
| `remove_from_cart` | `remove_from_cart` | Custom / N/A | N/A | N/A |
| `view_cart` | `view_cart` | `ViewContent` (cart) | `ViewContent` | `VIEW_CONTENT` |
| `begin_checkout` | `begin_checkout` | `InitiateCheckout` | `InitiateCheckout` | `START_CHECKOUT` |
| `add_shipping_info`| `add_shipping_info` | `AddShippingInfo` | `AddShippingInfo` | N/A |
| `add_payment_info` | `add_payment_info` | `AddPaymentInfo` | `AddPaymentInfo` | `ADD_BILLING` |
| `purchase` | `purchase` | `Purchase` | `CompletePayment` | `PURCHASE` |
| `whatsapp_click` | `whatsapp_click` | `Lead` | `Contact` | `CONTACT` |

## 3. Data Warehouse (BigQuery) Stream Schema

The unified event records are streamed into BigQuery partitioning tables:
- `dataset`: `ecommerce_analytics`
- `table`: `raw_events` (Partitioned by `DATE(timestamp)`, Clustered by `event_name`, `session_id`, `utm.source`)
- Views generated for Data Mining:
  - `rfm_scores`: Recency (days since last purchase), Frequency (total count), Monetary (total revenue).
  - `basket_co_occurrence`: Frequency of product pairs purchased together within same `order_id`.
