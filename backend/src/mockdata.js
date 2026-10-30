'use strict';

// Shared data builders live outside /seeders so sequelize-cli only runs actual seeders.

// Where the mock providers are placed. Set SEED_CENTER_LAT / SEED_CENTER_LNG to your test
// device's location. The default is the Android emulator's default location, so
// radius searches work out of the box there.
const CENTER = {
  lat: Number(process.env.SEED_CENTER_LAT ?? 37.422),
  lng: Number(process.env.SEED_CENTER_LNG ?? -122.0841),
};

const KM_PER_DEG_LAT = 111.32;

// A point `km` away from CENTER in direction `bearingDeg` (0 = north, 90 = east).
// Flat-earth approximation: accurate to a few metres at these distances.
function pointFrom(km, bearingDeg) {
  const rad = (bearingDeg * Math.PI) / 180;
  const lat = CENTER.lat + (km * Math.cos(rad)) / KM_PER_DEG_LAT;
  const lng = CENTER.lng + (km * Math.sin(rad)) / (KM_PER_DEG_LAT * Math.cos((CENTER.lat * Math.PI) / 180));
  return { latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) };
}

const uuid = (digit, n) =>
  `${digit.repeat(8)}-${digit.repeat(4)}-4${digit.repeat(3)}-8${digit.repeat(3)}-${String(n).padStart(12, '0')}`;
const serviceId = (n) => uuid('1', n);
const userId = (n) => uuid('2', n);
const providerId = (n) => uuid('3', n);
const providerServiceId = (n) => uuid('4', n);
const availabilityId = (n) => uuid('5', n);

const at = (dayOffset) => new Date(Date.UTC(2026, 8, 1 + dayOffset, 9, 0, 0)); // 1 Sep 2026 + offset

// Same reference date as `at`, but lets you set a specific hour/minute (UTC).
const dateTime = (dayOffset, hour, minute = 0) =>
  new Date(Date.UTC(2026, 8, 1 + dayOffset, hour, minute, 0));

// ---- The search tags -------------------------------------------------------
const SERVICES = [
  { n: 1, name: 'Boarding', description: "Overnight stays at the provider's home or facility" },
  { n: 2, name: 'Daycare', description: 'Supervised daytime care and play' },
  { n: 3, name: 'House sitting', description: "A sitter stays at the owner's home" },
  { n: 4, name: 'Drop-in visits', description: 'Short visits to feed, play and check on a pet' },
  { n: 5, name: 'Dog walking', description: 'Walks near the owner\'s home' },
  { n: 6, name: 'Training', description: 'Obedience and behaviour training sessions' },
  { n: 7, name: 'Grooming', description: 'Bathing, brushing, trimming and nail care' },
];

