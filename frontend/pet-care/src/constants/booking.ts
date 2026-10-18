// Service label helper - backend services table has service_name field
export const serviceLabel = (key: string) =>
  key ? String(key).replace(/_/g, ' ') : 'Service';

export const STATUS = {
  pending: { label: 'Pending', bg: '#FFF4D6', fg: '#8A6100' },
  confirmed: { label: 'Confirmed', bg: '#DDF1E8', fg: '#1F4E42' },
  completed: { label: 'Completed', bg: '#E9ECEB', fg: '#44514D' },
  cancelled: { label: 'Cancelled', bg: '#F8E0DD', fg: '#8E2A1F' },
};

// List tabs per role. `order` sorts by scheduled start.
export const SEGMENTS = {
  owner: [
    {
      key: 'upcoming', label: 'Upcoming', order: 'asc',
      statuses: ['pending', 'confirmed'],
      empty: { title: 'No upcoming bookings', message: 'Find a provider to book your first visit.' },
    },
    {
      key: 'past', label: 'Past', order: 'desc',
      statuses: ['completed', 'cancelled'],
      empty: { title: 'No past bookings yet', message: 'Completed and cancelled bookings show up here.' },
    },
  ],
  provider: [
    {
      key: 'requests', label: 'Requests', order: 'asc', showCount: true,
      statuses: ['pending'],
      empty: { title: 'No new requests', message: 'New booking requests from owners appear here.' },
    },
    {
      key: 'upcoming', label: 'Upcoming', order: 'asc',
      statuses: ['confirmed'],
      empty: { title: 'No upcoming jobs', message: 'Accepted bookings appear here.' },
    },
    {
      key: 'past', label: 'Past', order: 'desc',
      statuses: ['completed', 'cancelled'],
      empty: { title: 'No past jobs yet', message: 'Completed and cancelled jobs show up here.' },
    },
  ],
};

const CANCEL = {
  label: 'Cancel booking', next: 'cancelled', variant: 'outline',
  confirm: { title: 'Cancel this booking?', message: "This can't be undone.", confirmText: 'Cancel booking' },
};

// What each role can do from each status. The backend still enforces the real rules;
// this only decides which buttons to show. Every transition goes through PUT /bookings/:id.
export function getActions(role: string, status: string) {
  if (role === 'owner') {
    return status === 'pending' || status === 'confirmed' ? [CANCEL] : [];
  }
  if (role === 'provider') {
    switch (status) {
      case 'pending':
        return [
          { label: 'Accept request', next: 'confirmed', variant: 'primary' },
          {
            label: 'Decline', next: 'cancelled', variant: 'outline',
            confirm: { title: 'Decline this request?', message: 'The owner will see this booking as cancelled.', confirmText: 'Decline' },
          },
        ];
      case 'confirmed':
        return [{ label: 'Mark as completed', next: 'completed', variant: 'primary' }, CANCEL];
      default:
        return [];
    }
  }
  return [];
}