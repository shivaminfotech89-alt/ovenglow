import { Category } from '../types';

/**
 * The nine ranges the shop opened with, in catalogue order.
 *
 * These are a starting point now rather than the definition: they upload
 * themselves into the `categories` collection the first time an owner signs in
 * to an empty database, and after that the shop owns the list -- renaming
 * these, hiding them, reordering them, adding its own.
 *
 * The ids are what every product stores, so they are fixed. Renaming a range in
 * the admin changes its label and leaves its id alone, which is the whole reason
 * the two are separate fields: a shop that renames "Tea Cakes" to "Everyday
 * Cakes" should not thereby orphan every tea cake it sells.
 */
export const INITIAL_CATEGORIES: Category[] = [
  { id: 'premium-chocolate', label: 'Premium Chocolate', icon: 'layers', sortOrder: 0, isActive: true },
  { id: 'brownie-indulgence', label: 'Brownie Indulgence', icon: 'square', sortOrder: 1, isActive: true },
  { id: 'cookie-cravings', label: 'Cookie Cravings', icon: 'cookie', sortOrder: 2, isActive: true },
  { id: 'celebration-cakes', label: 'Celebration Cakes', icon: 'cake', sortOrder: 3, isActive: true },
  { id: 'tea-cakes', label: 'Tea Cakes', icon: 'coffee', sortOrder: 4, isActive: true },
  { id: 'gourmet-cookies', label: 'Gourmet Cookies', icon: 'gift', sortOrder: 5, isActive: true },
  { id: 'cupcake-dreams', label: 'Cupcake Dreams', icon: 'cupcake', sortOrder: 6, isActive: true },
  { id: 'muffin-moments', label: 'Muffin Moments', icon: 'croissant', sortOrder: 7, isActive: true },
  { id: 'cheesecake-heaven', label: 'Cheesecake Heaven', icon: 'cake-slice', sortOrder: 8, isActive: true },
];

/**
 * Turn a name the shop typed into an id products can store.
 *
 * Lower case, words joined by hyphens, nothing else -- the same shape as the
 * nine above, so a range added today looks no different in the database from
 * one that shipped with the shop.
 */
export function categorySlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}
