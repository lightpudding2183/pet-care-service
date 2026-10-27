// Service label helper - backend services table has service_name field
export const serviceLabel = (key: string) =>
  key ? String(key).replace(/_/g, ' ') : 'Service';

export const STATUS = {
  pending: { label: 'Pending', bg: '#FFF4D6', fg: '#8A6100' },
  confirmed: { label: 'Confirmed', bg: '#DDF1E8', fg: '#1F4E42' },
  in_progress: { label: 'In progress', bg: '#DCEAF2', fg: '#24516A' },
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
      statuses: ['confirmed', 'in_progress'],
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
        return [{ label: 'Accept request', next: 'confirmed', variant: 'primary' }];
      case 'confirmed':
        return [{ label: 'Start job', next: 'in_progress', variant: 'primary' }];
      case 'in_progress':
        return [{ label: 'Mark as completed', next: 'completed', variant: 'primary' }];
      default:
        return [];
    }
  }
  return [];
}