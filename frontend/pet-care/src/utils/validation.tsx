const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin({ email = '', password = '' }) {
  const errors: Record<string, string> = {}; 
  if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address';
  if (!password) errors.password = 'Enter your password';
  return errors;
}

export function validateSignup({ fullName = '', email = '', phone = '', password = '', confirmPassword = '' }) {
  const errors: Record<string, string> = {};
  if (fullName.trim().length < 2) errors.fullName = 'Enter your full name';
  if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address';
  if (phone.trim() && !/^\+?[0-9\s-]{8,15}$/.test(phone.trim())) {
    errors.phone = 'Enter a valid phone number';
  }
  if (password.length < 8) errors.password = 'Use at least 8 characters';
  else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    errors.password = 'Include at least one letter and one number';
  }
  if (confirmPassword !== password) errors.confirmPassword = 'Passwords do not match';
  return errors;
}

export function validatePet({ name = '', species= '', age= '' }) {
  const errors: Record<string, string> = {};
  if (!name.trim()) errors.name = "Enter your pet's name";
  else if (name.trim().length > 50) errors.name = 'Use 50 characters or fewer';
  if (!species) errors.species = 'Choose a species';
  if (age.trim() !== '') {
    const n = Number(age);
    if (Number.isNaN(n) || n < 0 || n > 40) errors.age = 'Enter an age between 0 and 40';
  }
  return errors;
}

export function validateProvider({ businessName = '', address = '', latitude = '', longitude = '' }) {
  const errors: Record<string, string> = {};
  if (!businessName.trim()) errors.businessName = 'Enter your business name';
  else if (businessName.trim().length > 80) errors.businessName = 'Use 80 characters or fewer';
  if (!address.trim()) errors.address = 'Enter your address';
  else if (address.trim().length > 500) errors.address = 'Use 500 characters or fewer';
  if (latitude.trim() !== '') {
    const lat = Number(latitude);
    if (Number.isNaN(lat) || lat < -90 || lat > 90) errors.latitude = 'Latitude must be between -90 and 90';
  }
  if (longitude.trim() !== '') {
    const lng = Number(longitude);
    if (Number.isNaN(lng) || lng < -180 || lng > 180) errors.longitude = 'Longitude must be between -180 and 180';
  }
  return errors;
}

export function validateBooking({ petId = '', start = '', end = '' }) {
  const errors:  Record<string, string> = {};
  if (!petId) errors.petId = 'Choose a pet';
  if (new Date(start).getTime() <= Date.now()) errors.start = 'Start time must be in the future';
  if (end <= start) errors.end = 'End time must be after the start time';
  return errors;
}


