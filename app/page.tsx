"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { fetchWeatherBundle } from "./weather-api";
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

const locationPresets: LocationPreset[] = [
  defaultLocation,
  {
    label: "Sao Paulo, SP",
    detail: "Centro expandido",
    latitude: -23.5505,
    longitude: -46.6333,
  },
  {
    label: "Recife, PE",
    detail: "Marco Zero",
    latitude: -8.0632,
    longitude: -34.8711,
  },
];

export default function Home() {
  const [selectedLocation, setSelectedLocation] =
    useState<LocationPreset>(defaultLocation);
  const [formLatitude, setFormLatitude] = useState(String(defaultLocation.latitude));
  const [formLongitude, setFormLongitude] = useState(String(defaultLocation.longitude));
  const [weather, setWeather] = useState<WeatherBundle | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const [permissionMessage, setPermissionMessage] = useState(
    "Geolocalizacao do navegador nao solicitada.",
  );

  useEffect(() => {
    void loadWeather(defaultLocation);
  }, []);

  async function loadWeather(location: LocationPreset) {
    setSelectedLocation(location);
    setFormLatitude(String(location.latitude));
    setFormLongitude(String(location.longitude));
    setStatus("loading");
    setMessage("");

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
  }

  function requestBrowserLocation() {
    if (!navigator.geolocation) {
      setPermissionMessage("Este navegador nao disponibiliza geolocalizacao.");
      return;
    }

    setPermissionMessage("Aguardando consentimento do navegador.");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          label: "Minha localizacao",
          detail: "Permissao unica do navegador",
          latitude: Number(position.coords.latitude.toFixed(4)),
          longitude: Number(position.coords.longitude.toFixed(4)),
        };
        setPermissionMessage("Localizacao recebida somente para esta consulta.");
        void loadWeather(location);
      },
      () => {
        setPermissionMessage("Permissao negada ou localizacao indisponivel.");
      },
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 },
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7f4] text-[#17211d]">
      <section className="border-b border-[#d8dfd8] bg-[#fbfcf7]">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[1fr_360px] lg:px-10">
          <div>
            <p className="text-sm font-semibold uppercase text-[#4d7266]">
              Clima Alerta
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-normal sm:text-5xl">
              Monitoramento meteorologico real
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[#51615b]">
              Dados carregados pela API propria do projeto. O navegador nao chama o
              provider meteorologico externo diretamente.
            </p>
          </div>

          <LocationPanel
            selectedLocation={selectedLocation}
            formLatitude={formLatitude}
            formLongitude={formLongitude}
            permissionMessage={permissionMessage}
            onLatitudeChange={setFormLatitude}
            onLongitudeChange={setFormLongitude}
            onPreset={loadWeather}
            onSubmit={submitManualLocation}
            onBrowserLocation={requestBrowserLocation}
          />
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-5 px-5 py-6 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
        {status === "loading" && <LoadingState />}
        {status === "error" && <ErrorState message={message} />}
        {status === "ready" && weather && (
          <>
            <CurrentWeather observation={weather.current} />
            <SourcePanel observation={weather.current} />
            <HourlyForecast rows={weather.hourly} />
            <DailyForecast rows={weather.daily} />
          </>
        )}
      </section>
    </main>
  );
}

