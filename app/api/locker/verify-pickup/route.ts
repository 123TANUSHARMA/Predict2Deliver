import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { compartment_number, otp_code } = await request.json()

  if (!compartment_number || !otp_code) {
    return NextResponse.json({ error: "Missing OTP or locker number" }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data: pickup, error } = await supabase
    .from("locker_pickups")
    .select("*")
    .eq("compartment_number", compartment_number)
    .eq("otp_code", otp_code)
    .eq("otp_verified", false)
    .eq("is_picked_up", false)
    .maybeSingle()

  if (error || !pickup) {
    return NextResponse.json({ error: "Invalid OTP or locker number" }, { status: 401 })
  }

  await supabase
    .from("locker_pickups")
    .update({ otp_verified: true, is_picked_up: true })
    .eq("id", pickup.id)

  return NextResponse.json({ success: true })
}
