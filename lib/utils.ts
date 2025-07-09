import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Haversine formula to calculate distance between two points
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959 // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

// Calculate liquidity score for inventory
export function calculateLiquidityScore(
  currentStock: number,
  reorderThreshold: number,
  maxCapacity: number,
): { score: number; status: "critical" | "low" | "optimal" | "overstocked" } {
  const ratio = currentStock / maxCapacity
  const thresholdRatio = reorderThreshold / maxCapacity

  let score: number
  let status: "critical" | "low" | "optimal" | "overstocked"

  if (currentStock <= reorderThreshold * 0.5) {
    score = 0.2
    status = "critical"
  } else if (currentStock <= reorderThreshold) {
    score = 0.4
    status = "low"
  } else if (ratio <= 0.8) {
    score = 0.8
    status = "optimal"
  } else {
    score = 0.6
    status = "overstocked"
  }

  return { score, status }
}

// Generate random pickup code
export function generatePickupCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

// Format date
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}
