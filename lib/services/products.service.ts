import { createClient } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/server';
import { Product, ProductVariant, ProductWithVariants } from '@/lib/supabase/types';
import { ALL_PRODUCTS_CATALOG } from '@/lib/data/bikes';

export class ProductsService {
  /**
   * Obtiene todos los productos activos con sus variantes (para el catálogo)
   */
  static async getAllActiveProducts(): Promise<ProductWithVariants[]> {
    try {
      if (typeof window !== 'undefined') {
        const stored = JSON.parse(localStorage.getItem('orono_custom_bikes') || '[]');
        if (Array.isArray(stored) && stored.length > 0) {
          return [...stored, ...ALL_PRODUCTS_CATALOG];
        }
      }
    } catch (e) {}

    return ALL_PRODUCTS_CATALOG;
  }

  /**
   * Obtiene un producto por su slug con todas sus variantes
   */
  static async getProductBySlug(slug: string): Promise<ProductWithVariants | null> {
    const all = await this.getAllActiveProducts();
    const found = all.find((p) => p.slug === slug || p.id === slug);
    return found || null;
  }

  /**
   * Búsqueda predictiva ultrarrápida por Modelo, Marca, SKU y Código de Barras para el sistema POS
   */
  static async searchVariantsForPOS(
    query: string
  ): Promise<(ProductVariant & { product: Product })[]> {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return [];

    let catalog: ProductWithVariants[] = ALL_PRODUCTS_CATALOG;
    try {
      if (typeof window !== 'undefined') {
        const stored = JSON.parse(localStorage.getItem('orono_custom_bikes') || '[]');
        if (Array.isArray(stored) && stored.length > 0) {
          catalog = [...stored, ...ALL_PRODUCTS_CATALOG];
        }
      }
    } catch (e) {}

    const matchedVariants: (ProductVariant & { product: Product })[] = [];

    for (const product of catalog) {
      const matchProductTitle = product.title.toLowerCase().includes(cleanQuery);
      const matchBrand = product.brand.toLowerCase().includes(cleanQuery);
      const matchCategory = product.category.toLowerCase().includes(cleanQuery);

      for (const variant of product.variants) {
        const matchSku = variant.sku ? variant.sku.toLowerCase().includes(cleanQuery) : false;
        const matchBarcode = variant.barcode ? variant.barcode.toLowerCase().includes(cleanQuery) : false;
        const matchColor = variant.color ? variant.color.toLowerCase().includes(cleanQuery) : false;
        const matchSize = variant.size ? variant.size.toLowerCase().includes(cleanQuery) : false;

        if (
          matchProductTitle ||
          matchBrand ||
          matchCategory ||
          matchSku ||
          matchBarcode ||
          matchColor ||
          matchSize
        ) {
          matchedVariants.push({
            ...variant,
            product: {
              id: product.id,
              title: product.title,
              slug: product.slug,
              brand: product.brand,
              category: product.category,
              description: product.description,
              specs: product.specs,
              images: product.images,
              is_active: product.is_active,
              created_at: product.created_at,
              updated_at: product.updated_at,
            },
          });
        }
      }
    }

    return matchedVariants.slice(0, 25);
  }

  /**
   * Actualiza stock de una variante directamente (POS o Admin)
   */
  static async updateVariantStock(variantId: string, newStock: number): Promise<boolean> {
    try {
      if (typeof window !== 'undefined') {
        const stored = JSON.parse(localStorage.getItem('orono_custom_bikes') || '[]');
        if (Array.isArray(stored)) {
          const updated = stored.map((p: any) => ({
            ...p,
            variants: p.variants.map((v: any) =>
              v.id === variantId ? { ...v, stock: newStock } : v
            ),
          }));
          localStorage.setItem('orono_custom_bikes', JSON.stringify(updated));
        }
      }
      return true;
    } catch (e) {
      return false;
    }
  }
}
