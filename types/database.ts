// types/database.ts
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

export interface SmartLocker {
  id: string;
  location_name: string;
  address: string;
  latitude: number;
  longitude: number;
  total_compartments: number;
  available_compartments: number;
  created_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  store_id: string;
  total_amount: number;
  status: string;
  order_date: string;
  delivery_date?: string;
  customers?: Customer;
}

export interface LockerPickup {
  id: string;
  order_id: string;
  locker_id: string;
  compartment_number: number;
  pickup_code: string;
  qr_code?: string;
  is_picked_up: boolean;
  expires_at: string;
  created_at: string;
  otp_code?: string;
  otp_verified: boolean;
  orders?: Order;
  smart_lockers?: SmartLocker;
}

export interface QRCodeData {
  order_id: string;
  locker_id: string;
  compartment: number;
  code: string;
  expires: string;
}

export interface OTPVerificationRequest {
  action: 'verify_otp';
  compartment_number: number;
  otp_code: string;
}

export interface LockerPickupResponse {
  success: boolean;
  message?: string;
  pickup?: {
    id: string;
    compartment_number: number;
    locker_name: string;
    customer_name: string;
  };
  data?: {
    pickup_id: string;
    compartment_number: number;
    locker_name: string;
    customer_name: string;
  };
}

export interface ApiError {
  error: string;
}