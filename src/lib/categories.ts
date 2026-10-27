import { Category } from '../types';
import {
  Cake,
  CakeSlice,
  Candy,
  Cherry,
  Citrus,
  Cookie,
  Croissant,
  Coffee,
  Gift,
  Heart,
  IceCreamCone,
  Layers,
  Popcorn,
  Sandwich,
  Soup,
  Sparkles,
  Square,
  Wheat,
} from 'lucide-react';

/**
 * The marks a range can be drawn with.
 *
 * A fixed set, chosen rather than typed. The alternative -- letting the shop
 * paste an icon name or a URL -- means a wrong name renders nothing and a URL
 * is one more request on the critical path for a 14-pixel glyph. These ship in
 * the bundle already.
 */
export const CATEGORY_ICON_CHOICES: { name: string; icon: typeof Cake; label: string }[] = [
  { name: 'layers', icon: Layers, label: 'Chocolate bar' },
  { name: 'square', icon: Square, label: 'Brownie' },
  { name: 'cookie', icon: Cookie, label: 'Cookie' },
  { name: 'cake', icon: Cake, label: 'Cake' },
  { name: 'cake-slice', icon: CakeSlice, label: 'Cake slice' },
  { name: 'coffee', icon: Coffee, label: 'Tea or coffee' },
  { name: 'cupcake', icon: IceCreamCone, label: 'Cupcake' },
  { name: 'croissant', icon: Croissant, label: 'Muffin or bake' },
  { name: 'candy', icon: Candy, label: 'Sweets' },
  { name: 'gift', icon: Gift, label: 'Gifting' },
  { name: 'heart', icon: Heart, label: 'Favourites' },
  { name: 'sparkles', icon: Sparkles, label: 'Special' },
  { name: 'cherry', icon: Cherry, label: 'Fruit' },
  { name: 'citrus', icon: Citrus, label: 'Citrus' },
  { name: 'wheat', icon: Wheat, label: 'Breads' },
  { name: 'sandwich', icon: Sandwich, label: 'Savoury' },
  { name: 'popcorn', icon: Popcorn, label: 'Snacks' },
  { name: 'soup', icon: Soup, label: 'Desserts in a cup' },
];

const BY_NAME = new Map(CATEGORY_ICON_CHOICES.map((c) => [c.name, c.icon]));

/**
 * The mark for a range, or a sensible one if its name means nothing here.
 *
 * Always returns something. A range saved with an icon this build no longer
 * ships -- renamed in a later version, or typed straight into the database --
 * should still appear in the menu with a cookie beside it rather than crash the
 * shop front on a missing component.
 */
export function categoryIcon(name: string | undefined): typeof Cake {
  return BY_NAME.get((name ?? '').trim()) ?? Cookie;
}

/**
 * A range's name, for a product that stores only its id.
 *
 * Falls back to the id itself rather than to nothing. A range can be deleted
 * while a product still carries it -- the admin refuses only while products are
 * in the range, and nothing stops a row being removed straight from the
 * database -- and a product whose range shows blank in the table reads as a bug
 * in this screen. Showing `tea-cakes` says what actually happened.
 */
export function categoryLabel(categories: Category[], id: string): string {
  return categories.find((c) => c.id === id)?.label ?? id;
}
