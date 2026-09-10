import { Banner } from '../types';

/**
 * Homepage banners and tiles. Each tile carries the category it opens; the
 * Banners screen warns about any tile left unlinked, because that tile opens an
 * empty shop.
 */
export const INITIAL_BANNERS: Banner[] = [
  {
    id: 'banner-hero-1',
    slot: 'hero',
    title: 'Delights Crafted to Crave',
    subtitle: 'Pure cocoa butter chocolates and eggless patisserie, baked fresh each morning.',
    buttonText: 'Explore the Atelier',
    image:
      'https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=1600&q=80',
    linkedCategory: 'artisanal-chocolates',
    isActive: true,
    sortOrder: 0,
  },
  {
    id: 'banner-cat-1',
    slot: 'category',
    title: 'Gourmet Cakes',
    subtitle: 'Eggless, baked to order',
    buttonText: 'Browse Cakes',
    image:
      'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=900&q=80',
    linkedCategory: 'gourmet-cakes',
    isActive: true,
    sortOrder: 0,
  },
  {
    id: 'banner-cat-2',
    slot: 'category',
    title: 'Truffles & Bonbons',
    subtitle: 'Hand-rolled, boxed for gifting',
    buttonText: 'Browse Truffles',
    image:
      'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=900&q=80',
    linkedCategory: 'truffles-bonbons',
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'banner-campaign-1',
    slot: 'campaign',
    title: 'Diwali Hampers',
    subtitle: 'Corporate and family gifting, delivered across the city',
    buttonText: 'See Hampers',
    image:
      'https://images.unsplash.com/photo-1526081347589-7fa3cb41b4b2?auto=format&fit=crop&w=900&q=80',
    linkedCategory: 'festive-hampers',
    isActive: true,
    sortOrder: 0,
  },
];
