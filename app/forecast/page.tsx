"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { TrendingUp, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react"

// --- Interfaces and Base Data ---

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

// Base "historical" data. Our algorithm will use this to make predictions.
const historicalProductData = [
    { id: "p1", name: "Bananas (1 lb)", category: "Produce", base_demand: 140, volatility: 0.2 },
    { id: "p2", name: "Milk (1 gallon)", category: "Dairy", base_demand: 210, volatility: 0.1 },
    { id: "p3", name: "Bread (White Loaf)", category: "Bakery", base_demand: 80, volatility: 0.3 },
    { id: "p4", name: "Chicken Meat (1 lb)", category: "Meat", base_demand: 115, volatility: 0.4 },
    { id: "p5", name: "Cheese Slices (8 oz)", category: "Dairy", base_demand: 40, volatility: 0.15 },
    { id: "p6", name: "Apples (3 lb bag)", category: "Produce", base_demand: 170, volatility: 0.25 },
    { id: "p7", name: "Yogurt (32 oz)", category: "Dairy", base_demand: 230, volatility: 0.1 },
];

const storesData: Store[] = [
  { id: "all", name: "All Stores" },
  { id: "s1", name: "Downtown Supercenter" },
  { id: "s2", name: "Uptown Market" },
  { id: "s3", name: "North Dallas" },
  { id: "s4", name: "East Dallas Express" },
  { id: "s5", name: "West Dallas" },
];

// --- Forecasting Algorithm ---

/**
 * Generates demand forecasts for a given set of products and stores.
 * @returns {Forecast[]} An array of forecast objects.
 */
const generateForecasts = (): Forecast[] => {
    const forecasts: Forecast[] = [];
    const today = new Date();

    // Generate forecasts for the next 7 days
    for (let i = 0; i < 7; i++) {
        const forecastDate = new Date(today);
        forecastDate.setDate(today.getDate() + i);
        const dayOfWeek = forecastDate.getDay(); // Sunday = 0, Saturday = 6

        for (const store of storesData.slice(1)) { // Exclude "All Stores"
            for (const product of historicalProductData) {
                
                // 1. Calculate Predicted Demand
                let demand = product.base_demand;
                // Add some random daily fluctuation
                demand += demand * (Math.random() - 0.5) * 0.1; // +/- 5% random noise
                // Apply a weekend multiplier (e.g., higher demand on Fri/Sat)
                if (dayOfWeek === 5 || dayOfWeek === 6) { // Friday or Saturday
                    demand *= 1.2;
                }
                // Apply a store-specific multiplier
                if (store.name.includes("Supercenter")) {
                    demand *= 1.1;
                }

                // 2. Calculate Confidence Score
                // Higher volatility leads to lower confidence
                let confidence = 1.0 - product.volatility;
                // Add a small random factor to confidence as well
                confidence -= (Math.random() * 0.1);
                // Ensure confidence is within a reasonable range (e.g., 0.5 to 0.95)
                confidence = Math.max(0.5, Math.min(0.95, confidence));

                forecasts.push({
                    id: `${store.id}-${product.id}-${i}`,
                    predicted_demand: Math.round(demand),
                    confidence_score: parseFloat(confidence.toFixed(2)),
                    forecast_date: forecastDate.toISOString().split('T')[0],
                    products: { name: product.name, category: product.category },
                    stores: { name: store.name, address: "N/A" },
                });
            }
        }
    }
    return forecasts;
};


export default function ForecastPage() {
  const [allForecasts, setAllForecasts] = useState<Forecast[]>([]);
  const [displayedForecasts, setDisplayedForecasts] = useState<Forecast[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  // This hook runs only ONCE when the component first mounts
  useEffect(() => {
    setLoading(true);
    // Generate all forecasts for all stores for the week
    const generated = generateForecasts();
    setAllForecasts(generated);
    setStores(storesData);
    setLoading(false);
  }, []);

  // This hook runs whenever the selected store changes, to filter the data
  useEffect(() => {
      if (allForecasts.length === 0) return;

      if (selectedStore === "all") {
          setDisplayedForecasts(allForecasts);
      } else {
          const storeName = storesData.find(s => s.id === selectedStore)?.name;
          const filtered = allForecasts.filter(f => f.stores.name === storeName);
          setDisplayedForecasts(filtered);
      }
  }, [selectedStore, allForecasts]);

  
  // --- All data processing logic below this line remains the same ---
  // IMPORTANT: It now uses `displayedForecasts` instead of `forecasts`
  
  const chartData = displayedForecasts
    .reduce((acc, forecast) => {
      const date = forecast.forecast_date
      const existing = acc.find((item) => item.date === date)
      if (existing) {
        existing.demand += forecast.predicted_demand
        existing.count += 1
      } else {
        acc.push({ date, demand: forecast.predicted_demand, count: 1 })
      }
      return acc
    }, [] as any[])
    .map((item) => ({ ...item, avgDemand: Math.round(item.demand / item.count) }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const categoryData = displayedForecasts
    .reduce((acc, forecast) => {
      const category = forecast.products.category
      const existing = acc.find((item) => item.category === category)
      if (existing) {
        existing.demand += forecast.predicted_demand;
        (existing as any).count += 1;
      } else {
        acc.push({ category, demand: forecast.predicted_demand, count: 1 })
      }
      return acc
    }, [] as any[])
    .map((item: any) => ({
        category: item.category,
        avgDemand: Math.round(item.demand / item.count)
    }));

  const avgConfidence =
    displayedForecasts.length > 0
      ? Math.round((displayedForecasts.reduce((sum, f) => sum + f.confidence_score, 0) / displayedForecasts.length) * 100)
      : 0

  const highConfidenceCount = displayedForecasts.filter((f) => f.confidence_score >= 0.8).length
  const lowConfidenceCount = displayedForecasts.filter((f) => f.confidence_score < 0.7).length

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

  // --- JSX Rendering ---

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
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setAllForecasts(generateForecasts())} className="bg-[#0071ce] hover:bg-blue-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Regenerate Forecasts
          </Button>
        </div>
      </div>
      
      {/* Cards, Charts, and Table JSX are unchanged */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Forecasts</p>
                <p className="text-2xl font-bold text-gray-900">{displayedForecasts.length}</p>
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
              <Badge variant="secondary" className="bg-green-50 text-green-700"> ≥80% </Badge>
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
                {displayedForecasts.slice(0, 20).map((forecast) => (
                  <tr key={forecast.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{forecast.products.name}</td>
                    <td className="py-3 px-4"><Badge variant="secondary" className="text-xs">{forecast.products.category}</Badge></td>
                    <td className="py-3 px-4 text-gray-600">{forecast.stores.name}</td>
                    <td className="py-3 px-4 text-right font-medium">{forecast.predicted_demand}</td>
                    <td className="py-3 px-4 text-right">
                      <Badge
                        variant={forecast.confidence_score >= 0.8 ? "default" : forecast.confidence_score >= 0.7 ? "secondary" : "destructive"}
                        className={forecast.confidence_score >= 0.8 ? "bg-green-100 text-green-800" : forecast.confidence_score >= 0.7 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}
                      >
                        {Math.round(forecast.confidence_score * 100)}%
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">{new Date(forecast.forecast_date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {displayedForecasts.length > 20 && (<div className="text-center py-4 text-gray-500">Showing 20 of {displayedForecasts.length} forecasts</div>)}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}