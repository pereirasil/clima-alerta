import type {
  DailyWeatherForecast,
  GeoPoint,
  HourlyWeatherForecast,
  WeatherBundle,
  WeatherObservation,
} from "./weather-types";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:4000";
const ibgeBaseUrl = "https://servicodados.ibge.gov.br/api/v1/localidades";
const geocodingBaseUrl = "https://geocoding-api.open-meteo.com/v1/search";
const reverseGeocodingBaseUrl = "https://nominatim.openstreetmap.org/reverse";
const rainViewerApiUrl = "https://api.rainviewer.com/public/weather-maps.json";
const gibsWmsUrl = "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi";

const brazilStates: StateOption[] = [
  { code: "AC", label: "Acre" },
  { code: "AL", label: "Alagoas" },
  { code: "AP", label: "Amapa" },
  { code: "AM", label: "Amazonas" },
  { code: "BA", label: "Bahia" },
  { code: "CE", label: "Ceara" },
  { code: "DF", label: "Distrito Federal" },
  { code: "ES", label: "Espirito Santo" },
  { code: "GO", label: "Goias" },
  { code: "MA", label: "Maranhao" },
  { code: "MT", label: "Mato Grosso" },
  { code: "MS", label: "Mato Grosso do Sul" },
  { code: "MG", label: "Minas Gerais" },
  { code: "PA", label: "Para" },
  { code: "PB", label: "Paraiba" },
  { code: "PR", label: "Parana" },
  { code: "PE", label: "Pernambuco" },
  { code: "PI", label: "Piaui" },
  { code: "RJ", label: "Rio de Janeiro" },
  { code: "RN", label: "Rio Grande do Norte" },
  { code: "RS", label: "Rio Grande do Sul" },
  { code: "RO", label: "Rondonia" },
  { code: "RR", label: "Roraima" },
  { code: "SC", label: "Santa Catarina" },
  { code: "SP", label: "Sao Paulo" },
  { code: "SE", label: "Sergipe" },
  { code: "TO", label: "Tocantins" },
];

export interface StateOption {
  code: string;
  label: string;
}

export interface CityOption {
  id: number;
  label: string;
}

export interface LiveRadarLayer {
  imageUrl: string;
  observedAt: string;
  generatedAt: string;
  sourceName: string;
}

export interface ReverseGeocodedLocation {
  city?: string;
  state?: string;
  countryCode?: string;
  label: string;
  detail: string;
}

interface IbgeCity {
  id: number;
  nome: string;
}

interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  country_code?: string;
  admin1?: string;
}

interface GeocodingResponse {
  results?: GeocodingResult[];
}

interface RainViewerFrame {
  time: number;
  path: string;
}

interface RainViewerResponse {
  generated: number;
  host: string;
  radar?: {
    past?: RainViewerFrame[];
  };
}

interface NominatimReverseResponse {
  display_name?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    suburb?: string;
    county?: string;
    state?: string;
    country_code?: string;
  };
}

export async function fetchWeatherBundle(location: GeoPoint): Promise<WeatherBundle> {
  const [current, hourly, daily] = await Promise.all([
    fetchWeather<WeatherObservation>("current", location),
    fetchWeather<HourlyWeatherForecast[]>("hourly", location),
    fetchWeather<DailyWeatherForecast[]>("daily", location),
  ]);

  return { current, hourly, daily };
}

export async function fetchBrazilStates(): Promise<StateOption[]> {
  return brazilStates;
}

export async function fetchBrazilCities(stateCode: string): Promise<CityOption[]> {
  const response = await fetch(
    `${ibgeBaseUrl}/estados/${stateCode}/municipios?orderBy=nome`,
  );
  if (!response.ok) {
    throw new Error("Nao foi possivel carregar as cidades.");
  }

  const rows = (await response.json()) as IbgeCity[];
  return rows.map((row) => ({
    id: row.id,
    label: row.nome,
  }));
}

