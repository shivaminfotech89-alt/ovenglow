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
    subtitle: 'Cakes, cookies, brownies and more for every occasion.',
    buttonText: 'See the menu',
    image:
      'https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=1600&q=80',
    linkedCategory: 'premium-chocolate',
    isActive: true,
    sortOrder: 0,
  },
  {
    id: 'banner-cat-1',
    slot: 'category',
    title: 'Celebration Cakes',
    subtitle: 'Baked to order for every occasion',
    buttonText: 'Browse Cakes',
    image:
      'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=900&q=80',
    linkedCategory: 'celebration-cakes',
    isActive: true,
    sortOrder: 0,
  },
  {
    id: 'banner-cat-2',
    slot: 'category',
    title: 'Gourmet Cookies',
    subtitle: 'Boxed and tinned for gifting',
    buttonText: 'Browse Cookies',
    image:
      'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=900&q=80',
    linkedCategory: 'gourmet-cookies',
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'banner-campaign-1',
    slot: 'campaign',
    title: 'Cheesecake Heaven',
    subtitle: 'Blueberry, Biscoff, Nutella and cranberry',
    buttonText: 'See Cheesecakes',
    image:
      'https://images.unsplash.com/photo-1526081347589-7fa3cb41b4b2?auto=format&fit=crop&w=900&q=80',
    linkedCategory: 'cheesecake-heaven',
    isActive: true,
    sortOrder: 0,
  },
];
