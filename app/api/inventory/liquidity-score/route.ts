import { createServerClient } from "@/lib/supabase"
import { calculateLiquidityScore } from "@/lib/utils"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get("store_id")

    const supabase = createServerClient()

    let query = supabase.from("inventory").select(`
        *,
        products (name, category, price),
        stores (name, address)
      `)

    if (storeId) {
      query = query.eq("store_id", storeId)
    }

    const { data: inventory, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate liquidity scores
    const inventoryWithScores =
      inventory?.map((item) => {
        const liquidityData = calculateLiquidityScore(item.current_stock, item.reorder_threshold, item.max_capacity)

        return {
          ...item,
          liquidity_score: liquidityData.score,
          liquidity_status: liquidityData.status,
        }
      }) || []

    // Group by status for summary
    const summary = {
      critical: inventoryWithScores.filter((item) => item.liquidity_status === "critical").length,
      low: inventoryWithScores.filter((item) => item.liquidity_status === "low").length,
      optimal: inventoryWithScores.filter((item) => item.liquidity_status === "optimal").length,
      overstocked: inventoryWithScores.filter((item) => item.liquidity_status === "overstocked").length,
      total: inventoryWithScores.length,
    }

    return NextResponse.json({
      inventory: inventoryWithScores,
      summary,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to calculate liquidity scores" }, { status: 500 })
  }
}
