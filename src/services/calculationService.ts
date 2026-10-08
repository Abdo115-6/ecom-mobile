import { dbService } from './dbService';

export interface CalculationProduct {
  id: string;
  name: string;
  category: string;
  image: string;
  buyPrice: number;
  sellPrice: number;
  shippingCost: number;
  adCost: number;
  estimatedSales: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'shopme_calculation_products_v2';

export class CalculationService {
  private products: CalculationProduct[] = [];
  private listeners: Array<(products: CalculationProduct[]) => void> = [];

  constructor() {
    this.loadProducts();
  }

  private loadProducts() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.products = JSON.parse(stored);
          return;
        }
      } catch (e) {
        console.warn('Failed to parse calculation products from storage:', e);
      }
    }

    // Seed initially with products from the website catalog
    this.products = this.seedFromCatalog();
    this.saveProducts();
  }

  private seedFromCatalog(): CalculationProduct[] {
    const catalog = dbService.products || [];
    return catalog.map((p, idx) => {
      const sellPrice = p.price;
      // Default buy price around 35% - 45% of retail price
      const estimatedBuyRatio = 0.38 + ((idx % 3) * 0.05);
      const buyPrice = Math.round(sellPrice * estimatedBuyRatio);
      const cat = dbService.categories.find(c => c.id === p.categoryId);
      const categoryName = cat ? cat.name : 'Catalogue Général';

      const firstImg = p.images && p.images.length > 0 ? p.images[0] : null;
      const imageUrl = firstImg 
        ? (typeof firstImg === 'string' ? firstImg : (firstImg as any)?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600')
        : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600';

      return {
        id: 'calc-' + p.id,
        name: p.name,
        category: categoryName,
        image: imageUrl,
        buyPrice: buyPrice,
        sellPrice: sellPrice,
        shippingCost: 35, // Average Moroccan COD delivery fee
        adCost: 20, // Average acquisition cost (Meta Ads Maroc)
        estimatedSales: 40 + (idx * 5),
        notes: 'Importé automatiquement du catalogue du site',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });
  }

  public getProducts(): CalculationProduct[] {
    return [...this.products];
  }

  public getProductById(id: string): CalculationProduct | undefined {
    return this.products.find(p => p.id === id);
  }

  public addProduct(productData: Omit<CalculationProduct, 'id' | 'createdAt' | 'updatedAt'>): CalculationProduct {
    const newProduct: CalculationProduct = {
      ...productData,
      id: 'calc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.products.unshift(newProduct);
    this.saveProducts();
    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<Omit<CalculationProduct, 'id' | 'createdAt'>>): CalculationProduct | null {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) return null;

    this.products[index] = {
      ...this.products[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.saveProducts();
    return this.products[index];
  }

  public deleteProduct(id: string): boolean {
    const prevLen = this.products.length;
    this.products = this.products.filter(p => p.id !== id);
    if (this.products.length !== prevLen) {
      this.saveProducts();
      return true;
    }
    return false;
  }

  private saveProducts() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.products));
      } catch (e) {
        console.warn('Failed to save calculation products to storage:', e);
      }
    }
    this.listeners.forEach(cb => cb([...this.products]));
  }

  public subscribe(listener: (products: CalculationProduct[]) => void): () => void {
    this.listeners.push(listener);
    listener([...this.products]);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // --- Financial Math Helpers ---

  public static calculateMetrics(item: CalculationProduct) {
    const grossProfit = item.sellPrice - item.buyPrice;
    const netProfit = item.sellPrice - item.buyPrice - (item.shippingCost || 0) - (item.adCost || 0);
    const netMarginPercent = item.sellPrice > 0 ? (netProfit / item.sellPrice) * 100 : 0;
    const grossMarginPercent = item.sellPrice > 0 ? (grossProfit / item.sellPrice) * 100 : 0;
    const roiPercent = item.buyPrice > 0 ? (netProfit / item.buyPrice) * 100 : 0;
    const markupMultiplier = item.buyPrice > 0 ? (item.sellPrice / item.buyPrice) : 0;
    const monthlyNetProfit = netProfit * (item.estimatedSales || 0);
    const monthlyRevenue = item.sellPrice * (item.estimatedSales || 0);

    return {
      grossProfit,
      netProfit,
      netMarginPercent: Number(netMarginPercent.toFixed(1)),
      grossMarginPercent: Number(grossMarginPercent.toFixed(1)),
      roiPercent: Number(roiPercent.toFixed(1)),
      markupMultiplier: Number(markupMultiplier.toFixed(2)),
      monthlyNetProfit,
      monthlyRevenue
    };
  }
}

export const calculationService = new CalculationService();
