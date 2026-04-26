import { useEffect, useMemo, useRef, useState } from "react";

import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type {
  Feature,
  FeatureCollection,
  Geometry,
  GeometryCollection,
  GeoJsonProperties,
  Position
} from "geojson";

import { Badge } from "../common/Badge";
import { LoadingState } from "../common/LoadingState";
import type { MapRegionMetric, FacilityMapPoint } from "../../types/map";

const SOURCE_ID = "india-boundaries-source";
const FILL_LAYER_ID = "india-boundaries-fill";
const BORDER_LAYER_ID = "india-boundaries-border";
const HOVER_LAYER_ID = "india-boundaries-hover";

const MARKER_SOURCE_ID = "facility-markers-source";
const MARKER_LAYER_ID = "facility-markers-layer";
const MARKER_SELECTED_LAYER_ID = "facility-markers-selected-layer";

const DEFAULT_CENTER: [number, number] = [78.9629, 22.5937];
const DEFAULT_ZOOM = 3.3;

interface IndiaMapProps {
  regionMetrics?: MapRegionMetric[];
  isLoadingMetrics?: boolean;
  metricsError?: string | null;
  facilityPoints?: FacilityMapPoint[];
  selectedFacilityId?: string | null;
  onSelectFacility?: (facilityId: string) => void;
}

function normalizeStateKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function markerColor(point: FacilityMapPoint): string {
  const trust = (point.trust_category ?? "").toLowerCase();
  const readiness = (point.recommendation_readiness ?? "").toLowerCase();

  if (trust.includes("high trust") || readiness.includes("ready for recommendation")) {
    return "#10b981";
  }
  if (trust.includes("moderate") || readiness.includes("usable with verification")) {
    return "#f59e0b";
  }
  if (trust.includes("low trust") || readiness.includes("needs human verification")) {
    return "#f97316";
  }
  if (trust.includes("high risk") || readiness.includes("do not recommend")) {
    return "#dc2626";
  }
  return "#6b7280";
}

export function getFeatureStateName(feature: Feature<Geometry, GeoJsonProperties>): string | null {
  const properties = feature.properties ?? {};
  const keys = ["state", "STATE", "ST_NM", "NAME_1", "NAME", "State_Name"];

  for (const key of keys) {
    const value = properties[key];
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }

  return null;
}

function asFeatureCollection(value: unknown): FeatureCollection<Geometry, GeoJsonProperties> | null {
  if (
    value &&
    typeof value === "object" &&
    (value as { type?: string }).type === "FeatureCollection" &&
    Array.isArray((value as { features?: unknown[] }).features)
  ) {
    return value as FeatureCollection<Geometry, GeoJsonProperties>;
  }

  return null;
}

function iterCoordinates(coords: unknown, onPosition: (position: Position) => void): void {
  if (!Array.isArray(coords)) {
    return;
  }

  if (coords.length >= 2 && typeof coords[0] === "number" && typeof coords[1] === "number") {
    onPosition(coords as Position);
    return;
  }

  for (const child of coords) {
    iterCoordinates(child, onPosition);
  }
}

function collectGeometryBounds(geometry: Geometry, onPosition: (position: Position) => void): void {
  if (geometry.type === "GeometryCollection") {
    for (const child of (geometry as GeometryCollection).geometries) {
      collectGeometryBounds(child, onPosition);
    }
    return;
  }

  iterCoordinates((geometry as Exclude<Geometry, GeometryCollection>).coordinates, onPosition);
}

function createMetricLookup(metrics: MapRegionMetric[]): Map<string, MapRegionMetric> {
  const map = new Map<string, MapRegionMetric>();

  for (const metric of metrics) {
    if (!metric.state) {
      continue;
    }
    map.set(normalizeStateKey(metric.state), metric);
  }

  return map;
}

