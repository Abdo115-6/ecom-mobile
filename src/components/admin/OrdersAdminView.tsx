import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/dbService';
import { Order, OrderStatus } from '../../types/ecommerce';
import { OrderDeliveryTicket } from './OrderDeliveryTicket';
import { WhatsAppConfirmationModal } from './WhatsAppConfirmationModal';
import { 
  Search, 
  Download, 
  Eye, 
  CheckCircle2, 
  X, 
  Truck, 
  MessageCircle, 
  Calendar, 
  Phone, 
  MapPin, 
  User,
  QrCode,
  Printer,
  CheckCheck
} from 'lucide-react';
import { whatsappService } from '../../services/whatsappService';

export const OrdersAdminView: React.FC = () => {
  const { currentUser, formatMoney, showToast } = useApp();
  const [orders, setOrders] = useState<Order[]>(dbService.orders);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [ticketOrder, setTicketOrder] = useState<Order | null>(null);
  const [whatsappModalOrder, setWhatsappModalOrder] = useState<Order | null>(null);

  const filteredOrders = orders.filter(o => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.shippingAddress.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => {
    dbService.updateOrderStatus(orderId, newStatus, currentUser);
    setOrders([...dbService.orders]);
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
    showToast(`Statut commande mis à jour : ${newStatus}`);
  };

  // Pick up customer WhatsApp replies (confirm / cancel) handled by the server webhook
  useEffect(() => {
    const timer = setInterval(() => {
      dbService.syncFromBackend().then(() => setOrders([...dbService.orders]));
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const handleResendWhatsApp = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/whatsapp/resend`, { method: 'POST' });
      const data = await res.json();
      const order = dbService.orders.find(o => o.id === orderId);
      if (order && data.notification) order.whatsappNotification = data.notification;
      setOrders([...dbService.orders]);
      if (data.success) {
        showToast('✓ Message WhatsApp envoyé au client');
      } else {
        showToast(`Échec WhatsApp : ${data.notification?.lastError || data.message || 'erreur inconnue'}`);
      }
    } catch {
      showToast('Serveur injoignable : message WhatsApp non envoyé');
    }
  };

  const handleConfirmViaWhatsApp = (orderId: string) => {
    const updated = dbService.confirmOrderViaWhatsApp(orderId, undefined, currentUser);
    if (updated) {
      setOrders([...dbService.orders]);
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(updated);
      }
      setWhatsappModalOrder(updated);
      showToast(`✓ Commande #${updated.orderNumber} confirmée via WhatsApp !`);
    }
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      ["N° Commande,Client,Ville,Sous-total,Frais Livraison,Total COD,Statut,Confirmation WhatsApp,Date,Source UTM",
        ...filteredOrders.map(o => `"${o.orderNumber}","${o.customerName}","${o.shippingAddress.city}",${o.subtotal},${o.shippingFee},${o.totalAmount},"${o.status}","${o.whatsappConfirmation?.isConfirmed ? 'OUI' : 'NON'}","${o.createdAt}","${o.utmSource || 'direct'}"`)
      ].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `shopme_orders_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Export CSV des commandes généré avec succès !");
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Gestion des Commandes & Confirmations WhatsApp</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Suivi des statuts, screen des conversations de confirmation WhatsApp, bordereaux et QR codes colis
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Exporter CSV</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par N° commande, client ou ville..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none cursor-pointer"
        >
          <option value="all">Tous les statuts</option>
          <option value="PENDING">En attente (Pending)</option>
          <option value="CONFIRMED">Confirmée (WhatsApp)</option>
          <option value="PROCESSING">En préparation</option>
          <option value="SHIPPED">En cours d'expédition</option>
          <option value="DELIVERED">Livrée</option>
          <option value="CANCELLED">Annulée</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 border-b border-slate-700/80">
                <th className="py-3 px-4 font-semibold">N° Commande</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Client</th>
                <th className="py-3 px-4 font-semibold">Ville</th>
                <th className="py-3 px-4 font-semibold">Frais Livr.</th>
                <th className="py-3 px-4 font-semibold">Total COD</th>
                <th className="py-3 px-4 font-semibold">Accord WhatsApp</th>
                <th className="py-3 px-4 font-semibold">Statut</th>
                <th className="py-3 px-4 font-semibold text-right">Actions & Tickets</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredOrders.map(order => {
                const isConfirmedWA = order.whatsappConfirmation?.isConfirmed || order.status === 'CONFIRMED';
                return (
                  <tr key={order.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 px-4 font-black text-white font-mono">{order.orderNumber}</td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{order.customerName}</div>
                      <div className="text-[10px] text-slate-400">{order.customerPhone}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-semibold">{order.shippingAddress.city}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                        order.shippingFee === 0 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-slate-700 text-slate-200'
                      }`}>
                        {order.shippingFee === 0 ? 'Gratuit' : `${order.shippingFee} DH`}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-black text-white font-mono text-sm">{formatMoney(order.totalAmount)}</td>
                    
                    {/* WhatsApp Confirmation Column */}
                    <td className="py-3 px-4">
                      {isConfirmedWA ? (
                        <button
                          onClick={() => setWhatsappModalOrder(order)}
                          className="px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold text-[10px] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                          title="Cliquez pour voir le screen de la conversation de confirmation"
                        >
                          <MessageCircle className="w-3.5 h-3.5 fill-emerald-400 text-slate-900" />
                          <span>✓ Confirmée WA</span>
                        </button>
                      ) : order.whatsappConfirmation?.needsHumanIntervention ? (
                        <button
                          onClick={() => setWhatsappModalOrder(order)}
                          className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl font-bold text-[10px] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 animate-pulse"
                          title="Le client attend une réponse humaine ! Cliquez pour répondre"
                        >
                          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                          <span>⚠️ Réponse Requise</span>
                        </button>
                      ) : (
                        <div className="flex flex-col gap-1 items-start">
                          <button
                            onClick={() => setWhatsappModalOrder(order)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold text-[10px] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                            title="Ouvrir l'écran de conversation WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                            <span>💬 Conversation WA</span>
                          </button>
                          <div className="text-[9px] text-slate-400">
                            {order.whatsappNotification?.status === 'SENT' && '📨 Envoyé · en attente OUI'}
                            {order.whatsappNotification?.status === 'FAILED' && (
                              <span className="text-red-400" title={order.whatsappNotification.lastError}>⚠ Échec envoi</span>
                            )}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Order Status Select */}
                    <td className="py-3 px-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value as OrderStatus)}
                        className="bg-slate-900 border border-slate-700 rounded-lg p-1 text-[11px] font-bold text-blue-400 focus:outline-none cursor-pointer"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="CONFIRMED">CONFIRMED</option>
                        <option value="PROCESSING">PROCESSING</option>
                        <option value="SHIPPED">SHIPPED</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>

                    {/* Actions Column */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* WhatsApp Conversation Screen button */}
                        <button
                          onClick={() => setWhatsappModalOrder(order)}
                          className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-bold text-xs"
                          title="Voir le Screen de confirmation WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Screen WA</span>
                        </button>

                        {/* Ticket Colis & QR Code Button */}
                        <button
                          onClick={() => setTicketOrder(order)}
                          className="p-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-bold text-xs"
                          title="Imprimer le Ticket de Livraison Colis & QR Code"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Ticket</span>
                        </button>

                        {/* Inspect Order */}
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors cursor-pointer"
                          title="Inspecter la commande"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white">Détails Commande {selectedOrder.orderNumber}</h3>
                <p className="text-xs text-slate-400">Passée le {new Date(selectedOrder.createdAt).toLocaleString('fr-FR')}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* WhatsApp Confirmation Status Card */}
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  selectedOrder.whatsappConfirmation?.isConfirmed || selectedOrder.status === 'CONFIRMED'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}>
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <span>
                      {selectedOrder.whatsappConfirmation?.isConfirmed || selectedOrder.status === 'CONFIRMED'
                        ? 'Accord Client Validé sur WhatsApp'
                        : 'En attente de confirmation WhatsApp'}
                    </span>
                    {(selectedOrder.whatsappConfirmation?.isConfirmed || selectedOrder.status === 'CONFIRMED') && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.2 rounded-full font-mono">
                        VERIFIED
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {selectedOrder.whatsappConfirmation?.isConfirmed
                      ? `Réponse : « ${selectedOrder.whatsappConfirmation.replyMessageText} »`
                      : 'Validation obligatoire avant expédition express par le livreur.'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setWhatsappModalOrder(selectedOrder)}
                  className="w-full sm:w-auto px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-xl text-xs font-bold transition-colors border border-emerald-500/30 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Voir Screen WhatsApp</span>
                </button>
                {!selectedOrder.whatsappConfirmation?.isConfirmed && selectedOrder.status !== 'CONFIRMED' && (
                  <button
                    onClick={() => handleConfirmViaWhatsApp(selectedOrder.id)}
                    className="w-full sm:w-auto px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Valider Accord
                  </button>
                )}
              </div>
            </div>

            {/* Customer & Shipping Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-800/60 p-4 rounded-2xl border border-slate-700">
              <div className="space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <span>Destinataire</span>
                </div>
                <div className="text-slate-300 font-semibold">{selectedOrder.customerName}</div>
                <div className="text-emerald-400 font-mono font-bold">{selectedOrder.customerPhone}</div>
                <div className="text-slate-400">{selectedOrder.customerEmail}</div>
              </div>

              <div className="space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>Adresse & Ville</span>
                </div>
                <div className="text-slate-300">{selectedOrder.shippingAddress.street}</div>
                <div className="text-white font-bold">{selectedOrder.shippingAddress.city}, Maroc</div>
                {selectedOrder.notes && (
                  <div className="text-amber-400 font-medium mt-1 italic">Note : "{selectedOrder.notes}"</div>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Articles commandés</div>
              <div className="divide-y divide-slate-800 bg-slate-800/40 rounded-xl p-3">
                {selectedOrder.items.map(item => (
                  <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-900 shrink-0">
                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-bold text-white">{item.productName}</div>
                        <div className="text-[10px] text-slate-400">Qté: {item.quantity} · SKU: {item.sku}</div>
                      </div>
                    </div>
                    <span className="font-bold text-white font-mono">{formatMoney(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Breakdown: Subtotal + Delivery Fee = Total */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Sous-total articles :</span>
                <span className="font-mono text-white font-bold">{formatMoney(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Frais de livraison ({selectedOrder.shippingAddress.city}) :</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {selectedOrder.shippingFee === 0 ? '0.00 DH (Gratuit)' : formatMoney(selectedOrder.shippingFee)}
                </span>
              </div>
              {selectedOrder.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Remise :</span>
                  <span className="font-mono font-bold">-{formatMoney(selectedOrder.discountAmount)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline text-sm font-black text-white">
                <span>Montant Total COD à encaisser :</span>
                <span className="text-xl text-amber-400 font-mono">{formatMoney(selectedOrder.totalAmount)}</span>
              </div>
            </div>

            {/* Action Buttons: Generate Ticket & WhatsApp */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setTicketOrder(selectedOrder)}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Générer Ticket de Livraison & QR Code</span>
              </button>

              <button
                onClick={() => setWhatsappModalOrder(selectedOrder)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>Screen WhatsApp</span>
              </button>

              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

      {/* QR Code Delivery Ticket Modal */}
      {ticketOrder && (
        <OrderDeliveryTicket
          order={ticketOrder}
          onClose={() => setTicketOrder(null)}
        />
      )}

      {/* WhatsApp Conversation Confirmation Screen Modal */}
      {whatsappModalOrder && (
        <WhatsAppConfirmationModal
          order={whatsappModalOrder}
          onClose={() => setWhatsappModalOrder(null)}
          onOrderUpdated={(updated) => {
            setOrders([...dbService.orders]);
            setWhatsappModalOrder(updated);
          }}
          onPrintTicket={(o) => {
            setWhatsappModalOrder(null);
            setTicketOrder(o);
          }}
        />
      )}

    </div>
  );
};
