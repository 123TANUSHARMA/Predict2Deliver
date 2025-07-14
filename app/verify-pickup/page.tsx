"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { MapPin, Package, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface PickupDetails {
  id: string
  compartment_number: number
  pickup_code: string
  is_picked_up: boolean
  expires_at: string
  is_expired: boolean
  locker: {
    name: string
    address: string
  }
  customer: string
  order_amount: number
}

function VerifyPickupContent() {
  const [pickupDetails, setPickupDetails] = useState<PickupDetails | null>(null)
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pickupId, setPickupId] = useState<string | null>(null)

  const searchParams = useSearchParams()

  useEffect(() => {
    // Try to get pickup_id from URL params or from QR code data
    const urlPickupId = searchParams.get("pickup_id")
    const qrData = searchParams.get("data")
    
    let extractedPickupId = urlPickupId

    if (!extractedPickupId && qrData) {
      try {
        const parsed = JSON.parse(decodeURIComponent(qrData))
        extractedPickupId = parsed.pickup_id
      } catch (e) {
        console.error("Failed to parse QR data:", e)
      }
    }

    if (extractedPickupId) {
      setPickupId(extractedPickupId)
      fetchPickupDetails(extractedPickupId)
    } else {
      setError("No pickup ID found in URL")
      setLoading(false)
    }
  }, [searchParams])

  const fetchPickupDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/locker/verify-pickup?pickup_id=${id}`)
      const data = await response.json()

      if (response.ok) {
        setPickupDetails(data.pickup)
      } else {
        setError(data.error || "Failed to fetch pickup details")
      }
    } catch (error) {
      console.error("Failed to fetch pickup details:", error)
      setError("Failed to fetch pickup details")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!pickupId || !otp || otp.length !== 6) return

    setVerifying(true)
    setError(null)

    try {
      const response = await fetch("/api/locker/verify-pickup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pickup_id: pickupId,
          otp: otp,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setPickupDetails(prev => prev ? { ...prev, is_picked_up: true } : null)
      } else {
        setError(data.error || "Failed to verify OTP")
      }
    } catch (error) {
      console.error("OTP verification error:", error)
      setError("Failed to verify OTP")
    } finally {
      setVerifying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <p>Loading pickup details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !pickupDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
            <CardTitle className="text-green-600">Pickup Verified!</CardTitle>
            <CardDescription>
              Your package pickup has been successfully verified. You can now collect your package from the locker.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Collection Details:</h3>
              <div className="space-y-2 text-sm text-green-700">
                <p><strong>Locker:</strong> {pickupDetails?.locker.name}</p>
                <p><strong>Compartment:</strong> #{pickupDetails?.compartment_number}</p>
                <p><strong>Pickup Code:</strong> {pickupDetails?.pickup_code}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 text-center">
              Use the pickup code at the locker to open your compartment.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="w-6 h-6 text-blue-600" />
              <span>Package Pickup Verification</span>
            </CardTitle>
            <CardDescription>
              Enter the OTP sent to your phone to verify and collect your package
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {pickupDetails && (
              <>
                {/* Pickup Status */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge
                    className={
                      pickupDetails.is_picked_up
                        ? "bg-green-100 text-green-800"
                        : pickupDetails.is_expired
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800"
                    }
                  >
                    {pickupDetails.is_picked_up 
                      ? "Completed" 
                      : pickupDetails.is_expired 
                      ? "Expired" 
                      : "Active"}
                  </Badge>
                </div>

                {/* Locker Details */}
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium">{pickupDetails.locker.name}</p>
                      <p className="text-sm text-gray-600">{pickupDetails.locker.address}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Package className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">Compartment #{pickupDetails.compartment_number}</p>
                      <p className="text-sm text-gray-600">Customer: {pickupDetails.customer}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">Expires: {formatDate(pickupDetails.expires_at)}</p>
                      <p className="text-sm text-gray-600">
                        {pickupDetails.is_expired ? "This pickup has expired" : "24 hours from creation"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* OTP Input */}
                {!pickupDetails.is_picked_up && !pickupDetails.is_expired && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-4">
                        Enter the 6-digit OTP sent to your phone
                      </p>
                      <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={setOtp}
                        className="justify-center"
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>

                    {error && (
                      <div className="flex items-center space-x-2 text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <p>{error}</p>
                      </div>
                    )}

                    <Button
                      onClick={handleVerifyOTP}
                      disabled={verifying || otp.length !== 6}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {verifying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Verifying...
                        </>
                      ) : (
                        "Verify OTP & Collect Package"
                      )}
                    </Button>
                  </div>
                )}

                {pickupDetails.is_picked_up && (
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-green-800 font-medium">Package Already Collected</p>
                    <p className="text-sm text-green-600">This pickup has been completed.</p>
                  </div>
                )}

                {pickupDetails.is_expired && (
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <p className="text-red-800 font-medium">Pickup Expired</p>
                    <p className="text-sm text-red-600">This pickup has expired. Please contact support.</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function VerifyPickupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <p>Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <VerifyPickupContent />
    </Suspense>
  )
}
