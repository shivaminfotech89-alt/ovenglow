/**
 * The Ovenglow order lifecycle.
 *
 * Adapted from a corporate-gifting flow: the payment spine (quote -> awaiting
 * payment -> customer submits reference -> admin verifies -> paid) is kept
 * intact, but the two supplier-confirmation stages are replaced with the
 * kitchen stages a bakery actually moves through.
 *
 * A stage is only ever changed through `canTransition` / `getNextStages`, so
 * the set of legal moves lives here and nowhere else.
 */

import { Order } from '../types';

export type OrderStage =
  | 'inquiry_received'
  | 'confirmed'
  | 'awaiting_payment'
  | 'payment_verification_pending'
  | 'paid'
  | 'baking'
  | 'packed'
  | 'dispatched'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

/** Who is expected to move an order into this stage. */
export type StageActor = 'automatic' | 'customer' | 'staff' | 'admin';

export interface StageDefinition {
  stage: OrderStage;
  label: string;
  /** Shown in the admin timeline and on the customer's tracking page. */
  why: string;
  actor: StageActor;
  /** Terminal stages accept no further transitions. */
  isTerminal: boolean;
  /** Drives badge colour across the admin and the storefront. */
  tone: 'neutral' | 'waiting' | 'money' | 'kitchen' | 'transit' | 'done' | 'stopped';
}

export const STAGE_ORDER: OrderStage[] = [
  'inquiry_received',
  'confirmed',
  'awaiting_payment',
  'payment_verification_pending',
  'paid',
  'baking',
  'packed',
  'dispatched',
  'out_for_delivery',
  'delivered',
];

export const STAGES: Record<OrderStage, StageDefinition> = {
  inquiry_received: {
    stage: 'inquiry_received',
    label: 'Inquiry Received',
    why: 'The order has arrived. Nothing is committed to the kitchen yet.',
    actor: 'automatic',
    isTerminal: false,
    tone: 'neutral',
  },
  confirmed: {
    stage: 'confirmed',
    label: 'Confirmed',
    why: 'Accepted by the kitchen. Ingredients and slot are committed.',
    actor: 'staff',
    isTerminal: false,
    tone: 'neutral',
  },
  awaiting_payment: {
    stage: 'awaiting_payment',
    label: 'Awaiting Payment',
    why: 'The customer can now see the UPI details and pay.',
    actor: 'staff',
    isTerminal: false,
    tone: 'waiting',
  },
  payment_verification_pending: {
    stage: 'payment_verification_pending',
    label: 'Payment Verification Pending',
    why: 'The customer submitted a UPI reference. Check it against the bank.',
    actor: 'customer',
    isTerminal: false,
    tone: 'waiting',
  },
  paid: {
    stage: 'paid',
    label: 'Paid',
    why: 'The money has been seen in the account. Admin only.',
    actor: 'admin',
    isTerminal: false,
    tone: 'money',
  },
  baking: {
    stage: 'baking',
    label: 'Baking & Tempering',
    why: 'In production — cocoa tempered, batch baked fresh.',
    actor: 'staff',
    isTerminal: false,
    tone: 'kitchen',
  },
  packed: {
    stage: 'packed',
    label: 'Thermal Packed',
    why: 'Sealed in a temperature-controlled pack, ready to hand over.',
    actor: 'staff',
    isTerminal: false,
    tone: 'kitchen',
  },
  dispatched: {
    stage: 'dispatched',
    label: 'Dispatched',
    why: 'Handed to the courier.',
    actor: 'staff',
    isTerminal: false,
    tone: 'transit',
  },
  out_for_delivery: {
    stage: 'out_for_delivery',
    label: 'Out for Delivery',
    why: 'On the road, arriving today.',
    actor: 'staff',
    isTerminal: false,
    tone: 'transit',
  },
  delivered: {
    stage: 'delivered',
    label: 'Delivered',
    why: 'Received by the customer. Handover complete.',
    actor: 'staff',
    isTerminal: true,
    tone: 'done',
  },
  cancelled: {
    stage: 'cancelled',
    label: 'Cancelled',
    why: 'Called off. Refund handled separately if money was taken.',
    actor: 'staff',
    isTerminal: true,
    tone: 'stopped',
  },
};

/**
 * Every legal move, before payment-method filtering.
 * Cancellation is handled separately by `canCancel` so it does not have to be
 * repeated on every row.
 */
const TRANSITIONS: Record<OrderStage, OrderStage[]> = {
  inquiry_received: ['confirmed'],
  confirmed: ['awaiting_payment', 'baking'],
  awaiting_payment: ['payment_verification_pending', 'paid'],
  // Rejecting a bad reference sends it back for the customer to re-submit.
  payment_verification_pending: ['paid', 'awaiting_payment'],
  paid: ['baking'],
  baking: ['packed'],
  packed: ['dispatched'],
  dispatched: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: [],
};

/** An order can be called off any time before it leaves the building. */
export function canCancel(order: Order): boolean {
  return !STAGES[order.stage].isTerminal && order.stage !== 'out_for_delivery';
}

/**
 * The stages this specific order may move to next.
 *
 * Cash-on-delivery orders skip the three payment stages entirely — there is no
 * UPI reference to verify, so `confirmed` goes straight to `baking`.
 */
export function getNextStages(order: Order): OrderStage[] {
  const isCod = order.paymentMethod === 'COD';
  let next = TRANSITIONS[order.stage] ?? [];

  if (isCod) {
    next = next.filter(
      (s) => s !== 'awaiting_payment' && s !== 'payment_verification_pending' && s !== 'paid',
    );
  } else if (order.stage === 'confirmed') {
    // A prepaid order must be invoiced before it is baked.
    next = next.filter((s) => s !== 'baking');
  }

  return next;
}

export function canTransition(order: Order, to: OrderStage): boolean {
  if (to === 'cancelled') return canCancel(order);
  return getNextStages(order).includes(to);
}

/** Where this order sits on the linear progress bar, ignoring cancellation. */
export function getStageIndex(stage: OrderStage): number {
  return STAGE_ORDER.indexOf(stage);
}

/**
 * The stages a given order will actually pass through, used to draw a progress
 * track that does not show payment steps to a cash-on-delivery customer.
 */
export function getStageTrack(order: Order): OrderStage[] {
  if (order.paymentMethod === 'COD') {
    return STAGE_ORDER.filter(
      (s) => s !== 'awaiting_payment' && s !== 'payment_verification_pending' && s !== 'paid',
    );
  }
  return STAGE_ORDER;
}

export function isPaidStage(stage: OrderStage): boolean {
  return getStageIndex(stage) >= getStageIndex('paid');
}
