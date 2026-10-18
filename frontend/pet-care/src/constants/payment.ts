export const PAYMENT_STATUS = {
  pending: { label: 'Pending', bg: '#FFF4D6', fg: '#8A6100' },
  paid: { label: 'Paid', bg: '#DDF1E8', fg: '#1F4E42' },
  refunded: { label: 'Refunded', bg: '#E9ECEB', fg: '#44514D' },
};

type PaymentStatus = keyof typeof PAYMENT_STATUS;

export const paymentStatusLabel = (status: string) => (status in PAYMENT_STATUS ? PAYMENT_STATUS[status as PaymentStatus]?.label : status) ?? status;

// Owners can pay once the provider has accepted the booking
export const PAYABLE_BOOKING_STATUSES = ['confirmed'];

// Assumption: the payee (provider) or an admin issues refunds, not the paying owner.
export const canRefund = (role: string, payment: any) => (role === 'provider' || role === 'admin') && payment.status === 'paid';