function createMarkerCollection(points: FacilityMapPoint[]): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: points
      .filter(
        (point) =>
          Number.isFinite(point.latitude) &&
          Number.isFinite(point.longitude)
      )
      .map((point) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [point.longitude, point.latitude]
        },
        properties: {
          facility_id: point.facility_id,
          name: point.name,
          city: point.city,
          state: point.state,
          facility_type: point.facility_type,
          trust_score: point.trust_score,
          trust_category: point.trust_category,
          recommendation_readiness: point.recommendation_readiness,
          final_score: point.final_score,
          reason_for_recommendation: point.reason_for_recommendation,
          marker_color: markerColor(point)
        }
      }))
  };
}

export function IndiaMap({
  regionMetrics = [],
  isLoadingMetrics = false,
  metricsError,
  facilityPoints = [],
  selectedFacilityId,
  onSelectFacility
}: IndiaMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const hoveredFeatureId = useRef<number | string | null>(null);
  const mapReadyRef = useRef(false);

  const [mapError, setMapError] = useState<string | null>(null);
  const [isGeoLoading, setIsGeoLoading] = useState(true);

  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
  const mapStyle =
    (import.meta.env.VITE_MAPBOX_STYLE as string | undefined) ?? "mapbox://styles/mapbox/dark-v11";

  const metricsLookup = useMemo(() => createMetricLookup(regionMetrics), [regionMetrics]);
  const validMarkerCount = useMemo(
    () =>
      facilityPoints.filter(
        (point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude)
      ).length,
    [facilityPoints]
  );

  useEffect(() => {
    if (!mapboxToken) {
      setMapError("Mapbox token missing. Add VITE_MAPBOX_TOKEN to .env.local.");
      setIsGeoLoading(false);
      return;
    }

    if (!mapContainerRef.current) {
      return;
    }

    let isCancelled = false;
    setMapError(null);
    setIsGeoLoading(true);

    mapboxgl.accessToken = mapboxToken;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: true
    });

    mapRef.current = map;
    mapReadyRef.current = false;
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });
    popupRef.current = popup;

    map.on("error", () => {
      if (!isCancelled) {
        setMapError("Unable to load map tiles. Check Mapbox token/style configuration.");
      }
    });

    map.on("load", async () => {
      try {
        const response = await fetch("/data/india-boundaries.geojson", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("India boundary file missing. Run npm run convert:india-shapefile.");
        }

        const rawGeojson = (await response.json()) as unknown;
        const featureCollection = asFeatureCollection(rawGeojson);

        if (!featureCollection) {
          throw new Error("India boundary file is not a valid FeatureCollection.");
        }

        const unmatchedMetrics = new Set(metricsLookup.keys());

        const enrichedFeatures = featureCollection.features.map((feature, index) => {
          const stateName = getFeatureStateName(feature);
          const stateKey = stateName ? normalizeStateKey(stateName) : null;
          const metric = stateKey ? metricsLookup.get(stateKey) : undefined;

          if (stateKey && metric) {
            unmatchedMetrics.delete(stateKey);
          }

          const properties: GeoJsonProperties = {
            ...(feature.properties ?? {}),
            __state_name: stateName,
            __high_risk_percent: metric?.high_risk_percent ?? null,
            __avg_trust_score: metric?.average_trust_score ?? null,
            __ready_percent: metric?.ready_percent ?? null,
            __risk_level: metric?.risk_level ?? null,
            __total_facilities: metric?.total_facilities ?? null
          };

          return {
            ...feature,
            id: feature.id ?? index,
            properties
          };
        });

        const enrichedCollection: FeatureCollection<Geometry, GeoJsonProperties> = {
          type: "FeatureCollection",
          features: enrichedFeatures
        };

        map.addSource(SOURCE_ID, {
          type: "geojson",
          data: enrichedCollection
        });

        map.addLayer({
          id: FILL_LAYER_ID,
          type: "fill",
          source: SOURCE_ID,
          paint: {
            "fill-color": [
              "case",
              [">=", ["coalesce", ["get", "__high_risk_percent"], -1], 35],
              "#dc2626",
              [">=", ["coalesce", ["get", "__high_risk_percent"], -1], 20],
              "#f59e0b",
              [">=", ["coalesce", ["get", "__high_risk_percent"], -1], 10],
              "#0ea5e9",
              [">=", ["coalesce", ["get", "__high_risk_percent"], -1], 0],
              "#10b981",
              "#334155"
            ],
            "fill-opacity": 0.38
          }
        });

        map.addLayer({
          id: BORDER_LAYER_ID,
          type: "line",
          source: SOURCE_ID,
          paint: {
            "line-color": "#cbd5e1",
            "line-width": 0.9,
            "line-opacity": 0.75
          }
        });

        map.addLayer({
          id: HOVER_LAYER_ID,
          type: "line",
          source: SOURCE_ID,
          paint: {
            "line-color": "#14b8a6",
            "line-width": 2,
            "line-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 1, 0]
          }
        });

        map.addSource(MARKER_SOURCE_ID, {
          type: "geojson",
          data: createMarkerCollection(facilityPoints)
        });

        map.addLayer({
          id: MARKER_LAYER_ID,
          type: "circle",
          source: MARKER_SOURCE_ID,
          paint: {
            "circle-radius": 6,
            "circle-color": ["coalesce", ["get", "marker_color"], "#6b7280"],
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "#e2e8f0"
          }
        });

        map.addLayer({
          id: MARKER_SELECTED_LAYER_ID,
          type: "circle",
          source: MARKER_SOURCE_ID,
          paint: {
            "circle-radius": 11,
            "circle-color": "rgba(20, 184, 166, 0.18)",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#14b8a6"
          },
          filter: ["==", ["get", "facility_id"], "__none__"]
        });

        const bounds = new mapboxgl.LngLatBounds();
        for (const feature of enrichedFeatures) {
          const geometry = feature.geometry;
          if (!geometry) {
            continue;
          }

          collectGeometryBounds(geometry, (position) => {
            bounds.extend([position[0], position[1]]);
          });
        }

        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 24, duration: 0 });
        }

        map.on("mousemove", FILL_LAYER_ID, (event) => {
          const feature = event.features?.[0];
          if (!feature || feature.id === undefined || feature.id === null) {
            return;
          }

          if (hoveredFeatureId.current !== null) {
            map.setFeatureState({ source: SOURCE_ID, id: hoveredFeatureId.current }, { hover: false });
          }

          hoveredFeatureId.current = feature.id;
          map.setFeatureState({ source: SOURCE_ID, id: feature.id }, { hover: true });

          const props = feature.properties as Record<string, unknown> | undefined;
          const name = (typeof props?.__state_name === "string" && props.__state_name) || "Region";
          const risk =
            typeof props?.__high_risk_percent === "number" ? `${props.__high_risk_percent.toFixed(1)}%` : "-";
          const trust =
            typeof props?.__avg_trust_score === "number" ? props.__avg_trust_score.toFixed(1) : "-";

          popup
            .setLngLat(event.lngLat)
            .setHTML(
              `<div style="font-size:12px;line-height:1.4">` +
                `<strong>${name}</strong><br/>` +
                `High risk: ${risk}<br/>` +
                `Avg trust: ${trust}` +
              `</div>`
            )
            .addTo(map);
        });

        map.on("mouseleave", FILL_LAYER_ID, () => {
          popup.remove();

          if (hoveredFeatureId.current !== null) {
            map.setFeatureState({ source: SOURCE_ID, id: hoveredFeatureId.current }, { hover: false });
          }
          hoveredFeatureId.current = null;
        });

        map.on("click", MARKER_LAYER_ID, (event) => {
          const feature = event.features?.[0];
          const props = feature?.properties as Record<string, unknown> | undefined;
          const facilityId = typeof props?.facility_id === "string" ? props.facility_id : null;

          if (facilityId && onSelectFacility) {
            onSelectFacility(facilityId);
          }
        });

        map.on("mouseenter", MARKER_LAYER_ID, (event) => {
          map.getCanvas().style.cursor = "pointer";

          const feature = event.features?.[0];
          const props = feature?.properties as Record<string, unknown> | undefined;

          const name = typeof props?.name === "string" ? props.name : "Facility";
          const city = typeof props?.city === "string" ? props.city : "-";
          const state = typeof props?.state === "string" ? props.state : "-";
          const facilityType = typeof props?.facility_type === "string" ? props.facility_type : "-";
          const trustScore = typeof props?.trust_score === "number" ? props.trust_score.toFixed(1) : "-";
          const trustCategory = typeof props?.trust_category === "string" ? props.trust_category : "-";
          const readiness =
            typeof props?.recommendation_readiness === "string" ? props.recommendation_readiness : "-";
          const finalScore = typeof props?.final_score === "number" ? props.final_score.toFixed(2) : "-";

          popup
            .setLngLat(event.lngLat)
            .setHTML(
              `<div style="font-size:12px;line-height:1.4;max-width:260px">` +
                `<strong>${name}</strong><br/>` +
                `${city}, ${state}<br/>` +
                `Type: ${facilityType}<br/>` +
                `Trust score: ${trustScore}<br/>` +
                `Trust: ${trustCategory}<br/>` +
                `Readiness: ${readiness}<br/>` +
                `Final score: ${finalScore}` +
              `</div>`
            )
            .addTo(map);
        });

        map.on("mouseleave", MARKER_LAYER_ID, () => {
          map.getCanvas().style.cursor = "";
          popup.remove();
        });

        if (import.meta.env.DEV && unmatchedMetrics.size > 0) {
          console.info(`Map state-name unmatched metrics: ${unmatchedMetrics.size}`);
        }

        mapReadyRef.current = true;
        if (!isCancelled) {
          setIsGeoLoading(false);
        }
      } catch (error) {
        if (!isCancelled) {
          setMapError(error instanceof Error ? error.message : "Map data loading failed.");
          setIsGeoLoading(false);
        }
      }
    });

    return () => {
      isCancelled = true;
      popup.remove();
      map.remove();
      mapRef.current = null;
      popupRef.current = null;
      hoveredFeatureId.current = null;
      mapReadyRef.current = false;
    };
  }, [mapStyle, mapboxToken, metricsLookup, onSelectFacility]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReadyRef.current) {
      return;
    }

    const source = map.getSource(MARKER_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (!source) {
      return;
    }

    source.setData(createMarkerCollection(facilityPoints));
  }, [facilityPoints]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReadyRef.current) {
      return;
    }

    const selectedId = selectedFacilityId ?? "__none__";

    if (map.getLayer(MARKER_SELECTED_LAYER_ID)) {
      map.setFilter(MARKER_SELECTED_LAYER_ID, ["==", ["get", "facility_id"], selectedId]);
    }

    if (!selectedFacilityId) {
      return;
    }

    const target = facilityPoints.find((point) => point.facility_id === selectedFacilityId);
    if (!target || !Number.isFinite(target.latitude) || !Number.isFinite(target.longitude)) {
      return;
    }

    map.flyTo({ center: [target.longitude, target.latitude], zoom: Math.max(map.getZoom(), 6), duration: 800 });
  }, [selectedFacilityId, facilityPoints]);

  if (!mapboxToken) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        Mapbox token missing. Add VITE_MAPBOX_TOKEN to .env.local.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Badge variant="default">Mapbox dark basemap</Badge>
        <Badge variant="info">India boundaries</Badge>
        {isLoadingMetrics ? <Badge variant="warning">Loading overlay metrics</Badge> : null}
        {metricsError ? <Badge variant="danger">Overlay fallback active</Badge> : null}
        {validMarkerCount > 0 ? <Badge variant="success">Markers: {validMarkerCount}</Badge> : null}
      </div>

      {facilityPoints.length > 0 && validMarkerCount === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Recommendations returned, but no map coordinates were available.
        </div>
      ) : null}

      {isGeoLoading ? <LoadingState label="Loading India boundary map..." /> : null}

      {mapError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
          {mapError.includes("India boundary file missing")
            ? "India boundary file missing. Run npm run convert:india-shapefile."
            : mapError}
        </div>
      ) : null}

      <div
        ref={mapContainerRef}
        className="h-[420px] w-full overflow-hidden rounded-2xl border border-slate-700 md:h-[500px] xl:h-[600px]"
      />
    </div>
  );
}
