"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  BarChart3,
  Package,
  Truck,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Database,
  Activity,
  DollarSign,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface SystemStats {
  forecasts: number
  inventory_items: number
  active_routes: number
  locker_pickups: number
  total_orders: number
  revenue: number
}

export default function AdminPage() {
  const [stats, setStats] = useState<SystemStats>({
    forecasts: 0,
    inventory_items: 0,
    active_routes: 0,
    locker_pickups: 0,
    total_orders: 0,
    revenue: 0,
  })
  const [loading, setLoading] = useState(true)
  const [operations, setOperations] = useState({
    seeding: false,
    forecasting: false,
    rebalancing: false,
    routing: false,
  })

  // Mock performance data
  const performanceData = [
    { name: "Mon", efficiency: 85, orders: 120 },
    { name: "Tue", efficiency: 88, orders: 135 },
    { name: "Wed", efficiency: 92, orders: 148 },
    { name: "Thu", efficiency: 87, orders: 142 },
    { name: "Fri", efficiency: 94, orders: 165 },
    { name: "Sat", efficiency: 91, orders: 158 },
    { name: "Sun", efficiency: 89, orders: 134 },
  ]

  const inventoryStatusData = [
    { name: "Optimal", value: 65, color: "#10b981" },
    { name: "Low Stock", value: 20, color: "#f59e0b" },
    { name: "Critical", value: 10, color: "#ef4444" },
    { name: "Overstocked", value: 5, color: "#3b82f6" },
  ]

  const fetchSystemStats = async () => {
    try {
      // In a real implementation, you'd have a dedicated stats endpoint
      // For now, we'll simulate the data
      setStats({
        forecasts: 1250,
        inventory_items: 875,
        active_routes: 23,
        locker_pickups: 156,
        total_orders: 2340,
        revenue: 45670.5,
      })
    } catch (error) {
      console.error("Failed to fetch system stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const runOperation = async (operation: string) => {
    setOperations((prev) => ({ ...prev, [operation]: true }))

    try {
      let endpoint = ""
      const method = "POST"

      switch (operation) {
        case "seeding":
          endpoint = "/api/mock-data/seed"
          break
        case "forecasting":
          endpoint = "/api/demand-forecast"
          break
        case "rebalancing":
          endpoint = "/api/inventory/rebalance"
          break
        case "routing":
          endpoint = "/api/delivery/bundle-routes"
          break
      }

      const response = await fetch(endpoint, { method })
      const data = await response.json()

      if (data.success) {
        // Refresh stats after successful operation
        await fetchSystemStats()
      }
    } catch (error) {
      console.error(`Failed to run ${operation}:`, error)
    } finally {
      setOperations((prev) => ({ ...prev, [operation]: false }))
    }
  }

  useEffect(() => {
    fetchSystemStats()
  }, [])

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
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">System monitoring and operations control</p>
        </div>
        <Button
          onClick={() => fetchSystemStats()}
          variant="outline"
          className="border-[#0071ce] text-[#0071ce] hover:bg-blue-50"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">${stats.revenue.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total_orders.toLocaleString()}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Routes</p>
                <p className="text-2xl font-bold text-orange-600">{stats.active_routes}</p>
              </div>
              <Truck className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Health</p>
                <p className="text-2xl font-bold text-green-600">98.5%</p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operations Panel */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>System Operations</CardTitle>
          <CardDescription>Trigger key system operations and data processing tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={() => runOperation("seeding")}
              disabled={operations.seeding}
              className="h-20 flex flex-col items-center justify-center bg-purple-600 hover:bg-purple-700"
            >
              {operations.seeding ? (
                <RefreshCw className="w-6 h-6 mb-2 animate-spin" />
              ) : (
                <Database className="w-6 h-6 mb-2" />
              )}
              <span>{operations.seeding ? "Seeding..." : "Seed Database"}</span>
            </Button>

            <Button
              onClick={() => runOperation("forecasting")}
              disabled={operations.forecasting}
              className="h-20 flex flex-col items-center justify-center bg-blue-600 hover:bg-blue-700"
            >
              {operations.forecasting ? (
                <RefreshCw className="w-6 h-6 mb-2 animate-spin" />
              ) : (
                <BarChart3 className="w-6 h-6 mb-2" />
              )}
              <span>{operations.forecasting ? "Forecasting..." : "Generate Forecasts"}</span>
            </Button>

            <Button
              onClick={() => runOperation("rebalancing")}
              disabled={operations.rebalancing}
              className="h-20 flex flex-col items-center justify-center bg-green-600 hover:bg-green-700"
            >
              {operations.rebalancing ? (
                <RefreshCw className="w-6 h-6 mb-2 animate-spin" />
              ) : (
                <Package className="w-6 h-6 mb-2" />
              )}
              <span>{operations.rebalancing ? "Rebalancing..." : "Rebalance Inventory"}</span>
            </Button>

            <Button
              onClick={() => runOperation("routing")}
              disabled={operations.routing}
              className="h-20 flex flex-col items-center justify-center bg-orange-600 hover:bg-orange-700"
            >
              {operations.routing ? (
                <RefreshCw className="w-6 h-6 mb-2 animate-spin" />
              ) : (
                <Truck className="w-6 h-6 mb-2" />
              )}
              <span>{operations.routing ? "Routing..." : "Generate Routes"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>System Performance</CardTitle>
            <CardDescription>Daily efficiency and order volume trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="efficiency" stroke="#0071ce" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Status Distribution</CardTitle>
            <CardDescription>Current inventory health across all stores</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={inventoryStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {inventoryStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center space-x-4 mt-4">
              {inventoryStatusData.map((entry, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                  <span className="text-sm text-gray-600">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Database Health</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Connection Pool</span>
                <Badge className="bg-green-100 text-green-800">Healthy</Badge>
              </div>
              <Progress value={95} className="h-2" />
              <p className="text-xs text-gray-500">95% optimal performance</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span>API Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Response Time</span>
                <Badge className="bg-blue-100 text-blue-800">142ms avg</Badge>
              </div>
              <Progress value={88} className="h-2" />
              <p className="text-xs text-gray-500">88% within SLA</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <span>System Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Alerts</span>
                <Badge className="bg-yellow-100 text-yellow-800">2 warnings</Badge>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <p>• High memory usage on server-2</p>
                <p>• Slow query detected in forecasting</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
