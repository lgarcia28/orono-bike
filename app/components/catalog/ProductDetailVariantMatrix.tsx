'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ProductWithVariants, ProductVariant } from '@/lib/supabase/types';
import { createClient } from '@/lib/supabase/client';
import { Check, ShieldCheck, Truck, RotateCcw, AlertTriangle } from 'lucide-react';

interface ProductDetailProps {
  product: ProductWithVariants;
  onAddToCart?: (variant: ProductVariant, quantity: number) => void;
}

export function ProductDetailVariantMatrix({ product, onAddToCart }: ProductDetailProps) {
  const [variants, setVariants] = useState<ProductVariant[]>(product.variants || []);
  
  // Extraer opciones únicas disponibles
  const availableSizes = useMemo(() => {
    return Array.from(new Set(variants.map((v) => v.size))).filter(Boolean);
  }, [variants]);

  const availableWheels = useMemo(() => {
    return Array.from(new Set(variants.map((v) => v.wheel_size))).filter(Boolean) as string[];
  }, [variants]);

  const availableColors = useMemo(() => {
    const colorMap = new Map<string, string>();
    variants.forEach((v) => {
      if (v.color) colorMap.set(v.color, v.color_hex || '#000000');
    });
    return Array.from(colorMap.entries()).map(([name, hex]) => ({ name, hex }));
  }, [variants]);

  // Estados seleccionados
  const [selectedSize, setSelectedSize] = useState<string>(availableSizes[0] || '');
  const [selectedWheel, setSelectedWheel] = useState<string>(availableWheels[0] || '');
  const [selectedColor, setSelectedColor] = useState<string>(availableColors[0]?.name || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [addedAnimation, setAddedAnimation] = useState<boolean>(false);

  // Variante activa correspondiente a la combinación
  const activeVariant = useMemo(() => {
    return variants.find(
      (v) =>
        v.size === selectedSize &&
        (!selectedWheel || v.wheel_size === selectedWheel) &&
        (!selectedColor || v.color === selectedColor)
    ) || variants[0];
  }, [variants, selectedSize, selectedWheel, selectedColor]);

  // Sincronización en tiempo real con Supabase Realtime para la tabla product_variants
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`product_variants_${product.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'product_variants',
          filter: `product_id=eq.${product.id}`,
        },
        (payload) => {
          const updated = payload.new as ProductVariant;
          setVariants((prev) =>
            prev.map((v) => (v.id === updated.id ? { ...v, stock: updated.stock, price: updated.price } : v))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [product.id]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleAddToCart = () => {
    if (!activeVariant || activeVariant.stock <= 0) return;
    if (onAddToCart) {
      onAddToCart(activeVariant, quantity);
    }
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-7xl mx-auto px-4 py-8">
      {/* Galería de Imágenes (High Contrast & Minimal) */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        <div className="relative aspect-4/3 bg-zinc-100 rounded-lg overflow-hidden border border-zinc-200">
          <img
            src={product.images[0] || 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1200&q=80'}
            alt={product.title}
            className="w-full h-full object-cover object-center"
          />
          <span className="absolute top-4 left-4 bg-zinc-900 text-white text-xs font-semibold px-3 py-1 rounded-sm uppercase tracking-wider">
            {product.brand}
          </span>
        </div>
      </div>

      {/* Panel de Compra & Matriz de Variantes */}
      <div className="lg:col-span-5 flex flex-col justify-start">
        <div className="border-b border-zinc-200 pb-6 mb-6">
          <p className="text-xs uppercase tracking-widest text-zinc-500 font-mono mb-1">{product.category}</p>
          <h1 className="text-2xl lg:text-3xl font-bold text-zinc-900 leading-tight mb-3">
            {product.title}
          </h1>

          {/* Precios & SKU */}
          <div className="flex items-baseline gap-4 mt-2">
            <span className="text-3xl font-bold text-zinc-950 font-mono">
              {formatCurrency(activeVariant?.price || 0)}
            </span>
            {activeVariant?.compare_at_price && activeVariant.compare_at_price > activeVariant.price && (
              <span className="text-lg text-zinc-400 line-through font-mono">
                {formatCurrency(activeVariant.compare_at_price)}
              </span>
            )}
          </div>
          <p className="text-xs font-mono text-zinc-500 mt-1">SKU: {activeVariant?.sku || 'N/A'}</p>
        </div>

        {/* 1. Selector de Talle de Cuadro */}
        {availableSizes.length > 0 && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-800">
                Talle del Cuadro: <span className="font-bold text-zinc-950">{selectedSize}</span>
              </label>
              <button type="button" className="text-xs underline text-zinc-600 hover:text-zinc-950">
                Guía de talles
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2.5">
              {availableSizes.map((size) => {
                const isSelected = selectedSize === size;
                const isAvailable = variants.some((v) => v.size === size && v.stock > 0);
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`py-3 text-sm font-medium border transition-all rounded-md flex items-center justify-center ${
                      isSelected
                        ? 'bg-zinc-950 text-white border-zinc-950 shadow-sm'
                        : isAvailable
                        ? 'bg-white text-zinc-900 border-zinc-300 hover:border-zinc-900'
                        : 'bg-zinc-100 text-zinc-400 border-zinc-200 line-through cursor-not-allowed'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Selector de Rodado */}
        {availableWheels.length > 0 && (
          <div className="mb-6">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-800 block mb-2">
              Rodado: <span className="font-bold text-zinc-950">{selectedWheel}</span>
            </label>
            <div className="flex gap-2.5">
              {availableWheels.map((wheel) => {
                const isSelected = selectedWheel === wheel;
                return (
                  <button
                    key={wheel}
                    type="button"
                    onClick={() => setSelectedWheel(wheel)}
                    className={`px-5 py-2.5 text-sm font-medium border rounded-md transition-all ${
                      isSelected
                        ? 'bg-zinc-950 text-white border-zinc-950 shadow-sm'
                        : 'bg-white text-zinc-900 border-zinc-300 hover:border-zinc-900'
                    }`}
                  >
                    {wheel}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Selector de Color */}
        {availableColors.length > 0 && (
          <div className="mb-6">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-800 block mb-2">
              Color: <span className="font-bold text-zinc-950">{selectedColor}</span>
            </label>
            <div className="flex items-center gap-3">
              {availableColors.map((col) => {
                const isSelected = selectedColor === col.name;
                return (
                  <button
                    key={col.name}
                    type="button"
                    onClick={() => setSelectedColor(col.name)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                      isSelected ? 'border-zinc-950 scale-110' : 'border-transparent hover:border-zinc-300'
                    }`}
                    title={col.name}
                  >
                    <span
                      className="w-7 h-7 rounded-full border border-zinc-200"
                      style={{ backgroundColor: col.hex }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Indicador de Stock en Tiempo Real */}
        <div className="mb-6 flex items-center gap-2">
          {activeVariant && activeVariant.stock > 0 ? (
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Stock disponible para entrega inmediata ({activeVariant.stock} {activeVariant.stock === 1 ? 'unidad' : 'unidades'})
            </div>
          ) : (
            <div className="flex items-center gap-2 text-rose-700 bg-rose-50 px-3 py-1.5 rounded-md border border-rose-200 text-xs font-medium">
              <AlertTriangle className="w-4 h-4" />
              Sin stock disponible en esta combinación
            </div>
          )}
        </div>

        {/* Botón de Agregar al Carrito / Compra */}
        <div className="flex gap-3 mb-8">
          <div className="flex items-center border border-zinc-300 rounded-md">
            <button
              type="button"
              disabled={quantity <= 1}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-3.5 py-3 text-zinc-600 hover:text-zinc-950 disabled:opacity-30"
            >
              -
            </button>
            <span className="px-2 font-mono text-sm font-semibold">{quantity}</span>
            <button
              type="button"
              disabled={!activeVariant || quantity >= activeVariant.stock}
              onClick={() => setQuantity((q) => q + 1)}
              className="px-3.5 py-3 text-zinc-600 hover:text-zinc-950 disabled:opacity-30"
            >
              +
            </button>
          </div>

          <button
            type="button"
            disabled={!activeVariant || activeVariant.stock <= 0}
            onClick={handleAddToCart}
            className={`flex-1 py-3.5 px-6 rounded-md font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              addedAnimation
                ? 'bg-emerald-600 text-white'
                : activeVariant && activeVariant.stock > 0
                ? 'bg-zinc-950 text-white hover:bg-zinc-800 active:scale-[0.99]'
                : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
            }`}
          >
            {addedAnimation ? (
              <>
                <Check className="w-4 h-4" /> ¡Agregado al Carrito!
              </>
            ) : (
              'Agregar al Carrito'
            )}
          </button>
        </div>

        {/* Beneficios y Garantías */}
        <div className="grid grid-cols-1 gap-3 border-t border-zinc-200 pt-6 text-xs text-zinc-600">
          <div className="flex items-center gap-3">
            <Truck className="w-4 h-4 text-zinc-900 shrink-0" />
            <span>Retiro gratis en el local de Oroño Bike o envíos a todo el país vía Andreani.</span>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-zinc-900 shrink-0" />
            <span>Garantía oficial y primer service de calibración incluido en nuestro taller.</span>
          </div>
          <div className="flex items-center gap-3">
            <RotateCcw className="w-4 h-4 text-zinc-900 shrink-0" />
            <span>Facturación electrónica ARCA directa (Factura A o B).</span>
          </div>
        </div>

        {/* Ficha Técnica Expandible */}
        {product.specs && Object.keys(product.specs).length > 0 && (
          <div className="mt-8 border-t border-zinc-200 pt-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 mb-3">Ficha Técnica</h3>
            <dl className="grid grid-cols-1 gap-2 text-xs">
              {Object.entries(product.specs).map(([key, value]) => (
                <div key={key} className="flex justify-between py-1 border-b border-zinc-100">
                  <dt className="text-zinc-500 capitalize">{key.replace(/_/g, ' ')}</dt>
                  <dd className="font-medium text-zinc-900 text-right">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
