import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Package, Truck, MapPin, TrendingUp, Zap, Target, Globe, Settings } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const features = [
    {
      icon: BarChart3,
      title: "AI-Powered Demand Forecasting",
      description:
        "Predict per-household and per-region product demand using advanced machine learning algorithms and historical purchase behavior.",
      color: "bg-blue-500",
    },
    {
      icon: Package,
      title: "Smart Inventory Management",
      description:
        "Real-time liquidity scoring and intelligent rebalancing between stores to optimize stock levels and reduce waste.",
      color: "bg-green-500",
    },
    {
      icon: Truck,
      title: "Optimized Delivery Routes",
      description:
        "Bundle orders intelligently and create efficient delivery routes using local agents and smart algorithms.",
      color: "bg-orange-500",
    },
    {
      icon: MapPin,
      title: "Smart Locker Network",
      description:
        "Seamless pickup experience with QR code generation and automated locker assignment for customer convenience.",
      color: "bg-purple-500",
    },
  ]

  const stats = [
    { label: "Forecast Accuracy", value: "94%", icon: Target },
    { label: "Delivery Efficiency", value: "+35%", icon: TrendingUp },
    { label: "Inventory Turnover", value: "+28%", icon: Zap },
    { label: "Customer Satisfaction", value: "4.8/5", icon: Globe },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <Badge variant="secondary" className="mb-4 bg-blue-50 text-[#0071ce] border-blue-200">
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Transform Your
          <span className="text-[#0071ce]"> Supply Chain</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Predict2Deliver.AI combines intelligent locker logistics, demand forecasting, and route optimization to ensure faster, safer, and smarter last-mile delivery.


        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="bg-[#0071ce] hover:bg-blue-700">
            <Link href="/forecast">
              <BarChart3 className="w-5 h-5 mr-2" />
              View Demand Forecasts
            </Link>
          </Button>
     { /*<Button
            asChild
            variant="outline"
            size="lg"
            className="border-[#0071ce] text-[#0071ce] hover:bg-blue-50 bg-transparent"
          >
           <Link href="/admin">
            <Settings className="w-5 h-5 mr-2" />
              Admin Dashboard
            </Link>
          </Button>*/}
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="text-center">
              <CardContent className="pt-6">
                <Icon className="w-8 h-8 text-[#0071ce] mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Features Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Comprehensive Supply Chain Intelligence</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${feature.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 leading-relaxed">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* CTA Section */}
      <Card className="bg-gradient-to-r from-[#0071ce] to-blue-600 text-white">
        <CardContent className="text-center py-12">
          <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Operations?</h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Experience the power of AI-driven supply chain optimization. Start with demand forecasting and see immediate
            improvements in your inventory management.
          </p>
          <Button asChild size="lg" variant="secondary" className="bg-white text-[#0071ce] hover:bg-gray-100">
            <Link href="/forecast">Get Started Now</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
