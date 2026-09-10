/**
 * Three staff roles, and what each may do.
 *
 * IMPORTANT: Ovenglow has no backend. These checks hide and disable controls in
 * the admin UI — they are NOT enforcement. Anyone able to open the browser's
 * devtools can edit localStorage and grant themselves any role. Treat this
 * module as the shape the rules should take once a server exists to apply them,
 * not as a security boundary.
 */

export type StaffRole = 'super_admin' | 'admin' | 'order_manager';

export type Permission =
  | 'orders.view'
  | 'orders.advance'
  | 'orders.cancel'
  | 'orders.verify_payment'
  | 'products.view'
  | 'products.edit'
  | 'customers.view'
  | 'marketing.manage'
  | 'settings.manage'
  | 'staff.manage';

export const ROLE_LABELS: Record<StaffRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  order_manager: 'Order Manager',
};

export const ROLE_DESCRIPTIONS: Record<StaffRole, string> = {
  super_admin: 'Everything, including settings and staff accounts.',
  admin: 'Orders, catalogue, customers and marketing. Cannot change settings or staff.',
  order_manager: 'Works orders and looks up customers. Cannot verify payments or touch prices.',
};

const MATRIX: Record<StaffRole, Permission[]> = {
  super_admin: [
    'orders.view',
    'orders.advance',
    'orders.cancel',
    'orders.verify_payment',
    'products.view',
    'products.edit',
    'customers.view',
    'marketing.manage',
    'settings.manage',
    'staff.manage',
  ],
  admin: [
    'orders.view',
    'orders.advance',
    'orders.cancel',
    'orders.verify_payment',
    'products.view',
    'products.edit',
    'customers.view',
    'marketing.manage',
  ],
  // Deliberately without orders.verify_payment: moving an order to `paid` means
  // asserting money arrived, which stays with an admin.
  order_manager: ['orders.view', 'orders.advance', 'orders.cancel', 'customers.view'],
};

export function can(role: StaffRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  return MATRIX[role].includes(permission);
}

export function permissionsFor(role: StaffRole): Permission[] {
  return MATRIX[role];
}

/**
 * These two addresses are always Super Admin and cannot be demoted, deactivated
 * or deleted, so a mistake in the staff screen can never lock the owners out.
 */
export const PERMANENT_SUPER_ADMINS = [
  'shivaminfotech89@gmail.com',
  'ovenglowdelights@gmail.com',
];

export function isPermanentSuperAdmin(email: string): boolean {
  return PERMANENT_SUPER_ADMINS.includes(email.trim().toLowerCase());
}
