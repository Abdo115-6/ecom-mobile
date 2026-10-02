import { dbService } from './dbService';
import { Order } from '../types/ecommerce';

export class WhatsAppService {
  /**
   * Generates a direct WhatsApp click-to-chat URL with pre-filled message for product inquiries
   */
  public generateProductInquiryLink(productName: string, productPrice: string, url: string): string {
    const phone = dbService.settings.whatsappPhoneNumber.replace(/[^0-9]/g, '');
    const message = `Salam ShopMe ! 👋 Je souhaite commander : *${productName}* (${productPrice}).\nLien : ${url}\nPouvez-vous me renseigner sur la disponibilité et les modalités de livraison svp ?`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  /**
   * Generates order confirmation WhatsApp message and link with all order details
   */
  public generateOrderConfirmationLink(order: Order): string {
    const phone = dbService.settings.whatsappPhoneNumber.replace(/[^0-9]/g, '');
    const itemsText = (order.items || []).map(i => {
      const v = i.variantTitle ? ` (${i.variantTitle})` : '';
      return `${i.productName}${v} x${i.quantity} [${Number(i.unitPrice || i.subtotal || 0).toFixed(0)} MAD]`;
    }).join('\n• ');

    const template = dbService.settings.whatsappOrderConfirmationTemplate ||
      `Salam {{customer_name}} ! 👋\nMerci pour votre commande sur *ShopMe Maroc* 🇲🇦.\n\n📋 *Détails de votre commande #{{order_number}}* :\n• {{items}}\n\n💰 *Total à régler* : *{{total}}* (Paiement cash à la livraison)\n📍 *Adresse* : {{address}}\n📞 *Téléphone* : {{phone}}\n\n👉 *Veuillez répondre « OUI » ou « CONFIRMER » pour valider l'expédition express.*`;

    const address = [order.shippingAddress?.street, order.shippingAddress?.city].filter(Boolean).join(', ');

    const formattedMessage = template
      .replace(/\{\{?\s*customer_name\s*\}?\}/g, order.shippingAddress?.fullName || order.customerName || 'Client')
      .replace(/\{\{?\s*customerName\s*\}?\}/g, order.shippingAddress?.fullName || order.customerName || 'Client')
      .replace(/\{\{?\s*order_number\s*\}?\}/g, order.orderNumber)
      .replace(/\{\{?\s*orderNumber\s*\}?\}/g, order.orderNumber)
      .replace(/\{\{?\s*items\s*\}?\}/g, itemsText)
      .replace(/\{\{?\s*total\s*\}?\}/g, `${order.totalAmount.toFixed(2)} MAD`)
      .replace(/\{\{?\s*city\s*\}?\}/g, order.shippingAddress?.city || 'Maroc')
      .replace(/\{\{?\s*address\s*\}?\}/g, address)
      .replace(/\{\{?\s*phone\s*\}?\}/g, order.customerPhone || order.shippingAddress?.phone || '');

    return `https://wa.me/${phone}?text=${encodeURIComponent(formattedMessage)}`;
  }

  /**
   * Generates customer support direct inquiry link
   */
  public generateSupportLink(topic = 'Question générale'): string {
    const phone = dbService.settings.whatsappPhoneNumber.replace(/[^0-9]/g, '');
    const message = `Salam ShopMe Maroc ! J'ai une question concernant : ${topic}.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }
}

export const whatsappService = new WhatsAppService();
