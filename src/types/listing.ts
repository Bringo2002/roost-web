// The "List a Property" form: its data, per-step validation and the request
// body sent to the backend. Mirrors the Android app's add-property flow
// (rules, messages and payload keys) so a listing made on web is
// indistinguishable from one made in the app.

export const STEP_LABELS = ['Photos', 'Basics', 'Location', 'Amenities', 'Contact', 'Review'] as const;
export const STEP_COUNT = STEP_LABELS.length;

export const MIN_PHOTOS = 3;
export const MAX_PHOTOS = 30;

/** Country used until the multi-country config lands on web. */
export const DEFAULT_COUNTRY = { code: 'KE', dialCode: '+254', currencyCode: 'KES' } as const;

export const HOUSE_TYPES = ['BEDSITTER', 'STUDIO', '1BR', '2BR', '3BR+'] as const;
export type ListingHouseType = (typeof HOUSE_TYPES)[number];

export const HOUSE_TYPE_LABELS: Record<ListingHouseType, string> = {
  BEDSITTER: 'Bedsitter',
  STUDIO: 'Studio',
  '1BR': '1 Bed',
  '2BR': '2 Bed',
  '3BR+': '3 Bed+',
};

export const ELECTRICITY_TYPES = ['tokens', 'postpaid', 'included'] as const;
export type ListingElectricity = (typeof ELECTRICITY_TYPES)[number];

export const ELECTRICITY_LABELS: Record<ListingElectricity, string> = {
  tokens: 'Prepaid Tokens',
  postpaid: 'Postpaid Bill',
  included: 'Included in Rent',
};

export type ListingManagerRole = 'LANDLORD' | 'CARETAKER' | 'AGENT';

export const AMENITY_OPTIONS = [
  { key: 'furnished', label: 'Furnished' },
  { key: 'wifi', label: 'WiFi' },
  { key: 'water', label: 'Water' },
  { key: 'generator', label: 'Backup Generator' },
  { key: 'solar', label: 'Solar Power' },
  { key: 'ac', label: 'Air Conditioning' },
  { key: 'heating', label: 'Heating' },
  { key: 'laundry', label: 'Laundry' },
  { key: 'dstv', label: 'DStv / Cable TV' },
  { key: 'security', label: 'Security' },
  { key: 'fence', label: 'Perimeter Fence' },
  { key: 'intercom', label: 'Intercom' },
  { key: 'elevator', label: 'Elevator' },
  { key: 'parking', label: 'Parking' },
  { key: 'caretaker', label: 'Caretaker' },
  { key: 'balcony', label: 'Balcony' },
  { key: 'rooftop', label: 'Rooftop Access' },
  { key: 'garden', label: 'Garden' },
  { key: 'storage', label: 'Storage' },
  { key: 'pool', label: 'Swimming Pool' },
  { key: 'gym', label: 'Gym' },
  { key: 'playArea', label: 'Play Area' },
  { key: 'petFriendly', label: 'Pet Friendly' },
  { key: 'cleaning', label: 'Cleaning Service' },
  { key: 'garbage', label: 'Garbage Collection' },
  { key: 'wheelchair', label: 'Wheelchair Accessible' },
] as const;

export type AmenityKey = (typeof AMENITY_OPTIONS)[number]['key'];

/** What the form holds. Text inputs are kept as strings, exactly as typed. */
export interface ListingDraft {
  // Photos
  imageUrls: string[];
  videoUrl: string | null;
  // Basics
  title: string;
  buildingName: string;
  houseType: ListingHouseType;
  price: string;
  depositMonths: number;
  deposit: string;
  description: string;
  electricityType: ListingElectricity;
  waterFee: string;
  garbageFee: string;
  serviceCharge: string;
  bedrooms: number;
  bathrooms: number;
  // Location
  location: string;
  latitude: number | null;
  longitude: number | null;
  locationConfirmed: boolean;
  /** The backend confirmed the pin matches where the lister stood. Shown, not required. */
  gpsVerified: boolean;
  /** The area last filled in from the lister's position, so it can be told apart from typing. */
  suggestedLocation: string | null;
  // Amenities
  amenities: Record<AmenityKey, boolean>;
  customAmenities: string[];
  // Contact
  managerRole: ListingManagerRole;
  phone: string;
  caretakerLivesOnSite: boolean;
  noViewingFeePledge: boolean;
  caretakerName: string;
  caretakerPhone: string;
  ownerName: string;
  ownerPhone: string;
  /** One-time token the owner uses to endorse a caretaker's listing; made once per draft. */
  endorsementToken: string | null;
  // Verification
  documentUrls: string[];
}

