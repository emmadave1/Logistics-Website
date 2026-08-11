import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion } from "framer-motion";
import {
  MapPin,
  Truck,
  Flag,
  Navigation,
  RefreshCw,
  CircleDot,
  CheckCircle2,
} from "lucide-react";
import { Shipment, ShipmentStatus } from "@/types/shipment";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import {
  geocodePlaceWithRetry,
  interpolate,
  isValidGeoPoint,
  GeoPoint,
  clearGeocodeCache,
  getRoadRoute,
} from "@/services/geocode";

const progressByStatus: Record<ShipmentStatus, number> = {
  pending: 0.02,
  processing: 0.15,
  in_transit: 0.5,
  out_for_delivery: 0.82,
  delivered: 1,
};

function divIcon(html: string, size = 34) {
  return L.divIcon({
    html,
    className: "movemate-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

const pinIcon = (color: string) =>
  divIcon(
    `
      <div style="
        display:flex;
        align-items:center;
        justify-content:center;
        width:26px;
        height:26px;
        border-radius:50%;
        background:${color};
        box-shadow:0 0 0 6px ${color}33, 0 2px 6px rgba(0,0,0,.35);
      ">
        <div style="
          width:8px;
          height:8px;
          border-radius:50%;
          background:white;
        "></div>
      </div>
    `,
    26,
  );

const getTruckIcon = (status: ShipmentStatus) => {
  const isDelivered = status === "delivered";
  const isActive =
    status === "processing" ||
    status === "in_transit" ||
    status === "out_for_delivery";

  const animationClass = isActive
    ? "movemate-truck-active"
    : isDelivered
      ? "movemate-truck-delivered"
      : "movemate-truck-idle";

  const truckIcon = divIcon(
    `
    <div style="
      display:flex;
      align-items:center;
      justify-content:center;
      width:38px;
      height:38px;
      border-radius:50%;
      background:#2563eb;
      box-shadow:0 0 0 10px rgba(37,99,235,.18), 0 4px 12px rgba(0,0,0,.35);
    ">
      <span style="
        font-size:20px;
        line-height:1;
      ">🚚</span>
    </div>
  `,
    38,
  );
  return truckIcon;
};
interface ShipmentMapProps {
  shipment: Shipment;
  locationUpdates?: { id: string; description: string; createdAt: string }[];
}

export function ShipmentMap({
  shipment,
  locationUpdates = [],
}: ShipmentMapProps) {
  const progress = progressByStatus[shipment.status] ?? 0;
  const isDelivered = shipment.status === "delivered";

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    travelled?: L.Polyline;
    vehicle?: L.Marker;
    currentDot?: L.CircleMarker;
  }>({});

  const animationRef = useRef<number | null>(null);

  const [origin, setOrigin] = useState<GeoPoint | null>(null);
  const [destination, setDestination] = useState<GeoPoint | null>(null);
  const [current, setCurrent] = useState<GeoPoint | null>(null);
  const [route, setRoute] = useState<GeoPoint[]>([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(1);
  const [tilesReady, setTilesReady] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const pickup = `${shipment.pickupCity}, ${shipment.pickupCountry}`;
  const delivery = `${shipment.deliveryCity}, ${shipment.deliveryCountry}`;
  const currentPlace = `${shipment.currentLocation.city}, ${shipment.currentLocation.country}`;

  const routeValid = isValidGeoPoint(origin) && isValidGeoPoint(destination);
  const hasRouteError = !loading && !routeValid;
  const showSkeleton = loading;

  const handleRetry = () => {
    [pickup, delivery, currentPlace].forEach((place) =>
      clearGeocodeCache(place),
    );
    setLoading(true);
    setRetryCount((c) => c + 1);
  };

  // Geocode the shipment's real cities, with automatic exponential-backoff retries
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setAttempt(1);
    (async () => {
      const track = (n: number) => !cancelled && setAttempt(n);
      const o = await geocodePlaceWithRetry(pickup, 3, 500, track);
      const d = await geocodePlaceWithRetry(delivery, 3, 500, track);
      const c = await geocodePlaceWithRetry(currentPlace, 2, 500);
      if (cancelled) return;
      setOrigin(isValidGeoPoint(o) ? o : null);
      setDestination(isValidGeoPoint(d) ? d : null);
      setCurrent(isValidGeoPoint(c) ? c : null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [pickup, delivery, currentPlace, retryCount]);

  const arc = route;

  useEffect(() => {
    if (!origin || !destination) {
      setRoute([]);
      return;
    }

    let cancelled = false;

    setRouteLoading(true);

    getRoadRoute(origin, destination)
      .then((points) => {
        if (cancelled) return;

        setRoute(points);
      })
      .catch((error) => {
        console.error("Failed to get road route:", error);
        if (!cancelled) {
          setRoute([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setRouteLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [origin, destination]);

  // Initialise the map once the route coordinates are available
  useEffect(() => {
    if (!containerRef.current || !origin || !destination || route.length < 2) {
      return;
    }

    // Prevent duplicate map instances
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const container = containerRef.current;

    // Make sure the container has dimensions before Leaflet initializes
    if (container.clientWidth === 0 || container.clientHeight === 0) {
      console.warn("⚠️ Map container has no size yet");

      const timer = window.setTimeout(() => {
        if (container.clientWidth > 0 && container.clientHeight > 0) {
          setRetryCount((count) => count + 1);
        }
      }, 300);

      return () => window.clearTimeout(timer);
    }

    console.log("🗺️ Initializing Leaflet map");
    console.log("Origin:", origin);
    console.log("Destination:", destination);

    const map = L.map(container, {
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: true,
    });

    mapRef.current = map;

    const tiles = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors",
        crossOrigin: true,
      },
    );

    tiles.on("loading", () => {
      console.log("⏳ Loading OpenStreetMap tiles...");
    });

    tiles.on("load", () => {
      console.log("✅ OpenStreetMap tiles loaded");
      setTilesReady(true);

      // Force Leaflet to recalculate its size
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    });

    tiles.on("tileerror", (error) => {
      console.error("❌ OpenStreetMap tile error:", error);
      setTilesReady(true);
    });

    tiles.addTo(map);

    const latlngs = arc.map(
      (point) => [point.lat, point.lng] as [number, number],
    );

    console.log("🛣️ Route points:", latlngs.length);
    console.log("📍 Origin:", origin);
    console.log("🏁 Destination:", destination);

    if (latlngs.length > 1) {
      // Full route
      L.polyline(latlngs, {
        color: "#64748b",
        weight: 5,
        opacity: 0.8,
        dashArray: "8 10",
      }).addTo(map);

      // Travelled route
      layersRef.current.travelled = L.polyline([], {
        color: "#2563eb",
        weight: 6,
        opacity: 1,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);
    }

    // Origin
    L.marker([origin.lat, origin.lng], {
      icon: pinIcon("#2563eb"),
    })
      .bindPopup(`<b>Origin</b><br/>${pickup}`)
      .addTo(map);

    // Destination
    L.marker([destination.lat, destination.lng], {
      icon: pinIcon(isDelivered ? "#16a34a" : "#64748b"),
    })
      .bindPopup(`<b>Destination</b><br/>${delivery}`)
      .addTo(map);

    // Initial vehicle position
    const initialIndex = Math.round(progress * (arc.length - 1));

    const initialPosition = arc[initialIndex] ?? origin;

    console.log("🚚 Truck position:", initialPosition);

    layersRef.current.vehicle = L.marker(
      [initialPosition.lat, initialPosition.lng],
      {
        icon: getTruckIcon(shipment.status),
        zIndexOffset: 2000,
      },
    ).addTo(map);

    // Fit route
    const bounds = L.latLngBounds(latlngs);

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 6,
      });
    } else {
      map.setView([origin.lat, origin.lng], 5);
    }

    // Leaflet sometimes needs this after React finishes rendering
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    setTimeout(() => {
      map.invalidateSize();
    }, 500);

    // Failsafe
    const tileTimeout = window.setTimeout(() => {
      console.warn("⚠️ Map tile timeout reached");
      setTilesReady(true);
    }, 5000);

    return () => {
      window.clearTimeout(tileTimeout);

      if (mapRef.current === map) {
        map.remove();
        mapRef.current = null;
      }

      layersRef.current = {};
    };

    // Only recreate when coordinates change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    origin?.lat,
    origin?.lng,
    destination?.lat,
    destination?.lng,
    route.length,
    retryCount,
  ]);

  // Last reported location marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !current) return;
    layersRef.current.currentDot?.remove();
    layersRef.current.currentDot = L.circleMarker([current.lat, current.lng], {
      radius: 7,
      color: "#0ea5e9",
      weight: 2,
      fillColor: "#0ea5e9",
      fillOpacity: 0.5,
    })
      .bindPopup(`<b>Last reported location</b><br/>${currentPlace}`)
      .addTo(map);
  }, [current?.lat, current?.lng, currentPlace, current]);

  useEffect(() => {
    const vehicle = layersRef.current.vehicle;

    if (!vehicle) return;

    vehicle.setIcon(getTruckIcon(shipment.status));
  }, [shipment.status]);

  // Animate truck along the real road route
  useEffect(() => {
    if (!origin || !destination || arc.length < 2) {
      console.warn("⚠️ Cannot draw route:", {
        origin,
        destination,
        arcLength: arc.length,
      });
      return;
    }

    const count = Math.max(1, Math.round(progress * (arc.length - 1)));

    const travelled = arc
      .slice(0, count + 1)
      .map((point) => [point.lat, point.lng] as [number, number]);

    console.log("🛣️ Drawing travelled route:", travelled.length);

    if (layersRef.current.travelled) {
      layersRef.current.travelled.setLatLngs(travelled);
    }

    const routeIndex = Math.min(
      Math.round(progress * (arc.length - 1)),
      arc.length - 1,
    );

    const position = arc[routeIndex];

    console.log("🚚 Moving truck to:", position);

    if (layersRef.current.vehicle && position) {
      layersRef.current.vehicle.setLatLng([position.lat, position.lng]);
    }
  }, [progress, arc, origin, destination]);

  // Text-only route timeline used when the map can't be plotted
  const fallbackStops = useMemo(() => {
    const stops: {
      title: string;
      place: string;
      meta?: string;
      done: boolean;
      active: boolean;
    }[] = [
      {
        title: "Origin",
        place: pickup,
        meta: formatDateTime(shipment.createdAt),
        done: true,
        active: false,
      },
    ];
    locationUpdates
      .slice()
      .reverse()
      .forEach((u) =>
        stops.push({
          title: "Stop update",
          place: u.description,
          meta: formatDateTime(u.createdAt),
          done: true,
          active: false,
        }),
      );
    stops.push({
      title: isDelivered ? "Delivered" : "Current status",
      place: currentPlace,
      meta: shipment.status.replace(/_/g, " "),
      done: isDelivered,
      active: !isDelivered,
    });
    stops.push({
      title: "Destination",
      place: delivery,
      meta: isDelivered
        ? `Delivered ${formatDateTime(shipment.deliveredAt ?? shipment.estimatedDelivery)}`
        : `ETA ${formatDateTime(shipment.estimatedDelivery)}`,
      done: isDelivered,
      active: false,
    });
    return stops;
  }, [pickup, delivery, currentPlace, locationUpdates, isDelivered, shipment]);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative">
          <div
            ref={containerRef}
            className="w-full h-[320px] sm:h-[420px] z-0 bg-muted relative"
            role="application"
            aria-label={`Route map for shipment ${shipment.trackingId}`}
          />

          {loading && !hasRouteError && (
            <div className="absolute inset-0 z-[500] bg-background p-4">
              <Skeleton className="h-full w-full rounded-xl skeleton-shimmer" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <Skeleton className="h-10 w-10 rounded-full skeleton-shimmer" />
                <p className="text-xs text-muted-foreground">
                  {loading
                    ? attempt > 1
                      ? `Locating route… (attempt ${attempt})`
                      : "Locating route…"
                    : routeLoading
                      ? "Finding road route…"
                      : "Loading map tiles…"}
                </p>
              </div>
            </div>
          )}

          {hasRouteError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-[500] overflow-y-auto bg-background p-5"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="relative h-10 w-10 shrink-0 rounded-full bg-muted flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="h-px w-9 bg-muted-foreground/60 rotate-45 rounded-full" />
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold">
                    Map couldn&apos;t load
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    We retried a few times without luck. Here&apos;s the route
                    timeline instead.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRetry}
                  disabled={loading}
                  className="gap-2 shrink-0"
                >
                  <RefreshCw
                    className={cn("h-3.5 w-3.5", loading && "animate-spin")}
                  />
                  Retry
                </Button>
              </div>

              <ol className="relative border-l border-border pl-5 space-y-4">
                {fallbackStops.map((stop, i) => (
                  <li key={`${stop.title}-${i}`} className="relative">
                    <span className="absolute -left-[26px] top-0.5">
                      {stop.done ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <CircleDot
                          className={cn(
                            "h-4 w-4",
                            stop.active
                              ? "text-primary"
                              : "text-muted-foreground",
                          )}
                        />
                      )}
                    </span>
                    <p className="text-sm font-medium">{stop.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {stop.place}
                    </p>
                    {stop.meta && (
                      <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                        {stop.meta}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </motion.div>
          )}
        </div>

        <div className="grid sm:grid-cols-3 gap-4 p-6 border-t border-border">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Origin</p>
              <p className="text-sm font-medium">{pickup}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-info/10 flex items-center justify-center shrink-0">
              <Truck className="h-4 w-4 text-info" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Current location</p>
              <p className="text-sm font-medium">{currentPlace}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                isDelivered ? "bg-success/10" : "bg-muted",
              )}
            >
              <Flag
                className={cn(
                  "h-4 w-4",
                  isDelivered ? "text-success" : "text-muted-foreground",
                )}
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Destination</p>
              <p className="text-sm font-medium">{delivery}</p>
            </div>
          </div>
        </div>

        {locationUpdates.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-6 pb-6"
          >
            <p className="text-sm font-semibold mb-3">Location updates</p>
            <div className="space-y-2">
              {locationUpdates.slice(0, 5).map((u) => (
                <div
                  key={u.id}
                  className="flex items-start gap-3 rounded-lg border border-border p-3"
                >
                  <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm">{u.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(u.createdAt)}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    Admin
                  </Badge>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

export default ShipmentMap;
