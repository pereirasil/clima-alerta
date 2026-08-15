"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  buildLiveSatelliteImageUrl,
  fetchBrazilCities,
  fetchBrazilStates,
  fetchLiveRainRadarLayer,
  fetchWeatherBundle,
  geocodeBrazilCity,
  reverseGeocodeLocation,
  type CityOption,
  type LiveRadarLayer,
  type StateOption,
} from "./weather-api";
import type {
  DailyWeatherForecast,
  HourlyWeatherForecast,
  LocationPreset,
  WeatherBundle,
  WeatherObservation,
} from "./weather-types";

const defaultLocation: LocationPreset = {
  label: "Rio de Janeiro, RJ",
  detail: "Consulta inicial padrao",
  latitude: -22.9068,
  longitude: -43.1729,
};

type ExploreLayer = "rain" | "satellite" | null;
type LocationSource = "city" | "manual" | "browser";

const defaultCountryCode = "BR";
const defaultStateCode = "RJ";
const defaultCityLabel = "Rio de Janeiro";
const countryOptions = [{ code: "BR", label: "Brasil" }];
const fallbackStates: StateOption[] = [
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
const fallbackCities: CityOption[] = [{ id: 3304557, label: "Rio de Janeiro" }];

export default function Home() {
  const [selectedLocation, setSelectedLocation] =
    useState<LocationPreset>(defaultLocation);
  const [formLatitude, setFormLatitude] = useState(String(defaultLocation.latitude));
  const [formLongitude, setFormLongitude] = useState(String(defaultLocation.longitude));
  const [weather, setWeather] = useState<WeatherBundle | null>(null);
  const [liveRadar, setLiveRadar] = useState<LiveRadarLayer | null>(null);
  const [liveRadarStatus, setLiveRadarStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const [exploreLayer, setExploreLayer] = useState<ExploreLayer>(null);
  const [countryCode, setCountryCode] = useState(defaultCountryCode);
  const [stateCode, setStateCode] = useState(defaultStateCode);
  const [cityLabel, setCityLabel] = useState(defaultCityLabel);
  const [states, setStates] = useState<StateOption[]>(fallbackStates);
  const [cities, setCities] = useState<CityOption[]>(fallbackCities);
  const [locationSource, setLocationSource] = useState<LocationSource>("city");
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState(
    "Escolha pais, estado e cidade para consultar.",
  );
  const [permissionMessage, setPermissionMessage] = useState(
    "Geolocalizacao do navegador nao solicitada.",
  );

  useEffect(() => {
    void loadWeather(defaultLocation);
    async function initializeLocations() {
      setLocationLoading(true);
      setLocationMessage("Carregando estados.");

      try {
        const nextStates = await fetchBrazilStates();
        const nextState =
          nextStates.find((state) => state.code === defaultStateCode) ??
          nextStates[0];
        const nextCities = await fetchBrazilCities(nextState.code);
        const nextCity =
          nextCities.find((city) => city.label === defaultCityLabel) ??
          nextCities[0];

        setStates(nextStates);
        setStateCode(nextState.code);
        setCities(nextCities);
        setCityLabel(nextCity?.label ?? "");
        setLocationMessage("Selecione uma cidade e consulte.");
      } catch (error) {
        setLocationMessage(
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar estados e cidades.",
        );
      } finally {
        setLocationLoading(false);
      }
    }

    void initializeLocations();
    // Initial boot only: load default weather and selector data once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadWeather(location: LocationPreset) {
    setSelectedLocation(location);
    setFormLatitude(String(location.latitude));
    setFormLongitude(String(location.longitude));
    setStatus("loading");
    setMessage("");
    void loadLiveRadar(location);

    try {
      const bundle = await fetchWeatherBundle(location);
      setWeather(bundle);
      setStatus("ready");
    } catch (error) {
      setWeather(null);
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Clima indisponivel.");
    }
  }

  async function loadLiveRadar(location: LocationPreset) {
    setLiveRadarStatus("loading");

    try {
      const layer = await fetchLiveRainRadarLayer(location);
      setLiveRadar(layer);
      setLiveRadarStatus("ready");
    } catch {
      setLiveRadar(null);
      setLiveRadarStatus("error");
    }
  }

  async function loadStates() {
    setLocationLoading(true);
    setLocationMessage("Carregando estados.");

    try {
      const nextStates = await fetchBrazilStates();
      setStates(nextStates);
      const nextState =
        nextStates.find((state) => state.code === defaultStateCode) ??
        nextStates[0];
      setStateCode(nextState.code);
      await loadCities(nextState.code, defaultCityLabel);
      setLocationMessage("Selecione uma cidade e consulte.");
    } catch (error) {
      setLocationMessage(
        error instanceof Error ? error.message : "Nao foi possivel carregar estados.",
      );
    } finally {
      setLocationLoading(false);
    }
  }

  async function loadCities(nextStateCode: string, preferredCity?: string) {
    setLocationLoading(true);
    setLocationMessage("Carregando cidades.");

    try {
      const nextCities = await fetchBrazilCities(nextStateCode);
      const nextCity =
        nextCities.find((city) => city.label === preferredCity) ?? nextCities[0];
      setCities(nextCities);
      setCityLabel(nextCity?.label ?? "");
      setLocationSource("city");
      setLocationMessage("Selecione uma cidade e consulte.");
    } catch (error) {
      setCities([]);
      setCityLabel("");
      setLocationMessage(
        error instanceof Error ? error.message : "Nao foi possivel carregar cidades.",
      );
    } finally {
      setLocationLoading(false);
    }
  }

  function selectCountry(nextCountryCode: string) {
    setCountryCode(nextCountryCode);
    setLocationSource("city");
    if (nextCountryCode === "BR") {
      void loadStates();
    }
  }

  function selectState(nextStateCode: string) {
    setStateCode(nextStateCode);
    setLocationSource("city");
    void loadCities(nextStateCode);
  }

  function selectCity(nextCityLabel: string) {
    setCityLabel(nextCityLabel);
    setLocationSource("city");
    setLocationMessage("Cidade selecionada. Clique em consultar clima.");
  }

  async function submitSelectedCity() {
    if (!cityLabel) {
      setLocationMessage("Selecione uma cidade antes de consultar.");
      return;
    }

    const selectedState = states.find((state) => state.code === stateCode);
    setLocationLoading(true);
    setStatus("loading");
    setMessage("");
    setLocationMessage("Localizando coordenadas da cidade.");

    try {
      const location = await geocodeBrazilCity({
        city: cityLabel,
        state: selectedState?.label ?? stateCode,
      });
      await loadWeather({
        label: `${cityLabel}, ${stateCode}`,
        detail: selectedState?.label ?? "Cidade selecionada",
        latitude: Number(location.latitude.toFixed(4)),
        longitude: Number(location.longitude.toFixed(4)),
      });
      setLocationMessage("Meteorologia atualizada para a cidade selecionada.");
    } catch (error) {
      setStatus("error");
      const nextMessage =
        error instanceof Error
          ? error.message
          : "Nao foi possivel consultar a cidade.";
      setMessage(nextMessage);
      setLocationMessage(nextMessage);
    } finally {
      setLocationLoading(false);
    }
  }

  function submitManualLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const latitude = Number(formLatitude);
    const longitude = Number(formLongitude);

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      setMessage("Latitude deve estar entre -90 e 90.");
      setStatus("error");
      return;
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      setMessage("Longitude deve estar entre -180 e 180.");
      setStatus("error");
      return;
    }

    void loadWeather({
      label: "Coordenada manual",
      detail: "Informada nesta sessao",
      latitude,
      longitude,
    });
    setLocationSource("manual");
  }

  function requestBrowserLocation() {
    if (!navigator.geolocation) {
      setPermissionMessage("Este navegador nao disponibiliza geolocalizacao.");
      return;
    }

    setPermissionMessage("Aguardando consentimento do navegador.");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = Number(position.coords.latitude.toFixed(4));
        const longitude = Number(position.coords.longitude.toFixed(4));
        let locationName: {
          city?: string;
          state?: string;
          countryCode?: string;
          label: string;
          detail: string;
        } = {
          label: "Localizacao atual",
          detail: "Cidade nao identificada",
        };

        try {
          locationName = await reverseGeocodeLocation({ latitude, longitude });
          if (locationName.countryCode === "BR" && locationName.state) {
            const detectedState = states.find(
              (state) =>
                normalizeText(state.label) === normalizeText(locationName.state ?? ""),
            );
            if (detectedState) {
              setCountryCode("BR");
              setStateCode(detectedState.code);
              const nextCities = await fetchBrazilCities(detectedState.code);
              setCities(nextCities);
              const detectedCity = nextCities.find(
                (city) =>
                  normalizeText(city.label) ===
                  normalizeText(locationName.city ?? ""),
              );
              setCityLabel(detectedCity?.label ?? locationName.city ?? "");
            }
          }
        } catch {
          setPermissionMessage(
            "Localizacao recebida, mas a cidade nao foi identificada.",
          );
        }

        const location = {
          label: locationName.label,
          detail: locationName.detail,
          latitude,
          longitude,
        };
        setPermissionMessage(
          `Localizacao recebida: ${locationName.label}.`,
        );
        setLocationSource("browser");
        void loadWeather(location);
      },
      () => {
        setPermissionMessage("Permissao negada ou localizacao indisponivel.");
      },
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 },
    );
  }

  return (
    <main className="min-h-screen bg-[#eef3ef] text-[#13201b]">
      <section className="border-b border-[#cad7d1] bg-[#fbfcf8]">
        <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8">
          <HeroPanel
            selectedLocation={selectedLocation}
            observation={weather?.current}
            status={status}
          />
          <LocationPanel
            selectedLocation={selectedLocation}
            countryCode={countryCode}
            stateCode={stateCode}
            cityLabel={cityLabel}
            states={states}
            cities={cities}
            locationSource={locationSource}
            locationLoading={locationLoading}
            locationMessage={locationMessage}
            formLatitude={formLatitude}
            formLongitude={formLongitude}
            permissionMessage={permissionMessage}
            onLatitudeChange={setFormLatitude}
            onLongitudeChange={setFormLongitude}
            onCountryChange={selectCountry}
            onStateChange={selectState}
            onCityChange={selectCity}
            onSelectedCitySubmit={submitSelectedCity}
            onSubmit={submitManualLocation}
            onBrowserLocation={requestBrowserLocation}
          />
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl items-start gap-4 px-4 py-5 sm:px-6 xl:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        {status === "loading" && <LoadingState />}
        {status === "error" && <ErrorState message={message} />}
        {status === "ready" && weather && (
          <>
            <div className="grid min-w-0 gap-4">
              <CurrentWeather observation={weather.current} hourly={weather.hourly} />
              <WeatherMapPanels
                observation={weather.current}
                hourly={weather.hourly}
                liveRadar={liveRadar}
                liveRadarStatus={liveRadarStatus}
                onExploreRain={() => setExploreLayer("rain")}
                onExploreSatellite={() => setExploreLayer("satellite")}
              />
              <HourlyForecast rows={weather.hourly} />
              <DailyForecast rows={weather.daily} />
            </div>
            <div className="grid min-w-0 content-start gap-4 xl:sticky xl:top-4">
              <RiskSummary observation={weather.current} hourly={weather.hourly} />
              <SourcePanel observation={weather.current} />
              <DailyHighlights rows={weather.daily} />
            </div>
          </>
        )}
      </section>
      {status === "ready" && weather && exploreLayer && (
        <ExploreLayerDialog
          layer={exploreLayer}
          observation={weather.current}
          hourly={weather.hourly}
          liveRadar={liveRadar}
          liveRadarStatus={liveRadarStatus}
          onClose={() => setExploreLayer(null)}
        />
      )}
    </main>
  );
}

