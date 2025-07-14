"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { MapPin } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface Stop {
  order_id: string
  customer_name: string
  customer_address: string
  latitude: number
  longitude: number
  total_amount: number
  distance_from_previous: number
  estimated_arrival: string
}

interface DeliveryMapProps {
  stops: Stop[]
}

export default function DeliveryMap({ stops }: DeliveryMapProps) {
  useEffect(() => {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "/marker-icon-2x.png",
      iconUrl: "/marker-icon.png",
      shadowUrl: "/marker-shadow.png",
    })
  }, [])

  if (!stops || stops.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">Interactive map would be displayed here</p>
        <p className="text-sm text-gray-400 mt-1">
          Integration with Leaflet.js or Mapbox for route visualization
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gray-100 rounded-lg p-2" style={{ height: 350 }}>
      <MapContainer
        center={[
          stops[0].latitude || 32.7767,
          stops[0].longitude || -96.797,
        ]}
        zoom={12}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {stops.map((stop) => (
          <Marker
            key={stop.order_id}
            position={[stop.latitude, stop.longitude]}
          >
            <Popup>
              <div>
                <strong>{stop.customer_name}</strong>
                <br />
                {stop.customer_address}
                <br />
                ETA: {formatDate(stop.estimated_arrival)}
              </div>
            </Popup>
          </Marker>
        ))}
        {stops.length > 1 && (
          <Polyline
            positions={stops.map((stop) => [stop.latitude, stop.longitude])}
            pathOptions={{ color: "#0071ce" }}
          />
        )}
      </MapContainer>
    </div>
  )
} 