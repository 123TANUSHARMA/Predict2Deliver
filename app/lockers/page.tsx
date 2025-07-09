"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Package, QrCode, CheckCircle, AlertCircle } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import QRCode from "qrcode"

interface LockerPickup {
  id: string
  compartment_number: number
  pickup_code: string
  qr_code: string
  is_picked_up: boolean
  expires_at: string
  created_at: string
  orders: {
    total_amount: number
    customers: { name: string; email: string }
  }
  smart_lockers: {
    location_name: string
    address: string
  }
}

interface GeneratePickupResponse {
  success: boolean
  pickup: {
    id: string
    compartment_number: number
    pickup_code: string
    qr_code: string
    expires_at: string
    locker: {
      name: string
      address: string
      distance_miles: number
    }
  }
}

export default function LockersPage() {
  const [pickups, setPickups] = useState<LockerPickup[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [orderId, setOrderId] = useState("")
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [selectedPickup, setSelectedPickup] = useState<LockerPickup | null>(null)

  const fetchPickups = async () => {
    try {
      const response = await fetch("/api/locker/generate-pickup")
      const data = await response.json()
      setPickups(data.pickups || [])
    } catch (error) {
      console.error("Failed to fetch pickups:", error)
    } finally {
      setLoading(false)
    }
  }

  const generatePickup = async () => {
    if (!orderId.trim()) return

    setGenerating(true)
    try {
      const response = await fetch("/api/locker/generate-pickup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ order_id: orderId }),
      })

      const data: GeneratePickupResponse = await response.json()

      if (data.success) {
        // Generate QR code image
        const qrCodeDataUrl = await QRCode.toDataURL(data.pickup.qr_code, {
          width: 256,
          margin: 2,
          color: {
            dark: "#0071ce",
            light: "#ffffff",
          },
        })
        setQrCodeUrl(qrCodeDataUrl)

        // Refresh pickups list
        await fetchPickups()
        setOrderId("")
      }
    } catch (error) {
      console.error("Failed to generate pickup:", error)
    } finally {
      setGenerating(false)
    }
  }

  const generateQRForPickup = async (pickup: LockerPickup) => {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(pickup.qr_code, {
        width: 256,
        margin: 2,
        color: {
          dark: "#0071ce",
          light: "#ffffff",
        },
      })
      setQrCodeUrl(qrCodeDataUrl)
      setSelectedPickup(pickup)
    } catch (error) {
      console.error("Failed to generate QR code:", error)
    }
  }

  useEffect(() => {
    fetchPickups()
  }, [])

  const activePickups = pickups.filter((p) => !p.is_picked_up && new Date(p.expires_at) > new Date()).length
  const expiredPickups = pickups.filter((p) => !p.is_picked_up && new Date(p.expires_at) <= new Date()).length
  const completedPickups = pickups.filter((p) => p.is_picked_up).length

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
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
          <h1 className="text-3xl font-bold text-gray-900">Smart Lockers</h1>
          <p className="text-gray-600 mt-2">Automated pickup locations with QR code access</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Pickups</p>
                <p className="text-2xl font-bold text-green-600">{activePickups}</p>
              </div>
              <Package className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-red-600">{expiredPickups}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-blue-600">{completedPickups}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Generate Pickup */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Locker Pickup</CardTitle>
            <CardDescription>Create a new pickup assignment for an order</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="orderId">Order ID</Label>
                <Input
                  id="orderId"
                  placeholder="Enter order ID (e.g., uuid-format)"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                />
              </div>
              <Button
                onClick={generatePickup}
                disabled={generating || !orderId.trim()}
                className="w-full bg-[#0071ce] hover:bg-blue-700"
              >
                {generating ? "Generating..." : "Generate Pickup"}
              </Button>
            </div>

            {qrCodeUrl && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
                <h4 className="font-medium text-gray-900 mb-4">Pickup QR Code Generated</h4>
                <img src={qrCodeUrl || "/placeholder.svg"} alt="Pickup QR Code" className="mx-auto mb-4" />
                {selectedPickup && (
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <strong>Location:</strong> {selectedPickup.smart_lockers.location_name}
                    </p>
                    <p>
                      <strong>Compartment:</strong> #{selectedPickup.compartment_number}
                    </p>
                    <p>
                      <strong>Code:</strong> {selectedPickup.pickup_code}
                    </p>
                    <p>
                      <strong>Expires:</strong> {formatDate(selectedPickup.expires_at)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Locker Locations */}
        <Card>
          <CardHeader>
            <CardTitle>Locker Locations</CardTitle>
            <CardDescription>Available smart locker locations across the city</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  name: "Downtown Transit Center",
                  address: "1401 Pacific Ave, Dallas, TX",
                  compartments: "45/60 available",
                },
                {
                  name: "Uptown Shopping Plaza",
                  address: "2500 McKinney Ave, Dallas, TX",
                  compartments: "32/40 available",
                },
                {
                  name: "North Dallas Mall",
                  address: "12000 North Central Expy, Dallas, TX",
                  compartments: "65/80 available",
                },
                {
                  name: "East Dallas Community Center",
                  address: "9009 Garland Rd, Dallas, TX",
                  compartments: "38/50 available",
                },
                {
                  name: "West Dallas Hub",
                  address: "1500 Singleton Blvd, Dallas, TX",
                  compartments: "40/45 available",
                },
              ].map((locker, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <MapPin className="w-5 h-5 text-[#0071ce] mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{locker.name}</p>
                    <p className="text-sm text-gray-600">{locker.address}</p>
                    <p className="text-xs text-green-600 mt-1">{locker.compartments}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pickups List */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Recent Pickups</CardTitle>
          <CardDescription>All locker pickup assignments and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Customer</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Location</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Compartment</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Code</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Expires</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">QR Code</th>
                </tr>
              </thead>
              <tbody>
                {pickups.slice(0, 20).map((pickup) => {
                  const isExpired = new Date(pickup.expires_at) <= new Date()
                  const status = pickup.is_picked_up ? "completed" : isExpired ? "expired" : "active"

                  return (
                    <tr key={pickup.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{pickup.orders.customers.name}</p>
                          <p className="text-xs text-gray-500">{formatCurrency(pickup.orders.total_amount)}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{pickup.smart_lockers.location_name}</p>
                          <p className="text-xs text-gray-500">{pickup.smart_lockers.address}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono">#{pickup.compartment_number}</td>
                      <td className="py-3 px-4 text-center font-mono">{pickup.pickup_code}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          className={
                            status === "completed"
                              ? "bg-green-100 text-green-800"
                              : status === "expired"
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                          }
                        >
                          {status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">{formatDate(pickup.expires_at)}</td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateQRForPickup(pickup)}
                          className="text-[#0071ce] border-[#0071ce] hover:bg-blue-50"
                        >
                          <QrCode className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
