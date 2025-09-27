'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { fetchSubwayEntrances, convertToGeoJSON } from '../lib/subwayData';

export default function Home() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // You'll need to set your Mapbox token in .env.local
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-73.9851, 40.7589], // NYC center
      zoom: 11
    });

    // Load subway entrances when map is ready
    map.current.on('load', async () => {
      try {
        const entrances = await fetchSubwayEntrances();
        const geoJSONData = convertToGeoJSON(entrances);

        // Add subway entrances source
        map.current?.addSource('subway-entrances', {
          type: 'geojson',
          data: geoJSONData
        });

        // Add subway entrance layer
        map.current?.addLayer({
          id: 'subway-entrances-layer',
          type: 'circle',
          source: 'subway-entrances',
          paint: {
            'circle-radius': 4,
            'circle-color': '#1a73e8',
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 0.8
          }
        });

        // Add click interaction
        map.current?.on('click', 'subway-entrances-layer', (e) => {
          const coordinates = e.lngLat;
          const properties = e.features?.[0]?.properties;

          if (properties) {
            new mapboxgl.Popup()
              .setLngLat(coordinates)
              .setHTML(`
                <div class="p-2">
                  <h3 class="font-bold text-lg">${properties.stationName}</h3>
                  <p class="text-sm text-gray-600">${properties.name}</p>
                  ${properties.entranceType ? `<p class="text-sm"><strong>Type:</strong> ${properties.entranceType}</p>` : ''}
                  ${properties.routes ? `<p class="text-sm"><strong>Routes:</strong> ${properties.routes}</p>` : ''}
                  ${properties.ada === 'YES' ? '<p class="text-sm text-green-600"><strong>ADA Accessible</strong></p>' : ''}
                  ${properties.staffing ? `<p class="text-sm"><strong>Staffing:</strong> ${properties.staffing}</p>` : ''}
                </div>
              `)
              .addTo(map.current!);
          }
        });

        // Change cursor on hover
        map.current?.on('mouseenter', 'subway-entrances-layer', () => {
          map.current!.getCanvas().style.cursor = 'pointer';
        });

        map.current?.on('mouseleave', 'subway-entrances-layer', () => {
          map.current!.getCanvas().style.cursor = '';
        });

      } catch (error) {
        console.error('Error loading subway data:', error);
      }
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  return (
    <div className="h-screen w-full">
      <div ref={mapContainer} className="h-full w-full" />
    </div>
  );
}
