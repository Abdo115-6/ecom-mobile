import { dbService } from './dbService';
import { Order } from '../types/ecommerce';

export class WhatsAppService {
  /**
   * Generates a direct WhatsApp click-to-chat URL with pre-filled message
   */
  public generateProductInquiryLink(productName: string, productPrice: string, url: string): string {
    const phone = dbService.settings.whatsappPhoneNumber.replace(/[^0-9]/g, '');
    const message = `Bonjour Aura Commerce ! Je souhaite commander le produit : *${productName}* (${productPrice}).\nLien : ${url}\nPouvez-vous me renseigner sur la disponibilité et les modalités de livraison svp ?`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  /**
   * Generates order confirmation WhatsApp message and link
   */
  public generateOrderConfirmationLink(order: Order): string {
    const phone = dbService.settings.whatsappPhoneNumber.replace(/[^0-9]/g, '');
    const template = dbService.settings.whatsappOrderConfirmationTemplate;
    
    const values: Record<string, string> = {
      customerName: order.shippingAddress.fullName || order.customerName,
      customer_name: order.shippingAddress.fullName || order.customerName,
      orderNumber: order.orderNumber,
      order_number: order.orderNumber,
      total: `${order.totalAmount.toFixed(2)} ${order.currency}`,
      city: order.shippingAddress.city,
    };

    const formattedMessage = template.replace(
      /\\{\\{?\\s*(customerName|customer_name|orderNumber|order_number|total|city)\\s*\\}\\}?/g,
      (_, key: string) => values[key] || '',
    );

    return `https://wa.me/${phone}?text=${encodeURIComponent(formattedMessage)}`;
  }

  /**
   * Generates customer support direct inquiry link
   */
  public generateSupportLink(topic = 'Question générale'): string {
    const phone = dbService.settings.whatsappPhoneNumber.replace(/[^0-9]/g, '');
    const message = `Bonjour Aura Commerce, j'ai une question concernant : ${topic}.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }
}

export const whatsappService = new WhatsAppService();
