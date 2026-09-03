import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { OrderStatus } from '../types';
import { 
  Search, 
  Truck, 
  CheckCircle2, 
  Clock, 
  ChefHat, 
  Package, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Copy, 
  ShieldCheck, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const OrderTrackingView: React.FC = () => {
  const { orders, activeTrackingId, setActiveTrackingId, getOrderById, getWhatsAppOrderLink, getWhatsAppSupportLink } = useStore();
  const [searchQuery, setSearchQuery] = useState(activeTrackingId || (orders.length > 0 ? orders[0].orderNumber : ''));
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Find order
  const currentOrder = getOrderById(searchQuery) || orders[0];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const found = getOrderById(searchQuery);
    if (found) {
      setActiveTrackingId(found.orderNumber);
    }
  };

  const steps: { status: OrderStatus; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { status: 'Placed', label: 'Order Placed', icon: Clock },
    { status: 'Confirmed', label: 'Bakery Confirmed', icon: ShieldCheck },
    { status: 'Baking', label: 'Tempering & Baking', icon: ChefHat },
    { status: 'Packed', label: 'Thermal Packed', icon: Package },
    { status: 'OutForDelivery', label: 'Out for Delivery', icon: Truck },
    { status: 'Delivered', label: 'Delivered to You', icon: CheckCircle2 },
  ];

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'Placed': return 0;
      case 'Confirmed': return 1;
      case 'Baking': return 2;
      case 'Packed': return 3;
      case 'OutForDelivery': return 4;
      case 'Delivered': return 5;
      case 'Cancelled': return -1;
    }
  };

  const currentStepIndex = currentOrder ? getStepIndex(currentOrder.status) : 0;

  const copyOtp = () => {
    if (!currentOrder) return;
    navigator.clipboard.writeText(currentOrder.deliveryOtp);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  return (
    <div id="order-tracking-view" className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header & Search Bar */}
      <div className="text-center max-w-xl mx-auto space-y-2.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#E8DFD8] text-[#5C4033] text-xs font-medium">
          <Truck className="w-3.5 h-3.5 text-[#C58940]" />
          <span>Dispatch & Thermal Courier Tracking</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#241510] tracking-tight">
          Track Your Order
        </h2>
        <p className="text-xs sm:text-sm text-[#6B574E]">
          Enter your order reference or mobile number to follow your thermal insulated parcel in real time.
        </p>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto pt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8C766B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Order ID (e.g. OG-8492) or Phone"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 rounded-full bg-white border border-[#E8DFD8] focus:border-[#241510] text-[#241510] text-xs font-mono placeholder:text-[#8C766B] focus:outline-none shadow-xs"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-full bg-[#241510] hover:bg-[#3D2317] text-white font-medium text-xs transition-all active:scale-98"
          >
            Track
          </button>
        </form>

        {/* Quick select tags for demoing */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-xs text-[#8C766B]">
          <span className="text-[11px]">Recent orders:</span>
          {orders.slice(0, 4).map((o) => (
            <button
              key={o.id}
              onClick={() => {
                setSearchQuery(o.orderNumber);
                setActiveTrackingId(o.orderNumber);
              }}
              className={`px-2.5 py-0.5 rounded-full font-mono text-[11px] transition-colors ${
                currentOrder?.orderNumber === o.orderNumber
                  ? 'bg-[#241510] text-white'
                  : 'bg-white border border-[#E8DFD8] text-[#5C4033] hover:bg-[#FAF7F2]'
              }`}
            >
              #{o.orderNumber}
            </button>
          ))}
        </div>
      </div>

      {!currentOrder ? (
        <div className="p-8 text-center rounded-2xl bg-white border border-[#E8DFD8] max-w-md mx-auto shadow-xs">
          <Package className="w-10 h-10 text-[#8C766B] mx-auto opacity-60 mb-2" />
          <h4 className="text-[#241510] font-serif font-bold text-base">No Order Found</h4>
          <p className="text-[#8C766B] text-xs mt-1">
            Please check the order number or contact support for help.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Tracking Stepper & Live Map */}
          <div className="lg:col-span-8 space-y-4 sm:space-y-6">
            
            {/* Status Card */}
            <div className="p-5 sm:p-7 rounded-2xl bg-white border border-[#E8DFD8] shadow-xs space-y-5">
              
              {/* Order Status Ribbon */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8DFD8] pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xl sm:text-2xl font-serif font-bold text-[#241510]">
                      Order #{currentOrder.orderNumber}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      currentOrder.status === 'Delivered'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : currentOrder.status === 'Cancelled'
                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                        : 'bg-[#FAF7F2] text-[#241510] border border-[#E8DFD8]'
                    }`}>
                      {currentOrder.status.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                  <p className="text-xs text-[#8C766B] mt-0.5">
                    Placed on {new Date(currentOrder.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at {new Date(currentOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Delivery OTP */}
                  <div className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] flex items-center gap-2.5">
                    <div>
                      <span className="text-[10px] text-[#8C766B] block">
                        Delivery PIN
                      </span>
                      <span className="text-base font-mono font-bold text-[#241510] tracking-wider">
                        {currentOrder.deliveryOtp}
                      </span>
                    </div>
                    <button
                      onClick={copyOtp}
                      title="Copy PIN"
                      className="p-1 rounded text-[#8C766B] hover:text-[#241510] transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Stepper Progress Bar */}
              <div className="relative pt-2 pb-1">
                <div className="hidden sm:grid sm:grid-cols-6 gap-1 relative z-10">
                  {steps.map((step, idx) => {
                    const isDone = currentStepIndex >= idx;
                    const isCurrent = currentStepIndex === idx;
                    const Icon = step.icon;

                    return (
                      <div key={step.status} className="flex flex-col items-center text-center">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 ${
                          isDone 
                            ? 'bg-[#241510] border-[#241510] text-white' 
                            : 'bg-[#FAF7F2] border-[#E8DFD8] text-[#8C766B]'
                        } ${isCurrent ? 'ring-2 ring-[#C58940]' : ''}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className={`text-[10px] font-medium mt-1.5 ${
                          isDone ? 'text-[#241510]' : 'text-[#8C766B]'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Progress track line behind steps */}
                <div className="hidden sm:block absolute top-6.5 inset-x-8 h-[2px] bg-[#E8DFD8] -z-0">
                  <div 
                    className="h-full bg-[#241510] transition-all duration-500"
                    style={{ width: `${Math.max(0, (currentStepIndex / 5) * 100)}%` }}
                  />
                </div>

                {/* Mobile Stepper View */}
                <div className="sm:hidden space-y-2">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8]">
                    <div className="w-8 h-8 rounded-full bg-[#241510] text-white flex items-center justify-center">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8C766B] block">Current Stage</span>
                      <span className="text-xs font-semibold text-[#241510]">
                        {steps[currentStepIndex]?.label || currentOrder.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estimated Delivery Time */}
              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-[#C58940] shrink-0" />
                  <div>
                    <span className="text-[10px] text-[#8C766B] block">Estimated Arrival</span>
                    <span className="text-xs sm:text-sm font-semibold text-[#241510]">
                      {currentOrder.estimatedDeliveryTime}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs text-emerald-800 font-medium">Live Active</span>
                </div>
              </div>

              {/* Simulated Live GPS Map */}
              <div className="relative rounded-xl overflow-hidden border border-[#E8DFD8] bg-[#1F140E] aspect-[16/8] shadow-xs flex flex-col justify-between p-3.5">
                {/* Minimal Grid SVG */}
                <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#FAF7F2" strokeWidth="0.6" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                  <path d="M 20,130 Q 160,50 300,90 T 560,70" fill="none" stroke="#C58940" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
                </svg>

                {/* Bakery Origin Pin */}
                <div className="relative z-10 flex items-center gap-1.5 bg-white/95 px-2.5 py-1 rounded-lg border border-[#E8DFD8] text-xs self-start shadow-xs">
                  <ChefHat className="w-3.5 h-3.5 text-[#C58940]" />
                  <span className="font-medium text-[#241510] text-[10px]">Ovenglow Bakery</span>
                </div>

                {/* Courier In-Transit Marker */}
                <div className="relative z-10 self-center flex flex-col items-center">
                  <div className="px-2.5 py-1 rounded-lg bg-[#241510] text-white text-[11px] font-medium shadow-md flex items-center gap-1.5">
                    <Truck className="w-3 h-3 text-[#C58940]" />
                    <span>{currentOrder.deliveryPartner.name} • Thermal Express</span>
                  </div>
                </div>

                {/* Destination */}
                <div className="relative z-10 flex items-center gap-1.5 bg-white/95 px-2.5 py-1 rounded-lg border border-emerald-500 text-xs self-end shadow-xs">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-medium text-[#241510] text-[10px] truncate max-w-[200px]">{currentOrder.customer.address}, {currentOrder.customer.city}</span>
                </div>
              </div>

              {/* Status Updates Timeline */}
              <div>
                <h4 className="text-xs font-serif font-bold text-[#241510] mb-2">
                  Dispatch Log
                </h4>
                <div className="space-y-1.5">
                  {currentOrder.statusHistory.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8]">
                      <div className="w-2 h-2 rounded-full bg-[#C58940] mt-1 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-[#241510] text-xs">{item.status}</span>
                          <span className="text-[10px] text-[#8C766B] font-mono">{item.timestamp}</span>
                        </div>
                        <p className="text-[#6B574E] text-[11px] mt-0.5">{item.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* Right Column: Order Summary & Rider Details */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Delivery Partner Details Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E8DFD8] shadow-xs space-y-3">
              <span className="text-[11px] font-medium text-[#8C766B] block">
                Thermal Delivery Specialist
              </span>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] flex items-center justify-center text-[#241510] font-medium text-sm">
                  {currentOrder.deliveryPartner.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h4 className="font-semibold text-[#241510] text-sm">
                    {currentOrder.deliveryPartner.name}
                  </h4>
                  <p className="text-xs text-[#8C766B] font-mono">
                    {currentOrder.deliveryPartner.vehicleNumber}
                  </p>
                </div>
              </div>

              {/* Contact rider or support buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {currentOrder.deliveryPartner.phone ? (
                  <a
                    href={`tel:${currentOrder.deliveryPartner.phone}`}
                    className="py-2 px-3 rounded-full bg-[#FAF7F2] border border-[#E8DFD8] hover:border-[#241510] text-[#241510] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#5C4033]" />
                    <span>Call Courier</span>
                  </a>
                ) : (
                  <button
                    onClick={copyOtp}
                    className="py-2 px-3 rounded-full bg-[#FAF7F2] border border-[#E8DFD8] hover:border-[#241510] text-[#241510] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#5C4033]" />
                    <span>{copiedOtp ? 'Copied OTP' : 'Copy OTP'}</span>
                  </button>
                )}
                <a
                  href={getWhatsAppSupportLink(`Order #${currentOrder.orderNumber}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3 rounded-full bg-[#FAF7F2] border border-[#E8DFD8] hover:border-[#241510] text-[#241510] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Support</span>
                </a>
              </div>
            </div>

            {/* WhatsApp Updates Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD8] shadow-xs space-y-2.5">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-700" />
                <h4 className="font-semibold text-[#241510] text-xs">
                  Instant WhatsApp Updates
                </h4>
              </div>
              <p className="text-xs text-[#6B574E] leading-relaxed">
                Receive invoice PDFs and parcel dispatch photos directly to your WhatsApp.
              </p>

              <a
                href={getWhatsAppOrderLink(currentOrder)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3 rounded-full bg-[#241510] hover:bg-[#3D2317] text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <span>Send to WhatsApp</span>
                <ExternalLink className="w-3 h-3 text-[#C58940]" />
              </a>
            </div>

            {/* Items in this order */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E8DFD8] shadow-xs space-y-3">
              <span className="text-xs font-serif font-bold text-[#241510] block">
                Order Summary ({currentOrder.items.length})
              </span>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {currentOrder.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 p-2 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8]">
                    <img 
                      src={item.product.image} 
                      alt={item.product.name} 
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-lg object-cover border border-[#E8DFD8] shrink-0" 
                    />
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-medium text-[#241510] truncate">{item.product.name}</h5>
                      <span className="text-[11px] text-[#8C766B] font-mono">
                        {item.quantity} × ₹{item.product.price}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-[#241510]">
                      ₹{item.quantity * item.product.price}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="pt-2 border-t border-[#E8DFD8] space-y-1 text-xs text-[#5C4033]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono">₹{currentOrder.itemTotal}</span>
                </div>
                {currentOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount</span>
                    <span className="font-mono">-₹{currentOrder.discount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Packaging & Delivery</span>
                  <span className="font-mono">
                    {currentOrder.deliveryFee === 0 ? 'FREE' : `₹${currentOrder.deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-[#241510] pt-1.5 border-t border-[#E8DFD8] text-sm">
                  <span>Total ({currentOrder.paymentMethod})</span>
                  <span className="font-mono">₹{currentOrder.totalAmount}</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
};
