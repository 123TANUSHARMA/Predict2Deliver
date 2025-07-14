"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export default function VerifyPickupPage() {
  const [lockerNumber, setLockerNumber] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/locker/verify-pickup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          compartment_number: parseInt(lockerNumber),
          otp_code: otpCode,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setMessage("✅ Locker unlocked successfully!")
      } else {
        setMessage(`❌ ${data.error || "Verification failed."}`)
      }
    } catch (err) {
      setMessage("❌ Network error. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12 p-6 border rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 text-center">Verify Locker Pickup</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="locker">Locker Number</Label>
          <Input
            id="locker"
            type="number"
            placeholder="Enter locker number"
            value={lockerNumber}
            onChange={(e) => setLockerNumber(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="otp">OTP Code</Label>
          <Input
            id="otp"
            type="text"
            placeholder="Enter OTP code"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full bg-blue-600 text-white" disabled={loading}>
          {loading ? "Verifying..." : "Verify & Unlock"}
        </Button>
        {message && (
          <p className="text-center mt-4 text-sm font-medium text-gray-700">{message}</p>
        )}
      </form>
    </div>
  )
}
