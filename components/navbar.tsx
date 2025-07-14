"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BarChart3, Package, Truck, MapPin, Settings, Home } from "lucide-react"



const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Forecast", href: "/forecast", icon: BarChart3 },
//  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Delivery", href: "/delivery", icon: Truck },
  { name: "Lockers", href: "/lockers", icon: MapPin },
 // { name: "Admin", href: "/admin", icon: Settings },
   { name: "otp form", href: "/verify-pickup", icon: Settings },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#0071ce] rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Predict2Deliver.AI</span>
            </Link>
          </div>

          <div className="flex space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive ? "bg-[#0071ce] text-white" : "text-gray-600 hover:text-[#0071ce] hover:bg-blue-50",
                  )}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
