import { createServerClient } from "@/lib/supabase"
import { calculateDistance, generatePickupCode } from "@/lib/utils"
import { NextResponse } from "next/server"
import twilio from "twilio"

export async function POST(request: Request) {
  try {
    const { order_id, otp_code, compartment_number, action } = await request.json()

    const supabase = createServerClient()

    // Handle OTP verification and locker opening
    if (action === "verify_otp") {
      if (!otp_code || !compartment_number) {
        return NextResponse.json({ 
          error: "OTP code and compartment number are required" 
        }, { status: 400 })
      }

      // Find the pickup record with the provided OTP and compartment
      const { data: pickup, error: pickupError } = await supabase
        .from("locker_pickups")
        .select(`
          *,
          orders!inner (
            id,
            status,
            customer_id,
            customers!inner (name, phone)
          ),
          smart_lockers!inner (
            id,
            location_name,
            address,
            available_compartments,
            total_compartments
          )
        `)
        .eq("otp_code", otp_code)
        .eq("compartment_number", compartment_number)
        .eq("is_picked_up", false)
        .single()

      if (pickupError || !pickup) {
        return NextResponse.json({ 
          error: "Invalid OTP or compartment number" 
        }, { status: 400 })
      }

      // Type assertion to handle Supabase typing issues
      const orderData = pickup.orders as any
      const customerData = orderData.customers as any
      const lockerData = pickup.smart_lockers as any

      // Check if OTP has expired (assuming 10 minutes validity)
      const otpExpiry = new Date(pickup.created_at)
      otpExpiry.setMinutes(otpExpiry.getMinutes() + 10)
      
      if (new Date() > otpExpiry) {
        return NextResponse.json({ 
          error: "OTP has expired. Please request a new one." 
        }, { status: 400 })
      }

      // Check if pickup has expired
      if (new Date() > new Date(pickup.expires_at)) {
        return NextResponse.json({ 
          error: "Pickup has expired" 
        }, { status: 400 })
      }

      // Mark pickup as completed and OTP as verified
      const { error: updatePickupError } = await supabase
        .from("locker_pickups")
        .update({ 
          is_picked_up: true,
          otp_verified: true
        })
        .eq("id", pickup.id)

      if (updatePickupError) {
        return NextResponse.json({ 
          error: "Failed to update pickup status" 
        }, { status: 500 })
      }

      // Update locker availability (increase available compartments)
      const { error: updateLockerError } = await supabase
        .from("smart_lockers")
        .update({
          available_compartments: lockerData.available_compartments + 1
        })
        .eq("id", pickup.locker_id)

      if (updateLockerError) {
        return NextResponse.json({ 
          error: "Failed to update locker availability" 
        }, { status: 500 })
      }

      // Update order status to completed
      const { error: updateOrderError } = await supabase
        .from("orders")
        .update({ status: "completed" })
        .eq("id", pickup.order_id)

      if (updateOrderError) {
        return NextResponse.json({ 
          error: "Failed to update order status" 
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: "Locker opened successfully! Your order is now complete.",
        pickup: {
          id: pickup.id,
          compartment_number: pickup.compartment_number,
          locker_name: lockerData.location_name,
          customer_name: customerData.name
        }
      })
    }

    // Original locker assignment logic (existing POST functionality)
    if (!order_id) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

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
    console.error("Locker pickup error:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get("order_id")
  const pickupId = searchParams.get("pickup_id")
  const qrCode = searchParams.get("qr_code")

  const supabase = createServerClient()

  // Handle QR code scan and OTP send
if (qrCode) {
  try {
    // Parse QR code data
    const qrData = JSON.parse(qrCode)
    const { order_id, locker_id, compartment, code, expires } = qrData

    console.log("QR Data parsed:", qrData); // DEBUG

    // Check if QR code has expired
    if (new Date() > new Date(expires)) {
      return NextResponse.json({ error: "QR code has expired" }, { status: 400 })
    }

    // Find the pickup record
    const { data: pickup, error: pickupError } = await supabase
      .from("locker_pickups")
      .select(`
        id,
        order_id,
        compartment_number,
        is_picked_up,
        orders!inner (
          customer_id,
          customers!inner (name, phone)
        ),
        smart_lockers!inner (location_name, address)
      `)
      .eq("order_id", order_id)
      .eq("locker_id", locker_id)
      .eq("compartment_number", compartment)
      .eq("pickup_code", code)
      .eq("is_picked_up", false)
      .single()

    console.log("Pickup query result:", { pickup, pickupError }); // DEBUG

    if (pickupError || !pickup) {
      return NextResponse.json({ error: "Invalid QR code or pickup already completed" }, { status: 400 })
    }

    // Type assertion to handle Supabase typing issues
    const orderData = pickup.orders as any
    const customerData = orderData.customers as any
    const lockerData = pickup.smart_lockers as any

    const customerPhone = customerData.phone

    console.log("Customer phone from DB:", customerPhone); // DEBUG

    if (!customerPhone) {
      return NextResponse.json({ error: "Customer phone number missing" }, { status: 400 })
    }

    // Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    console.log("Generated OTP:", otpCode); // DEBUG

    // Check Twilio credentials
    console.log("Twilio SID:", process.env.TWILIO_SID ? "Present" : "Missing"); // DEBUG
    console.log("Twilio Auth Token:", process.env.TWILIO_AUTH_TOKEN ? "Present" : "Missing"); // DEBUG
    console.log("Twilio Phone Number:", process.env.TWILIO_PHONE_NUMBER); // DEBUG

    // Send OTP via SMS
    try {
      const client = twilio(
        process.env.TWILIO_SID!,
        process.env.TWILIO_AUTH_TOKEN!
      )

      console.log("Twilio client created successfully"); // DEBUG

      const message = await client.messages.create({
        body: `Your OTP for locker pickup at ${lockerData.location_name} is: ${otpCode}. Valid for 10 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER!,
        to: "+918477812239", // Keep hardcoded for now to test
      })

      console.log("Twilio message sent successfully:", message.sid); // DEBUG

      // Update pickup record with OTP
      const { error: updateError } = await supabase
        .from("locker_pickups")
        .update({ 
          otp_code: otpCode,
          otp_verified: false
        })
        .eq("id", pickup.id)

      if (updateError) {
        console.log("Database update error:", updateError); // DEBUG
        return NextResponse.json({ error: "Failed to update OTP in database" }, { status: 500 })
      }

      console.log("OTP updated in database successfully"); // DEBUG

      return NextResponse.json({
        success: true,
        message: "OTP sent successfully",
        data: {
          pickup_id: pickup.id,
          compartment_number: pickup.compartment_number,
          locker_name: lockerData.location_name,
          customer_name: customerData.name
        }
      })

    } catch (twilioError) {
      console.error("Twilio error:", twilioError); // DEBUG
      return NextResponse.json({ 
        error: "Failed to send OTP via SMS",
        details: typeof twilioError === "object" && twilioError !== null && "message" in twilioError ? (twilioError as any).message : String(twilioError)
      }, { status: 500 })
    }

  } catch (error) {
    console.error("QR code processing error:", error)
    return NextResponse.json({ error: "Invalid QR code format" }, { status: 400 })
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