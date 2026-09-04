"use client";

import { useState } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/mapbox";
import { MapPin } from "lucide-react";
import { hospitals } from "@/data/demo";
import { UrgencyPill } from "@/components/urgency-pill";

export function HospitalMap() {
  const [selected, setSelected] = useState<(typeof hospitals)[number]>(hospitals[0]);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!token) {
    return <div className="grid h-[460px] place-items-center bg-stone-100 p-8 text-center text-sm text-stone-500">Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local, then restart the dev server.</div>;
  }

  return (
    <div className="relative h-[460px] overflow-hidden rounded-3xl bg-stone-100 sm:h-[560px]">
      <Map initialViewState={{ longitude: 96.153, latitude: 16.837, zoom: 10.5 }} mapboxAccessToken={token} mapStyle="mapbox://styles/mapbox/light-v11" attributionControl>
        <NavigationControl position="top-right" showCompass={false} />
        {hospitals.map((hospital) => (
          <Marker key={hospital.id} longitude={hospital.longitude} latitude={hospital.latitude} anchor="bottom">
            <button onClick={() => setSelected(hospital)} aria-label={`View ${hospital.name}`} className={`group flex flex-col items-center transition ${selected.id === hospital.id ? "scale-110" : "hover:scale-105"}`}>
              <span className="rounded-lg bg-white px-2 py-1 text-[10px] font-black text-brand-700 shadow-md">{hospital.need}</span>
              <MapPin className="h-9 w-9 fill-brand-600 text-white drop-shadow-md" />
            </button>
          </Marker>
        ))}
      </Map>
      <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/80 bg-white/95 p-4 shadow-card backdrop-blur sm:inset-x-auto sm:bottom-5 sm:left-5 sm:w-80">
        <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Demo need · {selected.township}</p><h2 className="mt-1 text-sm font-black">{selected.name}</h2></div><UrgencyPill urgency={selected.urgency} /></div>
        <p className="mt-3 text-xs text-stone-500"><strong className="text-lg text-brand-700">{selected.need}</strong> requested · fictional marker</p>
      </div>
    </div>
  );
}
