import { createServerClient } from "@/lib/supabase"
import { calculateDistance, generatePickupCode } from "@/lib/utils"
import { NextResponse } from "next/server"
import twilio from "twilio"

export async function POST(request: Request) {
  try {
    const { order_id } = await request.json()

    if (!order_id) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data: order } = await supabase
      .from("orders")
      .select(`*, customers (name, phone, latitude, longitude)`)
      .eq("id", order_id)
      .single()

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const { data: lockers } = await supabase.from("smart_lockers").select("*").gt("available_compartments", 0)
    if (!lockers || lockers.length === 0) {
      return NextResponse.json({ error: "No available lockers found" }, { status: 404 })
    }

    let nearestLocker = null
    let minDistance = Number.POSITIVE_INFINITY

    for (const locker of lockers) {
      const distance = calculateDistance(
        order.customers.latitude,
        order.customers.longitude,
        locker.latitude,
        locker.longitude
      )
      if (distance < minDistance) {
        minDistance = distance
        nearestLocker = locker
      }
    }

    if (!nearestLocker) {
      return NextResponse.json({ error: "No suitable locker found" }, { status: 404 })
    }

    const pickupCode = generatePickupCode()

    const predictRes = await fetch("http://localhost:8000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_lat: order.customers.latitude,
        customer_lng: order.customers.longitude,
        locker_lat: nearestLocker.latitude,
        locker_lng: nearestLocker.longitude,
        distance_km: minDistance,
        available_compartments: nearestLocker.available_compartments,
        active_pickups: 10,
        total_compartments: nearestLocker.total_compartments,
        time_of_day: new Date().getHours(),
      }),
    })

    const { assign_slot } = await predictRes.json()
    const compartmentNumber = assign_slot
    const expiresAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)

    const qrData = JSON.stringify({
      order_id,
      locker_id: nearestLocker.id,
      compartment: compartmentNumber,
      code: pickupCode,
      expires: expiresAt.toISOString(),
    })

    const { data: pickup, error } = await supabase
      .from("locker_pickups")
      .insert({
        order_id,
        locker_id: nearestLocker.id,
        compartment_number: compartmentNumber,
        pickup_code: pickupCode,
        qr_code: qrData,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await supabase
      .from("smart_lockers")
      .update({
        available_compartments: nearestLocker.available_compartments - 1,
      })
      .eq("id", nearestLocker.id)

    await supabase.from("orders").update({ status: "ready_for_pickup" }).eq("id", order_id)

    return NextResponse.json({
      success: true,
      pickup: {
        ...pickup,
        locker: {
          name: nearestLocker.location_name,
          address: nearestLocker.address,
          distance_miles: Math.round(minDistance * 10) / 10,
        },
      },
    })
  } catch (error) {
    console.error("Locker pickup generation error:", error)
    return NextResponse.json({ error: "Failed to generate locker pickup" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get("order_id")
  const pickupId = searchParams.get("pickup_id")

  const supabase = createServerClient()

  // Handle OTP send request
  if (pickupId) {
    try {
const { data: pickupData, error: pickupError } = await supabase
  .from("locker_pickups")
  .select(`
    id,
    order_id,
    orders (
      customer_id,
      customers:customers!orders_customer_id_fkey ( phone )
    )
  `)
  .eq("id", pickupId)
  .single()


      if (pickupError || !pickupData) {
        return NextResponse.json({ error: "Pickup not found" }, { status: 404 })
      }

const customerPhone = pickupData.orders.customers.phone

      if (!customerPhone) {
        return NextResponse.json({ error: "Customer phone number missing" }, { status: 400 })
      }

      const otpCode = Math.floor(100000 + Math.random() * 900000).toString()

      const client = twilio(
        process.env.TWILIO_SID!,
        process.env.TWILIO_AUTH_TOKEN!
      )

      await client.messages.create({
        body: `Your OTP for locker pickup is: ${otpCode}`,
        from: process.env.TWILIO_PHONE_NUMBER!,
        to: customerPhone,
      })

      const { error: updateError } = await supabase
        .from("locker_pickups")
        .update({ otp_code: otpCode })
        .eq("id", pickupId)

      if (updateError) {
        return NextResponse.json({ error: "Failed to update OTP in DB" }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: "OTP sent to customer" })
    } catch (error) {
      console.error("OTP send error:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  }

  // Default: fetch locker pickups
  try {
    let query = supabase
      .from("locker_pickups")
      .select(`
        *,
        orders (
          total_amount,
          customers (name, email)
        ),
        smart_lockers (location_name, address)
      `)
      .order("created_at", { ascending: false })

    if (orderId) {
      query = query.eq("order_id", orderId)
    }

    const { data: pickups, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ pickups })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch locker pickups" }, { status: 500 })
  }
}