function LocationPanel(props: {
  selectedLocation: LocationPreset;
  formLatitude: string;
  formLongitude: string;
  permissionMessage: string;
  onLatitudeChange: (value: string) => void;
  onLongitudeChange: (value: string) => void;
  onPreset: (location: LocationPreset) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onBrowserLocation: () => void;
}) {
  return (
    <aside className="rounded border border-[#d7ded8] bg-white p-4 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase text-[#6a7b75]">
          Local consultado
        </p>
        <p className="mt-1 text-lg font-semibold">{props.selectedLocation.label}</p>
        <p className="text-sm text-[#61716b]">{props.selectedLocation.detail}</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1">
        {locationPresets.map((preset) => (
          <button
            className="rounded border border-[#cad5ce] px-3 py-2 text-left text-sm font-semibold hover:bg-[#edf3ef]"
            key={preset.label}
            type="button"
            onClick={() => props.onPreset(preset)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <button
        className="mt-3 w-full rounded bg-[#315f55] px-3 py-2 text-sm font-semibold text-white hover:bg-[#254940]"
        type="button"
        onClick={props.onBrowserLocation}
      >
        Usar minha localizacao
      </button>
      <p className="mt-2 text-xs leading-5 text-[#61716b]">
        {props.permissionMessage}
      </p>

      <form className="mt-4 grid grid-cols-2 gap-2" onSubmit={props.onSubmit}>
        <label className="text-xs font-semibold text-[#52615c]">
          Latitude
          <input
            className="mt-1 w-full rounded border border-[#cad5ce] px-3 py-2 text-sm"
            inputMode="decimal"
            value={props.formLatitude}
            onChange={(event) => props.onLatitudeChange(event.target.value)}
          />
        </label>
        <label className="text-xs font-semibold text-[#52615c]">
          Longitude
          <input
            className="mt-1 w-full rounded border border-[#cad5ce] px-3 py-2 text-sm"
            inputMode="decimal"
            value={props.formLongitude}
            onChange={(event) => props.onLongitudeChange(event.target.value)}
          />
        </label>
        <button
          className="col-span-2 rounded border border-[#315f55] px-3 py-2 text-sm font-semibold text-[#315f55] hover:bg-[#edf3ef]"
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
    <div className="rounded border border-[#d7ded8] bg-white p-5 shadow-sm lg:col-span-2">
      <p className="text-sm font-semibold text-[#315f55]">
        Carregando dados reais...
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div className="h-28 animate-pulse rounded bg-[#e7eee9]" key={item} />
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

function CurrentWeather({ observation }: { observation: WeatherObservation }) {
  return (
    <section className="rounded border border-[#d7ded8] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#315f55]">Agora</p>
          <h2 className="mt-2 text-5xl font-semibold tracking-normal">
            {formatNumber(observation.temperatureCelsius, 1)} C
          </h2>
          <p className="mt-2 text-base text-[#52615c]">
            {observation.weatherDescription}
          </p>
        </div>
        <div className="rounded border border-[#dce3de] bg-[#f8faf7] px-3 py-2 text-sm text-[#52615c]">
          Observado em {formatDateTime(observation.observedAt, observation.timezone)}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
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

function SourcePanel({ observation }: { observation: WeatherObservation }) {
  return (
    <aside className="rounded border border-[#d7ded8] bg-[#17211d] p-5 text-white shadow-sm">
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
    <section className="rounded border border-[#d7ded8] bg-white p-5 shadow-sm lg:col-span-2">
      <h2 className="text-xl font-semibold">Proximas horas</h2>
      <div className="mt-4 overflow-x-auto">
        <div className="grid min-w-[760px] grid-cols-12 gap-2">
          {visibleRows.map((row) => (
            <div
              className="rounded border border-[#dce3de] bg-[#f8faf7] p-3"
              key={row.time}
            >
              <p className="text-xs font-semibold text-[#52615c]">
                {formatHour(row.time, row.timezone)}
              </p>
              <p className="mt-2 text-lg font-semibold">
                {formatNumber(row.temperatureCelsius, 0)} C
              </p>
              <p className="mt-1 min-h-10 text-xs leading-5 text-[#61716b]">
                {row.weatherDescription}
              </p>
              <p className="mt-2 text-xs text-[#315f55]">
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
    <section className="rounded border border-[#d7ded8] bg-white p-5 shadow-sm lg:col-span-2">
      <h2 className="text-xl font-semibold">Proximos dias</h2>
      <div className="mt-4 overflow-x-auto">
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-[#dce3de] bg-[#f8faf7] p-4">
      <p className="text-xs font-semibold uppercase text-[#61716b]">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
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
