/**
 * Geographic services and centroid coordinates for Myanmar locations.
 */

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export const RADIUS_TIERS = [3, 5, 10, 20, 50, 100, 1000] as const;
export const SEARCH_RADIUS_TIERS_KM = RADIUS_TIERS;

export function getSearchRadiusKm(tierIndex: number): number {
  const index = Math.max(0, Math.min(tierIndex, RADIUS_TIERS.length - 1));
  return RADIUS_TIERS[index];
}

/**
 * Normalized dictionary of Myanmar townships and city centroids.
 */
const TOWNSHIP_COORDINATES: Record<string, Coordinates> = {
  // Yangon Region
  "kamayut": { latitude: 16.8322, longitude: 96.1288 },
  "hlaing": { latitude: 16.8488, longitude: 96.1235 },
  "sanchaung": { latitude: 16.8042, longitude: 96.1345 },
  "bahan": { latitude: 16.8122, longitude: 96.1558 },
  "dagon": { latitude: 16.7933, longitude: 96.1472 },
  "pabedan": { latitude: 16.7767, longitude: 96.1561 },
  "kyauktada": { latitude: 16.7745, longitude: 96.1610 },
  "botahtaung": { latitude: 16.7725, longitude: 96.1697 },
  "pazundaung": { latitude: 16.7845, longitude: 96.1738 },
  "mingalar taung nyunt": { latitude: 16.7915, longitude: 96.1700 },
  "tamwe": { latitude: 16.8085, longitude: 96.1735 },
  "yankin": { latitude: 16.8395, longitude: 96.1670 },
  "mayangone": { latitude: 16.8710, longitude: 96.1440 },
  "insein": { latitude: 16.8967, longitude: 96.1083 },
  "north okkalapa": { latitude: 16.9050, longitude: 96.1650 },
  "south okkalapa": { latitude: 16.8520, longitude: 96.1830 },
  "thingangyun": { latitude: 16.8280, longitude: 96.1950 },
  "dawbon": { latitude: 16.7860, longitude: 96.1890 },
  "thaketa": { latitude: 16.7980, longitude: 96.2080 },
  "north dagon": { latitude: 16.8830, longitude: 96.2200 },
  "south dagon": { latitude: 16.8400, longitude: 96.2350 },
  "east dagon": { latitude: 16.9020, longitude: 96.2500 },
  "dagon seikkan": { latitude: 16.8300, longitude: 96.2700 },
  "hlaingthaya": { latitude: 16.8670, longitude: 96.0670 },
  "shwepyitha": { latitude: 16.9550, longitude: 96.0850 },
  "mingaladon": { latitude: 16.9750, longitude: 96.1400 },
  "ahlone": { latitude: 16.7900, longitude: 96.1250 },
  "kyeemyindaing": { latitude: 16.8050, longitude: 96.1180 },
  "lanmadaw": { latitude: 16.7780, longitude: 96.1450 },
  "latha": { latitude: 16.7760, longitude: 96.1500 },
  "thanlyin": { latitude: 16.7560, longitude: 96.2520 },
  "kyauktan": { latitude: 16.6340, longitude: 96.3260 },
  "twante": { latitude: 16.7110, longitude: 95.9330 },
  "kawhmu": { latitude: 16.6020, longitude: 96.0350 },
  "kungyangon": { latitude: 16.4380, longitude: 95.9980 },

  // Mandalay Region
  "chanayethazan": { latitude: 21.9750, longitude: 96.0840 },
  "chanmyathazi": { latitude: 21.9320, longitude: 96.0880 },
  "chan mya tharsi": { latitude: 21.9320, longitude: 96.0880 },
  "mahaaungmyay": { latitude: 21.9540, longitude: 96.0850 },
  "aungmyethazan": { latitude: 21.9980, longitude: 96.0900 },
  "pyigyidagun": { latitude: 21.9050, longitude: 96.0950 },
  "amarapura": { latitude: 21.9010, longitude: 96.0460 },
  "patheingyi": { latitude: 22.0120, longitude: 96.1670 },
  "pyinoolwin": { latitude: 22.0350, longitude: 96.4670 },
  "maymyo": { latitude: 22.0350, longitude: 96.4670 },
  "meiktila": { latitude: 20.8800, longitude: 95.8600 },
  "kyaukse": { latitude: 21.6050, longitude: 96.1330 },
  "myingyan": { latitude: 21.4600, longitude: 95.3850 },
  "bagan": { latitude: 21.1717, longitude: 94.8585 },
  "nyaung-u": { latitude: 21.1960, longitude: 94.9080 },
  "yamethin": { latitude: 20.4300, longitude: 96.1400 },

  // Naypyidaw
  "zabuthiri": { latitude: 19.7450, longitude: 96.1150 },
  "ottarathiri": { latitude: 19.8200, longitude: 96.1500 },
  "dekkhinathiri": { latitude: 19.6800, longitude: 96.0900 },
  "pobbathiri": { latitude: 19.8500, longitude: 96.1900 },
  "pyinmana": { latitude: 19.7380, longitude: 96.2160 },
  "lewe": { latitude: 19.6350, longitude: 96.2150 },
  "tatkon": { latitude: 20.1300, longitude: 96.2050 },

  // Bago Region
  "bago": { latitude: 17.3350, longitude: 96.4800 },
  "pyay": { latitude: 18.8200, longitude: 95.2200 },
  "taungoo": { latitude: 18.9400, longitude: 96.4300 },
  "nattalin": { latitude: 18.4200, longitude: 95.4200 },

  // Ayeyarwady Region
  "pathein": { latitude: 16.7800, longitude: 94.7350 },
  "hinthada": { latitude: 17.6500, longitude: 95.4600 },
  "maubin": { latitude: 16.7300, longitude: 95.6500 },
  "myaungmya": { latitude: 16.6000, longitude: 94.9300 },

  // Shan State
  "taunggyi": { latitude: 20.7850, longitude: 97.0350 },
  "lashio": { latitude: 22.9350, longitude: 97.7500 },
  "kalaw": { latitude: 20.6300, longitude: 96.5650 },
  "muse": { latitude: 23.9900, longitude: 97.9000 },

  // Mon State
  "mawlamyine": { latitude: 16.4900, longitude: 97.6300 },
  "thaton": { latitude: 16.9200, longitude: 97.3700 },
  "mudon": { latitude: 16.2550, longitude: 97.7150 },

  // Other Capitals
  "monywa": { latitude: 22.1150, longitude: 95.1350 },
  "magway": { latitude: 20.1450, longitude: 94.9250 },
  "sagaing": { latitude: 21.8800, longitude: 95.9600 },
  "myitkyina": { latitude: 25.3850, longitude: 97.4000 },
  "sittwe": { latitude: 20.1450, longitude: 92.8900 },
  "hpa-an": { latitude: 16.8700, longitude: 97.6350 },
  "dawei": { latitude: 14.0800, longitude: 98.2000 },
  "loikaw": { latitude: 19.6750, longitude: 97.2100 },
  "hakha": { latitude: 22.6400, longitude: 93.6050 },
};

