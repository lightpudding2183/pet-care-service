import { serviceLabel } from '../constants/booking';

interface BookingService {
	name?: string | null;
}

interface BookingUser {
	fullName?: string | null;
	avatarUrl?: string | null;
}

interface BookingOwner extends BookingUser {
	phone?: string | null;
}

interface BookingProvider {
	businessName?: string | null;
	user?: BookingUser | null;
}

interface BookingPet {
	name?: string | null;
	species?: string | null;
	breed?: string | null;
}

interface Booking {
	service?: BookingService | null;
	serviceType?: string | null;
	provider?: BookingProvider | null;
	owner?: BookingOwner | null;
	pet?: BookingPet | null;
}

// Assumed booking shape: { id, status, scheduledStart, scheduledEnd, actualStart, actualEnd,
// priceSnapshot, notes, address, serviceType | service: { name },
// pet: { name, species, breed }, provider: { businessName, user: { fullName, avatarUrl } },
// owner: { fullName, avatarUrl, phone } }
export const bookingService = (b: Booking): string => serviceLabel(b.service?.name ?? b.serviceType ?? '');
export const providerName = (b: Booking) => b.provider?.businessName || b.provider?.user?.fullName || 'Provider';
export const ownerName = (b: Booking) => b.owner?.fullName || 'Pet owner';
export const petName = (b: Booking) => b.pet?.name || 'Pet';

export const counterpartName = (b: Booking, role: string) => (role === 'provider' ? ownerName(b) : providerName(b));
export const counterpartAvatar = (b: Booking, role: string) => (role === 'provider' ? b.owner?.avatarUrl : b.provider?.user?.avatarUrl);

export const formatPrice = (p: string | number | null) => (p == null || p === '' ? null : Number(p).toLocaleString());