import { createServerClient } from "@/lib/supabase"
import { calculateDistance } from "@/lib/utils"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = createServerClient()

    // Get all inventory with store and product details
    const { data: inventory } = await supabase.from("inventory").select(`
        *,
        products (name, category),
        stores (name, latitude, longitude)
      `)

    if (!inventory) {
      return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 })
    }

    const rebalanceActions = []

    // Group inventory by product
    const productGroups = inventory.reduce(
      (groups, item) => {
        if (!groups[item.product_id]) {
          groups[item.product_id] = []
        }
        groups[item.product_id].push(item)
        return groups
      },
      {} as Record<string, any[]>,
    )

    // For each product, find rebalancing opportunities
    for (const [productId, productInventory] of Object.entries(productGroups)) {
      // Find stores with low stock (below reorder threshold)
      const lowStockStores = productInventory.filter((item) => item.current_stock <= item.reorder_threshold)

      // Find stores with excess stock (above 80% capacity)
      const excessStockStores = productInventory.filter((item) => item.current_stock > item.max_capacity * 0.8)

      // Create rebalancing pairs
      for (const lowStore of lowStockStores) {
        const needed = Math.min(
          lowStore.max_capacity - lowStore.current_stock,
          lowStore.reorder_threshold * 2 - lowStore.current_stock,
        )

        if (needed <= 0) continue

        // Find the closest store with excess stock
        let bestSource = null
        let minDistance = Number.POSITIVE_INFINITY

        for (const excessStore of excessStockStores) {
          const available = excessStore.current_stock - excessStore.reorder_threshold * 1.5
          if (available <= 0) continue

          const distance = calculateDistance(
            lowStore.stores.latitude,
            lowStore.stores.longitude,
            excessStore.stores.latitude,
            excessStore.stores.longitude,
          )

          if (distance < minDistance && distance < 50) {
            // Within 50 miles
            minDistance = distance
            bestSource = excessStore
          }
        }

        if (bestSource) {
          const transferAmount = Math.min(needed, bestSource.current_stock - bestSource.reorder_threshold * 1.5)

          if (transferAmount > 0) {
            rebalanceActions.push({
              product_id: productId,
              product_name: lowStore.products.name,
              from_store: bestSource.stores.name,
              from_store_id: bestSource.store_id,
              to_store: lowStore.stores.name,
              to_store_id: lowStore.store_id,
              transfer_amount: Math.floor(transferAmount),
              distance_miles: Math.round(minDistance * 10) / 10,
              priority: lowStore.current_stock <= lowStore.reorder_threshold * 0.5 ? "high" : "medium",
            })

            // Update the inventory arrays to prevent double-counting
            bestSource.current_stock -= transferAmount
            lowStore.current_stock += transferAmount
          }
        }
      }
    }

    // Sort by priority and distance
    rebalanceActions.sort((a, b) => {
      if (a.priority === "high" && b.priority !== "high") return -1
      if (b.priority === "high" && a.priority !== "high") return 1
      return a.distance_miles - b.distance_miles
    })

    return NextResponse.json({
      success: true,
      rebalance_actions: rebalanceActions,
      total_actions: rebalanceActions.length,
      high_priority: rebalanceActions.filter((a) => a.priority === "high").length,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to calculate rebalancing" }, { status: 500 })
  }
}
