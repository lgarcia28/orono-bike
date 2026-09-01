import { createClient } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/server';
import { Order, OrderItem } from '@/lib/supabase/types';

export interface CreateOrderDTO {
  channel?: 'web' | 'pos';
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  billingType: 'FACTURA_A' | 'FACTURA_B' | 'FACTURA_C' | 'TICKET_LOCAL';
  docType: 'DNI' | 'CUIT' | 'PASAPORTE' | 'OTRO';
  docNumber: string;
  taxAddress?: string;
  shippingType: 'local_pickup' | 'andreani_standard' | 'andreani_express';
  shippingCost?: number;
  shippingAddress?: Record<string, unknown>;
  paymentMethod: string;
  paymentStatus?: Order['payment_status'];
  paymentIdExternal?: string;
  subtotal: number;
  discount?: number;
  total: number;
  notes?: string;
  items: {
    productVariantId: string;
    title: string;
    variantDetails: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export class OrdersService {
  /**
   * Crea una nueva orden con sus items asociados
   */
  static async createOrder(data: CreateOrderDTO): Promise<{ success: boolean; order?: Order; error?: string }> {
    const supabase = data.channel === 'pos' ? createAdminClient() : createClient();
    
    // Generar número de orden legible (ej: ORN-20260901-7890)
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORN-${timestamp}-${randomSuffix}`;

    const { data: order, error: orderError } = await (supabase
      .from('orders') as any)
      .insert({
        order_number: orderNumber,
        channel: data.channel || 'web',
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        customer_phone: data.customerPhone,
        billing_type: data.billingType,
        doc_type: data.docType,
        doc_number: data.docNumber,
        tax_address: data.taxAddress || null,
        shipping_type: data.shippingType,
        shipping_cost: data.shippingCost || 0,
        shipping_address: (data.shippingAddress || {}) as any,
        payment_method: data.paymentMethod,
        payment_status: data.paymentStatus || (data.channel === 'pos' ? 'paid' : 'pending_payment'),
        payment_id_external: data.paymentIdExternal || null,
        subtotal: data.subtotal,
        discount: data.discount || 0,
        total: data.total,
        notes: data.notes || null,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Error creating order header:', orderError);
      return { success: false, error: orderError?.message || 'Error al registrar orden' };
    }

    // Insertar items de la orden
    const itemsToInsert = data.items.map((item) => ({
      order_id: order.id,
      product_variant_id: item.productVariantId,
      title: item.title,
      variant_details: item.variantDetails,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      subtotal: item.quantity * item.unitPrice,
    }));

    const { error: itemsError } = await (supabase.from('order_items') as any).insert(itemsToInsert);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      return { success: false, error: itemsError.message };
    }

    return { success: true, order };
  }

  /**
   * Actualiza el estado del pago de la orden (vía Webhook MP o aprobación de transferencia)
   */
  static async updateOrderStatus(
    orderId: string,
    status: Order['payment_status'],
    externalPaymentId?: string
  ): Promise<boolean> {
    const supabase = createAdminClient();
    const updatePayload: Partial<Order> = {
      payment_status: status,
      updated_at: new Date().toISOString(),
    };

    if (externalPaymentId) {
      updatePayload.payment_id_external = externalPaymentId;
    }

    const { error } = await (supabase
      .from('orders') as any)
      .update(updatePayload)
      .eq('id', orderId);

    if (error) {
      console.error(`Error updating status for order ${orderId}:`, error);
      return false;
    }
    return true;
  }

  /**
   * Obtiene una orden por su ID o número de orden
   */
  static async getOrderWithDetails(orderIdentifier: string): Promise<(Order & { items: OrderItem[] }) | null> {
    const supabase = createClient();
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderIdentifier);

    const { data: order, error } = await (isUUID
      ? (supabase.from('orders') as any).select('*, items:order_items(*)').eq('id', orderIdentifier).single()
      : (supabase.from('orders') as any).select('*, items:order_items(*)').eq('order_number', orderIdentifier).single());

    if (error || !order) {
      console.error('Error fetching order:', error);
      return null;
    }

    return order as unknown as (Order & { items: OrderItem[] });
  }
}
