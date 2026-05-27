import * as React from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";

interface ElevationProfileLeafletProps {
  center: [number, number];
  geoJson: any;
}

export default function ElevationProfileLeaflet({ center, geoJson }: ElevationProfileLeafletProps) {
  return (
    <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {geoJson && (
        <GeoJSON
          data={geoJson}
          style={{
            color: "#ef4444",
            weight: 4,
            opacity: 0.8,
          }}
        />
      )}
    </MapContainer>
  );
}
