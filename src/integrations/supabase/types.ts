export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          product_name: string | null
          quantity: number
          unit_price: number
          price: number | null
          vendor_id: string | null
          vendor_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          product_name?: string | null
          quantity: number
          unit_price: number
          price?: number | null
          vendor_id?: string | null
          vendor_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string | null
          quantity?: number
          unit_price?: number
          price?: number | null
          vendor_id?: string | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      orders: {
        Row: {
          created_at: string
          id: string
          mpesa_checkout_request_id: string | null
          mpesa_receipt_number: string | null
          phone_number: string
          status: string
          total: number
          updated_at: string
          user_id: string
          vendor_id: string | null
          vendor_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          mpesa_checkout_request_id?: string | null
          mpesa_receipt_number?: string | null
          phone_number: string
          status?: string
          total: number
          updated_at?: string
          user_id: string
          vendor_id?: string | null
          vendor_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          mpesa_checkout_request_id?: string | null
          mpesa_receipt_number?: string | null
          phone_number?: string
          status?: string
          total?: number
          updated_at?: string
          user_id?: string
          vendor_id?: string | null
          vendor_name?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_url: string | null
          in_stock: boolean
          name: string
          price: number
          updated_at: string
          vendor_name: string
          vendor_id: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean
          name: string
          price: number
          updated_at?: string
          vendor_name?: string
          vendor_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean
          name?: string
          price?: number
          updated_at?: string
          vendor_name?: string
          vendor_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          phone_number: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          phone_number?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          phone_number?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier access
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Specific type exports for common use
export type Product = Tables<'products'>
export type Order = Tables<'orders'>
export type OrderItem = Tables<'order_items'>
export type Profile = Tables<'profiles'>

// Extended types for frontend use
export interface ProductWithVendor extends Product {
  vendor_email?: string
  vendor_phone?: string
}

export interface OrderWithItems extends Order {
  items: OrderItem[]
  customer_email?: string
  customer_name?: string
}

export interface VendorOrderItem extends OrderItem {
  orders: Order & {
    user_email?: string
    user_name?: string
  }
}

export interface DailySalesReport {
  date: string
  total: number
  items: Array<{
    id: string
    product_name: string
    quantity: number
    price: number
    order_id: string
  }>
}

export interface CartItemType {
  product: Product
  quantity: number
}

export interface VendorGroup {
  vendorId: string
  vendorName: string
  items: CartItemType[]
  subtotal: number
}