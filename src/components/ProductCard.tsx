import React, { useState } from 'react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { formatRupees } from '../lib/pricing';
import { ProductImage } from './ProductImage';
import { 
  Star, 
  Check, 
  Plus,
  Minus
} from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onOpenDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onOpenDetails }) => {
  const { cart, addToCart, updateCartQuantity } = useStore();
  const [justAdded, setJustAdded] = useState(false);

  const cartItem = cart.find((item) => item.product.id === product.id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <div
      id={`product-card-${product.id}`}
      onClick={() => onOpenDetails(product)}
      className="group relative flex flex-col rounded-xl sm:rounded-2xl bg-white border border-[#EBE3DA] hover:border-[#C58940]/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_rgba(42,24,16,0.08)] transition-all duration-300 overflow-hidden cursor-pointer"
    >
      {/* Product Image Stage */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#FAF7F2]">
        <ProductImage
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Soft Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10 pointer-events-none" />

        {/* Top Floating Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none">
          <div className="flex items-center gap-1.5">
            {/* Authentic FSSAI Veg Mark */}
            {product.isVeg && (
              <div 
                title="100% Pure Vegetarian / Eggless" 
                className="w-4 h-4 rounded-sm bg-white/95 border border-emerald-600 flex items-center justify-center shadow-xs pointer-events-auto"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              </div>
            )}

            {product.isBestseller && (
              <span className="rounded-full bg-[#241510]/85 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.12em] text-white backdrop-blur-xs">
                Bestseller
              </span>
            )}
          </div>
        </div>

        {/* Cacao & Grams Note */}
        <div className="absolute bottom-2 left-2 pointer-events-none">
          <span className="text-[10px] font-medium text-white/90 bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-md">
            {product.cacaoPercentage ? `${product.cacaoPercentage}% Cacao • ` : ''}{product.weightGrams}g
          </span>
        </div>
      </div>

      {/* Product Content Details */}
      <div className="flex flex-col flex-1 p-2.5 sm:p-3.5 justify-between gap-2 sm:gap-2.5 bg-white">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-[11px] text-[#8C766B] mb-1">
            <span className="capitalize truncate max-w-[90px] sm:max-w-[130px]">
              {product.category.replace('-', ' ')}
            </span>
            <div className="flex items-center gap-1 text-[#C58940] shrink-0 font-medium">
              <Star className="w-3 h-3 fill-current" />
              <span className="text-[#241510]">{product.rating}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-serif text-[#241510] font-bold text-xs sm:text-sm leading-snug line-clamp-1 group-hover:text-[#C58940] transition-colors">
            {product.name}
          </h3>

          {/* Subtle Tagline / Subname */}
          <p className="text-[11px] text-[#8C766B] line-clamp-1 mt-0.5">
            {product.tagline || product.hindiSubname}
          </p>

          {/* Primary Flavor Note Chip */}
          {product.flavorNotes && product.flavorNotes.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              <span className="text-[10px] font-medium text-[#7A5844] bg-[#FAF5EE] px-2 py-0.5 rounded-md border border-[#EADBCE]">
                {product.flavorNotes[0]}
              </span>
            </div>
          )}
        </div>

        {/* Pricing & Add to Cart Footer */}
        <div className="pt-2 border-t border-[#F0EAE1] flex items-center justify-between gap-1.5">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <span className="font-sans text-sm font-bold tabular-nums text-[#241510] sm:text-base">
                {formatRupees(product.price)}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-[10px] tabular-nums text-[#9E8B80] line-through sm:text-[11px]">
                  {formatRupees(product.originalPrice)}
                </span>
              )}
            </div>
            {product.originalPrice > product.price && (
              <span className="text-[9px] font-bold tabular-nums text-emerald-700">
                Save {formatRupees(product.originalPrice - product.price)}
              </span>
            )}
          </div>

          {/* Action button */}
          {product.stockCount <= 0 ? (
            <span className="text-[10px] font-medium text-rose-700 uppercase px-2 py-1 rounded bg-rose-50 border border-rose-200">
              Sold Out
            </span>
          ) : quantityInCart > 0 ? (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="flex items-center bg-[#241510] text-white rounded-full overflow-hidden text-xs shadow-xs"
            >
              <button
                onClick={() => updateCartQuantity(product.id, quantityInCart - 1)}
                className="flex h-9 w-9 items-center justify-center transition-colors hover:bg-[#3D2317]"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="px-1.5 sm:px-2 font-medium text-[11px]">{quantityInCart}</span>
              <button
                onClick={() => updateCartQuantity(product.id, quantityInCart + 1)}
                disabled={quantityInCart >= product.stockCount}
                className="flex h-9 w-9 items-center justify-center transition-colors hover:bg-[#3D2317] disabled:opacity-40"
                aria-label="Increase quantity"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              id={`btn-add-product-${product.id}`}
              onClick={handleAdd}
              className={`flex min-h-9 items-center gap-1 rounded-full px-4 text-xs font-medium shadow-xs transition-all active:scale-95 ${
                justAdded
                  ? 'bg-emerald-700 text-white'
                  : 'bg-[#241510] hover:bg-[#3D2317] text-white'
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-3 h-3" />
                  <span className="text-[11px]">Added</span>
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3" />
                  <span className="text-[11px]">Add</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
