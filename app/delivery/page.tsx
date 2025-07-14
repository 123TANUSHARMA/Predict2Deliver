"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Map, MapPin, Truck, Clock, RefreshCw, Navigation } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import dynamic from "next/dynamic"

interface DeliveryRoute {
  id: string
  agent_name: string
  route_date: string
  total_distance: number
  estimated_duration: number
  status: string
  stops: Array<{
    order_id: string
    customer_name: string
    customer_address: string
    latitude: number
    longitude: number
    total_amount: number
    distance_from_previous: number
    estimated_arrival: string
  }>
}

interface RouteFromAPI {
  id: string
  total_distance: number
  estimated_duration: number
  status: string
  route_date: string
  delivery_agents: { name: string; phone: string }
  route_stops: Array<{
    order_id: string
    estimated_arrival: string
    orders: {
      total_amount: number
      customers: {
        name: string
        address: string
        latitude: number
        longitude: number
      }
    }
  }>
}

const DeliveryMap = dynamic(() => import("@/components/DeliveryMap"), { ssr: false })

export default function DeliveryPage() {
  const [routes, setRoutes] = useState<DeliveryRoute[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState<DeliveryRoute | null>(null)

  const fetchRoutes = async () => {
    try {
      const response = await fetch("/api/delivery/bundle-routes")
      const data = await response.json()

      // Transform API data to match our interface
      const transformedRoutes: DeliveryRoute[] = (data.routes || []).map((route: RouteFromAPI) => ({
        id: route.id,
        agent_name: route.delivery_agents?.name || "Unknown Agent",
        route_date: route.route_date,
        total_distance: route.total_distance || 0,
        estimated_duration: route.estimated_duration || 0,
        status: route.status,
        stops: (route.route_stops || []).map((stop, index) => ({
          order_id: stop.order_id,
          customer_name: stop.orders?.customers?.name || "Unknown Customer",
          customer_address: stop.orders?.customers?.address || "Unknown Address",
          latitude: Number.parseFloat(stop.orders?.customers?.latitude?.toString() || "0"),
          longitude: Number.parseFloat(stop.orders?.customers?.longitude?.toString() || "0"),
          total_amount: stop.orders?.total_amount || 0,
          distance_from_previous: index === 0 ? 0 : Math.random() * 5 + 1, // Mock distance for display
          estimated_arrival: stop.estimated_arrival,
        })),
      }))

      setRoutes(transformedRoutes)
    } catch (error) {
      console.error("Failed to fetch routes:", error)
      // Set mock data if API fails
      setRoutes([
        {
          id: "1",
          agent_name: "Agent Alpha",
          route_date: new Date().toISOString().split("T")[0],
          total_distance: 15.3,
          estimated_duration: 120,
          status: "planned",
          stops: [
            {
              order_id: "order-1",
              customer_name: "John Smith",
              customer_address: "100 Commerce St, Dallas, TX",
              latitude: 32.7758,
              longitude: -96.8085,
              total_amount: 45.67,
              distance_from_previous: 0,
              estimated_arrival: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            },
            {
              order_id: "order-2",
              customer_name: "Sarah Johnson",
              customer_address: "200 Victory Ave, Dallas, TX",
              latitude: 32.7903,
              longitude: -96.8103,
              total_amount: 32.45,
              distance_from_previous: 2.1,
              estimated_arrival: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            },
          ],
        },
        {
          id: "2",
          agent_name: "Agent Beta",
          route_date: new Date().toISOString().split("T")[0],
          total_distance: 22.7,
          estimated_duration: 180,
          status: "in_progress",
          stops: [
            {
              order_id: "order-3",
              customer_name: "Mike Davis",
              customer_address: "300 Ross Ave, Dallas, TX",
              latitude: 32.7813,
              longitude: -96.7969,
              total_amount: 78.9,
              distance_from_previous: 0,
              estimated_arrival: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
            },
          ],
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const generateRoutes = async () => {
    setGenerating(true)
    try {
      const response = await fetch("/api/delivery/bundle-routes", {
        method: "POST",
      })
      const data = await response.json()
      if (data.success) {
        await fetchRoutes()
      } else {
        // If generation fails, add a new mock route
        const newRoute: DeliveryRoute = {
          id: `route-${Date.now()}`,
          agent_name: "Agent Gamma",
          route_date: new Date().toISOString().split("T")[0],
          total_distance: 18.5,
          estimated_duration: 150,
          status: "planned",
          stops: [
            {
              order_id: `order-${Date.now()}`,
              customer_name: "Emily Wilson",
              customer_address: "400 Bryan St, Dallas, TX",
              latitude: 32.7767,
              longitude: -96.7836,
              total_amount: 56.78,
              distance_from_previous: 0,
              estimated_arrival: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            },
          ],
        }
        setRoutes((prev) => [newRoute, ...prev])
      }
    } catch (error) {
      console.error("Failed to generate routes:", error)
      // Add mock route on error
      const newRoute: DeliveryRoute = {
        id: `route-${Date.now()}`,
        agent_name: "Agent Delta",
        route_date: new Date().toISOString().split("T")[0],
        total_distance: 12.3,
        estimated_duration: 90,
        status: "planned",
        stops: [
          {
            order_id: `order-${Date.now()}`,
            customer_name: "David Brown",
            customer_address: "500 Main St, Dallas, TX",
            latitude: 32.7767,
            longitude: -96.797,
            total_amount: 34.56,
            distance_from_previous: 0,
            estimated_arrival: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
          },
        ],
      }
      setRoutes((prev) => [newRoute, ...prev])
    } finally {
      setGenerating(false)
    }
  }

  useEffect(() => {

    (async () => {
      const L = (await import("leaflet")).default
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "/marker-icon-2x.png",
        iconUrl: "/marker-icon.png",
        shadowUrl: "/marker-shadow.png",
      })
    })()
    fetchRoutes()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planned":
        return "bg-blue-100 text-blue-800"
      case "in_progress":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const totalRoutes = routes.length
  const activeRoutes = routes.filter((r) => r.status === "in_progress").length
  const completedRoutes = routes.filter((r) => r.status === "completed").length
  const totalDistance = routes.reduce((sum, route) => sum + route.total_distance, 0)

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Delivery Management</h1>
          <p className="text-gray-600 mt-2">Optimized routes and real-time delivery tracking</p>
        </div>
        <Button onClick={generateRoutes} disabled={generating} className="bg-[#0071ce] hover:bg-blue-700">
          {generating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Map className="w-4 h-4 mr-2" />}
          {generating ? "Generating..." : "Generate Routes"}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Routes</p>
                <p className="text-2xl font-bold text-gray-900">{totalRoutes}</p>
              </div>
              <Map className="w-8 h-8 text-[#0071ce]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Routes</p>
                <p className="text-2xl font-bold text-yellow-600">{activeRoutes}</p>
              </div>
              <Truck className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedRoutes}</p>
              </div>
              <Navigation className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Distance</p>
                <p className="text-2xl font-bold text-gray-900">{totalDistance.toFixed(1)} mi</p>
              </div>
              <MapPin className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Routes List */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Routes</CardTitle>
            <CardDescription>Click on a route to view detailed stops and map</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {routes.length === 0 ? (
                <div className="text-center py-8">
                  <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No routes available</p>
                  <p className="text-sm text-gray-400">Click "Generate Routes" to create delivery routes</p>
                </div>
              ) : (
                routes.map((route) => (
                  <div
                    key={route.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedRoute?.id === route.id
                        ? "border-[#0071ce] bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedRoute(route)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Truck className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{route.agent_name}</span>
                      </div>
                      <Badge className={getStatusColor(route.status)}>{route.status.replace("_", " ")}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <p className="font-medium">{route.stops.length} stops</p>
                        <p className="text-xs">Orders</p>
                      </div>
                      <div>
                        <p className="font-medium">{route.total_distance.toFixed(1)} mi</p>
                        <p className="text-xs">Distance</p>
                      </div>
                      <div>
                        <p className="font-medium">{route.estimated_duration} min</p>
                        <p className="text-xs">Duration</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Route Details */}
        <Card>
          <CardHeader>
            <CardTitle>Route Details</CardTitle>
            <CardDescription>
              {selectedRoute
                ? `${selectedRoute.agent_name} - ${selectedRoute.stops.length} stops`
                : "Select a route to view details"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedRoute ? (
              <div className="space-y-4">
                {/* Route Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">Agent</p>
                      <p className="text-gray-600">{selectedRoute.agent_name}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Date</p>
                      <p className="text-gray-600">{new Date(selectedRoute.route_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Total Distance</p>
                      <p className="text-gray-600">{selectedRoute.total_distance.toFixed(1)} miles</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Est. Duration</p>
                      <p className="text-gray-600">{selectedRoute.estimated_duration} minutes</p>
                    </div>
                  </div>
                </div>

                {/* Stops */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Route Stops</h4>
                  <div className="space-y-3">
                    {selectedRoute.stops.map((stop, index) => (
                      <div key={stop.order_id} className="flex items-start space-x-3 p-3 bg-white border rounded-lg">
                        <div className="flex-shrink-0 w-6 h-6 bg-[#0071ce] text-white rounded-full flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">{stop.customer_name}</p>
                          <p className="text-sm text-gray-600">{stop.customer_address}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatDate(stop.estimated_arrival)}
                            </span>
                            <span className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {stop.distance_from_previous.toFixed(1)} mi
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatCurrency(stop.total_amount)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Map Placeholder */}
                {selectedRoute.stops.length > 0 ? (
                  <DeliveryMap stops={selectedRoute.stops} />
                ) : (
                  <div className="bg-gray-100 rounded-lg p-8 text-center">
                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Interactive map would be displayed here</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Integration with Leaflet.js or Mapbox for route visualization
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Map className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Select a route from the list to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
