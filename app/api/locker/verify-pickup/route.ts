import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { pickup_id, otp } = await request.json()

    if (!pickup_id || !otp) {
      return NextResponse.json({ error: "Pickup ID and OTP are required" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Get pickup details
    const { data: pickup, error: pickupError } = await supabase
      .from("locker_pickups")
      .select(`
        *,
        orders (
          total_amount,
          customers (name, email, phone)
        ),
        smart_lockers (location_name, address)
      `)
      .eq("id", pickup_id)
      .single()

    if (pickupError || !pickup) {
      return NextResponse.json({ error: "Pickup not found" }, { status: 404 })
    }

    // Check if already picked up
    if (pickup.is_picked_up) {
      return NextResponse.json({ error: "Package already picked up" }, { status: 400 })
    }

    // Check if expired
    const now = new Date()
    const expiresAt = new Date(pickup.expires_at)
    if (now > expiresAt) {
      return NextResponse.json({ error: "Pickup has expired" }, { status: 400 })
    }

    // Verify OTP
    if (pickup.otp_code !== otp) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 })
    }

    // Mark as picked up
    const { error: updateError } = await supabase
      .from("locker_pickups")
      .update({ 
        is_picked_up: true,
        otp_verified: true,
        picked_up_at: new Date().toISOString()
      })
      .eq("id", pickup_id)

    if (updateError) {
      return NextResponse.json({ error: "Failed to update pickup status" }, { status: 500 })
    }

    // Update locker availability
    await supabase
      .from("smart_lockers")
      .update({ 
        available_compartments: supabase.sql`available_compartments + 1`
      })
      .eq("id", pickup.locker_id)

    // Update order status
    await supabase
      .from("orders")
      .update({ status: "delivered" })
      .eq("id", pickup.order_id)

    return NextResponse.json({
      success: true,
      message: "Package pickup verified successfully",
      pickup: {
        id: pickup.id,
        compartment_number: pickup.compartment_number,
        locker: {
          name: pickup.smart_lockers.location_name,
          address: pickup.smart_lockers.address,
        },
        customer: pickup.orders.customers.name,
        picked_up_at: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Pickup verification error:", error)
    return NextResponse.json({ error: "Failed to verify pickup" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const pickupId = searchParams.get("pickup_id")

    if (!pickupId) {
      return NextResponse.json({ error: "Pickup ID is required" }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data: pickup, error } = await supabase
      .from("locker_pickups")
      .select(`
        *,
        orders (
          total_amount,
          customers (name, email)
        ),
        smart_lockers (location_name, address)
      `)
      .eq("id", pickupId)
      .single()

    if (error || !pickup) {
      return NextResponse.json({ error: "Pickup not found" }, { status: 404 })
    }

    // Check if expired
    const now = new Date()
    const expiresAt = new Date(pickup.expires_at)
    const isExpired = now > expiresAt

    return NextResponse.json({
      pickup: {
        id: pickup.id,
        compartment_number: pickup.compartment_number,
        pickup_code: pickup.pickup_code,
        is_picked_up: pickup.is_picked_up,
        expires_at: pickup.expires_at,
        is_expired: isExpired,
        locker: {
          name: pickup.smart_lockers.location_name,
          address: pickup.smart_lockers.address,
        },
        customer: pickup.orders.customers.name,
        order_amount: pickup.orders.total_amount,
      },
    })
  } catch (error) {
    console.error("Pickup fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch pickup details" }, { status: 500 })
  }
}
