"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { TrendingUp, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react"

interface Forecast {
  id: string
  predicted_demand: number
  confidence_score: number
  forecast_date: string
  products: { name: string; category: string }
  stores: { name: string; address: string }
}

interface Store {
  id: string
  name: string
}

export default function ForecastPage() {
  const [forecasts, setForecasts] = useState<Forecast[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStore, setSelectedStore] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const fetchForecasts = async () => {
    try {
      const url = selectedStore === "all" ? "/api/demand-forecast" : `/api/demand-forecast?store_id=${selectedStore}`

      const response = await fetch(url)
      const data = await response.json()
      setForecasts(data.forecasts || [])
    } catch (error) {
      console.error("Failed to fetch forecasts:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStores = async () => {
    try {
      const response = await fetch("/api/mock-data/seed")
      // For now, we'll use hardcoded stores since we need the store list
      setStores([
        { id: "all", name: "All Stores" },
        { id: "1", name: "Downtown Supercenter" },
        { id: "2", name: "Uptown Market" },
        { id: "3", name: "North Dallas" },
        { id: "4", name: "East Dallas Express" },
        { id: "5", name: "West Dallas" },
      ])
    } catch (error) {
      console.error("Failed to fetch stores:", error)
    }
  }

  const generateForecasts = async () => {
    setGenerating(true)
    try {
      const response = await fetch("/api/demand-forecast", {
        method: "POST",
      })
      const data = await response.json()
      if (data.success) {
        await fetchForecasts()
      }
    } catch (error) {
      console.error("Failed to generate forecasts:", error)
    } finally {
      setGenerating(false)
    }
  }

  useEffect(() => {
    fetchStores()
    fetchForecasts()
  }, [selectedStore])

  // Prepare chart data
  const chartData = forecasts
    .reduce((acc, forecast) => {
      const date = forecast.forecast_date
      const existing = acc.find((item) => item.date === date)

      if (existing) {
        existing.demand += forecast.predicted_demand
        existing.count += 1
      } else {
        acc.push({
          date,
          demand: forecast.predicted_demand,
          count: 1,
        })
      }

      return acc
    }, [] as any[])
    .map((item) => ({
      ...item,
      avgDemand: Math.round(item.demand / item.count),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Category breakdown
  const categoryData = forecasts
    .reduce((acc, forecast) => {
      const category = forecast.products.category
      const existing = acc.find((item) => item.category === category)

      if (existing) {
        existing.demand += forecast.predicted_demand
        existing.count += 1
      } else {
        acc.push({
          category,
          demand: forecast.predicted_demand,
          count: 1,
        })
      }

      return acc
    }, [] as any[])
    .map((item) => ({
      ...item,
      avgDemand: Math.round(item.demand / item.count),
    }))

  const avgConfidence =
    forecasts.length > 0
      ? Math.round((forecasts.reduce((sum, f) => sum + f.confidence_score, 0) / forecasts.length) * 100)
      : 0

  const highConfidenceCount = forecasts.filter((f) => f.confidence_score >= 0.8).length
  const lowConfidenceCount = forecasts.filter((f) => f.confidence_score < 0.7).length

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
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
          <h1 className="text-3xl font-bold text-gray-900">Demand Forecasting</h1>
          <p className="text-gray-600 mt-2">AI-powered predictions for optimal inventory planning</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedStore} onValueChange={setSelectedStore}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select store" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stores</SelectItem>
              {stores.slice(1).map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={generateForecasts} disabled={generating} className="bg-[#0071ce] hover:bg-blue-700">
            {generating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <TrendingUp className="w-4 h-4 mr-2" />}
            {generating ? "Generating..." : "Generate Forecasts"}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Forecasts</p>
                <p className="text-2xl font-bold text-gray-900">{forecasts.length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-[#0071ce]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Confidence</p>
                <p className="text-2xl font-bold text-gray-900">{avgConfidence}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Confidence</p>
                <p className="text-2xl font-bold text-green-600">{highConfidenceCount}</p>
              </div>
              <Badge variant="secondary" className="bg-green-50 text-green-700">
                ≥80%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Needs Review</p>
                <p className="text-2xl font-bold text-orange-600">{lowConfidenceCount}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Demand Trend Over Time</CardTitle>
            <CardDescription>Average predicted demand by date</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value) => [value, "Avg Demand"]}
                />
                <Line type="monotone" dataKey="avgDemand" stroke="#0071ce" strokeWidth={2} dot={{ fill: "#0071ce" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Demand by Category</CardTitle>
            <CardDescription>Average predicted demand by product category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => [value, "Avg Demand"]} />
                <Bar dataKey="avgDemand" fill="#0071ce" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Forecasts</CardTitle>
          <CardDescription>Individual product demand predictions with confidence scores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Product</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Store</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Predicted Demand</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Confidence</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Forecast Date</th>
                </tr>
              </thead>
              <tbody>
                {forecasts.slice(0, 20).map((forecast) => (
                  <tr key={forecast.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{forecast.products.name}</td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary" className="text-xs">
                        {forecast.products.category}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{forecast.stores.name}</td>
                    <td className="py-3 px-4 text-right font-medium">{forecast.predicted_demand}</td>
                    <td className="py-3 px-4 text-right">
                      <Badge
                        variant={
                          forecast.confidence_score >= 0.8
                            ? "default"
                            : forecast.confidence_score >= 0.7
                              ? "secondary"
                              : "destructive"
                        }
                        className={
                          forecast.confidence_score >= 0.8
                            ? "bg-green-100 text-green-800"
                            : forecast.confidence_score >= 0.7
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }
                      >
                        {Math.round(forecast.confidence_score * 100)}%
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {new Date(forecast.forecast_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {forecasts.length > 20 && (
              <div className="text-center py-4 text-gray-500">Showing 20 of {forecasts.length} forecasts</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
