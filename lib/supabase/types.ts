export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          title: string;
          slug: string;
          brand: string;
          category: string;
          description: string | null;
          specs: Record<string, string>;
          images: string[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          sku: string;
          barcode: string | null;
          size: string;
          wheel_size: string | null;
          color: string;
          color_hex: string;
          cost?: number | null;
          profit_margin_percent?: number | null;
          price: number;
          compare_at_price: number | null;
          stock: number;
          min_stock_alert: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['product_variants']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['product_variants']['Insert']>;
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          channel: 'web' | 'pos';
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          billing_type: 'FACTURA_A' | 'FACTURA_B' | 'FACTURA_C' | 'TICKET_LOCAL';
          doc_type: 'DNI' | 'CUIT' | 'PASAPORTE' | 'OTRO';
          doc_number: string;
          tax_address: string | null;
          shipping_type: 'local_pickup' | 'andreani_standard' | 'andreani_express';
          shipping_cost: number;
          shipping_address: Json;
          payment_method: string;
          payment_status: 'pending_payment' | 'pending_verification' | 'paid' | 'preparing' | 'ready_for_pickup' | 'shipped' | 'delivered' | 'cancelled';
          payment_id_external: string | null;
          subtotal: number;
          discount: number;
          total: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_variant_id: string;
          title: string;
          variant_details: string;
          quantity: number;
          unit_price: number;
          subtotal: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['order_items']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>;
      };
      invoices_arca: {
        Row: {
          id: string;
          order_id: string;
          cbte_tipo: number;
          punto_venta: number;
          cbte_nro: number;
          cae: string;
          cae_vto: string;
          doc_tipo: number;
          doc_nro: number;
          imp_total: number;
          imp_neto: number;
          imp_iva: number;
          qr_data: string | null;
          pdf_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['invoices_arca']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['invoices_arca']['Insert']>;
      };
      workshop_appointments: {
        Row: {
          id: string;
          appointment_code: string;
          client_name: string;
          client_phone: string;
          client_email: string;
          service_type: string;
          bike_brand: string;
          bike_model: string;
          wheel_size: string | null;
          appointment_date: string;
          time_slot: string;
          status: 'pending_intake' | 'in_workshop' | 'ready_for_pickup' | 'delivered' | 'cancelled';
          client_notes: string | null;
          mechanic_diagnosis: string | null;
          estimated_cost: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['workshop_appointments']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['workshop_appointments']['Insert']>;
      };
      payment_receipts: {
        Row: {
          id: string;
          order_id: string;
          file_url: string;
          is_verified: boolean;
          verified_by: string | null;
          verified_at: string | null;
          admin_notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['payment_receipts']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['payment_receipts']['Insert']>;
      };
    };
  };
}

export type Product = Database['public']['Tables']['products']['Row'];
export type ProductVariant = Database['public']['Tables']['product_variants']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderItem = Database['public']['Tables']['order_items']['Row'];
export type WorkshopAppointment = Database['public']['Tables']['workshop_appointments']['Row'];
export type InvoiceArca = Database['public']['Tables']['invoices_arca']['Row'];
export type PaymentReceipt = Database['public']['Tables']['payment_receipts']['Row'];

export interface ProductWithVariants extends Product {
  variants: ProductVariant[];
}
