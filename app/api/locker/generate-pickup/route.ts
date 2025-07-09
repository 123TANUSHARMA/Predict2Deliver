import { createServerClient } from "@/lib/supabase"
import { calculateDistance, generatePickupCode } from "@/lib/utils"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { order_id } = await request.json()

    if (!order_id) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Get order details with customer location
    const { data: order } = await supabase
      .from("orders")
      .select(`
        *,
        customers (name, latitude, longitude)
      `)
      .eq("id", order_id)
      .single()

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Find the nearest available locker
    const { data: lockers } = await supabase.from("smart_lockers").select("*").gt("available_compartments", 0)

    if (!lockers || lockers.length === 0) {
      return NextResponse.json({ error: "No available lockers found" }, { status: 404 })
    }

    // Find closest locker
    let nearestLocker = null
    let minDistance = Number.POSITIVE_INFINITY

    for (const locker of lockers) {
      const distance = calculateDistance(
        order.customers.latitude,
        order.customers.longitude,
        locker.latitude,
        locker.longitude,
      )

      if (distance < minDistance) {
        minDistance = distance
        nearestLocker = locker
      }
    }

    if (!nearestLocker) {
      return NextResponse.json({ error: "No suitable locker found" }, { status: 404 })
    }

    // Generate pickup details
    const pickupCode = generatePickupCode()
    const compartmentNumber = Math.floor(Math.random() * nearestLocker.total_compartments) + 1
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now

    // Create QR code data (JSON string with pickup info)
    const qrData = JSON.stringify({
      order_id,
      locker_id: nearestLocker.id,
      compartment: compartmentNumber,
      code: pickupCode,
      expires: expiresAt.toISOString(),
    })

    // Save pickup record
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

    // Update locker availability
    await supabase
      .from("smart_lockers")
      .update({
        available_compartments: nearestLocker.available_compartments - 1,
      })
      .eq("id", nearestLocker.id)

    // Update order status
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
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("order_id")

    const supabase = createServerClient()

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
