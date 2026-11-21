import L from 'leaflet';

// Nairobi: used only when there is nothing to centre on. Per-country centres
// arrive with the multi-country config.
export const DEFAULT_CENTER: [number, number] = [-1.286389, 36.817223];

const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

/** The one place the map's tile provider is chosen. */
export function addBaseTiles(map: L.Map): L.TileLayer {
  return L.tileLayer(OSM_TILE_URL, { maxZoom: 19, attribution: OSM_ATTRIBUTION }).addTo(map);
}

/** The blue "you are here" dot. */
export function userLocationMarker(lat: number, lng: number): L.CircleMarker {
  return L.circleMarker([lat, lng], {
    radius: 7,
    color: '#ffffff',
    weight: 2,
    fillColor: '#4285F4',
    fillOpacity: 1,
  });
}
