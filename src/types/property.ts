export interface NearbyFacility {
  name: string;
  category: 'mall' | 'hospital' | 'road';
  distanceMeters: number;
  lat: number;
  lng: number;
}

export type PropertyType = 'RENTAL' | 'SALE' | 'SHORT_STAY';
export type HouseType = 'BEDSITTER' | 'ONE_BEDROOM' | 'TWO_BEDROOM' | 'THREE_BEDROOM' | 'FOUR_BEDROOM' | 'STUDIO' | 'MANSION' | 'VILLA' | 'TOWNHOUSE' | 'BUNGALOW' | 'PENTHOUSE';
export type PropertyStatus = 'DRAFT' | 'PUBLISHED' | 'TAKEN' | 'HIDDEN' | 'PENDING_REVIEW';
export type ManagerRole = 'LANDLORD' | 'CARETAKER' | 'AGENT';
export type ElectricityType = 'tokens' | 'postpaid' | 'solar' | 'none';

export interface PropertyOwner {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
  avatarUrl?: string;
  lastActiveAt?: string;
  responseTime?: string;
}

export interface PropertyVerification {
  gpsVerified: boolean;
  documentVerified: boolean;
  communityVerified: boolean;
  phoneVerified: boolean;
  identityVerified: boolean;
}

export interface Property {
  id: number;
  title: string;
  buildingName?: string;
  description: string;
  location: string;
  price: number;
  bedrooms: number;
  type: PropertyType;
  landlordPhone: string;
  landlordName?: string;
  landlordId?: string;
  available: boolean;
  imageUrl?: string;
  verified: boolean;
  gpsVerified: boolean;
  documentVerified: boolean;
  communityVerified: boolean;
  verification?: PropertyVerification;
  riskFlags: string[];
  priceComparisonAverage?: number;
  priceComparisonSampleSize?: number;
  priceComparisonPercentDiff?: number;
  status: PropertyStatus;
  latitude?: number;
  longitude?: number;
  owner?: PropertyOwner;
  imageUrls: string[];
  documentUrls: string[];
  documentCount: number;
  averageRating: number;
  reviewCount: number;
  reportCount: number;
  videoUrl?: string;
  houseType: HouseType;
  bathrooms: number;
  furnished: boolean;
  parking: boolean;
  water: boolean;
  wifi: boolean;
  security: boolean;
  petFriendly: boolean;
  balcony: boolean;
  ac: boolean;
  heating: boolean;
  laundry: boolean;
  dstv: boolean;
  fence: boolean;
  intercom: boolean;
  elevator: boolean;
  caretaker: boolean;
  rooftop: boolean;
  garden: boolean;
  storage: boolean;
  pool: boolean;
  gym: boolean;
  playArea: boolean;
  cleaning: boolean;
  garbage: boolean;
  wheelchair: boolean;
  solar: boolean;
  generator: boolean;
  deposit?: string;
  depositMonths: number;
  waterFee: number;
  garbageFee: number;
  serviceCharge: number;
  electricityType: ElectricityType;
  moveInDate?: string;
  viewCount: number;
  saveCount: number;
  listedAt?: string;
  lastConfirmedAt?: string;
  country: string;
  nearbyFacilities: NearbyFacility[];
  customAmenities: string[];
  managerRole: ManagerRole;
  caretakerName?: string;
  caretakerPhone?: string;
  caretakerLivesOnSite: boolean;
  landlordEndorsed: boolean;
  endorsementToken?: string;
  ownerVerifyName?: string;
  ownerVerifyPhone?: string;
}

export function getManagementBadge(p: Property): string {
  if (p.managerRole === 'LANDLORD') return 'Direct Owner';
  if (p.managerRole === 'CARETAKER') return p.landlordEndorsed ? 'Landlord Endorsed Caretaker' : 'Caretaker Managed';
  return p.landlordEndorsed ? 'Landlord Endorsed Agent' : 'Authorized Agent';
}

export function getPrimaryContact(p: Property): { name: string; phone: string } {
  if ((p.managerRole === 'CARETAKER' || p.managerRole === 'AGENT') && p.caretakerName) {
    return { name: p.caretakerName, phone: p.caretakerPhone || p.landlordPhone };
  }
  return { name: p.landlordName || 'Landlord', phone: p.landlordPhone };
}

export function getTotalMoveInCost(p: Property): number {
  return p.price + (p.price * p.depositMonths) + p.waterFee + p.garbageFee + p.serviceCharge;
}

export function getActiveAmenities(p: Property): string[] {
  const amenities: string[] = [];
  if (p.furnished) amenities.push('Furnished');
  if (p.parking) amenities.push('Parking');
  if (p.water) amenities.push('Water');
  if (p.wifi) amenities.push('WiFi');
  if (p.security) amenities.push('Security');
  if (p.petFriendly) amenities.push('Pet Friendly');
  if (p.balcony) amenities.push('Balcony');
  if (p.ac) amenities.push('AC');
  if (p.heating) amenities.push('Heating');
  if (p.laundry) amenities.push('Laundry');
  if (p.dstv) amenities.push('DSTV');
  if (p.fence) amenities.push('Fenced');
  if (p.intercom) amenities.push('Intercom');
  if (p.elevator) amenities.push('Elevator');
  if (p.caretaker) amenities.push('Caretaker');
  if (p.rooftop) amenities.push('Rooftop');
  if (p.garden) amenities.push('Garden');
  if (p.storage) amenities.push('Storage');
  if (p.pool) amenities.push('Pool');
  if (p.gym) amenities.push('Gym');
  if (p.playArea) amenities.push('Play Area');
  if (p.cleaning) amenities.push('Cleaning');
  if (p.garbage) amenities.push('Garbage Collection');
  if (p.wheelchair) amenities.push('Wheelchair Access');
  if (p.solar) amenities.push('Solar');
  if (p.generator) amenities.push('Generator');
  return [...amenities, ...p.customAmenities];
}

export function formatHouseType(ht: string): string {
  const map: Record<string, string> = {
    BEDSITTER: 'Bedsitter',
    ONE_BEDROOM: '1 Bedroom',
    TWO_BEDROOM: '2 Bedroom',
    THREE_BEDROOM: '3 Bedroom',
    FOUR_BEDROOM: '4 Bedroom',
    STUDIO: 'Studio',
    MANSION: 'Mansion',
    VILLA: 'Villa',
    TOWNHOUSE: 'Townhouse',
    BUNGALOW: 'Bungalow',
    PENTHOUSE: 'Penthouse',
  };
  return map[ht] || ht;
}