// ---- Providers -------------------------------------------------------------
// km / bearing place each provider relative to CENTER, so radius filters are easy to test.
// rating: null means a new provider with no reviews (rating_avg stays null, count 0).
const PROVIDERS = [
  { n: 1, owner: 'Maya Chen', business: 'Paws & Relax Boarding', address: '12 Willow Street', km: 0.8, bearing: 40,
    verified: true, rating: { avg: 4.9, count: 128 },
    services: [['Boarding', 55, 'day'], ['Daycare', 32, 'day'], ['Dog walking', 22, 'hour']] },
  { n: 2, owner: 'Luca Romano', business: 'Happy Tails Walkers', address: '48 Orchard Avenue', km: 1.6, bearing: 110,
    verified: true, rating: { avg: 4.7, count: 86 },
    services: [['Dog walking', 20, 'visit'], ['Drop-in visits', 18, 'visit']] },
  { n: 3, owner: 'Aisha Khan', business: 'Whisker Watch Sitters', address: '7 Linden Court', km: 2.3, bearing: 200,
    verified: true, rating: { avg: 4.8, count: 54 },
    services: [['House sitting', 65, 'day'], ['Drop-in visits', 22, 'visit']] },
  { n: 4, owner: 'Tom Becker', business: 'The Grooming Parlour', address: '230 Market Road', km: 3.1, bearing: 290,
    verified: true, rating: { avg: 4.5, count: 212 },
    services: [['Grooming', 60, 'visit']] },
  { n: 5, owner: 'Sofia Alvarez', business: 'Good Boy Academy', address: '5 Cedar Lane', km: 4.4, bearing: 15,
    verified: true, rating: { avg: 4.9, count: 37 },
    services: [['Training', 70, 'hour'], ['Dog walking', 26, 'hour']] },
  { n: 6, owner: 'Ben Okafor', business: 'Cozy Kennel Co.', address: '91 Birch Road', km: 6.8, bearing: 160,
    verified: true, rating: { avg: 4.2, count: 19 },
    services: [['Boarding', 48, 'day'], ['Daycare', 30, 'day'], ['Grooming', 45, 'visit']] },
  { n: 7, owner: 'Hana Sato', business: 'Sunny Paws Daycare', address: '33 Maple Drive', km: 9.5, bearing: 250,
    verified: true, rating: { avg: 3.9, count: 8 },
    services: [['Daycare', 28, 'day'], ['Dog walking', 18, 'visit']] },
  { n: 8, owner: 'Priya Nair', business: 'Everything Pets', address: '1 Central Plaza', km: 14, bearing: 75,
    verified: true, rating: { avg: 4.6, count: 301 },
    services: [['Boarding', 62, 'day'], ['Daycare', 38, 'day'], ['House sitting', 72, 'day'], ['Drop-in visits', 25, 'visit'],
      ['Dog walking', 24, 'hour'], ['Training', 80, 'hour'], ['Grooming', 85, 'visit']] },
  // New provider: verified but no reviews yet
  { n: 9, owner: 'Noah Williams', business: 'New Leaf Pet Care', address: '18 Aspen Way', km: 2.9, bearing: 330,
    verified: true, rating: null,
    services: [['Drop-in visits', 15, 'visit'], ['Dog walking', 16, 'visit']] },
  // Far away: outside a 25 km search radius
  { n: 10, owner: 'Ellie Brooks', business: 'Rural Retreat Farm Stay', address: 'Hillside Farm, Route 9', km: 38, bearing: 225,
    verified: true, rating: { avg: 4.8, count: 22 },
    services: [['Boarding', 42, 'day'], ['House sitting', 58, 'day']] },
  // Not approved yet: must never show up in search results
  { n: 11, owner: 'Marcus Reed', business: 'Pending Approval Pet Co.', address: '66 Spruce Street', km: 1.2, bearing: 300,
    verified: false, rating: null,
    services: [['Boarding', 50, 'day'], ['Grooming', 55, 'visit']] },
];

// ---- Availability schedules -------------------------------------------------
// Realistic availability for each provider, tailored to the services they offer.
// day: offset from Tue Sep 1 2026 (0=Tue, 1=Wed, 2=Thu, 3=Fri, 4=Sat, 5=Sun, 6=Mon).
// start/end: UTC hour boundaries for the slot. recurring: repeats weekly.
const AVAILABILITY_SCHEDULES = {
  1: [ // Paws & Relax Boarding — Boarding, Daycare, Dog walking
    { day: 0, start: 8, end: 20, recurring: true },    // Tue full-day boarding/daycare
    { day: 6, start: 8, end: 20, recurring: true },    // Mon weekday coverage
    { day: 4, start: 8, end: 17, recurring: true },    // Sat weekend partial
    { day: 0, start: 6, end: 8, recurring: false },    // Tue early-morning dog walk
  ],
  2: [ // Happy Tails Walkers — Dog walking, Drop-in visits
    { day: 0, start: 6, end: 10, recurring: true },     // Tue morning walks
    { day: 3, start: 12, end: 17, recurring: true },   // Fri afternoon drop-ins
  ],
  3: [ // Whisker Watch Sitters — House sitting, Drop-in visits
    { day: 0, start: 9, end: 17, recurring: true },     // Tue weekday
    { day: 4, start: 10, end: 14, recurring: true },   // Sat weekend
  ],
  4: [ // The Grooming Parlour — Grooming
    { day: 0, start: 9, end: 17, recurring: true },     // Tue weekday
    { day: 2, start: 10, end: 15, recurring: false },   // Thu one-off extended hours
  ],
  5: [ // Good Boy Academy — Training, Dog walking
    { day: 0, start: 8, end: 19, recurring: true },     // Tue weekday
    { day: 4, start: 9, end: 16, recurring: true },    // Sat weekend training
  ],
  6: [ // Cozy Kennel Co. — Boarding, Daycare, Grooming
    { day: 0, start: 7, end: 20, recurring: true },     // Tue full day
    { day: 5, start: 8, end: 18, recurring: true },    // Sun weekend
  ],
  7: [ // Sunny Paws Daycare — Daycare, Dog walking
    { day: 0, start: 8, end: 18, recurring: true },     // Tue weekday
    { day: 0, start: 6, end: 9, recurring: false },    // Tue early dog walk
  ],
  8: [ // Everything Pets — Boarding, Daycare, House sitting, Drop-in visits, Dog walking, Training, Grooming
    { day: 0, start: 7, end: 20, recurring: true },     // Tue extended hours
    { day: 4, start: 7, end: 21, recurring: true },    // Sat extended hours
    { day: 5, start: 8, end: 19, recurring: true },    // Sun partial
  ],
  9: [ // New Leaf Pet Care — Drop-in visits, Dog walking (new provider, no reviews)
    { day: 0, start: 9, end: 17, recurring: true },     // Tue standard business hours
  ],
  10: [ // Rural Retreat Farm Stay — Boarding, House sitting (far from center)
    { day: 0, start: 8, end: 18, recurring: true },    // Tue weekday
  ],
  11: [ // Pending Approval Pet Co. — Boarding, Grooming (not verified)
    { day: 0, start: 9, end: 17, recurring: true },    // Tue weekday
  ],
};

