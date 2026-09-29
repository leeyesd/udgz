"use client";
import { regionLabel } from "./place-region";
import { useEffect, useState } from 'react';
export function useTopRegions() {
  const [regions, setRegions] = useState<string[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/places?regions=1', {signal:controller.signal}).then(r => {
      if (!r.ok) throw new Error('regions');
      return r.json() as Promise<{regions?: {province:string;city:string}[]}>;
    }).then(data => setRegions((data.regions ?? []).map((r: {province:string;city:string}) => regionLabel(r))))
      .catch(() => {});
    return () => controller.abort();
  }, []);
  return regions;
}
