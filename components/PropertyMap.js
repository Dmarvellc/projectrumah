"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { formatPrice } from "@/lib/utils";

// Peta OSM (Leaflet) tanpa API key. points: [{lat,lng,title,url,price,listing,priceUnit,image}]
export default function PropertyMap({ points = [], zoom = 16, height = 420, single = false, draggable = false, onDragEnd }) {
  const ref = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !ref.current || mapRef.current) return;

      const pts = points.filter((p) => p.lat && p.lng);
      if (!pts.length) return;

      const map = L.map(ref.current, { scrollWheelZoom: true });
      mapRef.current = map;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const icon = (label) =>
        L.divIcon({
          className: "",
          html: `<div style="background:#214735;color:#F7F4EE;font-weight:800;font-family:inherit;font-size:13px;padding:6px 12px;border-radius:14px;border:3px solid #F7F4EE;box-shadow:0 4px 14px rgba(23,19,17,.35);white-space:nowrap;transform:translate(-50%,-100%);">${label}</div>`,
          iconSize: [0, 0],
        });

      const markers = pts.map((p) => {
        const label = single ? "●" : formatPrice(p.price, p.listing, p.priceUnit);
        const m = L.marker([p.lat, p.lng], { icon: icon(label), draggable }).addTo(map);
        if (draggable && onDragEnd) {
          m.on("dragend", () => {
            const ll = m.getLatLng();
            onDragEnd(ll.lat, ll.lng);
          });
        }
        if (!single && p.url) {
          m.bindPopup(
            `<a href="${p.url}" style="display:block;min-width:190px;text-decoration:none;color:#171311;font-family:inherit;">` +
              (p.image ? `<img src="${p.image}" style="width:100%;height:100px;object-fit:cover;border-radius:12px;" />` : "") +
              `<div style="font-weight:800;font-size:14px;margin-top:8px;line-height:1.3;">${p.title || ""}</div>` +
              `<div style="font-weight:800;font-size:14px;color:#214735;margin-top:2px;">${formatPrice(p.price, p.listing, p.priceUnit)}</div>` +
            `</a>`,
            { closeButton: false }
          );
        }
        return m;
      });

      if (pts.length === 1) {
        map.setView([pts[0].lat, pts[0].lng], zoom);
      } else {
        map.fitBounds(L.featureGroup(markers).getBounds().pad(0.18));
      }
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(points.map((p) => [p.lat, p.lng]))]);

  if (!points.some((p) => p.lat && p.lng)) return null;
  return <div ref={ref} style={{ height }} className="z-0 w-full overflow-hidden rounded-3xl border border-ink/10 shadow-card" />;
}
