import { Banner } from '../types';

/**
 * Homepage banners and tiles. Each tile carries the category it opens; the
 * Banners screen warns about any tile left unlinked, because that tile opens an
 * empty shop.
 *
 * Hero banners are the slides after the shop's own. Each needs a `couponCode`
 * or an `offerText`: the carousel opens on who the shop is, and the slides that
 * follow are what is on offer. A hero slide with no offer is a second brand
 * slide arguing with the first, so it is not shown.
 */
export const INITIAL_BANNERS: Banner[] = [
  {
    id: 'banner-hero-festive',
    slot: 'hero',
    title: 'Festive boxes, ready to gift',
    subtitle: 'Chocolate, cookies and brownies, boxed for the season.',
    buttonText: 'Shop the offer',
    // Quoted from the coupon table rather than written out, so changing the
    // code's value changes the slide with it.
    couponCode: 'FESTIVE15',
    image: '',
    linkedCategory: 'premium-chocolate',
    isActive: true,
    sortOrder: 0,
  },
  {
    id: 'banner-hero-delivery',
    slot: 'hero',
    title: 'Free delivery across Ahmedabad',
    subtitle: 'On every order over the free-delivery threshold.',
    buttonText: 'Browse the menu',
    offerText: 'Free delivery on orders over ₹499',
    image: '',
    linkedCategory: 'celebration-cakes',
    isActive: true,
    sortOrder: 1,
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