export function emptyListingDraft(): ListingDraft {
  const amenities = Object.fromEntries(AMENITY_OPTIONS.map(a => [a.key, false])) as Record<AmenityKey, boolean>;
  // Offered by most places, so on by default (as in the app).
  amenities.water = true;
  amenities.security = true;
  return {
    imageUrls: [],
    videoUrl: null,
    title: '',
    buildingName: '',
    houseType: '1BR',
    price: '',
    depositMonths: 1,
    deposit: '',
    description: '',
    electricityType: 'tokens',
    waterFee: '',
    garbageFee: '',
    serviceCharge: '',
    bedrooms: 1,
    bathrooms: 1,
    location: '',
    latitude: null,
    longitude: null,
    locationConfirmed: false,
    gpsVerified: false,
    suggestedLocation: null,
    amenities,
    customAmenities: [],
    managerRole: 'LANDLORD',
    phone: '',
    caretakerLivesOnSite: true,
    noViewingFeePledge: false,
    caretakerName: '',
    caretakerPhone: '',
    ownerName: '',
    ownerPhone: '',
    endorsementToken: null,
    documentUrls: [],
  };
}

// ── Parsing helpers ─────────────────────────────────────────────────────

/** Number from what the person typed, or null if it isn't one ("12,000" is not). */
export function parseAmount(raw: string): number | null {
  const text = raw.trim();
  return /^[+-]?(\d+\.?\d*|\.\d+)$/.test(text) ? Number(text) : null;
}

/** An optional monthly fee: commas and spaces are ignored; blank or not a number counts as 0. */
export function parseFee(raw: string): number {
  return parseAmount(raw.replace(/[,\s]/g, '')) ?? 0;
}

/**
 * Full international number. A leading national "0" is dropped before the
 * country code is added, so 0712 345 678 becomes +254712345678 (not +2540712…).
 */
export function formatPhone(raw: string, dialCode: string = DEFAULT_COUNTRY.dialCode): string {
  const text = raw.trim().replace(/[\s-]/g, '');
  if (text === '') return '';
  if (text.startsWith('+')) return text;
  return `${dialCode}${text.replace(/^0/, '')}`;
}

/**
 * Whether a position-based area suggestion may replace what's in the field:
 * only when it's empty or still holds the previous suggestion untouched.
 */
export function shouldApplyAreaSuggestion(currentText: string, previousSuggestion: string | null): boolean {
  const text = currentText.trim();
  if (text === '') return true;
  return previousSuggestion !== null && text === previousSuggestion;
}

// ── Validation ──────────────────────────────────────────────────────────

export type StepErrors = Record<string, string>;

/**
 * Errors for one step (0-based), keyed like the app's: photos, title, price,
 * locationText, gps, phone, caretakerName, caretakerPhone. An empty object
 * means the step can continue.
 */
export function validateStep(draft: ListingDraft, step: number): StepErrors {
  const errors: StepErrors = {};

  if (step === 0) {
    if (draft.imageUrls.length < MIN_PHOTOS) {
      errors.photos = `Add at least ${MIN_PHOTOS} photos to continue`;
    }
  } else if (step === 1) {
    if (draft.title.trim() === '') errors.title = 'Give your listing a title';

    const priceText = draft.price.trim();
    const price = parseAmount(priceText);
    if (priceText === '') errors.price = 'Enter the monthly rent';
    else if (price === null || price <= 0) errors.price = 'Enter a valid amount';
  } else if (step === 2) {
    if (draft.location.trim() === '') errors.locationText = 'Add a neighborhood or street';
    if (!draft.locationConfirmed) errors.gps = 'Use your current location to continue';
  } else if (step === 4) {
    if (draft.phone.trim() === '') errors.phone = 'Add a contact phone number';
    if (draft.managerRole !== 'LANDLORD') {
      if (draft.caretakerName.trim() === '') errors.caretakerName = 'Enter the name of the on-site contact';
      if (draft.caretakerPhone.trim() === '') errors.caretakerPhone = 'Enter their phone number';
    }
  }
  return errors;
}

