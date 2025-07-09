"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, Package, RefreshCw, TrendingDown, TrendingUp } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface InventoryItem {
  id: string
  current_stock: number
  reorder_threshold: number
  max_capacity: number
  liquidity_score: number
  liquidity_status: "critical" | "low" | "optimal" | "overstocked"
  products: { name: string; category: string; price: number }
  stores: { name: string; address: string }
}

interface RebalanceAction {
  product_name: string
  from_store: string
  to_store: string
  transfer_amount: number
  distance_miles: number
  priority: "high" | "medium"
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [rebalanceActions, setRebalanceActions] = useState<RebalanceAction[]>([])
  const [selectedStore, setSelectedStore] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [rebalancing, setRebalancing] = useState(false)
  const [summary, setSummary] = useState({
    critical: 0,
    low: 0,
    optimal: 0,
    overstocked: 0,
    total: 0,
  })

  const fetchInventory = async () => {
    try {
      const url =
        selectedStore === "all"
          ? "/api/inventory/liquidity-score"
          : `/api/inventory/liquidity-score?store_id=${selectedStore}`

      const response = await fetch(url)
      const data = await response.json()
      setInventory(data.inventory || [])
      setSummary(data.summary || {})
    } catch (error) {
      console.error("Failed to fetch inventory:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateRebalance = async () => {
    setRebalancing(true)
    try {
      const response = await fetch("/api/inventory/rebalance", {
        method: "POST",
      })
      const data = await response.json()
      setRebalanceActions(data.rebalance_actions || [])
    } catch (error) {
      console.error("Failed to calculate rebalance:", error)
    } finally {
      setRebalancing(false)
    }
  }

  useEffect(() => {
    fetchInventory()
  }, [selectedStore])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200"
      case "low":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "optimal":
        return "bg-green-100 text-green-800 border-green-200"
      case "overstocked":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "critical":
        return <AlertTriangle className="w-4 h-4" />
      case "low":
        return <TrendingDown className="w-4 h-4" />
      case "optimal":
        return <Package className="w-4 h-4" />
      case "overstocked":
        return <TrendingUp className="w-4 h-4" />
      default:
        return <Package className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-2">Real-time stock levels and liquidity scoring</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedStore} onValueChange={setSelectedStore}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select store" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stores</SelectItem>
              <SelectItem value="1">Downtown Supercenter</SelectItem>
              <SelectItem value="2">Uptown Market</SelectItem>
              <SelectItem value="3">North Dallas</SelectItem>
              <SelectItem value="4">East Dallas Express</SelectItem>
              <SelectItem value="5">West Dallas</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={calculateRebalance} disabled={rebalancing} className="bg-[#0071ce] hover:bg-blue-700">
            {rebalancing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Package className="w-4 h-4 mr-2" />}
            {rebalancing ? "Calculating..." : "Calculate Rebalance"}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Stock</p>
                <p className="text-2xl font-bold text-red-600">{summary.critical}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-orange-600">{summary.low}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Optimal Stock</p>
                <p className="text-2xl font-bold text-green-600">{summary.optimal}</p>
              </div>
              <Package className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overstocked</p>
                <p className="text-2xl font-bold text-blue-600">{summary.overstocked}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rebalance Actions */}
      {rebalanceActions.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recommended Rebalancing Actions</CardTitle>
            <CardDescription>Intelligent inventory transfers to optimize stock levels across stores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rebalanceActions.slice(0, 10).map((action, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge
                        variant={action.priority === "high" ? "destructive" : "secondary"}
                        className={action.priority === "high" ? "bg-red-100 text-red-800" : ""}
                      >
                        {action.priority} priority
                      </Badge>
                      <span className="font-medium">{action.product_name}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Transfer {action.transfer_amount} units from {action.from_store} to {action.to_store}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{action.distance_miles} miles</p>
                    <p className="text-xs text-gray-500">distance</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Details</CardTitle>
          <CardDescription>Current stock levels with liquidity scores and capacity utilization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Product</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Store</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Current Stock</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Capacity</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Value</th>
                </tr>
              </thead>
              <tbody>
                {inventory.slice(0, 50).map((item) => {
                  const utilizationPercent = (item.current_stock / item.max_capacity) * 100

                  return (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{item.products.name}</p>
                          <p className="text-xs text-gray-500">{item.products.category}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{item.stores.name}</td>
                      <td className="py-3 px-4 text-right">
                        <div>
                          <p className="font-medium">{item.current_stock}</p>
                          <p className="text-xs text-gray-500">Reorder at {item.reorder_threshold}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div>
                          <p className="font-medium">{item.max_capacity}</p>
                          <Progress value={utilizationPercent} className="w-16 h-2 mt-1" />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant="outline"
                          className={`${getStatusColor(item.liquidity_status)} flex items-center space-x-1 w-fit mx-auto`}
                        >
                          {getStatusIcon(item.liquidity_status)}
                          <span className="capitalize">{item.liquidity_status}</span>
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {formatCurrency(item.current_stock * item.products.price)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {inventory.length > 50 && (
              <div className="text-center py-4 text-gray-500">Showing 50 of {inventory.length} items</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
