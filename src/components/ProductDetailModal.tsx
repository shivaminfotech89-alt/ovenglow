import React, { useState } from 'react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { formatRupees } from '../lib/pricing';
import { ProductImage } from './ProductImage';
import { 
  X, 
  Star, 
  ShoppingBag, 
  ShieldCheck, 
  Package, 
  Gift, 
  Truck
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  const { addToCart, deliveryPincode } = useStore();
  const [selectedImage, setSelectedImage] = useState<string>(product?.image || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [giftNote, setGiftNote] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  if (!product) return null;

  const images = [product.image, ...(product.secondaryImages || [])];

  const handleAddToCart = () => {
    addToCart(product, quantity, giftNote);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div 
      id="product-detail-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl bg-[#FAF7F2] border border-[#E8DFD8] rounded-2xl shadow-xl overflow-hidden my-auto max-h-[92vh] flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-white/80 hover:bg-white border border-[#E8DFD8] text-[#5C4033] hover:text-[#241510] flex items-center justify-center transition-all shadow-xs"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Column: Image Gallery */}
        <div className="md:w-1/2 p-4 sm:p-6 flex flex-col justify-between bg-white border-b md:border-b-0 md:border-r border-[#E8DFD8]">
          <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#FAF7F2] border border-[#E8DFD8]">
            <ProductImage
              src={selectedImage || product.image}
              alt={product.name}
              lazy={false}
              className="w-full h-full object-cover"
            />
            {product.isVeg && (
              <div className="absolute top-2.5 left-2.5 bg-white/95 px-2 py-0.5 rounded-sm border border-emerald-600 flex items-center gap-1 shadow-xs">
                <div className="w-3 h-3 border border-emerald-600 rounded-xs flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                </div>
                <span className="text-[9px] font-medium text-emerald-800 tracking-wider">VEG</span>
              </div>
            )}
          </div>

          {/* Thumbnail row */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(img)}
                  className={`w-14 h-14 rounded-lg overflow-hidden border transition-all shrink-0 ${
                    (selectedImage || product.image) === img 
                      ? 'border-[#241510] ring-1 ring-[#241510]' 
                      : 'border-[#E8DFD8] opacity-70 hover:opacity-100'
                  }`}
                >
                  <ProductImage src={img} alt={`${product.name} thumbnail`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Information & Actions */}
        <div className="md:w-1/2 p-5 sm:p-6 flex flex-col justify-between overflow-y-auto space-y-3.5">
          <div>
            {/* Category & Badge */}
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] uppercase font-medium text-[#8C766B] tracking-wider capitalize">
                {product.category.replace('-', ' ')}
              </span>
              {product.isBestseller && (
                <span className="px-2 py-0.5 rounded-full bg-[#241510] text-white text-[10px] font-medium">
                  Bestseller
                </span>
              )}
            </div>

            {/* Product Title */}
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#241510] leading-snug">
              {product.name}
            </h2>
            {product.hindiSubname && (
              <p className="text-xs text-[#8C766B] font-medium mt-0.5">
                {product.hindiSubname}
              </p>
            )}

            {/* Ratings & Reviews */}
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="flex items-center text-[#C58940]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? 'fill-current' : 'text-stone-300'}`} />
                ))}
              </div>
              <span className="text-xs font-medium text-[#241510]">{product.rating}</span>
              <span className="text-xs text-[#8C766B]">({product.reviewCount} reviews)</span>
            </div>

            {/* Pricing */}
            <div className="flex items-baseline gap-2.5 mt-3">
              <span className="text-2xl font-bold font-sans text-[#241510]">{formatRupees(product.price)}</span>
              {product.originalPrice > product.price && (
                <span className="text-[#9E8B80] line-through text-sm">{formatRupees(product.originalPrice)}</span>
              )}
              <span className="text-xs font-medium text-emerald-800">
                Inclusive of GST
              </span>
            </div>

            {/* Description */}
            <p className="text-[#6B574E] text-xs sm:text-sm mt-2.5 leading-relaxed">
              {product.description}
            </p>

            {/* Flavor notes */}
            <div className="mt-3">
              <span className="text-[11px] font-medium text-[#8C766B] block mb-1">
                Tasting Notes
              </span>
              <div className="flex flex-wrap gap-1">
                {product.flavorNotes.map((note, i) => (
                  <span key={i} className="px-2.5 py-0.5 rounded-full bg-white border border-[#E8DFD8] text-xs text-[#5C4033]">
                    {note}
                  </span>
                ))}
              </div>
            </div>

            {/* Delivery Estimator banner */}
            <div className="mt-3 p-2.5 rounded-xl bg-white border border-[#E8DFD8] flex items-center gap-2.5 text-xs text-[#5C4033]">
              <Truck className="w-4 h-4 text-[#C58940] shrink-0" />
              <div>
                <span className="text-[#241510] font-medium block">Delivering to {deliveryPincode}</span>
                <span className="text-[11px] text-[#8C766B]">Delivered fresh across the city.</span>
              </div>
            </div>

            {/* Personalized Gift Message Field */}
            <div className="mt-3">
              <label className="text-xs font-medium text-[#5C4033] flex items-center gap-1 mb-1">
                <Gift className="w-3.5 h-3.5 text-[#C58940]" />
                Gift note (Optional):
              </label>
              <input
                type="text"
                placeholder="E.g., Wishing you joy and warm celebrations!"
                value={giftNote}
                onChange={(e) => setGiftNote(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E8DFD8] text-[#241510] text-xs placeholder:text-[#8C766B] focus:outline-none focus:border-[#241510]"
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-3 border-t border-[#E8DFD8] space-y-2.5">
            <div className="flex items-center gap-3">
              {/* Quantity selector */}
              <div className="flex items-center rounded-lg bg-white border border-[#E8DFD8] overflow-hidden text-xs">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-2.5 py-2 hover:bg-[#FAF7F2] text-[#241510] transition-colors"
                >
                  -
                </button>
                <span className="px-3 font-mono font-medium text-[#241510]">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stockCount, quantity + 1))}
                  disabled={quantity >= product.stockCount}
                  className="px-2.5 py-2 hover:bg-[#FAF7F2] text-[#241510] disabled:opacity-40 transition-colors"
                >
                  +
                </button>
              </div>

              {/* Add to Cart button */}
              <button
                id="btn-modal-add-to-cart"
                onClick={handleAddToCart}
                disabled={product.stockCount <= 0}
                className="flex-1 py-2.5 px-5 rounded-full font-medium bg-[#241510] hover:bg-[#3D2317] text-white text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {showSuccess ? (
                  <span className="font-medium text-emerald-300">Added to Bag!</span>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 text-[#C58940]" />
                    <span>Add to Bag • {formatRupees(product.price * quantity)}</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-center gap-3 text-[11px] text-[#8C766B]">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> 100% Pure Cocoa Butter
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-[#C58940]" /> Thermal Packaged
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