/**
 * Region fallback coordinates when township is not in database.
 */
const REGION_COORDINATES: Record<string, Coordinates> = {
  "yangon": { latitude: 16.8409, longitude: 96.1735 },
  "mandalay": { latitude: 21.9750, longitude: 96.0840 },
  "naypyidaw": { latitude: 19.7633, longitude: 96.0785 },
  "bago": { latitude: 17.3350, longitude: 96.4800 },
  "ayeyarwady": { latitude: 16.7800, longitude: 94.7350 },
  "magway": { latitude: 20.1450, longitude: 94.9250 },
  "sagaing": { latitude: 21.8800, longitude: 95.9600 },
  "shan": { latitude: 20.7850, longitude: 97.0350 },
  "mon": { latitude: 16.4900, longitude: 97.6300 },
  "kayin": { latitude: 16.8700, longitude: 97.6350 },
  "kachin": { latitude: 25.3850, longitude: 97.4000 },
  "rakhine": { latitude: 20.1450, longitude: 92.8900 },
  "kayah": { latitude: 19.6750, longitude: 97.2100 },
  "chin": { latitude: 22.3850, longitude: 93.6150 },
  "tanintharyi": { latitude: 14.0800, longitude: 98.2000 },
};

function normalizeName(name?: string | null): string {
  if (!name) return "";
  return name.trim().toLowerCase()
    .replace(/region|state|division|township|tsp/g, "")
    .replace(/[^a-z0-9]/g, " ")
    .trim();
}

/**
 * Resolves coordinates from given township, region, or custom coordinates.
 */
export function resolveLocationCoordinates(
  township?: string | null,
  stateRegion?: string | null,
  customCoords?: Coordinates | null,
): Coordinates {
  if (customCoords && typeof customCoords.latitude === "number" && typeof customCoords.longitude === "number") {
    return customCoords;
  }

  const normTownship = normalizeName(township);
  if (normTownship && TOWNSHIP_COORDINATES[normTownship]) {
    return TOWNSHIP_COORDINATES[normTownship];
  }

  // Partial matches on township
  for (const [key, coords] of Object.entries(TOWNSHIP_COORDINATES)) {
    if (normTownship && (normTownship.includes(key) || key.includes(normTownship))) {
      return coords;
    }
  }

  const normRegion = normalizeName(stateRegion);
  for (const [key, coords] of Object.entries(REGION_COORDINATES)) {
    if (normRegion && (normRegion.includes(key) || key.includes(normRegion))) {
      return coords;
    }
  }

  // Default to central Yangon if completely unknown
  return REGION_COORDINATES.yangon;
}

/**
 * Calculates distance between two coordinates in kilometers using Haversine formula.
 */
export function getDistanceKm(
  coord1OrLat1: Coordinates | number,
  coord2OrLon1: Coordinates | number,
  lat2?: number,
  lon2?: number,
): number {
  let lat1Val: number;
  let lon1Val: number;
  let lat2Val: number;
  let lon2Val: number;

  if (typeof coord1OrLat1 === "object" && coord1OrLat1 !== null && typeof coord2OrLon1 === "object" && coord2OrLon1 !== null) {
    lat1Val = coord1OrLat1.latitude;
    lon1Val = coord1OrLat1.longitude;
    lat2Val = coord2OrLon1.latitude;
    lon2Val = coord2OrLon1.longitude;
  } else {
    lat1Val = Number(coord1OrLat1);
    lon1Val = Number(coord2OrLon1);
    lat2Val = Number(lat2);
    lon2Val = Number(lon2);
  }

  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2Val - lat1Val) * Math.PI) / 180;
  const dLon = ((lon2Val - lon1Val) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1Val * Math.PI) / 180) *
      Math.cos((lat2Val * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}