export async function geocodeBrazilCity(params: {
  city: string;
  state: string;
}): Promise<GeoPoint> {
  const url = new URL(geocodingBaseUrl);
  url.searchParams.set("name", params.city);
  url.searchParams.set("count", "10");
  url.searchParams.set("language", "pt");
  url.searchParams.set("format", "json");
  url.searchParams.set("countryCode", "BR");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Nao foi possivel localizar a cidade selecionada.");
  }

  const payload = (await response.json()) as GeocodingResponse;
  const results = payload.results ?? [];
  const exactState = results.find(
    (result) =>
      result.country_code === "BR" &&
      normalizeText(result.admin1 ?? "") === normalizeText(params.state),
  );
  const fallback = results.find((result) => result.country_code === "BR");
  const selected = exactState ?? fallback;

  if (!selected) {
    throw new Error("Cidade nao encontrada para consulta meteorologica.");
  }

  return {
    latitude: selected.latitude,
    longitude: selected.longitude,
  };
}

export async function reverseGeocodeLocation(
  location: GeoPoint,
): Promise<ReverseGeocodedLocation> {
  const url = new URL(reverseGeocodingBaseUrl);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(location.latitude));
  url.searchParams.set("lon", String(location.longitude));
  url.searchParams.set("zoom", "10");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "pt-BR");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error("Nao foi possivel identificar a cidade atual.");
  }

  const payload = (await response.json()) as NominatimReverseResponse;
  const address = payload.address ?? {};
  const city =
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    address.suburb ??
    address.county;
  const state = address.state;
  const countryCode = address.country_code?.toUpperCase();
  const stateCode =
    state === undefined
      ? undefined
      : brazilStates.find(
          (stateOption) =>
            normalizeText(stateOption.label) === normalizeText(state),
        )?.code;

  if (!city) {
    throw new Error("Cidade nao encontrada para sua localizacao.");
  }

  return {
    city,
    state,
    countryCode,
    label: stateCode ? `${city}, ${stateCode}` : city,
    detail: state ?? payload.display_name ?? "Localizacao pelo navegador",
  };
}

export async function fetchLiveRainRadarLayer(
  location: GeoPoint,
): Promise<LiveRadarLayer> {
  const response = await fetch(rainViewerApiUrl);
  if (!response.ok) {
    throw new Error("Radar de chuva em tempo real indisponivel.");
  }

  const payload = (await response.json()) as RainViewerResponse;
  const latestFrame = payload.radar?.past?.at(-1);
  if (!latestFrame) {
    throw new Error("Nenhum frame recente de radar encontrado.");
  }

  return {
    imageUrl: `${payload.host}${latestFrame.path}/512/5/${location.latitude}/${location.longitude}/2/1_1.png`,
    observedAt: new Date(latestFrame.time * 1000).toISOString(),
    generatedAt: new Date(payload.generated * 1000).toISOString(),
    sourceName: "RainViewer",
  };
}

export function buildLiveSatelliteImageUrl(
  location: GeoPoint,
  width = 900,
  height = 600,
): string {
  const latitudeSpan = 7;
  const longitudeSpan = 9;
  const minLongitude = clamp(location.longitude - longitudeSpan, -180, 180);
  const maxLongitude = clamp(location.longitude + longitudeSpan, -180, 180);
  const minLatitude = clamp(location.latitude - latitudeSpan, -90, 90);
  const maxLatitude = clamp(location.latitude + latitudeSpan, -90, 90);
  const url = new URL(gibsWmsUrl);

  url.searchParams.set("SERVICE", "WMS");
  url.searchParams.set("REQUEST", "GetMap");
  url.searchParams.set("VERSION", "1.1.1");
  url.searchParams.set("LAYERS", "GOES-East_ABI_Band13_Clean_Infrared");
  url.searchParams.set("STYLES", "");
  url.searchParams.set("SRS", "EPSG:4326");
  url.searchParams.set(
    "BBOX",
    `${minLongitude},${minLatitude},${maxLongitude},${maxLatitude}`,
  );
  url.searchParams.set("WIDTH", String(width));
  url.searchParams.set("HEIGHT", String(height));
  url.searchParams.set("FORMAT", "image/png");
  url.searchParams.set("TRANSPARENT", "false");
  url.searchParams.set("TIME", "default");

  return url.toString();
}

async function fetchWeather<T>(
  path: "current" | "hourly" | "daily",
  location: GeoPoint,
): Promise<T> {
  const url = new URL(`/api/v1/weather/${path}`, apiBaseUrl);
  url.searchParams.set("latitude", String(location.latitude));
  url.searchParams.set("longitude", String(location.longitude));

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API de clima indisponivel (${response.status}).`);
  }

  return (await response.json()) as T;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
