export interface RFMSegmentSummary {
  segment: string;
  count: number;
  avgRecencyDays: number;
  avgFrequency: number;
  avgMonetary: number;
  sharePercent: number;
  actionRecommendation: string;
}

export interface ProductCoOccurrence {
  productAId: string;
  productAName: string;
  productBId: string;
  productBName: string;
  coOccurrenceCount: number;
  support: number;
  confidence: number;
  lift: number;
}

export interface FunnelStageData {
  stage: string;
  users: number;
  dropoffRate: number;
}

export interface DashboardKPIData {
  todaySales: number;
  salesGrowthPercent: number;
  ordersToday: number;
  ordersGrowthPercent: number;
  customersCount: number;
  conversionRatePercent: number;
  averageOrderValue: number;
  productsSoldToday: number;
  lowStockCount: number;
  pendingOrdersCount: number;
  pendingReviewsCount: number;
}

export interface SalesTimelinePoint {
  date: string;
  sales: number;
  orders: number;
}

export interface CategoryRevenuePoint {
  category: string;
  revenue: number;
  orders: number;
}
