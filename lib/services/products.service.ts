import { createClient } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/server';
import { Product, ProductVariant, ProductWithVariants } from '@/lib/supabase/types';

export class ProductsService {
  /**
   * Obtiene todos los productos activos con sus variantes (para el catálogo)
   */
  static async getAllActiveProducts(): Promise<ProductWithVariants[]> {
    const supabase = createClient();
    const { data: products, error } = await supabase
      .from('products')
      .select('*, variants:product_variants(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching active products:', error);
      return [];
    }

    return (products as unknown as ProductWithVariants[]) || [];
  }

  /**
   * Obtiene un producto por su slug con todas sus variantes
   */
  static async getProductBySlug(slug: string): Promise<ProductWithVariants | null> {
    const supabase = createClient();
    const { data: product, error } = await supabase
      .from('products')
      .select('*, variants:product_variants(*)')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !product) {
      console.error('Error fetching product by slug:', error);
      return null;
    }

    return product as unknown as ProductWithVariants;
  }

  /**
   * Búsqueda predictiva y por código de barras para el sistema POS
   */
  static async searchVariantsForPOS(query: string): Promise<(ProductVariant & { product: Product })[]> {
    const supabase = createClient();
    const cleanQuery = query.trim();

    if (!cleanQuery) return [];

    // Búsqueda directa por código de barras o SKU
    const { data, error } = await supabase
      .from('product_variants')
      .select('*, product:products(*)')
      .or(`barcode.ilike.%${cleanQuery}%,sku.ilike.%${cleanQuery}%,product.title.ilike.%${cleanQuery}%`)
      .limit(20);

    if (error) {
      console.error('Error searching variants for POS:', error);
      return [];
    }

    return (data as unknown as (ProductVariant & { product: Product })[]) || [];
  }

  /**
   * Actualiza stock de una variante directamente (POS o Admin)
   */
  static async updateVariantStock(variantId: string, newStock: number): Promise<boolean> {
    const supabase = createAdminClient();
    const { error } = await (supabase
      .from('product_variants') as any)
      .update({ stock: newStock, updated_at: new Date().toISOString() })
      .eq('id', variantId);

    if (error) {
      console.error(`Error updating stock for variant ${variantId}:`, error);
      return false;
    }
    return true;
  }
}
