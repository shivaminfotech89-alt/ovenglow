import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, Order, OrderStatus } from '../types';
import { 
  Package, 
  ShoppingBag, 
  TrendingUp, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  MessageSquare, 
  Clock, 
  DollarSign, 
  FileText, 
  Search, 
  Filter, 
  ShieldCheck, 
  Truck, 
  AlertCircle,
  Download,
  BarChart3,
  Lock,
  Mail,
  UserCheck,
  LogOut,
  Sparkles,
  Phone,
  MapPin,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  KeyRound,
  ChefHat,
  Flame,
  Layers,
  Cake,
  Gift,
  Settings,
  UserPlus,
  Users,
  Save,
  CheckCircle2
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const { 
    products, 
    orders, 
    updateOrderStatus, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    getAnalytics,
    getWhatsAppOrderLink,
    setActiveTab,
    setActiveTrackingId,
    ownerUser,
    loginAsOwner,
    logoutOwner,
    admins,
    addAdmin,
    removeAdmin,
    storeSettings,
    updateStoreSettings
  } = useStore();

  // Login Form state for unauthenticated owner
  const [loginEmailInput, setLoginEmailInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active Admin Tab
  const [activeAdminTab, setActiveAdminTab] = useState<'orders' | 'inventory' | 'analytics' | 'settings' | 'admins' | 'boutique'>('orders');
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState<string>('');

  // Store Settings Form state
  const [settingsForm, setSettingsForm] = useState(storeSettings);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState<string | null>(null);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaPin, setNewAreaPin] = useState('');

  // Sync settingsForm when storeSettings changes
  useEffect(() => {
    setSettingsForm(storeSettings);
  }, [storeSettings]);

  // Admin Team Management state
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adminActionMsg, setAdminActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // OTP Verification modal or quick verify state
  const [verifyingOrderId, setVerifyingOrderId] = useState<string | null>(null);
  const [inputOtp, setInputOtp] = useState<string>('');
  const [otpError, setOtpError] = useState<string | null>(null);

  // Add/Edit Product Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [quickPriceVal, setQuickPriceVal] = useState<number>(0);

  // New Product Form state
  const [productForm, setProductForm] = useState<Omit<Product, 'id'>>({
    name: '',
    hindiSubname: '',
    tagline: '',
    description: '',
    price: 499,
    originalPrice: 650,
    category: 'artisanal-chocolates',
    image: 'https://images.unsplash.com/photo-1548741487-18d16a1a0821?auto=format&fit=crop&w=900&q=80',
    secondaryImages: [],
    inStock: true,
    stockCount: 25,
    isVeg: true,
    rating: 4.9,
    reviewCount: 1,
    weightGrams: 100,
    cacaoPercentage: 60,
    shelfLife: '6 Months',
    isBestseller: false,
    isFestiveSpecial: false,
    flavorNotes: ['Belgian Cocoa', 'Roasted Nuts'],
    layers: [
      { name: 'Topping', description: 'Gold dust & nuts', color: '#E5A93C' },
      { name: 'Core', description: 'Artisanal ganache', color: '#451A03' }
    ]
  });

  const analytics = getAnalytics();

  // Handle owner login
  const handleQuickOwnerLogin = (email: string) => {
    setLoginError(null);
    const res = loginAsOwner(email);
    if (!res.success) {
      setLoginError(res.message);
    }
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmailInput.trim()) return;
    setLoginError(null);
    const res = loginAsOwner(loginEmailInput);
    if (!res.success) {
      setLoginError(res.message);
    }
  };

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    const matchesFilter = orderFilter === 'all' || o.status === orderFilter;
    const matchesSearch = 
      o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customer.name.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customer.phone.includes(orderSearch) ||
      o.customer.city.toLowerCase().includes(orderSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Verify OTP for Handover
  const handleVerifyOtp = (order: Order) => {
    if (inputOtp.trim() === order.deliveryOtp) {
      updateOrderStatus(order.id, 'Delivered', 'Verified with delivery OTP at customer doorstep');
      setVerifyingOrderId(null);
      setInputOtp('');
      setOtpError(null);
    } else {
      setOtpError(`Invalid OTP. Customer's registered handover OTP is ${order.deliveryOtp}`);
    }
  };

  // Export Analytics to CSV
  const exportCSVReport = () => {
    const headers = ['Order Number', 'Date', 'Customer Name', 'Phone', 'City', 'Payment Method', 'Status', 'Total Amount (INR)'];
    const rows = orders.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleDateString('en-IN'),
      `"${o.customer.name}"`,
      o.customer.phone,
      o.customer.city,
      o.paymentMethod,
      o.status,
      o.totalAmount
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Ovenglow_Sales_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Save Store Settings Handler
  const handleSaveStoreSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreSettings(settingsForm);
    setSettingsSavedMsg('Store & location configuration updated and persisted successfully.');
    setTimeout(() => setSettingsSavedMsg(null), 4000);
  };

  // Add Delivery Coverage Area
  const handleAddDeliveryArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAreaName.trim()) return;
    const currentAreas = settingsForm.deliveryAreas || [];
    const updatedAreas = [...currentAreas, { name: newAreaName.trim(), pincode: newAreaPin.trim() || undefined }];
    const updated = { ...settingsForm, deliveryAreas: updatedAreas };
    setSettingsForm(updated);
    updateStoreSettings(updated);
    setNewAreaName('');
    setNewAreaPin('');
  };

  // Remove Delivery Coverage Area
  const handleRemoveDeliveryArea = (index: number) => {
    const updatedAreas = (settingsForm.deliveryAreas || []).filter((_, i) => i !== index);
    const updated = { ...settingsForm, deliveryAreas: updatedAreas };
    setSettingsForm(updated);
    updateStoreSettings(updated);
  };

  // Add New Administrator Handler
  const handleAddNewAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminActionMsg(null);
    if (!newAdminName.trim() || !newAdminEmail.trim()) {
      setAdminActionMsg({ type: 'error', text: 'Please provide both Administrator Name and Email Address.' });
      return;
    }
    const res = addAdmin(newAdminEmail.trim(), newAdminName.trim(), 'Full Administrative Control (All Powers)');
    if (res.success) {
      setAdminActionMsg({ type: 'success', text: `Administrator ${newAdminName.trim()} (${newAdminEmail.trim()}) authorized with Full Control.` });
      setNewAdminName('');
      setNewAdminEmail('');
      setTimeout(() => setAdminActionMsg(null), 5000);
    } else {
      setAdminActionMsg({ type: 'error', text: res.message });
    }
  };

  // Remove Administrator Handler
  const handleRemoveAdmin = (id: string, name: string) => {
    if (confirm(`Are you sure you want to revoke administrative powers for ${name}?`)) {
      const res = removeAdmin(id);
      if (res.success) {
        setAdminActionMsg({ type: 'success', text: `Revoked administrative credentials for ${name}.` });
        setTimeout(() => setAdminActionMsg(null), 4000);
      } else {
        setAdminActionMsg({ type: 'error', text: res.message });
      }
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProductId) {
      updateProduct(editingProductId, productForm);
    } else {
      addProduct(productForm);
    }
    setIsAddModalOpen(false);
    setEditingProductId(null);
  };

  const handleStartEditProduct = (p: Product) => {
    setProductForm({
      name: p.name,
      hindiSubname: p.hindiSubname || '',
      tagline: p.tagline,
      description: p.description,
      price: p.price,
      originalPrice: p.originalPrice,
      category: p.category,
      image: p.image,
      secondaryImages: p.secondaryImages || [],
      inStock: p.inStock,
      stockCount: p.stockCount,
      isVeg: p.isVeg,
      rating: p.rating,
      reviewCount: p.reviewCount,
      weightGrams: p.weightGrams,
      cacaoPercentage: p.cacaoPercentage || 50,
      shelfLife: p.shelfLife,
      isBestseller: !!p.isBestseller,
      isFestiveSpecial: !!p.isFestiveSpecial,
      flavorNotes: p.flavorNotes || [],
      layers: p.layers || []
    });
    setEditingProductId(p.id);
    setIsAddModalOpen(true);
  };

  // If owner is NOT authenticated, show the common prestigious Admin Login Gate
  if (!ownerUser) {
    return (
      <div id="owner-login-gate" className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="bg-white border border-[#E8DFD8] rounded-3xl p-6 sm:p-10 shadow-lg text-[#241510] space-y-7">
          
          {/* Header Banner */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF7F2] border border-[#E8DFD8] text-xs font-semibold text-[#5C4033]">
              <Lock className="w-3.5 h-3.5 text-[#C58940]" />
              <span>Ovenglow Atelier • Executive Control Portal</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#241510] tracking-tight">
              Store Administrator Sign In
            </h2>
            
            <p className="text-xs sm:text-sm text-[#8C766B] leading-relaxed max-w-lg mx-auto">
              Secure administrative access for {storeSettings.storeName} ({storeSettings.city}). Manage kitchen fulfillment, dynamic location & address settings, chocolate catalog, and administrative team control.
            </p>
          </div>

          {/* Common Unified Administrator Sign In Card */}
          <div className="bg-[#FAF7F2] border border-[#E8DFD8] rounded-2xl p-6 space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#241510] text-[#E5A93C] mx-auto flex items-center justify-center font-serif font-bold text-xl shadow-xs">
              <ShieldCheck className="w-7 h-7 text-[#E5A93C]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#241510]">
                Unified Administrator Authentication
              </h3>
              <p className="text-xs text-[#8C766B]">
                All authorized administrators hold 100% equal storewide management power.
              </p>
              <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Full Administrative Control & All Powers</span>
              </div>
            </div>

            {/* Direct 1-Click Common Administrator Sign-In */}
            <button
              id="btn-login-common-admin"
              onClick={() => handleQuickOwnerLogin(admins[0]?.email || 'shivaminfotech89@gmail.com')}
              className="w-full py-3 px-5 rounded-xl bg-[#241510] hover:bg-[#3D2317] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2.5 transition-all active:scale-98 shadow-sm"
            >
              <KeyRound className="w-4 h-4 text-[#E5A93C]" />
              <span>Sign In with Administrator Power</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Alternative: Enter Any Authorized Administrator Email */}
          <div className="border-t border-[#E8DFD8] pt-5 space-y-3">
            <form onSubmit={handleManualLogin} className="space-y-2.5">
              <label className="block text-xs font-medium text-[#5C4033] text-center">
                Or enter registered administrator email
              </label>
              
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 text-[#8C766B] absolute left-3 top-2.5" />
                  <input
                    type="email"
                    placeholder="shivaminfotech89@gmail.com"
                    value={loginEmailInput}
                    onChange={(e) => {
                      setLoginEmailInput(e.target.value);
                      setLoginError(null);
                    }}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-xs font-mono text-[#241510] placeholder:text-[#A69286] focus:outline-none focus:border-[#241510]"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#241510] hover:bg-[#3D2317] text-white text-xs font-medium shrink-0 transition-colors shadow-xs"
                >
                  Authenticate
                </button>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}
            </form>
          </div>

          {/* Security Guarantee */}
          <div className="text-center pt-2 border-t border-[#E8DFD8]">
            <p className="text-[11px] text-[#8C766B] flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Executive sessions are securely stored in your local browser sandbox.</span>
            </p>
          </div>

        </div>
      </div>
    );
  }

  // Owner IS authenticated - Full Admin Dashboard
  return (
    <div id="ovenglow-admin-dashboard" className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
      
      {/* Top Owner Executive Header Bar */}
      <div className="bg-white border border-[#E8DFD8] rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left: Owner Profile & Status */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#241510] text-[#E5A93C] flex items-center justify-center font-serif font-bold text-lg shadow-xs">
            CO
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Full Administrative Control (All Powers)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#241510] flex items-center gap-2 mt-0.5">
              <span>{ownerUser.name}</span>
            </h2>
            <p className="text-xs font-mono text-[#5C4033]">
              {ownerUser.email}
            </p>
          </div>
        </div>

        {/* Right: Quick actions & Logout */}
        <div className="flex flex-wrap items-center gap-2.5 border-t md:border-t-0 pt-3 md:pt-0 border-[#E8DFD8]">
          <button
            onClick={() => setActiveTab('shop')}
            className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F2ECE4] border border-[#E8DFD8] text-xs font-medium text-[#5C4033] flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Storefront</span>
          </button>

          <button
            onClick={exportCSVReport}
            className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F2ECE4] border border-[#E8DFD8] text-xs font-medium text-[#5C4033] flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#C58940]" />
            <span>Export Orders CSV</span>
          </button>

          {/* Manage Admins Shortcut */}
          <button
            onClick={() => setActiveAdminTab('admins')}
            className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F2ECE4] border border-[#E8DFD8] text-xs font-medium text-[#5C4033] flex items-center gap-1.5 transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-[#C58940]" />
            <span>Admin Team ({admins.length})</span>
          </button>

          {/* Sign Out */}
          <button
            onClick={logoutOwner}
            title="Sign out of Admin Console"
            className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-medium text-rose-700 flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit Console</span>
          </button>
        </div>

      </div>

      {/* KPI METRICS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#E8DFD8] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#8C766B]">
            <span>Gross Revenue</span>
            <DollarSign className="w-3.5 h-3.5 text-[#C58940]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-sans text-[#241510]">
            ₹{analytics.totalRevenue.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-emerald-700 font-medium block">
            ↑ 24.5% festive seasonal demand
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E8DFD8] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#8C766B]">
            <span>Total Orders</span>
            <ShoppingBag className="w-3.5 h-3.5 text-[#C58940]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-sans text-[#241510]">
            {analytics.totalOrders}
          </div>
          <span className="text-[11px] text-[#8C766B] block">
            {orders.filter(o => o.status === 'OutForDelivery' || o.status === 'Baking').length} in active kitchen fulfillment
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E8DFD8] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#8C766B]">
            <span>Average Order Value</span>
            <TrendingUp className="w-3.5 h-3.5 text-[#C58940]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-sans text-[#241510]">
            ₹{analytics.averageOrderValue}
          </div>
          <span className="text-[11px] text-[#8C766B] block">
            Multi-bar gift boxes & hampers
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E8DFD8] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#8C766B]">
            <span>Active SKUs</span>
            <Package className="w-3.5 h-3.5 text-[#C58940]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-sans text-[#241510]">
            {products.length}
          </div>
          <span className="text-[11px] text-emerald-700 font-medium block">
            100% Eggless pure cocoa butter
          </span>
        </div>
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="flex items-center justify-between border-b border-[#E8DFD8] pb-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            id="admin-tab-orders"
            onClick={() => setActiveAdminTab('orders')}
            className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 transition-all shrink-0 ${
              activeAdminTab === 'orders'
                ? 'bg-[#241510] text-white shadow-xs'
                : 'bg-white text-[#5C4033] hover:bg-[#FAF7F2] border border-[#E8DFD8]'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Kitchen Orders ({orders.length})</span>
          </button>

          <button
            id="admin-tab-inventory"
            onClick={() => setActiveAdminTab('inventory')}
            className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 transition-all shrink-0 ${
              activeAdminTab === 'inventory'
                ? 'bg-[#241510] text-white shadow-xs'
                : 'bg-white text-[#5C4033] hover:bg-[#FAF7F2] border border-[#E8DFD8]'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Atelier Confections ({products.length})</span>
          </button>

          <button
            id="admin-tab-settings"
            onClick={() => setActiveAdminTab('settings')}
            className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 transition-all shrink-0 ${
              activeAdminTab === 'settings'
                ? 'bg-[#241510] text-white shadow-xs'
                : 'bg-white text-[#5C4033] hover:bg-[#FAF7F2] border border-[#E8DFD8]'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-[#C58940]" />
            <span>Store & Address</span>
          </button>

          <button
            id="admin-tab-admins"
            onClick={() => setActiveAdminTab('admins')}
            className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 transition-all shrink-0 ${
              activeAdminTab === 'admins'
                ? 'bg-[#241510] text-white shadow-xs'
                : 'bg-white text-[#5C4033] hover:bg-[#FAF7F2] border border-[#E8DFD8]'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#C58940]" />
            <span>Admin Team ({admins.length})</span>
          </button>

          <button
            id="admin-tab-analytics"
            onClick={() => setActiveAdminTab('analytics')}
            className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 transition-all shrink-0 ${
              activeAdminTab === 'analytics'
                ? 'bg-[#241510] text-white shadow-xs'
                : 'bg-white text-[#5C4033] hover:bg-[#FAF7F2] border border-[#E8DFD8]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>P&L Analytics</span>
          </button>

          <button
            id="admin-tab-boutique"
            onClick={() => setActiveAdminTab('boutique')}
            className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 transition-all shrink-0 ${
              activeAdminTab === 'boutique'
                ? 'bg-[#241510] text-white shadow-xs'
                : 'bg-white text-[#5C4033] hover:bg-[#FAF7F2] border border-[#E8DFD8]'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>Kitchen Contacts</span>
          </button>
        </div>

        {activeAdminTab === 'inventory' && (
          <button
            id="btn-add-product"
            onClick={() => {
              setEditingProductId(null);
              setProductForm({
                name: '',
                hindiSubname: '',
                tagline: '',
                description: '',
                price: 499,
                originalPrice: 650,
                category: 'artisanal-chocolates',
                image: 'https://images.unsplash.com/photo-1548741487-18d16a1a0821?auto=format&fit=crop&w=900&q=80',
                secondaryImages: [],
                inStock: true,
                stockCount: 25,
                isVeg: true,
                rating: 4.9,
                reviewCount: 1,
                weightGrams: 100,
                cacaoPercentage: 60,
                shelfLife: '6 Months',
                isBestseller: false,
                isFestiveSpecial: false,
                flavorNotes: ['Belgian Cocoa', 'Roasted Nuts'],
                layers: [
                  { name: 'Topping', description: 'Gold dust & nuts', color: '#E5A93C' },
                  { name: 'Core', description: 'Artisanal ganache', color: '#451A03' }
                ]
              });
              setIsAddModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-full bg-[#241510] hover:bg-[#3D2317] text-white text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#E5A93C]" />
            <span className="hidden sm:inline">Add Confection</span>
          </button>
        )}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: KITCHEN ORDERS & THERMAL DISPATCH */}
      {/* ========================================================= */}
      {activeAdminTab === 'orders' && (
        <div className="space-y-4">
          
          {/* Search & Status Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E8DFD8]">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[#8C766B] absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by order ID, customer name, phone, or city..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#E8DFD8] text-xs text-[#241510] placeholder:text-[#A69286] focus:outline-none focus:border-[#241510]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {['all', 'Placed', 'Confirmed', 'Baking', 'Packed', 'OutForDelivery', 'Delivered'].map((st) => (
                <button
                  key={st}
                  onClick={() => setOrderFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    orderFilter === st
                      ? 'bg-[#241510] text-white'
                      : 'bg-[#FAF7F2] text-[#5C4033] hover:bg-[#F2ECE4]'
                  }`}
                >
                  {st === 'all' ? 'All Orders' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-[#E8DFD8] space-y-2">
                <Truck className="w-8 h-8 text-[#C58940] mx-auto opacity-50" />
                <p className="text-sm font-medium text-[#241510]">No orders found matching this filter</p>
                <p className="text-xs text-[#8C766B]">Try changing the search query or status filter.</p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order.id}
                  id={`order-row-${order.id}`}
                  className="bg-white border border-[#E8DFD8] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 transition-all hover:border-[#C58940]"
                >
                  {/* Order Top Line */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0EAE1] pb-3">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className="font-mono font-bold text-sm text-[#241510]">
                        {order.orderNumber}
                      </span>
                      <span className="text-xs text-[#8C766B]">
                        {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                        order.status === 'OutForDelivery' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'Baking' ? 'bg-amber-100 text-amber-800' :
                        'bg-[#FAF7F2] text-[#5C4033] border border-[#E8DFD8]'
                      }`}>
                        {order.status}
                      </span>
                      <span className="text-xs font-mono text-[#8C766B]">
                        Payment: {order.paymentMethod} ({order.paymentStatus})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setActiveTrackingId(order.orderNumber);
                          setActiveTab('track');
                        }}
                        className="text-xs text-[#C58940] hover:underline flex items-center gap-1 font-medium"
                      >
                        <span>Customer Live View</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Order Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    
                    {/* Customer info */}
                    <div className="space-y-1.5 p-3 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8]">
                      <span className="text-[10px] font-semibold text-[#8C766B] uppercase tracking-wider block">
                        Customer & Address
                      </span>
                      <p className="font-bold text-[#241510] text-sm">{order.customer.name}</p>
                      <p className="text-[#5C4033] flex items-center gap-1">
                        <Phone className="w-3 h-3 text-[#C58940]" />
                        <span>{order.customer.phone}</span>
                      </p>
                      <p className="text-[#5C4033] flex items-center gap-1">
                        <Mail className="w-3 h-3 text-[#C58940]" />
                        <span>{order.customer.email}</span>
                      </p>
                      <p className="text-[#5C4033] flex items-start gap-1">
                        <MapPin className="w-3 h-3 text-[#C58940] shrink-0 mt-0.5" />
                        <span>{order.customer.address}, {order.customer.city} ({order.customer.pincode})</span>
                      </p>
                      
                      {/* WhatsApp Ping button */}
                      <div className="pt-1">
                        <a
                          href={getWhatsAppOrderLink(order)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px] transition-colors"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>WhatsApp Customer</span>
                        </a>
                      </div>
                    </div>

                    {/* Items Breakdown */}
                    <div className="space-y-2 p-3 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8]">
                      <span className="text-[10px] font-semibold text-[#8C766B] uppercase tracking-wider block">
                        Confections ({order.items.reduce((s, i) => s + i.quantity, 0)} items)
                      </span>
                      <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs py-0.5 border-b border-[#E8DFD8]/50 last:border-0">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-mono text-[#C58940] font-bold">{item.quantity}x</span>
                              <span className="text-[#241510] truncate">{item.product.name}</span>
                            </div>
                            <span className="font-mono text-[#5C4033] shrink-0">₹{item.product.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="pt-1 border-t border-[#E8DFD8] flex items-center justify-between font-bold text-sm text-[#241510]">
                        <span>Total:</span>
                        <span className="font-mono">₹{order.totalAmount}</span>
                      </div>

                      {/* Gift Note if any */}
                      {order.customer.giftMessage && (
                        <div className="p-2 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-900 text-[11px] italic">
                          "{order.customer.giftMessage}"
                        </div>
                      )}
                    </div>

                    {/* Fulfillment & Delivery Actions */}
                    <div className="space-y-2.5 p-3 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-semibold text-[#8C766B] uppercase tracking-wider block">
                          Fulfillment & Handover
                        </span>
                        
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#8C766B]">Courier:</span>
                          <span className="font-medium text-[#241510]">{order.deliveryPartner.name}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#8C766B]">Handover OTP:</span>
                          <span className="font-mono font-bold text-[#C58940] bg-white px-2 py-0.5 rounded border border-[#E8DFD8]">
                            {order.deliveryOtp}
                          </span>
                        </div>
                      </div>

                      {/* Quick Status Advance Buttons */}
                      <div className="pt-2 border-t border-[#E8DFD8] space-y-1.5">
                        <label className="text-[10px] font-medium text-[#8C766B] block">Update Kitchen Status:</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {order.status === 'Placed' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'Confirmed', 'Order accepted by kitchen')}
                              className="col-span-2 py-1.5 px-2 rounded-lg bg-[#241510] text-white text-[11px] font-medium hover:bg-[#3D2317] transition-colors"
                            >
                              Accept & Confirm
                            </button>
                          )}

                          {order.status === 'Confirmed' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'Baking', 'Baking & chocolate tempering started')}
                              className="col-span-2 py-1.5 px-2 rounded-lg bg-amber-700 text-white text-[11px] font-medium hover:bg-amber-800 transition-colors"
                            >
                              Start Baking & Tempering
                            </button>
                          )}

                          {order.status === 'Baking' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'Packed', 'Insulated silver pack with cooling gels')}
                              className="col-span-2 py-1.5 px-2 rounded-lg bg-blue-700 text-white text-[11px] font-medium hover:bg-blue-800 transition-colors"
                            >
                              Pack in Thermal Cold-Chain
                            </button>
                          )}

                          {order.status === 'Packed' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'OutForDelivery', 'Handed to courier electric thermal van')}
                              className="col-span-2 py-1.5 px-2 rounded-lg bg-indigo-700 text-white text-[11px] font-medium hover:bg-indigo-800 transition-colors"
                            >
                              Dispatch with Thermal Courier
                            </button>
                          )}

                          {order.status === 'OutForDelivery' && (
                            <div className="col-span-2 space-y-1">
                              <div className="flex gap-1">
                                <input
                                  type="text"
                                  maxLength={4}
                                  placeholder="Enter 4-digit OTP"
                                  value={verifyingOrderId === order.id ? inputOtp : ''}
                                  onChange={(e) => {
                                    setVerifyingOrderId(order.id);
                                    setInputOtp(e.target.value);
                                    setOtpError(null);
                                  }}
                                  className="w-full px-2 py-1 bg-white border border-[#E8DFD8] rounded text-xs font-mono text-center"
                                />
                                <button
                                  onClick={() => handleVerifyOtp(order)}
                                  className="px-2.5 py-1 bg-emerald-700 text-white rounded text-xs font-medium hover:bg-emerald-800"
                                >
                                  Verify
                                </button>
                              </div>
                              {verifyingOrderId === order.id && otpError && (
                                <p className="text-[10px] text-rose-600 font-medium">{otpError}</p>
                              )}
                            </div>
                          )}

                          {order.status === 'Delivered' && (
                            <div className="col-span-2 py-1.5 px-2 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-medium flex items-center justify-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>Delivered Successfully</span>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                  </div>

                </div>
              ))
            )}
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ATELIER CONFECTIONS & MENU MANAGEMENT */}
      {/* ========================================================= */}
      {activeAdminTab === 'inventory' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E8DFD8] rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#E8DFD8] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-serif font-bold text-lg text-[#241510]">
                Handcrafted Confectionery Catalog ({products.length})
              </h3>
              <p className="text-xs text-[#8C766B]">
                Click price to inline edit • Manage live stock & dietary certifications
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] text-[#8C766B] uppercase font-semibold text-[10px] tracking-wider border-b border-[#E8DFD8]">
                  <tr>
                    <th className="py-3 px-4">Confection</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price (₹)</th>
                    <th className="py-3 px-4">Stock</th>
                    <th className="py-3 px-4">Dietary</th>
                    <th className="py-3 px-4">Cacao %</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EAE1]">
                  {products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                      
                      {/* Product details */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={prod.image} 
                            alt={prod.name}
                            className="w-10 h-10 rounded-lg object-cover border border-[#E8DFD8] shrink-0" 
                          />
                          <div>
                            <span className="font-bold text-[#241510] block max-w-xs truncate">
                              {prod.name}
                            </span>
                            {prod.hindiSubname && (
                              <span className="text-[10px] text-[#8C766B] font-normal block truncate">
                                {prod.hindiSubname}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-[#5C4033]">
                        <span className="capitalize">{prod.category.replace('-', ' ')}</span>
                      </td>

                      {/* Price inline editor */}
                      <td className="py-3 px-4 font-mono font-bold text-[#241510]">
                        {editingPriceId === prod.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={quickPriceVal}
                              onChange={(e) => setQuickPriceVal(Number(e.target.value))}
                              className="w-16 px-1.5 py-0.5 bg-white border border-[#241510] rounded text-xs font-mono"
                            />
                            <button
                              onClick={() => {
                                updateProduct(prod.id, { price: quickPriceVal });
                                setEditingPriceId(null);
                              }}
                              className="p-1 text-emerald-700 hover:bg-emerald-50 rounded"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingPriceId(null)}
                              className="p-1 text-[#8C766B] hover:bg-gray-100 rounded"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div 
                            onClick={() => {
                              setEditingPriceId(prod.id);
                              setQuickPriceVal(prod.price);
                            }}
                            className="flex items-center gap-1 cursor-pointer hover:text-[#C58940]"
                            title="Click to inline edit price"
                          >
                            <span>₹{prod.price}</span>
                            <Edit3 className="w-3 h-3 text-[#8C766B] opacity-50" />
                          </div>
                        )}
                      </td>

                      {/* Stock with quick buttons */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-medium ${prod.stockCount < 10 ? 'text-rose-600' : 'text-[#241510]'}`}>
                            {prod.stockCount} units
                          </span>
                          <button
                            onClick={() => updateProduct(prod.id, { stockCount: prod.stockCount + 5 })}
                            className="px-1.5 py-0.5 rounded bg-[#FAF7F2] border border-[#E8DFD8] text-[10px] text-[#5C4033] hover:bg-white"
                            title="Add 5 units to inventory"
                          >
                            +5
                          </button>
                        </div>
                      </td>

                      {/* Dietary Badges */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => updateProduct(prod.id, { isVeg: !prod.isVeg })}
                          className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                            prod.isVeg 
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                              : 'bg-amber-50 border-amber-300 text-amber-800'
                          }`}
                        >
                          {prod.isVeg ? '100% Eggless' : 'Contains Egg'}
                        </button>
                      </td>

                      {/* Cacao % */}
                      <td className="py-3 px-4 font-mono text-[#5C4033]">
                        {prod.cacaoPercentage ? `${prod.cacaoPercentage}%` : 'N/A'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleStartEditProduct(prod)}
                            className="p-1.5 rounded-lg text-[#5C4033] hover:bg-[#FAF7F2] hover:text-[#241510] transition-colors"
                            title="Edit full recipe details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to remove "${prod.name}" from Ovenglow menu?`)) {
                                deleteProduct(prod.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete confection"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: FINANCIAL P&L & ANALYTICS */}
      {/* ========================================================= */}
      {activeAdminTab === 'analytics' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Category Revenue Breakdown */}
            <div className="bg-white border border-[#E8DFD8] rounded-2xl p-5 shadow-xs space-y-4">
              <h4 className="font-serif font-bold text-base text-[#241510] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#C58940]" />
                <span>Sales by Confectionery Collection</span>
              </h4>

              <div className="space-y-3">
                {Object.entries(analytics.categoryRevenue).map(([cat, rev]) => {
                  const revNum = Number(rev) || 0;
                  const percent = analytics.totalRevenue > 0 
                    ? Math.round((revNum / analytics.totalRevenue) * 100) 
                    : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="capitalize text-[#5C4033]">{cat.replace('-', ' ')}</span>
                        <span className="font-mono font-bold text-[#241510]">₹{revNum} ({percent}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#FAF7F2] overflow-hidden">
                        <div 
                          className="h-full bg-[#241510] rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Method Distribution */}
            <div className="bg-white border border-[#E8DFD8] rounded-2xl p-5 shadow-xs space-y-4">
              <h4 className="font-serif font-bold text-base text-[#241510] flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#C58940]" />
                <span>Payment Settlement Methods</span>
              </h4>

              <div className="space-y-3">
                {Object.entries(analytics.paymentMethodBreakdown).map(([method, count]) => {
                  const countNum = Number(count) || 0;
                  const percent = analytics.totalOrders > 0 
                    ? Math.round((countNum / analytics.totalOrders) * 100) 
                    : 0;
                  return (
                    <div key={method} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#5C4033]">{method} (Google Pay, PhonePe, Cards)</span>
                        <span className="font-mono font-bold text-[#241510]">{countNum} orders ({percent}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#FAF7F2] overflow-hidden">
                        <div 
                          className="h-full bg-[#C58940] rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-[#E8DFD8]">
                <button
                  onClick={exportCSVReport}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#241510] hover:bg-[#3D2317] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-[#E5A93C]" />
                  <span>Download Full Financial Settlement Sheet (CSV)</span>
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: KITCHEN CONTACTS & BOUTIQUE SETTINGS */}
      {/* ========================================================= */}
      {activeAdminTab === 'boutique' && (
        <div className="bg-white border border-[#E8DFD8] rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b border-[#E8DFD8] pb-4">
            <h3 className="text-xl font-serif font-bold text-[#241510]">
              Ovenglow Executive Contacts & Operations
            </h3>
            <p className="text-xs text-[#8C766B]">
              Direct contact channels for corporate gifting, wedding cakes, and boutique administration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Owner Email 1 */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#241510]">
                <Mail className="w-4 h-4 text-[#C58940]" />
                <span>Head Chocolatier & Founder</span>
              </div>
              <p className="font-mono text-xs text-[#5C4033]">
                ovenglowdelights@gmail.com
              </p>
              <p className="text-[11px] text-[#8C766B]">
                Primary atelier management, single-estate cacao bean sourcing, recipes, and bespoke confectionery tasting requests.
              </p>
              <a
                href="mailto:ovenglowdelights@gmail.com"
                className="inline-block mt-2 text-xs text-[#C58940] hover:underline font-medium"
              >
                Send Direct Mail →
              </a>
            </div>

            {/* Owner Email 2 */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#241510]">
                <Mail className="w-4 h-4 text-[#C58940]" />
                <span>Executive Operations & Logistics Desk</span>
              </div>
              <p className="font-mono text-xs text-[#5C4033]">
                ovenglowdelights@gmail.com (Attn: Operations)
              </p>
              <p className="text-[11px] text-[#8C766B]">
                Technical systems, cold-chain thermal logistics across 500+ Indian cities, payment settlements, and corporate partnership contracts.
              </p>
              <a
                href="mailto:ovenglowdelights@gmail.com?subject=Attn:%20Ovenglow%20Operations%20%26%20Logistics"
                className="inline-block mt-2 text-xs text-[#C58940] hover:underline font-medium"
              >
                Contact Operations Desk →
              </a>
            </div>

          </div>

          {/* Bakery Atelier Specs */}
          <div className="border-t border-[#E8DFD8] pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-[#8C766B] font-medium block">Kitchen Location</span>
              <p className="font-medium text-[#241510]">{storeSettings.address}, {storeSettings.city} {storeSettings.pincode}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[#8C766B] font-medium block">FSSAI Certified Atelier</span>
              <p className="font-mono text-[#241510]">Lic. No. {storeSettings.fssaiLicense}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[#8C766B] font-medium block">Tempering Guarantee</span>
              <p className="font-medium text-emerald-700">100% Pure Cocoa Butter (No Palm Oil)</p>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* STORE & ADDRESS SETTINGS TAB */}
      {/* ========================================================= */}
      {activeAdminTab === 'settings' && (
        <div id="admin-settings-section" className="space-y-6">
          
          {/* Header */}
          <div className="bg-white border border-[#E8DFD8] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#C58940]" />
                <h3 className="font-serif font-bold text-lg text-[#241510]">
                  Store & Location Settings
                </h3>
              </div>
              <p className="text-xs text-[#8C766B] mt-1">
                Enter and manage atelier location (Ahmedabad), physical address, phone line, WhatsApp, UPI ID, and delivery radius.
              </p>
            </div>

            <button
              onClick={handleSaveStoreSettings}
              className="px-5 py-2.5 rounded-xl bg-[#241510] hover:bg-[#3D2317] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs self-start sm:self-auto"
            >
              <Save className="w-4 h-4 text-[#E5A93C]" />
              <span>Save Configuration</span>
            </button>
          </div>

          {/* Success Notification */}
          {settingsSavedMsg && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{settingsSavedMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveStoreSettings} className="space-y-6">
            
            {/* Grid 1: Location & Physical Address */}
            <div className="bg-white border border-[#E8DFD8] rounded-2xl p-6 shadow-xs space-y-4">
              <div className="border-b border-[#F0EAE1] pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#C58940]" />
                  <h4 className="font-bold text-sm text-[#241510]">Atelier Physical Location & Address</h4>
                </div>
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Active Hub: {settingsForm.city}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-medium text-[#5C4033] block mb-1.5">Store / Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.storeName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-[#241510] focus:outline-none focus:border-[#241510]"
                  />
                </div>

                <div>
                  <label className="font-medium text-[#5C4033] block mb-1.5">Brand Tagline *</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.tagline}
                    onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-[#241510] focus:outline-none focus:border-[#241510]"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="font-medium text-[#5C4033] block mb-1.5">Street Address / Kitchen Unit *</label>
                <textarea
                  rows={2}
                  required
                  value={settingsForm.address}
                  onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                  placeholder="Enter street address, building or landmark"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-[#241510] focus:outline-none focus:border-[#241510] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="font-medium text-[#5C4033] block mb-1.5">City *</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.city}
                    onChange={(e) => setSettingsForm({ ...settingsForm, city: e.target.value })}
                    placeholder="City"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-[#241510] focus:outline-none focus:border-[#241510] font-medium"
                  />
                </div>

                <div>
                  <label className="font-medium text-[#5C4033] block mb-1.5">State *</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.state}
                    onChange={(e) => setSettingsForm({ ...settingsForm, state: e.target.value })}
                    placeholder="State"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-[#241510] focus:outline-none focus:border-[#241510]"
                  />
                </div>

                <div>
                  <label className="font-medium text-[#5C4033] block mb-1.5">PIN Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={settingsForm.pincode}
                    onChange={(e) => setSettingsForm({ ...settingsForm, pincode: e.target.value })}
                    placeholder="PIN Code"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-[#241510] font-mono focus:outline-none focus:border-[#241510]"
                  />
                </div>

                <div>
                  <label className="font-medium text-[#5C4033] block mb-1.5">Landmark</label>
                  <input
                    type="text"
                    value={settingsForm.landmark}
                    onChange={(e) => setSettingsForm({ ...settingsForm, landmark: e.target.value })}
                    placeholder="Landmark (Optional)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-[#241510] focus:outline-none focus:border-[#241510]"
                  />
                </div>
              </div>
            </div>

            {/* Grid 2: Contact Numbers & Legal */}
            <div className="bg-white border border-[#E8DFD8] rounded-2xl p-6 shadow-xs space-y-4">
              <div className="border-b border-[#F0EAE1] pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#C58940]" />
                  <h4 className="font-bold text-sm text-[#241510]">Communications, UPI & Regulatory</h4>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="font-medium text-[#5C4033] block mb-1.5">Customer Support Mobile (Admin Line) *</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.phone}
                    onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-[#241510] font-mono focus:outline-none focus:border-[#241510]"
                  />
                </div>

                <div>
                  <label className="font-medium text-[#5C4033] block mb-1.5">WhatsApp Dispatch Line (12 digits with 91) *</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.whatsappNumber}
                    onChange={(e) => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
                    placeholder="919876543210"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-[#241510] font-mono focus:outline-none focus:border-[#241510]"
                  />
                </div>

                <div>
                  <label className="font-medium text-[#5C4033] block mb-1.5">Operations Notification Email *</label>
                  <input
                    type="email"
                    required
                    value={settingsForm.email}
                    onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                    placeholder="support@yourbakery.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-[#241510] font-mono focus:outline-none focus:border-[#241510]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="font-medium text-[#5C4033] block mb-1.5">UPI ID for Bank Transfers *</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.upiId}
                    onChange={(e) => setSettingsForm({ ...settingsForm, upiId: e.target.value })}
                    placeholder="yourhandle@upi"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-[#241510] font-mono focus:outline-none focus:border-[#241510]"
                  />
                </div>

                <div>
                  <label className="font-medium text-[#5C4033] block mb-1.5">FSSAI License Registration No. *</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.fssaiLicense}
                    onChange={(e) => setSettingsForm({ ...settingsForm, fssaiLicense: e.target.value })}
                    placeholder="14-digit FSSAI License"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-[#241510] font-mono focus:outline-none focus:border-[#241510]"
                  />
                </div>

                <div>
                  <label className="font-medium text-[#5C4033] block mb-1.5">Baking & Fulfillment Operating Hours *</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.operatingHours}
                    onChange={(e) => setSettingsForm({ ...settingsForm, operatingHours: e.target.value })}
                    placeholder="10:00 AM – 11:00 PM (Daily Fresh Baking)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-[#241510] focus:outline-none focus:border-[#241510]"
                  />
                </div>
              </div>
            </div>

            {/* Grid 3: Local Ahmedabad Delivery Coverage Areas */}
            <div className="bg-white border border-[#E8DFD8] rounded-2xl p-6 shadow-xs space-y-4">
              <div className="border-b border-[#F0EAE1] pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#C58940]" />
                  <h4 className="font-bold text-sm text-[#241510]">Delivery Coverage & Serviceable Zones ({settingsForm.city})</h4>
                </div>
                <div className="text-xs text-[#8C766B] flex items-center gap-2">
                  <span>Delivery Radius:</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={settingsForm.deliveryRadiusKm}
                    onChange={(e) => setSettingsForm({ ...settingsForm, deliveryRadiusKm: Number(e.target.value) })}
                    className="w-16 px-2 py-1 rounded-lg bg-[#FAF7F2] border border-[#E8DFD8] text-[#241510] font-mono text-center font-bold"
                  />
                  <span>KM</span>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <label className="font-medium text-[#5C4033] block">
                  Active Serviceable Neighborhoods in {settingsForm.city} ({settingsForm.deliveryAreas?.length || 0})
                </label>

                <div className="flex flex-wrap gap-2">
                  {(settingsForm.deliveryAreas || []).map((area, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#E8DFD8] text-xs font-medium text-[#241510]"
                    >
                      <MapPin className="w-3 h-3 text-[#C58940]" />
                      <span>{area.name}</span>
                      {area.pincode && <span className="text-[10px] text-[#8C766B]">({area.pincode})</span>}
                      <button
                        type="button"
                        onClick={() => handleRemoveDeliveryArea(idx)}
                        className="hover:text-rose-600 ml-1 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add New Area Input */}
                <div className="pt-2 flex flex-wrap sm:flex-nowrap gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Add area or neighborhood (e.g. Downtown, Westside)"
                    value={newAreaName}
                    onChange={(e) => setNewAreaName(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-xs text-[#241510] focus:outline-none focus:border-[#241510]"
                  />
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="PIN (Optional)"
                    value={newAreaPin}
                    onChange={(e) => setNewAreaPin(e.target.value)}
                    className="w-28 px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-xs font-mono text-[#241510] focus:outline-none focus:border-[#241510]"
                  />
                  <button
                    type="button"
                    onClick={handleAddDeliveryArea}
                    className="px-4 py-2 rounded-xl bg-[#241510] hover:bg-[#3D2317] text-white text-xs font-medium shrink-0 transition-colors"
                  >
                    + Add Zone
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Save Action */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-8 py-3 rounded-xl bg-[#241510] hover:bg-[#3D2317] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-98"
              >
                <Save className="w-4 h-4 text-[#E5A93C]" />
                <span>Save All Store & Address Settings</span>
              </button>
            </div>

          </form>

        </div>
      )}

      {/* ========================================================= */}
      {/* ADMIN TEAM MANAGEMENT TAB */}
      {/* ========================================================= */}
      {activeAdminTab === 'admins' && (
        <div id="admin-team-section" className="space-y-6">
          
          {/* Header */}
          <div className="bg-white border border-[#E8DFD8] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#C58940]" />
                <h3 className="font-serif font-bold text-lg text-[#241510]">
                  Administrator Team & Access Delegation
                </h3>
              </div>
              <p className="text-xs text-[#8C766B] mt-1">
                Both primary emails and any added administrators hold identical, full administrative control with no hierarchy restrictions.
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{admins.length} Active System Administrators</span>
            </div>
          </div>

          {/* Action Notification */}
          {adminActionMsg && (
            <div className={`p-4 rounded-xl text-xs flex items-center gap-2.5 animate-fadeIn ${
              adminActionMsg.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}>
              {adminActionMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-medium">{adminActionMsg.text}</span>
            </div>
          )}

          {/* Current Administrators List */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8C766B]">
              Authorized Administrators ({admins.length})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="bg-white border border-[#E8DFD8] hover:border-[#C58940] rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-[#241510] text-[#E5A93C] flex items-center justify-center shrink-0 font-serif font-bold text-sm shadow-xs">
                        {admin.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-sm text-[#241510]">{admin.name}</h5>
                          {ownerUser.email === admin.email && (
                            <span className="text-[10px] bg-[#241510] text-white px-2 py-0.5 rounded-full font-medium">
                              You
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-xs text-[#5C4033]">
                          {admin.email}
                        </p>
                        <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-medium">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>{admin.role}</span>
                        </div>
                      </div>
                    </div>

                    {/* Revoke Button (only if > 1 admin) */}
                    {admins.length > 1 && (
                      <button
                        onClick={() => handleRemoveAdmin(admin.id, admin.name)}
                        title="Revoke Administrator Access"
                        className="p-2 rounded-xl text-[#8C766B] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="border-t border-[#F0EAE1] pt-3 flex items-center justify-between text-[11px] text-[#8C766B]">
                    <span>Authorized since: {new Date(admin.addedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span className="text-emerald-700 font-medium">Full Powers Enabled</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add New Administrator Card */}
          <div className="bg-white border border-[#E8DFD8] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="border-b border-[#F0EAE1] pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#C58940]" />
                <h4 className="font-bold text-sm text-[#241510]">Grant New Administrator Authority</h4>
              </div>
              <span className="text-[11px] text-[#8C766B]">
                Immediate full access to all store management tools
              </span>
            </div>

            <form onSubmit={handleAddNewAdmin} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-medium text-[#5C4033] block mb-1.5">Administrator Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priyesh Patel"
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-[#241510] focus:outline-none focus:border-[#241510]"
                  />
                </div>

                <div>
                  <label className="font-medium text-[#5C4033] block mb-1.5">Google / Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. priyesh.admin@gmail.com"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-[#241510] font-mono focus:outline-none focus:border-[#241510]"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] space-y-1 text-xs">
                <span className="font-medium text-[#241510] block">Assigned Administrative Permissions:</span>
                <p className="text-[11px] text-[#8C766B]">
                  • Direct order verification, cold-chain courier dispatch & OTP overrides
                  <br />
                  • Atelier product catalog: add new confections, edit real-time prices, toggle live stock
                  <br />
                  • Store & Location: edit physical Ahmedabad address, landmark, WhatsApp, and UPI settlement
                  <br />
                  • Administrator delegation: add and manage additional administrators
                </p>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#241510] hover:bg-[#3D2317] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <UserPlus className="w-4 h-4 text-[#E5A93C]" />
                  <span>Authorize & Add Administrator</span>
                </button>
              </div>
            </form>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* ADD / EDIT PRODUCT MODAL */}
      {/* ========================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white border border-[#E8DFD8] rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            
            <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-3">
              <h3 className="font-serif font-bold text-xl text-[#241510]">
                {editingProductId ? 'Edit Artisan Confection' : 'Add New Handcrafted Confection'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full text-[#8C766B] hover:text-[#241510]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-[#5C4033] block mb-1">Confection Name *</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="e.g. Royal Mysore 72% Dark Single Origin Bar"
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-[#241510] focus:outline-none focus:border-[#241510]"
                  />
                </div>

                <div>
                  <label className="font-medium text-[#5C4033] block mb-1">Hindi Subname (Optional)</label>
                  <input
                    type="text"
                    value={productForm.hindiSubname || ''}
                    onChange={(e) => setProductForm({ ...productForm, hindiSubname: e.target.value })}
                    placeholder="e.g. मैसूर डार्क चॉकलेट बार"
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-[#241510] focus:outline-none focus:border-[#241510]"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-[#5C4033] block mb-1">Tagline / Tasting Highlights *</label>
                <input
                  type="text"
                  required
                  value={productForm.tagline}
                  onChange={(e) => setProductForm({ ...productForm, tagline: e.target.value })}
                  placeholder="e.g. Malabar coast single-estate cocoa beans with sea salt crystals"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-[#241510] focus:outline-none focus:border-[#241510]"
                />
              </div>

              <div>
                <label className="font-medium text-[#5C4033] block mb-1">Detailed Description *</label>
                <textarea
                  rows={3}
                  required
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Describe the artisan cocoa origin, texture, and notes..."
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-[#241510] focus:outline-none focus:border-[#241510]"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-medium text-[#5C4033] block mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-[#241510] font-mono focus:outline-none focus:border-[#241510]"
                  />
                </div>

                <div>
                  <label className="font-medium text-[#5C4033] block mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    value={productForm.originalPrice}
                    onChange={(e) => setProductForm({ ...productForm, originalPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-[#241510] font-mono focus:outline-none focus:border-[#241510]"
                  />
                </div>

                <div>
                  <label className="font-medium text-[#5C4033] block mb-1">Stock Units *</label>
                  <input
                    type="number"
                    required
                    value={productForm.stockCount}
                    onChange={(e) => setProductForm({ ...productForm, stockCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-[#241510] font-mono focus:outline-none focus:border-[#241510]"
                  />
                </div>

                <div>
                  <label className="font-medium text-[#5C4033] block mb-1">Cacao %</label>
                  <input
                    type="number"
                    value={productForm.cacaoPercentage || ''}
                    onChange={(e) => setProductForm({ ...productForm, cacaoPercentage: Number(e.target.value) })}
                    placeholder="e.g. 72"
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-[#241510] font-mono focus:outline-none focus:border-[#241510]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-[#5C4033] block mb-1">Category *</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-[#241510] focus:outline-none focus:border-[#241510]"
                  >
                    <option value="artisanal-chocolates">Artisanal Chocolates</option>
                    <option value="truffles-bonbons">Truffles & Bonbons</option>
                    <option value="gourmet-cakes">Gourmet Cakes</option>
                    <option value="bakery-pastries">Bakery & Pastries</option>
                    <option value="festive-hampers">Festive Hampers</option>
                  </select>
                </div>

                <div>
                  <label className="font-medium text-[#5C4033] block mb-1">Image URL *</label>
                  <input
                    type="url"
                    required
                    value={productForm.image}
                    onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-[#241510] font-mono focus:outline-none focus:border-[#241510]"
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.isVeg}
                    onChange={(e) => setProductForm({ ...productForm, isVeg: e.target.checked })}
                    className="rounded text-[#241510]"
                  />
                  <span className="font-medium text-[#241510]">100% Eggless / Pure Vegetarian</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.isBestseller}
                    onChange={(e) => setProductForm({ ...productForm, isBestseller: e.target.checked })}
                    className="rounded text-[#241510]"
                  />
                  <span className="font-medium text-[#241510]">Bestseller Badge</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.isFestiveSpecial}
                    onChange={(e) => setProductForm({ ...productForm, isFestiveSpecial: e.target.checked })}
                    className="rounded text-[#241510]"
                  />
                  <span className="font-medium text-[#241510]">Festive Special Badge</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="border-t border-[#F0EAE1] pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E8DFD8] text-[#5C4033] hover:bg-[#FAF7F2] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#241510] hover:bg-[#3D2317] text-white font-semibold shadow-xs"
                >
                  {editingProductId ? 'Update Confection' : 'Add to Atelier Menu'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
