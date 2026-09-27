import type { Product } from '../types';

const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  electronics: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
  'fashion-apparel': 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
  'home-kitchen': 'https://images.unsplash.com/photo-1584990347449-399066e40994?auto=format&fit=crop&w=800&q=80',
  'beauty-personal-care': 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
  'sports-outdoors': 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
  'books-stationery': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
};

const DEFAULT_REAL_IMAGE = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';

/**
 * Parses raw verification document URLs that could be single string, JSON array, or comma-separated.
 */
export function parseDocumentUrls(rawUrl?: string | null): string[] {
  if (!rawUrl || typeof rawUrl !== 'string') return [];
  const trimmed = rawUrl.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
      }
    } catch {
      // fallback
    }
  }
  if (trimmed.includes(',')) {
    return trimmed.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
  }
  return [trimmed];
}

/**
 * Resolves any backend media or uploaded document URL (e.g. KYC documents, product uploads).
 * Strips any leaked Windows or local filesystem paths (e.g. /F:/all apps/mves/uploads/...),
 * normalizes slashes, and prepends the backend origin (e.g. http://localhost:5000).
 */
export function getMediaUrl(pathOrUrl?: string | null): string {
  if (!pathOrUrl || typeof pathOrUrl !== 'string') return '';
  const trimmed = pathOrUrl.trim();
  if (!trimmed) return '';

  // If already a fully-qualified HTTP/HTTPS URL
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const backendBase = (
    import.meta.env.VITE_API_URL_BASE ||
    import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') ||
    'http://localhost:5000'
  ).replace(/\/$/, '');

  // Normalize backslashes to forward slashes
  const normalized = trimmed.replace(/\\/g, '/');

  // Check if it contains an /uploads/ or uploads/ segment
  const uploadsIndex = normalized.toLowerCase().indexOf('uploads/');
  if (uploadsIndex !== -1) {
    const cleanPath = '/' + normalized.slice(uploadsIndex);
    return `${backendBase}${cleanPath}`;
  }

  // If it's a relative path starting with /
  if (normalized.startsWith('/')) {
    return `${backendBase}${normalized}`;
  }

  return `${backendBase}/${normalized}`;
}

/**
 * Resolves product image URLs safely, ensuring real high-resolution photography is always shown.
 * Never returns an SVG or solid placeholder box with text.
 */
export function getProductImageUrl(url?: string | null, categorySlug?: string): string {
  if (!url || typeof url !== 'string' || url.trim() === '' || url.includes('.svg') || url.startsWith('data:image/svg')) {
    if (categorySlug && CATEGORY_FALLBACK_IMAGES[categorySlug]) {
      return CATEGORY_FALLBACK_IMAGES[categorySlug];
    }
    return DEFAULT_REAL_IMAGE;
  }

  return getMediaUrl(url);
}

/**
 * Safely formats any numeric, string, or Decimal price to a 2-decimal string (e.g. "149.99").
 */
export function formatPrice(price: unknown): string {
  if (price === null || price === undefined) return '0.00';
  
  if (typeof price === 'number') {
    return isNaN(price) ? '0.00' : price.toFixed(2);
  }

  if (typeof price === 'string') {
    const parsed = parseFloat(price);
    return isNaN(parsed) ? '0.00' : parsed.toFixed(2);
  }

  if (typeof price === 'object') {
    // Check if Prisma Decimal or has toNumber/toString
    if ('toNumber' in price && typeof (price as any).toNumber === 'function') {
      const num = (price as any).toNumber();
      return isNaN(num) ? '0.00' : num.toFixed(2);
    }
    if ('toString' in price && typeof (price as any).toString === 'function') {
      const parsed = parseFloat((price as any).toString());
      return isNaN(parsed) ? '0.00' : parsed.toFixed(2);
    }
  }

  return '0.00';
}

/**
 * Calculates a realistic compare-at original price for sale items (e.g., 20-30% higher)
 */
export function getComparePrice(price: unknown, percentHigher = 25): string {
  const current = parseFloat(formatPrice(price));
  if (isNaN(current) || current <= 0) return '0.00';
  const original = current * (1 + percentHigher / 100);
  return original.toFixed(2);
}

/**
 * Deduplicates a list of products by title so clone entries don't duplicate in featured showcases
 */
export function deduplicateProducts(products: Product[]): Product[] {
  const seenTitles = new Set<string>();
  return products.filter((product) => {
    const normalized = product.title.trim().toLowerCase();
    if (seenTitles.has(normalized)) {
      return false;
    }
    seenTitles.add(normalized);
    return true;
  });
}
