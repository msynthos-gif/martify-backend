import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Store } from 'lucide-react';
import type { Product } from '../../types';
import { getProductImageUrl, formatPrice, getComparePrice } from '../../utils/formatters';

interface ProductCardProps {
  product: Product;
  showSaleBadge?: boolean;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  showSaleBadge = false,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  const categorySlug = product.category?.slug;
  const primaryUrl = (product.images && product.images.length > 0) ? product.images[0].url : product.imageUrl;
  const initialImage = getProductImageUrl(primaryUrl, categorySlug);
  const fallbackImage = getProductImageUrl(null, categorySlug);

  const priceStr = formatPrice(product.price);
  const isSale = showSaleBadge;
  const comparePriceStr = isSale ? getComparePrice(product.price, 25) : null;

  return (
    <div
      className={`group flex flex-col bg-white rounded-sm border border-slate-200 overflow-hidden transition-all duration-200 hover:border-slate-400 ${className}`}
    >
      {/* Product Image Link */}
      <Link
        to={`/products/${product.id}`}
        className="block relative aspect-square w-full bg-slate-100 overflow-hidden"
      >
        <img
          src={imageError ? fallbackImage : initialImage}
          alt={product.title}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Recently Sold Indicator - Clean sharp badge */}
        {Number(product.totalSold) > 0 && (
          <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
            <span className="inline-flex items-center px-2 py-0.5 rounded-sm bg-[#0F172A] text-white text-[10px] font-medium tracking-wide">
              {product.totalSold}+ Sold
            </span>
          </div>
        )}
      </Link>

      {/* Card Body: Title, Store Attribution & Price */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <Link to={`/products/${product.id}`} className="block group-hover:text-[#0F172A] transition-colors">
            <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug group-hover:text-[#0F172A] transition-colors min-h-[2.5rem]">
              {product.title}
            </h3>
          </Link>

          {/* Store Attribution */}
          {product.seller && (
            <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-slate-500">
              <Store className="w-3 h-3 text-slate-400 shrink-0" />
              <Link
                to={`/sellers/${product.seller.id}`}
                className="truncate hover:text-[#0F172A] hover:underline transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {(product.seller as any).storeName || product.seller.name}
              </Link>
            </div>
          )}
        </div>

        {/* Price Row */}
        <div className="mt-2.5 pt-2 flex items-baseline gap-2">
          {comparePriceStr && (
            <span className="text-xs font-semibold text-slate-400 line-through">
              ${comparePriceStr}
            </span>
          )}
          <span className="text-base font-bold text-[#0F172A] tracking-tight">
            ${priceStr}
          </span>
        </div>
      </div>
    </div>
  );
};
