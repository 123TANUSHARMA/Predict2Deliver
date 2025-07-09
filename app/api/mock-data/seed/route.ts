import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = createServerClient()

    // Clear existing data
    await supabase.from("route_stops").delete().neq("id", "00000000-0000-0000-0000-000000000000")
    await supabase.from("delivery_routes").delete().neq("id", "00000000-0000-0000-0000-000000000000")
    await supabase.from("locker_pickups").delete().neq("id", "00000000-0000-0000-0000-000000000000")
    await supabase.from("order_items").delete().neq("id", "00000000-0000-0000-0000-000000000000")
    await supabase.from("orders").delete().neq("id", "00000000-0000-0000-0000-000000000000")
    await supabase.from("demand_forecasts").delete().neq("id", "00000000-0000-0000-0000-000000000000")
    await supabase.from("inventory").delete().neq("id", "00000000-0000-0000-0000-000000000000")
    await supabase.from("customers").delete().neq("id", "00000000-0000-0000-0000-000000000000")
    await supabase.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000")
    await supabase.from("smart_lockers").delete().neq("id", "00000000-0000-0000-0000-000000000000")
    await supabase.from("delivery_agents").delete().neq("id", "00000000-0000-0000-0000-000000000000")
    await supabase.from("stores").delete().neq("id", "00000000-0000-0000-0000-000000000000")

    // Insert stores
    const { data: stores } = await supabase
      .from("stores")
      .insert([
        {
          name: "Walmart Supercenter - Downtown",
          address: "123 Main St, Dallas, TX 75201",
          latitude: 32.7767,
          longitude: -96.797,
          capacity: 2000,
        },
        {
          name: "Walmart Neighborhood Market - Uptown",
          address: "456 Oak Ave, Dallas, TX 75204",
          latitude: 32.7877,
          longitude: -96.8089,
          capacity: 1500,
        },
        {
          name: "Walmart Supercenter - North Dallas",
          address: "789 Elm St, Dallas, TX 75230",
          latitude: 32.8998,
          longitude: -96.7587,
          capacity: 2500,
        },
        {
          name: "Walmart Express - East Dallas",
          address: "321 Pine Rd, Dallas, TX 75218",
          latitude: 32.7668,
          longitude: -96.7156,
          capacity: 1000,
        },
        {
          name: "Walmart Supercenter - West Dallas",
          address: "654 Cedar Blvd, Dallas, TX 75212",
          latitude: 32.7668,
          longitude: -96.8667,
          capacity: 2200,
        },
      ])
      .select()

    // Insert products
    const { data: products } = await supabase
      .from("products")
      .insert([
        { name: "Bananas (1 lb)", category: "Fresh Produce", price: 0.68, weight: 1.0 },
        { name: "Milk (1 gallon)", category: "Dairy", price: 3.48, weight: 8.6 },
        { name: "Bread (White Loaf)", category: "Bakery", price: 1.28, weight: 1.5 },
        { name: "Eggs (12 count)", category: "Dairy", price: 2.48, weight: 1.5 },
        { name: "Chicken Breast (1 lb)", category: "Meat", price: 4.98, weight: 1.0 },
        { name: "Rice (5 lb bag)", category: "Pantry", price: 3.98, weight: 5.0 },
        { name: "Apples (3 lb bag)", category: "Fresh Produce", price: 2.98, weight: 3.0 },
        { name: "Ground Beef (1 lb)", category: "Meat", price: 5.48, weight: 1.0 },
        { name: "Pasta (1 lb box)", category: "Pantry", price: 1.48, weight: 1.0 },
        { name: "Yogurt (32 oz)", category: "Dairy", price: 4.98, weight: 2.0 },
        { name: "Tomatoes (1 lb)", category: "Fresh Produce", price: 1.98, weight: 1.0 },
        { name: "Cheese Slices (8 oz)", category: "Dairy", price: 3.98, weight: 0.5 },
        { name: "Cereal (18 oz box)", category: "Breakfast", price: 4.48, weight: 1.2 },
        { name: "Orange Juice (64 oz)", category: "Beverages", price: 3.98, weight: 4.0 },
        { name: "Frozen Pizza", category: "Frozen Foods", price: 2.98, weight: 1.5 },
      ])
      .select()

    // Insert customers
    const { data: customers } = await supabase
      .from("customers")
      .insert([
        {
          name: "John Smith",
          email: "john.smith@email.com",
          address: "100 Commerce St, Dallas, TX 75202",
          latitude: 32.7758,
          longitude: -96.8085,
        },
        {
          name: "Sarah Johnson",
          email: "sarah.j@email.com",
          address: "200 Victory Ave, Dallas, TX 75219",
          latitude: 32.7903,
          longitude: -96.8103,
        },
        {
          name: "Mike Davis",
          email: "mike.davis@email.com",
          address: "300 Ross Ave, Dallas, TX 75201",
          latitude: 32.7813,
          longitude: -96.7969,
        },
        {
          name: "Emily Wilson",
          email: "emily.w@email.com",
          address: "400 Bryan St, Dallas, TX 75201",
          latitude: 32.7767,
          longitude: -96.7836,
        },
        {
          name: "David Brown",
          email: "david.brown@email.com",
          address: "500 Main St, Dallas, TX 75202",
          latitude: 32.7767,
          longitude: -96.797,
        },
        {
          name: "Lisa Garcia",
          email: "lisa.garcia@email.com",
          address: "600 Elm St, Dallas, TX 75202",
          latitude: 32.7767,
          longitude: -96.7836,
        },
        {
          name: "Robert Miller",
          email: "robert.m@email.com",
          address: "700 Commerce St, Dallas, TX 75202",
          latitude: 32.7758,
          longitude: -96.8085,
        },
        {
          name: "Jennifer Taylor",
          email: "jennifer.t@email.com",
          address: "800 Main St, Dallas, TX 75202",
          latitude: 32.7767,
          longitude: -96.797,
        },
      ])
      .select()

    // Insert delivery agents
    await supabase.from("delivery_agents").insert([
      {
        name: "Agent Alpha",
        phone: "+1-555-0101",
        current_latitude: 32.7767,
        current_longitude: -96.797,
        is_available: true,
        max_capacity: 25,
      },
      {
        name: "Agent Beta",
        phone: "+1-555-0102",
        current_latitude: 32.7877,
        current_longitude: -96.8089,
        is_available: true,
        max_capacity: 20,
      },
      {
        name: "Agent Gamma",
        phone: "+1-555-0103",
        current_latitude: 32.8998,
        current_longitude: -96.7587,
        is_available: true,
        max_capacity: 30,
      },
      {
        name: "Agent Delta",
        phone: "+1-555-0104",
        current_latitude: 32.7668,
        current_longitude: -96.7156,
        is_available: false,
        max_capacity: 25,
      },
      {
        name: "Agent Echo",
        phone: "+1-555-0105",
        current_latitude: 32.7668,
        current_longitude: -96.8667,
        is_available: true,
        max_capacity: 20,
      },
    ])

    // Insert smart lockers
    await supabase.from("smart_lockers").insert([
      {
        location_name: "Downtown Transit Center",
        address: "1401 Pacific Ave, Dallas, TX 75201",
        latitude: 32.7767,
        longitude: -96.8085,
        total_compartments: 60,
        available_compartments: 45,
      },
      {
        location_name: "Uptown Shopping Plaza",
        address: "2500 McKinney Ave, Dallas, TX 75201",
        latitude: 32.7903,
        longitude: -96.8103,
        total_compartments: 40,
        available_compartments: 32,
      },
      {
        location_name: "North Dallas Mall",
        address: "12000 North Central Expy, Dallas, TX 75243",
        latitude: 32.8998,
        longitude: -96.7587,
        total_compartments: 80,
        available_compartments: 65,
      },
      {
        location_name: "East Dallas Community Center",
        address: "9009 Garland Rd, Dallas, TX 75218",
        latitude: 32.7668,
        longitude: -96.7156,
        total_compartments: 50,
        available_compartments: 38,
      },
      {
        location_name: "West Dallas Hub",
        address: "1500 Singleton Blvd, Dallas, TX 75212",
        latitude: 32.7668,
        longitude: -96.8667,
        total_compartments: 45,
        available_compartments: 40,
      },
    ])

    // Generate inventory for each store-product combination
    if (stores && products) {
      const inventoryData = []
      for (const store of stores) {
        for (const product of products) {
          const currentStock = Math.floor(Math.random() * 80 + 20) // 20-100
          let reorderThreshold = 12
          if (product.category === "Fresh Produce") reorderThreshold = 15
          if (product.category === "Dairy") reorderThreshold = 20
          if (product.category === "Meat") reorderThreshold = 10

          const maxCapacity = store.capacity > 2000 ? 150 : store.capacity > 1500 ? 120 : 100

          inventoryData.push({
            store_id: store.id,
            product_id: product.id,
            current_stock: currentStock,
            reorder_threshold: reorderThreshold,
            max_capacity: maxCapacity,
          })
        }
      }
      await supabase.from("inventory").insert(inventoryData)
    }

    // Generate sample orders
    if (customers && stores && products) {
      const orderData = []
      const orderItemsData = []

      for (let i = 0; i < 50; i++) {
        const customer = customers[Math.floor(Math.random() * customers.length)]
        const store = stores[Math.floor(Math.random() * stores.length)]
        const orderDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)

        const orderId = crypto.randomUUID()
        const totalAmount = Math.round((Math.random() * 50 + 10) * 100) / 100
        const statuses = ["pending", "processing", "delivered", "cancelled"]
        const status = statuses[Math.floor(Math.random() * statuses.length)]

        orderData.push({
          id: orderId,
          customer_id: customer.id,
          store_id: store.id,
          total_amount: totalAmount,
          status,
          order_date: orderDate.toISOString(),
        })

        // Add 1-3 items per order
        const itemCount = Math.floor(Math.random() * 3) + 1
        for (let j = 0; j < itemCount; j++) {
          const product = products[Math.floor(Math.random() * products.length)]
          orderItemsData.push({
            order_id: orderId,
            product_id: product.id,
            quantity: Math.floor(Math.random() * 5) + 1,
            unit_price: product.price,
          })
        }
      }

      await supabase.from("orders").insert(orderData)
      await supabase.from("order_items").insert(orderItemsData)
    }

    // Generate demand forecasts
    if (stores && products) {
      const forecastData = []
      for (const store of stores) {
        for (const product of products) {
          if (Math.random() < 0.8) {
            // 80% chance of forecast
            const forecastDate = new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000)
            forecastData.push({
              product_id: product.id,
              store_id: store.id,
              predicted_demand: Math.floor(Math.random() * 100 + 20),
              confidence_score: Math.round((Math.random() * 0.3 + 0.7) * 100) / 100,
              forecast_date: forecastDate.toISOString().split("T")[0],
            })
          }
        }
      }
      await supabase.from("demand_forecasts").insert(forecastData)
    }

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      counts: {
        stores: stores?.length || 0,
        products: products?.length || 0,
        customers: customers?.length || 0,
      },
    })
  } catch (error) {
    console.error("Seeding error:", error)
    return NextResponse.json({ success: false, error: "Failed to seed database" }, { status: 500 })
  }
}