// ── Request body ────────────────────────────────────────────────────────

export interface PayloadOptions {
  /** 'DRAFT' while the form is incomplete, 'PUBLISHED' on submit. */
  status: 'DRAFT' | 'PUBLISHED';
  /** When editing, keep the listing's current values; new listings are available and unverified. */
  available?: boolean;
  verified?: boolean;
  country?: { code: string; dialCode: string; currencyCode?: string };
}

export function generateEndorsementToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * The body for POST/PUT /api/properties. Keys, including the snake_case
 * duplicates and which ones are only present when filled in, are exactly what
 * the app sends. (The "free viewings" pledge is not sent: the backend has no
 * field for it, in the app or here.)
 */
export function buildPropertyPayload(draft: ListingDraft, options: PayloadOptions): Record<string, unknown> {
  const country = options.country ?? DEFAULT_COUNTRY;
  const trimmed = (text: string) => text.trim();
  const deposit = trimmed(draft.deposit);
  const buildingName = trimmed(draft.buildingName);
  const waterFee = parseFee(draft.waterFee);
  const garbageFee = parseFee(draft.garbageFee);
  const serviceCharge = parseFee(draft.serviceCharge);
  const hasManager = draft.managerRole !== 'LANDLORD';
  const ownerName = trimmed(draft.ownerName);
  const ownerPhone = trimmed(draft.ownerPhone);

  const payload: Record<string, unknown> = {
    title: trimmed(draft.title),
    buildingName: buildingName === '' ? null : buildingName,
    location: trimmed(draft.location),
    price: parseAmount(draft.price) ?? 0,
    deposit: deposit === '' ? null : deposit,
    bedrooms: draft.bedrooms,
    bathrooms: draft.bathrooms,
    houseType: draft.houseType,
    type: 'RENTAL',
    available: options.available ?? true,
    verified: options.verified ?? false,
    landlordPhone: formatPhone(draft.phone, country.dialCode),
    description: trimmed(draft.description),
    // The first photo is the cover.
    ...(draft.imageUrls.length > 0 ? { imageUrl: draft.imageUrls[0] } : {}),
    imageUrls: draft.imageUrls,
    videoUrl: draft.videoUrl,
    latitude: draft.latitude,
    longitude: draft.longitude,
    moveInDate: 'Immediate',
    country: country.code,
    status: options.status,
    customAmenities: draft.customAmenities,
    depositMonths: draft.depositMonths,
    deposit_months: draft.depositMonths,
    waterFee,
    water_fee: waterFee,
    garbageFee,
    garbage_fee: garbageFee,
    serviceCharge,
    service_charge: serviceCharge,
    electricityType: draft.electricityType,
    electricity_type: draft.electricityType,
    managerRole: draft.managerRole,
    ...(hasManager
      ? {
          caretakerName: trimmed(draft.caretakerName),
          caretakerPhone: formatPhone(draft.caretakerPhone, country.dialCode),
        }
      : {}),
    caretakerLivesOnSite: draft.caretakerLivesOnSite,
    documentUrls: draft.documentUrls,
    landlordEndorsed: false,
    ...(ownerName !== '' ? { ownerVerifyName: ownerName } : {}),
    ...(ownerPhone !== ''
      ? {
          ownerVerifyPhone: formatPhone(ownerPhone, country.dialCode),
          endorsementToken: draft.endorsementToken ?? generateEndorsementToken(),
        }
      : {}),
  };

  for (const { key } of AMENITY_OPTIONS) payload[key] = draft.amenities[key] ?? false;
  return payload;
}
