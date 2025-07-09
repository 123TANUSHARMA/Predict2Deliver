import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get("store_id")
    const productId = searchParams.get("product_id")

    const supabase = createServerClient()

    let query = supabase
      .from("demand_forecasts")
      .select(`
        *,
        products (name, category),
        stores (name, address)
      `)
      .order("forecast_date", { ascending: true })

    if (storeId) {
      query = query.eq("store_id", storeId)
    }

    if (productId) {
      query = query.eq("product_id", productId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ forecasts: data })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch demand forecasts" }, { status: 500 })
  }
}

export async function POST() {
  try {
    const supabase = createServerClient()

    // Get all products and stores
    const { data: products } = await supabase.from("products").select("*")
    const { data: stores } = await supabase.from("stores").select("*")

    if (!products || !stores) {
      return NextResponse.json({ error: "Failed to fetch products or stores" }, { status: 500 })
    }

    // Clear existing forecasts for today
    const today = new Date().toISOString().split("T")[0]
    await supabase.from("demand_forecasts").delete().eq("forecast_date", today)

    // Generate new forecasts using simple algorithm
    const forecasts = []

    for (const store of stores) {
      for (const product of products) {
        // Get historical orders for this product-store combination
        const { data: orderHistory } = await supabase
          .from("order_items")
          .select(`
            quantity,
            orders!inner (
              store_id,
              order_date,
              status
            )
          `)
          .eq("orders.store_id", store.id)
          .eq("product_id", product.id)
          .eq("orders.status", "delivered")
          .gte("orders.order_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

        // Calculate base demand from historical data
        const totalHistoricalDemand = orderHistory?.reduce((sum, item) => sum + item.quantity, 0) || 0
        const avgDailyDemand = totalHistoricalDemand / 30

        // Apply category-based multipliers
        let categoryMultiplier = 1.0
        switch (product.category) {
          case "Fresh Produce":
            categoryMultiplier = 1.2 // Higher demand for fresh items
            break
          case "Dairy":
            categoryMultiplier = 1.1
            break
          case "Meat":
            categoryMultiplier = 0.9
            break
          case "Pantry":
            categoryMultiplier = 0.8
            break
        }

        // Apply store size multiplier
        const storeSizeMultiplier = store.capacity / 2000 // Normalize to average store size

        // Add some randomness for market fluctuations
        const randomFactor = 0.8 + Math.random() * 0.4 // 0.8 to 1.2

        const predictedDemand = Math.max(
          1,
          Math.round(avgDailyDemand * categoryMultiplier * storeSizeMultiplier * randomFactor),
        )

        // Calculate confidence score based on data availability
        const confidenceScore = Math.min(0.95, 0.5 + (orderHistory?.length || 0) * 0.05)

        forecasts.push({
          product_id: product.id,
          store_id: store.id,
          predicted_demand: predictedDemand,
          confidence_score: Math.round(confidenceScore * 100) / 100,
          forecast_date: today,
        })
      }
    }

    // Insert new forecasts
    const { error } = await supabase.from("demand_forecasts").insert(forecasts)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${forecasts.length} demand forecasts`,
      forecasts_generated: forecasts.length,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate demand forecasts" }, { status: 500 })
  }
}
