import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Order } from '../../types/ecommerce';
import { Logo } from '../common/Logo';
import { 
  Printer, 
  X, 
  MapPin, 
  Phone, 
  Package, 
  Truck, 
  Calendar, 
  ShieldCheck, 
  CheckCircle2, 
  DollarSign,
  AlertCircle
} from 'lucide-react';

interface OrderDeliveryTicketProps {
  order: Order;
  onClose: () => void;
}

export const OrderDeliveryTicket: React.FC<OrderDeliveryTicketProps> = ({ order, onClose }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    // Generate real scannable QR Code containing all courier data
    const qrData = JSON.stringify({
      store: 'ShopMe Maroc',
      orderNumber: order.orderNumber,
      customer: order.customerName,
      phone: order.customerPhone,
      city: order.shippingAddress.city,
      address: order.shippingAddress.street,
      subtotal: `${order.subtotal} MAD`,
      shippingFee: `${order.shippingFee} MAD`,
      totalCodToCollect: `${order.totalAmount} MAD`,
      paymentMethod: order.paymentMethod,
      carrier: order.shipment?.carrier || 'ShopMe Express',
      date: order.createdAt
    });

    QRCode.toDataURL(qrData, {
      width: 220,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    })
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error('Failed to generate QR code', err));
  }, [order]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      {/* Container with print styles */}
      <div className="bg-white text-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-auto border border-slate-300 print:m-0 print:p-0 print:border-none print:shadow-none print:w-full print:max-w-none">
        
        {/* Top Control Bar (Hidden when printing) */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-400" />
            <span className="font-black text-sm">Bordereau de Livraison COD & Ticket Colis</span>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono text-[10px] rounded-md font-bold">
              {order.orderNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer Ticket (A6 / Thermique / A4)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Ticket Area */}
        <div id="printable-ticket" className="p-6 sm:p-8 space-y-5 print:p-4 print:text-black">
          
          {/* Header: Store Identity & Carrier Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-900 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Logo size="md" variant="light" subtitleText="EXPÉDITION NATIONALE MAROC" />
              </div>
              <div className="text-[11px] text-slate-600 mt-1 space-y-0.5">
                <div>Expéditeur : <strong>ShopMe Casablanca Hub Logistique</strong></div>
                <div>Support / WhatsApp : <strong>+212 600 00 00 00</strong></div>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <div className="inline-block px-3 py-1 bg-slate-900 text-white font-black text-xs uppercase tracking-wider rounded-lg">
                PAIEMENT À LA LIVRAISON (COD)
              </div>
              <div className="text-xs font-mono font-black text-slate-800">
                Colis #{order.orderNumber}
              </div>
              <div className="text-[11px] text-slate-500">
                Date : {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Destinataire Box (High visibility for Courier / Driver) */}
          <div className="border-2 border-slate-900 rounded-2xl p-4 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-300 pb-2">
              <div className="font-black text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-600" />
                <span>DESTINATAIRE (CLIENT FINAL)</span>
              </div>
              <span className="px-2.5 py-0.5 bg-slate-900 text-white font-black text-xs rounded-md">
                VILLE : {order.shippingAddress.city.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500">Nom & Prénom</div>
                <div className="text-base sm:text-lg font-black text-slate-900 uppercase">
                  {order.customerName}
                </div>

                <div className="text-[10px] uppercase font-bold text-slate-500 mt-2">Numéro de Téléphone</div>
                <div className="text-base sm:text-lg font-mono font-black text-emerald-700 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>{order.customerPhone}</span>
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500">Adresse de Livraison</div>
                <div className="text-xs font-bold text-slate-900 leading-snug">
                  {order.shippingAddress.street || 'Adresse confirmée avec le client'}
                </div>
                <div className="text-xs font-black text-slate-800 mt-0.5">
                  {order.shippingAddress.city}, Maroc
                </div>

                {order.notes && (
                  <div className="mt-2 text-[11px] bg-amber-100 text-amber-900 p-1.5 rounded-lg font-semibold border border-amber-300">
                    ⚠️ Note : {order.notes}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items & Financial Breakdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
            
            {/* Left: Items Summary */}
            <div className="sm:col-span-7 space-y-2">
              <div className="text-xs font-black uppercase text-slate-700 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-slate-700" />
                <span>Contenu du Colis ({order.items.length} référence{order.items.length > 1 ? 's' : ''})</span>
              </div>

              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                    <tr>
                      <th className="p-2">Article</th>
                      <th className="p-2 text-center">Qté</th>
                      <th className="p-2 text-right">Prix</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {order.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2">
                          <div className="font-bold text-slate-900">{item.productName}</div>
                          {item.variantTitle && (
                            <div className="text-[10px] text-slate-500 font-medium">{item.variantTitle}</div>
                          )}
                        </td>
                        <td className="p-2 text-center font-bold text-slate-900">
                          x{item.quantity}
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-slate-900">
                          {item.subtotal} DH
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Instructions for Courier */}
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 space-y-0.5">
                <div className="font-black uppercase flex items-center gap-1 text-[10px] text-blue-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Consignes Livreur :</span>
                </div>
                <div>• Ouverture et vérification du colis par le client <strong>autorisée</strong>.</div>
                <div>• En cas d'absence, contacter le client 2 fois avant retour.</div>
              </div>
            </div>

            {/* Right: QR Code & Big Amount to Collect */}
            <div className="sm:col-span-5 flex flex-col items-center justify-between space-y-3 bg-slate-50 p-4 rounded-2xl border-2 border-slate-900">
              
              {/* QR Code */}
              <div className="flex flex-col items-center">
                <div className="text-[10px] font-black uppercase text-slate-600 tracking-wider mb-1">
                  Scanner Colis (Livreur / Hub)
                </div>
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="QR Code Livraison"
                    className="w-32 h-32 border border-slate-300 rounded-xl p-1 bg-white shadow-xs"
                  />
                ) : (
                  <div className="w-32 h-32 bg-slate-200 animate-pulse rounded-xl"></div>
                )}
                <div className="font-mono text-[10px] font-bold text-slate-600 mt-1">
                  {order.orderNumber}
                </div>
              </div>

              {/* Financial Recap Box */}
              <div className="w-full space-y-1.5 pt-2 border-t border-slate-300 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Sous-total articles :</span>
                  <span className="font-mono font-bold text-slate-900">{order.subtotal} DH</span>
                </div>

                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Remise :</span>
                    <span className="font-mono font-bold">-{order.discountAmount} DH</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Frais de livraison :</span>
                  <span className="font-mono font-bold text-slate-900">
                    {order.shippingFee === 0 ? '0.00 DH (Gratuit)' : `${order.shippingFee} DH`}
                  </span>
                </div>

                {/* Big Total COD to collect */}
                <div className="mt-2 p-2.5 bg-slate-900 text-white rounded-xl text-center space-y-0.5 border-2 border-slate-950">
                  <div className="text-[9px] uppercase tracking-widest font-bold text-amber-400">
                    MONTANT TOTAL À ENCAISSER EN ESPÈCES
                  </div>
                  <div className="text-xl sm:text-2xl font-black font-mono text-white">
                    {order.totalAmount} DH
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Barcode Footer Graphic */}
          <div className="pt-3 border-t border-dashed border-slate-400 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
            <div>
              Transporteur assigné : <strong>{order.shipment?.carrier || 'ShopMe Express Courier'}</strong> · Réf : {order.shipment?.trackingNumber || order.orderNumber}
            </div>
            <div className="font-mono text-[10px] text-slate-400">
              Généré par ShopMe Maroc Intelligence Logistique
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