function HeroPanel({
  selectedLocation,
  observation,
  status,
}: {
  selectedLocation: LocationPreset;
  observation?: WeatherObservation;
  status: "loading" | "ready" | "error";
}) {
  return (
    <div className="grid min-h-[260px] content-between gap-6 rounded border border-[#cad7d1] bg-[#12352f] p-5 text-white shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-[#9ed8c5]">
            Clima Alerta
          </p>
          <h1 className="mt-2 max-w-3xl text-4xl font-semibold tracking-normal sm:text-5xl">
            Monitoramento meteorologico em tempo real
          </h1>
        </div>
        <span className="w-fit rounded border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-[#d8f0e7]">
          {status === "loading"
            ? "Atualizando"
            : status === "error"
              ? "Indisponivel"
              : "Online"}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div>
          <p className="text-sm text-[#b7d2c9]">Local monitorado</p>
          <p className="mt-1 text-2xl font-semibold">{selectedLocation.label}</p>
          <p className="mt-1 text-sm text-[#b7d2c9]">
            {selectedLocation.latitude.toFixed(4)},{" "}
            {selectedLocation.longitude.toFixed(4)}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:min-w-72">
          <HeroMetric
            label="Temperatura"
            value={
              observation
                ? `${formatNumber(observation.temperatureCelsius, 1)} C`
                : "--"
            }
          />
          <HeroMetric
            label="Chuva agora"
            value={
              observation
                ? `${formatNumber(observation.precipitationMm, 1)} mm`
                : "--"
            }
          />
        </div>
      </div>
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-white/15 bg-white/10 p-3">
      <p className="text-xs font-semibold uppercase text-[#b7d2c9]">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function LocationPanel(props: {
  selectedLocation: LocationPreset;
  countryCode: string;
  stateCode: string;
  cityLabel: string;
  states: StateOption[];
  cities: CityOption[];
  locationSource: LocationSource;
  locationLoading: boolean;
  locationMessage: string;
  formLatitude: string;
  formLongitude: string;
  permissionMessage: string;
  onLatitudeChange: (value: string) => void;
  onLongitudeChange: (value: string) => void;
  onCountryChange: (countryCode: string) => void;
  onStateChange: (stateCode: string) => void;
  onCityChange: (cityLabel: string) => void;
  onSelectedCitySubmit: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onBrowserLocation: () => void;
}) {
  return (
    <aside className="rounded border border-[#cad7d1] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-[#65756f]">
            Local consultado
          </p>
          <p className="mt-1 text-lg font-semibold">{props.selectedLocation.label}</p>
          <p className="text-sm text-[#5d6f68]">{props.selectedLocation.detail}</p>
        </div>
        <span className="rounded bg-[#eef3ef] px-2 py-1 text-xs font-semibold text-[#315f55]">
          {props.locationSource === "browser"
            ? "GPS"
            : props.locationSource === "manual"
              ? "Manual"
              : "Cidade"}
        </span>
      </div>

      <div className="mt-4 grid gap-3">
        <label className="text-xs font-semibold text-[#52615c]">
          Pais
          <select
            className="mt-1 w-full rounded border border-[#c5d2cc] bg-white px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#315f55]"
            value={props.countryCode}
            onChange={(event) => props.onCountryChange(event.target.value)}
          >
            {countryOptions.map((countryOption) => (
              <option key={countryOption.code} value={countryOption.code}>
                {countryOption.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-semibold text-[#52615c]">
          Estado
          <select
            className="mt-1 w-full rounded border border-[#c5d2cc] bg-white px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#315f55]"
            value={props.stateCode}
            onChange={(event) => props.onStateChange(event.target.value)}
            disabled={props.locationLoading}
          >
            {props.states.map((stateOption) => (
              <option key={stateOption.code} value={stateOption.code}>
                {stateOption.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-semibold text-[#52615c]">
          Cidade
          <select
            className="mt-1 w-full rounded border border-[#c5d2cc] bg-white px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#315f55]"
            value={props.cityLabel}
            onChange={(event) => props.onCityChange(event.target.value)}
            disabled={props.locationLoading || props.cities.length === 0}
          >
            {props.cities.length === 0 && <option value="">Sem cidades</option>}
            {props.cities.map((cityOption) => (
              <option key={cityOption.id} value={cityOption.label}>
                {cityOption.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        className="mt-3 w-full rounded bg-[#315f55] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#244d44] disabled:cursor-not-allowed disabled:bg-[#9aa9a3] focus:outline-none focus:ring-2 focus:ring-[#315f55] focus:ring-offset-2"
        type="button"
        disabled={props.locationLoading || props.cities.length === 0}
        onClick={props.onSelectedCitySubmit}
      >
        {props.locationLoading ? "Carregando..." : "Consultar clima da cidade"}
      </button>
      <p className="mt-2 text-xs leading-5 text-[#5d6f68]">
        {props.locationMessage}
      </p>

      <button
        className="mt-4 w-full rounded border border-[#315f55] px-3 py-2 text-sm font-semibold text-[#315f55] transition hover:bg-[#edf3ef] focus:outline-none focus:ring-2 focus:ring-[#315f55]"
        type="button"
        onClick={props.onBrowserLocation}
      >
        Usar minha localizacao
      </button>
      <p className="mt-2 text-xs leading-5 text-[#5d6f68]">
        {props.permissionMessage}
      </p>

      <form className="mt-4 grid grid-cols-2 gap-2 border-t border-[#edf2ef] pt-4" onSubmit={props.onSubmit}>
        <label className="text-xs font-semibold text-[#52615c]">
          Latitude
          <input
            className="mt-1 w-full rounded border border-[#c5d2cc] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#315f55]"
            inputMode="decimal"
            value={props.formLatitude}
            onChange={(event) => props.onLatitudeChange(event.target.value)}
          />
        </label>
        <label className="text-xs font-semibold text-[#52615c]">
          Longitude
          <input
            className="mt-1 w-full rounded border border-[#c5d2cc] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#315f55]"
            inputMode="decimal"
            value={props.formLongitude}
            onChange={(event) => props.onLongitudeChange(event.target.value)}
          />
        </label>
        <button
          className="col-span-2 rounded border border-[#315f55] px-3 py-2 text-sm font-semibold text-[#315f55] transition hover:bg-[#edf3ef] focus:outline-none focus:ring-2 focus:ring-[#315f55]"
          type="submit"
        >
          Consultar coordenada
        </button>
      </form>
    </aside>
  );
}

function LoadingState() {
  return (
    <div className="rounded border border-[#cad7d1] bg-white p-5 shadow-sm lg:col-span-2">
      <p className="text-sm font-semibold text-[#315f55]">
        Carregando dados reais...
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div className="h-32 animate-pulse rounded bg-[#dfe9e4]" key={item} />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded border border-[#d9b7b0] bg-white p-5 shadow-sm lg:col-span-2">
      <p className="text-lg font-semibold text-[#9d3328]">Dados indisponiveis</p>
      <p className="mt-2 text-sm leading-6 text-[#52615c]">
        {message || "A API propria nao retornou clima agora."}
      </p>
    </div>
  );
}

function CurrentWeather({
  observation,
  hourly,
}: {
  observation: WeatherObservation;
  hourly: HourlyWeatherForecast[];
}) {
  const nextRain = getRainSignal(observation, hourly);

  return (
    <section className="min-w-0 overflow-hidden rounded border border-[#cad7d1] bg-white p-5 shadow-sm">
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-[#315f55]">Agora</p>
            <span className="rounded bg-[#eef3ef] px-2 py-1 text-xs font-semibold text-[#315f55]">
              {formatDateTime(observation.observedAt, observation.timezone)}
            </span>
          </div>
          <h2 className="mt-3 text-6xl font-semibold tracking-normal">
            {formatNumber(observation.temperatureCelsius, 1)} C
          </h2>
          <p className="mt-2 text-lg text-[#52615c]">
            {observation.weatherDescription}
          </p>
        </div>

        <div className="rounded bg-[#f4f8f5] p-4">
          <p className="text-xs font-semibold uppercase text-[#61716b]">
            Proxima janela de chuva
          </p>
          <p className="mt-2 text-3xl font-semibold text-[#214f79]">
            {nextRain.label}
          </p>
          <p className="mt-2 text-sm leading-5 text-[#5d6f68]">{nextRain.detail}</p>
        </div>
      </div>

      <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        <Metric
          label="Sensacao"
          value={`${formatNumber(observation.apparentTemperatureCelsius, 1)} C`}
        />
        <Metric
          label="Umidade"
          value={`${formatNumber(observation.humidityPercent, 0)}%`}
        />
        <Metric
          label="Chuva"
          value={`${formatNumber(observation.precipitationMm, 1)} mm`}
        />
        <Metric
          label="Vento"
          value={`${formatNumber(observation.windSpeedKmh, 1)} km/h`}
        />
      </div>
    </section>
  );
}

function WeatherMapPanels({
  observation,
  hourly,
  liveRadar,
  liveRadarStatus,
  onExploreRain,
  onExploreSatellite,
}: {
  observation: WeatherObservation;
  hourly: HourlyWeatherForecast[];
  liveRadar: LiveRadarLayer | null;
  liveRadarStatus: "idle" | "loading" | "ready" | "error";
  onExploreRain: () => void;
  onExploreSatellite: () => void;
}) {
  return (
    <section className="grid min-w-0 gap-4 2xl:grid-cols-2">
      <RainRadar
        observation={observation}
        hourly={hourly}
        liveRadar={liveRadar}
        liveRadarStatus={liveRadarStatus}
        onExplore={onExploreRain}
      />
      <CloudSatellite
        observation={observation}
        hourly={hourly}
        onExplore={onExploreSatellite}
      />
    </section>
  );
}

function RainRadar({
  observation,
  hourly,
  liveRadar,
  liveRadarStatus,
  onExplore,
}: {
  observation: WeatherObservation;
  hourly: HourlyWeatherForecast[];
  liveRadar: LiveRadarLayer | null;
  liveRadarStatus: "idle" | "loading" | "ready" | "error";
  onExplore: () => void;
}) {
  const rainSignal = getRainSignal(observation, hourly);

  return (
    <article className="min-w-0 overflow-hidden rounded border border-[#cad7d1] bg-[#071d2c] text-white shadow-sm">
      <div className="flex items-start justify-between gap-3 p-4">
        <div>
          <p className="text-xs font-semibold uppercase text-[#8fd4ff]">
            Radar de chuva
          </p>
          <h2 className="mt-1 text-xl font-semibold">Mapa de chuva</h2>
        </div>
        <span className="rounded bg-white/10 px-2 py-1 text-xs font-semibold text-[#d5efff]">
          {liveRadarStatus === "ready" ? "Ao vivo" : rainSignal.label}
        </span>
      </div>
      <div className="relative mx-4 h-64 overflow-hidden rounded border border-white/10 bg-[#0d2a3c]">
        {liveRadar && liveRadarStatus === "ready" ? (
          <div
            aria-label="Radar de chuva recente centralizado na localizacao consultada"
            className="h-full w-full bg-cover bg-center"
            role="img"
            style={{ backgroundImage: `url(${liveRadar.imageUrl})` }}
          />
        ) : (
          <div className="grid h-full place-items-center px-6 text-center text-sm text-[#bfd5df]">
            {liveRadarStatus === "loading"
              ? "Carregando radar em tempo real..."
              : "Radar real indisponivel agora."}
          </div>
        )}
        <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#ff4d4d] shadow-lg shadow-black/30" />
        <div className="absolute bottom-3 left-3 rounded bg-black/45 px-2 py-1 text-xs font-semibold text-white">
          {liveRadar
            ? formatDateTime(liveRadar.observedAt, observation.timezone)
            : "RainViewer"}
        </div>
      </div>
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-[#bfd5df]">
          Dados por RainViewer. Atualizacao exibida quando a fonte retorna frame recente.
        </p>
        <button
          className="shrink-0 rounded bg-[#8fd4ff] px-3 py-2 text-sm font-semibold text-[#071d2c] transition hover:bg-[#b9e6ff] focus:outline-none focus:ring-2 focus:ring-[#8fd4ff] focus:ring-offset-2 focus:ring-offset-[#071d2c]"
          type="button"
          onClick={onExplore}
        >
          Explorar no mapa
        </button>
      </div>
    </article>
  );
}

function CloudSatellite({
  observation,
  hourly,
  onExplore,
}: {
  observation: WeatherObservation;
  hourly: HourlyWeatherForecast[];
  onExplore: () => void;
}) {
  const cloudSignal = getCloudSignal(observation, hourly);
  const satelliteUrl = buildLiveSatelliteImageUrl(observation.location, 900, 600);

  return (
    <article className="min-w-0 overflow-hidden rounded border border-[#cad7d1] bg-[#f8faf7] shadow-sm">
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-[#5d6f68]">
            Satelite nuvens
          </p>
          <h2 className="mt-1 text-xl font-semibold">GOES-East infravermelho</h2>
        </div>
        <span className="shrink-0 rounded bg-[#e7eee9] px-2 py-1 text-xs font-semibold text-[#315f55]">
          NASA GIBS
        </span>
      </div>
      <div className="relative mx-4 h-64 overflow-hidden rounded border border-[#cbd7d1] bg-[#1d1f22]">
        <div
          aria-label="Imagem real de satelite GOES-East em infravermelho"
          className="h-full w-full bg-cover bg-center"
          role="img"
          style={{ backgroundImage: `url(${satelliteUrl})` }}
        />
        <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#ff4d4d] shadow-lg shadow-black/30" />
        <div className="absolute bottom-3 left-3 rounded bg-black/45 px-2 py-1 text-xs font-semibold text-white">
          Latest GOES-East
        </div>
      </div>
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-[#52615c]">
          Camada real GOES-East Band 13 via NASA GIBS. Sinal local:{" "}
          {cloudSignal.label}.
        </p>
        <button
          className="shrink-0 rounded bg-[#315f55] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#244d44] focus:outline-none focus:ring-2 focus:ring-[#315f55] focus:ring-offset-2"
          type="button"
          onClick={onExplore}
        >
          Explorar satelite
        </button>
      </div>
    </article>
  );
}

function ExploreLayerDialog({
  layer,
  observation,
  hourly,
  liveRadar,
  liveRadarStatus,
  onClose,
}: {
  layer: Exclude<ExploreLayer, null>;
  observation: WeatherObservation;
  hourly: HourlyWeatherForecast[];
  liveRadar: LiveRadarLayer | null;
  liveRadarStatus: "idle" | "loading" | "ready" | "error";
  onClose: () => void;
}) {
  const rainSignal = getRainSignal(observation, hourly);
  const cloudSignal = getCloudSignal(observation, hourly);
  const isRain = layer === "rain";
  const title = isRain ? "Radar de chuva" : "Satelite nuvens";
  const subtitle = isRain ? rainSignal.label : cloudSignal.label;
  const detail = isRain ? rainSignal.detail : cloudSignal.detail;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#07130f]/70 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="explore-layer-title"
    >
      <div className="grid max-h-[92vh] w-full max-w-6xl overflow-hidden rounded border border-[#cad7d1] bg-white shadow-2xl">
        <div className="flex flex-col gap-3 border-b border-[#d8e2dd] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-[#315f55]">
              Exploracao
            </p>
            <h2 id="explore-layer-title" className="mt-1 text-2xl font-semibold">
              {title}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-[#eef3ef] px-3 py-2 text-sm font-semibold text-[#315f55]">
              {subtitle}
            </span>
            <button
              className="rounded border border-[#315f55] px-3 py-2 text-sm font-semibold text-[#315f55] transition hover:bg-[#edf3ef] focus:outline-none focus:ring-2 focus:ring-[#315f55]"
              type="button"
              onClick={onClose}
            >
              Fechar
            </button>
          </div>
        </div>

        <div className="grid min-h-0 gap-4 overflow-y-auto p-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <ExpandedWeatherLayer
            layer={layer}
            observation={observation}
            hourly={hourly}
            liveRadar={liveRadar}
            liveRadarStatus={liveRadarStatus}
          />
          <aside className="grid content-start gap-3">
            <MiniInsight
              label="Local"
              value={`${observation.location.latitude.toFixed(3)}, ${observation.location.longitude.toFixed(3)}`}
              detail={formatDateTime(observation.observedAt, observation.timezone)}
            />
            <MiniInsight
              label={isRain ? "Sinal de chuva" : "Cobertura"}
              value={subtitle}
              detail={detail}
            />
            <MiniInsight
              label="Vento"
              value={`${formatNumber(observation.windSpeedKmh, 1)} km/h`}
              detail={`Umidade ${formatNumber(observation.humidityPercent, 0)}%`}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}

function ExpandedWeatherLayer({
  layer,
  observation,
  hourly,
  liveRadar,
  liveRadarStatus,
}: {
  layer: Exclude<ExploreLayer, null>;
  observation: WeatherObservation;
  hourly: HourlyWeatherForecast[];
  liveRadar: LiveRadarLayer | null;
  liveRadarStatus: "idle" | "loading" | "ready" | "error";
}) {
  const rainSignal = getRainSignal(observation, hourly);
  const cloudSignal = getCloudSignal(observation, hourly);
  const satelliteUrl = buildLiveSatelliteImageUrl(observation.location, 1200, 760);

  if (layer === "rain") {
    return (
      <div className="relative min-h-[520px] overflow-hidden rounded border border-[#0f3148] bg-[#071d2c]">
        {liveRadar && liveRadarStatus === "ready" ? (
          <div
            aria-label="Radar de chuva ampliado com frame recente"
            className="h-full min-h-[520px] w-full bg-cover bg-center"
            role="img"
            style={{ backgroundImage: `url(${liveRadar.imageUrl})` }}
          />
        ) : (
          <div className="grid min-h-[520px] place-items-center px-6 text-center text-sm text-[#bfd5df]">
            {liveRadarStatus === "loading"
              ? "Carregando radar em tempo real..."
              : `Radar real indisponivel agora. Sinal local: ${rainSignal.label}.`}
          </div>
        )}
        <div className="absolute inset-x-0 top-1/2 border-t border-white/15" />
        <div className="absolute inset-y-0 left-1/2 border-l border-white/15" />
        <div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#ff4d4d] shadow-lg shadow-black/30" />
        <div className="absolute bottom-4 left-4 rounded bg-black/45 px-3 py-2 text-sm font-semibold text-white">
          {liveRadar
            ? `RainViewer ${formatDateTime(liveRadar.observedAt, observation.timezone)}`
            : "RainViewer"}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[520px] overflow-hidden rounded border border-[#cbd7d1] bg-[#1d1f22]">
      <div
        aria-label="Imagem ampliada real de satelite GOES-East em infravermelho"
        className="h-full min-h-[520px] w-full bg-cover bg-center"
        role="img"
        style={{ backgroundImage: `url(${satelliteUrl})` }}
      />
      <div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#ff4d4d] shadow-lg shadow-black/30" />
      <div className="absolute bottom-4 left-4 rounded bg-black/35 px-3 py-2 text-sm font-semibold text-white">
        NASA GIBS GOES-East - sinal local: {cloudSignal.label}
      </div>
    </div>
  );
}

function RiskSummary({
  observation,
  hourly,
}: {
  observation: WeatherObservation;
  hourly: HourlyWeatherForecast[];
}) {
  const rainSignal = getRainSignal(observation, hourly);
  const cloudSignal = getCloudSignal(observation, hourly);
  const windLabel =
    observation.windSpeedKmh >= 45
      ? "Vento forte"
      : observation.windSpeedKmh >= 25
        ? "Atencao"
        : "Estavel";

  return (
    <aside className="min-w-0 rounded border border-[#cad7d1] bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-[#315f55]">Resumo operacional</p>
      <div className="mt-4 grid gap-3">
        <StatusRow label="Chuva" value={rainSignal.label} tone="blue" />
        <StatusRow label="Nuvens" value={cloudSignal.label} tone="green" />
        <StatusRow label="Vento" value={windLabel} tone="amber" />
      </div>
    </aside>
  );
}

function StatusRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "amber" | "blue" | "green";
}) {
  const toneClass = {
    amber: "bg-[#fff4d8] text-[#77540b]",
    blue: "bg-[#e3f2ff] text-[#214f79]",
    green: "bg-[#e7f4eb] text-[#25583b]",
  }[tone];

  return (
    <div className="flex items-center justify-between gap-3 rounded bg-[#f8faf7] p-3">
      <span className="text-sm font-semibold text-[#52615c]">{label}</span>
      <span className={`rounded px-2 py-1 text-sm font-semibold ${toneClass}`}>
        {value}
      </span>
    </div>
  );
}

function SourcePanel({ observation }: { observation: WeatherObservation }) {
  return (
    <aside className="min-w-0 rounded border border-[#cad7d1] bg-[#17211d] p-5 text-white shadow-sm">
      <p className="text-sm font-semibold text-[#9bc7b8]">Fonte</p>
      <p className="mt-3 text-2xl font-semibold">{observation.source.name}</p>
      <p className="mt-3 text-sm leading-6 text-[#c8d7d0]">
        Atualizado pela API do backend em{" "}
        {formatDateTime(observation.source.fetchedAt, observation.timezone)}.
      </p>
      <div className="mt-5 border-t border-white/15 pt-4">
        <p className="text-sm font-semibold text-[#f1d28b]">Alertas oficiais</p>
        <p className="mt-2 text-sm leading-6 text-[#c8d7d0]">
          Nenhum provider oficial de alertas foi integrado nesta fase.
        </p>
      </div>
    </aside>
  );
}

function HourlyForecast({ rows }: { rows: HourlyWeatherForecast[] }) {
  const visibleRows = useMemo(() => rows.slice(0, 12), [rows]);
  return (
    <section className="min-w-0 overflow-hidden rounded border border-[#cad7d1] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#315f55]">Linha do tempo</p>
          <h2 className="text-xl font-semibold">Proximas horas</h2>
        </div>
        <p className="text-sm text-[#5d6f68]">Temperatura, chuva e vento</p>
      </div>
      <div className="mt-4 min-w-0 overflow-x-auto pb-1">
        <div className="grid min-w-[840px] grid-cols-12 gap-2">
          {visibleRows.map((row) => (
            <div
              className="rounded border border-[#d8e2dd] bg-[#f8faf7] p-3"
              key={row.time}
            >
              <p className="text-xs font-semibold text-[#52615c]">
                {formatHour(row.time, row.timezone)}
              </p>
              <p className="mt-2 text-lg font-semibold">
                {formatNumber(row.temperatureCelsius, 0)} C
              </p>
              <p className="mt-1 h-10 overflow-hidden text-xs leading-5 text-[#61716b]">
                {row.weatherDescription}
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded bg-[#dfe8e3]">
                <div
                  className="h-full rounded bg-[#2d88d8]"
                  style={{
                    width: `${Math.max(
                      row.precipitationProbabilityPercent ?? 0,
                      Math.min(100, row.precipitationMm * 18),
                    )}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs font-semibold text-[#214f79]">
                {formatOptionalPercent(row.precipitationProbabilityPercent)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DailyForecast({ rows }: { rows: DailyWeatherForecast[] }) {
  return (
    <section className="min-w-0 overflow-hidden rounded border border-[#cad7d1] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#315f55]">Planejamento</p>
          <h2 className="text-xl font-semibold">Proximos dias</h2>
        </div>
        <p className="text-sm text-[#5d6f68]">Minima, maxima e acumulado</p>
      </div>
      <div className="mt-4 min-w-0 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#dce3de] text-[#52615c]">
              <th className="py-3 pr-4 font-semibold">Dia</th>
              <th className="py-3 pr-4 font-semibold">Condicao</th>
              <th className="py-3 pr-4 font-semibold">Min / Max</th>
              <th className="py-3 pr-4 font-semibold">Chuva</th>
              <th className="py-3 font-semibold">Vento</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-b border-[#eef2ef]" key={row.date}>
                <td className="py-3 pr-4 font-semibold">
                  {formatDate(row.date, row.timezone)}
                </td>
                <td className="py-3 pr-4 text-[#52615c]">
                  {row.weatherDescription}
                </td>
                <td className="py-3 pr-4">
                  {formatNumber(row.temperatureMinCelsius, 0)} /{" "}
                  {formatNumber(row.temperatureMaxCelsius, 0)} C
                </td>
                <td className="py-3 pr-4">
                  {formatNumber(row.precipitationSumMm, 1)} mm
                </td>
                <td className="py-3">
                  {row.windSpeedMaxKmh === undefined
                    ? "Indisponivel"
                    : `${formatNumber(row.windSpeedMaxKmh, 1)} km/h`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DailyHighlights({ rows }: { rows: DailyWeatherForecast[] }) {
  const wettestDay = rows.reduce((selected, row) =>
    row.precipitationSumMm > selected.precipitationSumMm ? row : selected,
  );
  const hottestDay = rows.reduce((selected, row) =>
    row.temperatureMaxCelsius > selected.temperatureMaxCelsius ? row : selected,
  );

  return (
    <aside className="min-w-0 rounded border border-[#cad7d1] bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-[#315f55]">Destaques da semana</p>
      <div className="mt-4 grid gap-3">
        <MiniInsight
          label="Maior acumulado"
          value={`${formatNumber(wettestDay.precipitationSumMm, 1)} mm`}
          detail={formatDate(wettestDay.date, wettestDay.timezone)}
        />
        <MiniInsight
          label="Dia mais quente"
          value={`${formatNumber(hottestDay.temperatureMaxCelsius, 0)} C`}
          detail={formatDate(hottestDay.date, hottestDay.timezone)}
        />
      </div>
    </aside>
  );
}

function MiniInsight({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded bg-[#f8faf7] p-3">
      <p className="text-xs font-semibold uppercase text-[#61716b]">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-[#5d6f68]">{detail}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-[#d8e2dd] bg-[#f8faf7] p-4">
      <p className="text-xs font-semibold uppercase text-[#61716b]">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function getRainSignal(
  observation: WeatherObservation,
  hourly: HourlyWeatherForecast[],
) {
  const nextRows = hourly.slice(0, 6);
  const maxProbability = Math.max(
    0,
    ...nextRows.map((row) => row.precipitationProbabilityPercent ?? 0),
  );
  const maxRain = Math.max(
    0,
    observation.precipitationMm,
    ...nextRows.map((row) => row.precipitationMm),
  );
  const score = Math.min(100, Math.max(maxProbability, maxRain * 22));

  if (score >= 70) {
    return {
      score,
      label: "Alta",
      detail:
        "Sinal forte de chuva nas proximas horas. Monitore deslocamentos e areas de alagamento.",
    };
  }

  if (score >= 35) {
    return {
      score,
      label: "Moderada",
      detail:
        "Ha chance relevante de pancadas. Acompanhe a evolucao da previsao horaria.",
    };
  }

  return {
    score,
    label: "Baixa",
    detail: "Pouco sinal de chuva imediata para a coordenada consultada.",
  };
}

function getCloudSignal(
  observation: WeatherObservation,
  hourly: HourlyWeatherForecast[],
) {
  const nextHumidity = hourly.slice(0, 6).map((row) => row.humidityPercent);
  const humidity = Math.max(observation.humidityPercent, ...nextHumidity);
  const description = observation.weatherDescription.toLowerCase();
  const descriptionBoost =
    description.includes("nublado") || description.includes("nevoeiro")
      ? 16
      : description.includes("chuva")
        ? 10
        : 0;
  const score = Math.min(100, humidity * 0.78 + descriptionBoost);

  if (score >= 78) {
    return {
      score,
      label: "Muito nublado",
      detail: "Cobertura alta estimada por umidade e condicao observada.",
    };
  }

  if (score >= 55) {
    return {
      score,
      label: "Parcial",
      detail: "Nuvens presentes, com aberturas possiveis ao longo do periodo.",
    };
  }

  return {
    score,
    label: "Poucas nuvens",
    detail: "Baixa cobertura estimada para a coordenada consultada.",
  };
}

function formatNumber(value: number, fractionDigits: number): string {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(value);
}

function formatDateTime(value: string, timezone: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: timezone,
  }).format(new Date(value));
}

function formatHour(value: string, timezone: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(value));
}

function formatDate(value: string, timezone: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
  }).format(new Date(`${value}T12:00:00`));
}

function formatOptionalPercent(value: number | undefined): string {
  return value === undefined
    ? "Chuva indisponivel"
    : `${formatNumber(value, 0)}% chuva`;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
