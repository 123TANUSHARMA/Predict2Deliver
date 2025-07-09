import { createServerClient } from "@/lib/supabase"
import { calculateDistance } from "@/lib/utils"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = createServerClient()

    // Get pending orders with customer and store details
    const { data: orders } = await supabase
      .from("orders")
      .select(`
        *,
        customers (name, address, latitude, longitude),
        stores (name, latitude, longitude)
      `)
      .eq("status", "pending")
      .limit(50)

    // Get available delivery agents
    const { data: agents } = await supabase.from("delivery_agents").select("*").eq("is_available", true)

    if (!orders || !agents) {
      return NextResponse.json({ error: "Failed to fetch orders or agents" }, { status: 500 })
    }

    if (orders.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No pending orders to route",
        routes: [],
      })
    }

    const routes = []
    const assignedOrders = new Set()

    // For each agent, create optimized routes
    for (const agent of agents) {
      const availableOrders = orders.filter((order) => !assignedOrders.has(order.id))
      if (availableOrders.length === 0) break

      // Start from agent's current location
      const route = {
        agent_id: agent.id,
        agent_name: agent.name,
        route_date: new Date().toISOString().split("T")[0],
        stops: [],
        total_distance: 0,
        estimated_duration: 0,
        total_orders: 0,
      }

      let currentLat = agent.current_latitude
      let currentLon = agent.current_longitude
      let remainingCapacity = agent.max_capacity

      // Greedy algorithm: always pick the nearest unvisited order
      while (remainingCapacity > 0 && availableOrders.length > 0) {
        let nearestOrder = null
        let minDistance = Number.POSITIVE_INFINITY
        let nearestIndex = -1

        for (let i = 0; i < availableOrders.length; i++) {
          const order = availableOrders[i]
          if (assignedOrders.has(order.id)) continue

          const distance = calculateDistance(
            currentLat,
            currentLon,
            order.customers.latitude,
            order.customers.longitude,
          )

          if (distance < minDistance) {
            minDistance = distance
            nearestOrder = order
            nearestIndex = i
          }
        }

        if (nearestOrder && minDistance < 25) {
          // Within 25 miles
          // Add to route
          route.stops.push({
            order_id: nearestOrder.id,
            customer_name: nearestOrder.customers.name,
            customer_address: nearestOrder.customers.address,
            latitude: nearestOrder.customers.latitude,
            longitude: nearestOrder.customers.longitude,
            total_amount: nearestOrder.total_amount,
            distance_from_previous: Math.round(minDistance * 10) / 10,
            estimated_arrival: new Date(Date.now() + (route.stops.length + 1) * 30 * 60 * 1000).toISOString(),
          })

          route.total_distance += minDistance
          route.estimated_duration += 30 // 30 minutes per stop
          route.total_orders++

          assignedOrders.add(nearestOrder.id)
          availableOrders.splice(nearestIndex, 1)

          currentLat = nearestOrder.customers.latitude
          currentLon = nearestOrder.customers.longitude
          remainingCapacity--
        } else {
          break // No more nearby orders
        }
      }

      if (route.stops.length > 0) {
        route.total_distance = Math.round(route.total_distance * 10) / 10
        routes.push(route)
      }
    }

    // Save routes to database
    for (const route of routes) {
      const { data: savedRoute } = await supabase
        .from("delivery_routes")
        .insert({
          agent_id: route.agent_id,
          route_date: route.route_date,
          total_distance: route.total_distance,
          estimated_duration: route.estimated_duration,
          status: "planned",
        })
        .select()
        .single()

      if (savedRoute) {
        // Save route stops
        const stops = route.stops.map((stop, index) => ({
          route_id: savedRoute.id,
          order_id: stop.order_id,
          stop_sequence: index + 1,
          estimated_arrival: stop.estimated_arrival,
          status: "pending",
        }))

        await supabase.from("route_stops").insert(stops)

        // Update order statuses
        const orderIds = route.stops.map((stop) => stop.order_id)
        await supabase.from("orders").update({ status: "processing" }).in("id", orderIds)
      }
    }

    return NextResponse.json({
      success: true,
      routes,
      total_routes: routes.length,
      total_orders_assigned: assignedOrders.size,
      unassigned_orders: orders.length - assignedOrders.size,
    })
  } catch (error) {
    console.error("Route bundling error:", error)
    return NextResponse.json({ error: "Failed to bundle delivery routes" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = createServerClient()

    const { data: routes } = await supabase
      .from("delivery_routes")
      .select(`
        *,
        delivery_agents (name, phone),
        route_stops (
          *,
          orders (
            total_amount,
            customers (name, address, latitude, longitude)
          )
        )
      `)
      .order("created_at", { ascending: false })
      .limit(20)

    return NextResponse.json({ routes })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch delivery routes" }, { status: 500 })
  }
}