// ---- Row builders ----------------------------------------------------------
// Column names follow the active Sequelize CLI migrations.

const serviceRows = () =>
  SERVICES.map((s) => ({ id: serviceId(s.n), service_name: s.name, description: s.description, created_at: at(0), updated_at: at(0) }));

const userRows = (passwordHash) =>
  PROVIDERS.map((p) => ({
    id: userId(p.n),
    email: `provider${String(p.n).padStart(2, '0')}@example.com`,
    password_hash: passwordHash,
    phone: `+1555010${String(p.n).padStart(4, '0')}`,
    role: 'provider',
    full_name: p.owner,
    created_at: at(p.n),
    updated_at: at(p.n),
  }));

const providerRows = () =>
  PROVIDERS.map((p) => {
    return {
      id: providerId(p.n),
      business_name: p.business,
      address: p.address,
      verified: p.verified,
      ...pointFrom(p.km, p.bearing),
      user_id: userId(p.n),
      rating_avg: p.rating ? p.rating.avg : null,
      rating_count: p.rating ? p.rating.count : 0,
      created_at: at(p.n),
      updated_at: at(p.n),
    };
  });

const providerServiceRows = () => {
  const rows = [];
  let n = 0;
  PROVIDERS.forEach((p) => {
    p.services.forEach(([name, price, unit]) => {
      const service = SERVICES.find((entry) => entry.name === name);
      n += 1;
      rows.push({
        id: providerServiceId(n),
        provider_id: providerId(p.n),
        service_id: serviceId(service.n),
        price,
        price_unit: unit
      });
    });
  });
  return rows;
};

const availabilityRows = () => {
  const rows = [];
  let n = 0;
  PROVIDERS.forEach((p) => {
    const schedule = AVAILABILITY_SCHEDULES[p.n] || [];
    schedule.forEach((slot) => {
      n += 1;
      rows.push({
        id: availabilityId(n),
        provider_id: providerId(p.n),
        date: dateTime(slot.day, 0, 0),
        start_time: dateTime(slot.day, slot.start),
        end_time: dateTime(slot.day, slot.end),
        is_recurring: slot.recurring,
      });
    });
  });
  return rows;
};

const allIds = {
  services: () => SERVICES.map((s) => serviceId(s.n)),
  users: () => PROVIDERS.map((p) => userId(p.n)),
  providers: () => PROVIDERS.map((p) => providerId(p.n)),
  providerServices: () => {
    const total = PROVIDERS.reduce((sum, p) => sum + p.services.length, 0);
    return Array.from({ length: total }, (_, index) => providerServiceId(index + 1));
  },
  availability: () => {
    const total = PROVIDERS.reduce(
      (sum, p) => sum + (AVAILABILITY_SCHEDULES[p.n]?.length ?? 0), 0
    );
    return Array.from({ length: total }, (_, index) => availabilityId(index + 1));
  },
};

module.exports = {
  CENTER, SERVICES, PROVIDERS, pointFrom,
  serviceRows, userRows, providerRows, providerServiceRows, availabilityRows, allIds,
};