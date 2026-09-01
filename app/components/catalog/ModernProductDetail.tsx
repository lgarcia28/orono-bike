'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ProductWithVariants, ProductVariant } from '@/lib/supabase/types';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowLeft,
  Check,
  ShieldCheck,
  Truck,
  RotateCcw,
  AlertTriangle,
  CreditCard,
  MessageCircle,
  Wrench,
  Zap,
  ChevronRight,
} from 'lucide-react';

interface ModernProductDetailProps {
  product: ProductWithVariants;
  onBack: () => void;
  onAddToCart: (variant: ProductVariant, quantity: number) => void;
}

export function ModernProductDetail({ product, onBack, onAddToCart }: ModernProductDetailProps) {
  const [variants, setVariants] = useState<ProductVariant[]>(product.variants || []);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

  // Opciones únicas
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

  // Selección activa
  const [selectedSize, setSelectedSize] = useState<string>(availableSizes[0] || '');
  const [selectedWheel, setSelectedWheel] = useState<string>(availableWheels[0] || '');
  const [selectedColor, setSelectedColor] = useState<string>(availableColors[0]?.name || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [addedAnimation, setAddedAnimation] = useState<boolean>(false);

  // Variante calculada
  const activeVariant = useMemo(() => {
    return (
      variants.find(
        (v) =>
          v.size === selectedSize &&
          (!selectedWheel || v.wheel_size === selectedWheel) &&
          (!selectedColor || v.color === selectedColor)
      ) || variants[0]
    );
  }, [variants, selectedSize, selectedWheel, selectedColor]);

  // Supabase Realtime para stock
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`realtime_variant_${product.id}`)
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

  const handleAdd = () => {
    if (!activeVariant || activeVariant.stock <= 0) return;
    onAddToCart(activeVariant, quantity);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 2000);
  };

  const price = activeVariant?.price || 0;
  const transferPrice = price * 0.9; // 10% OFF
  const installment3 = price / 3;
  const installment6 = price / 6;

  const basePhone = process.env.NEXT_PUBLIC_LOCAL_WHATSAPP || '5493410000000';
  const whatsappMsg = `¡Hola Oroño Bike! Quiero consultar por la ${product.title} (Talle: ${selectedSize}, Color: ${selectedColor}).`;
  const whatsappUrl = `https://wa.me/${basePhone}?text=${encodeURIComponent(whatsappMsg)}`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Top Breadcrumb & Back */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-4 mb-8">
        <button
          onClick={onBack}
          className="group flex items-center gap-2 font-heading text-xs font-bold uppercase tracking-wider text-zinc-600 hover:text-zinc-950 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-zinc-100 group-hover:bg-zinc-950 group-hover:text-white flex items-center justify-center transition-colors shadow-xs">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span>Volver al Catálogo de Bicicletas</span>
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs font-heading font-medium text-zinc-500">
          <span>{product.brand}</span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          <span>{product.category}</span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-950 font-bold">{product.title}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Columna Izquierda: Galería y Ficha de Especificaciones (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6 sticky top-28">
          <div className="relative aspect-16/11 bg-zinc-50/80 border border-zinc-200 rounded-3xl overflow-hidden flex items-center justify-center p-8 shadow-sm">
            <img
              src={product.images[selectedImageIndex] || product.images[0]}
              alt={product.title}
              className="w-full h-full object-contain object-center transition-all duration-300"
            />
            <div className="absolute top-5 left-5 bg-zinc-950 text-white text-xs font-heading font-black px-3.5 py-1.5 rounded-md uppercase tracking-wider shadow-sm">
              {product.brand}
            </div>

            {activeVariant && activeVariant.stock <= 2 && activeVariant.stock > 0 && (
              <div className="absolute bottom-5 left-5 bg-amber-500 text-zinc-950 text-xs font-heading font-black px-3.5 py-1.5 rounded-md shadow-md">
                ¡ÚLTIMAS {activeVariant.stock} UNIDADES EN ESTE TALLE!
              </div>
            )}
          </div>

          {/* Miniaturas de Fotos */}
          {product.images.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-24 h-24 rounded-xl border-2 p-2 bg-zinc-50 transition-all ${
                    selectedImageIndex === idx ? 'border-zinc-950 shadow-md ring-2 ring-zinc-950/10' : 'border-zinc-200 hover:border-zinc-400'
                  }`}
                >
                  <img src={img} alt="Thumb" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}

          {/* Especificaciones de Rendimiento (Estilo Fusion/Bertolina) */}
          {product.specs && Object.keys(product.specs).length > 0 && (
            <div className="bg-zinc-50/90 border border-zinc-200 rounded-2xl p-6 sm:p-8 mt-2">
              <h3 className="font-heading font-extrabold text-base uppercase tracking-wider text-zinc-950 mb-5 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-zinc-950" /> Ficha Técnica y Componentes
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {Object.entries(product.specs).map(([key, value]) => (
                  <div key={key} className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-xs flex flex-col justify-between">
                    <span className="text-zinc-400 uppercase text-[11px] font-heading font-bold tracking-wider">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="font-bold text-zinc-900 mt-1 text-sm leading-snug">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Columna Derecha: Configuración de Variantes & Compra (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          {/* Header */}
          <div className="border-b border-zinc-100 pb-6 mb-6">
            <span className="text-xs font-heading font-bold uppercase tracking-widest text-zinc-400">
              {product.category}
            </span>
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-zinc-950 tracking-tight mt-1.5 leading-tight">
              {product.title}
            </h1>
            <p className="text-xs text-zinc-600 mt-2.5 leading-relaxed">{product.description}</p>
          </div>

          {/* Pricing & Promociones (Estilo Bertolina / Fusion) */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 mb-6 space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="font-heading font-black text-3xl sm:text-4xl text-zinc-950">
                  {formatCurrency(price)}
                </span>
                {activeVariant?.compare_at_price && activeVariant.compare_at_price > price && (
                  <span className="ml-2 text-sm text-zinc-400 line-through font-semibold">
                    {formatCurrency(activeVariant.compare_at_price)}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-heading font-bold text-zinc-500 uppercase">Factura A/B</span>
            </div>

            {/* Promociones de Pago */}
            <div className="pt-3 border-t border-zinc-200 space-y-2 text-xs">
              <div className="flex items-center justify-between text-emerald-800 bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-200 font-bold">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-600" /> Transferencia Bancaria (10% OFF):
                </span>
                <span className="font-heading font-black text-sm">{formatCurrency(transferPrice)}</span>
              </div>
              <div className="flex items-center justify-between text-zinc-700 bg-white p-2.5 rounded-lg border border-zinc-200 font-medium">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-zinc-500" /> 3 cuotas sin interés de:
                </span>
                <span className="font-heading font-bold text-zinc-950">{formatCurrency(installment3)}</span>
              </div>
              <div className="flex items-center justify-between text-zinc-700 bg-white p-2.5 rounded-lg border border-zinc-200 font-medium">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-zinc-500" /> 6 cuotas fijas de:
                </span>
                <span className="font-heading font-bold text-zinc-950">{formatCurrency(installment6)}</span>
              </div>
            </div>
          </div>

          {/* 1. Selector de Talles */}
          {availableSizes.length > 0 && (
            <div className="mb-5">
              <div className="flex justify-between items-center mb-2.5">
                <label className="font-heading text-xs font-extrabold uppercase tracking-wider text-zinc-800">
                  1. Talle de Cuadro: <span className="text-zinc-950 font-black">{selectedSize}</span>
                </label>
                <span className="text-xs font-semibold text-zinc-500 underline cursor-pointer hover:text-zinc-950">
                  Guía de talles
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {availableSizes.map((size) => {
                  const isSelected = selectedSize === size;
                  const variantForSize = variants.find((v) => v.size === size);
                  const isAvailable = variantForSize && variantForSize.stock > 0;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`py-3 rounded-xl text-xs font-heading font-bold border transition-all flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-zinc-950 text-white border-zinc-950 shadow-md ring-2 ring-zinc-950/20'
                          : isAvailable
                          ? 'bg-white text-zinc-900 border-zinc-300 hover:border-zinc-950'
                          : 'bg-zinc-100 text-zinc-400 border-zinc-200 line-through cursor-not-allowed'
                      }`}
                    >
                      <span className="text-sm font-black">{size}</span>
                      <span className={`text-[10px] font-normal mt-0.5 ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>
                        {isAvailable ? `${variantForSize?.stock} en stock` : 'Agotado'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Selector de Rodado */}
          {availableWheels.length > 0 && (
            <div className="mb-5">
              <label className="font-heading text-xs font-extrabold uppercase tracking-wider text-zinc-800 block mb-2">
                2. Rodado: <span className="text-zinc-950 font-black">{selectedWheel}</span>
              </label>
              <div className="flex gap-2">
                {availableWheels.map((wheel) => {
                  const isSelected = selectedWheel === wheel;
                  return (
                    <button
                      key={wheel}
                      type="button"
                      onClick={() => setSelectedWheel(wheel)}
                      className={`px-5 py-2.5 rounded-xl font-heading text-xs font-bold border transition-all ${
                        isSelected
                          ? 'bg-zinc-950 text-white border-zinc-950 shadow-sm'
                          : 'bg-white text-zinc-800 border-zinc-300 hover:border-zinc-950'
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
              <label className="font-heading text-xs font-extrabold uppercase tracking-wider text-zinc-800 block mb-2">
                3. Color / Acabado: <span className="text-zinc-950 font-black">{selectedColor}</span>
              </label>
              <div className="flex items-center gap-3">
                {availableColors.map((col) => {
                  const isSelected = selectedColor === col.name;
                  return (
                    <button
                      key={col.name}
                      type="button"
                      onClick={() => setSelectedColor(col.name)}
                      className={`p-1 rounded-full border-2 transition-all flex items-center justify-center ${
                        isSelected ? 'border-zinc-950 scale-110 shadow-md' : 'border-zinc-200 hover:border-zinc-400'
                      }`}
                      title={col.name}
                    >
                      <span className="w-7 h-7 rounded-full border border-zinc-200" style={{ backgroundColor: col.hex }} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stock & SKU */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-100">
            {activeVariant && activeVariant.stock > 0 ? (
              <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 text-xs font-heading font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Entrega Inmediata ({activeVariant.stock} disponibles)
              </div>
            ) : (
              <div className="flex items-center gap-2 text-rose-700 bg-rose-50 px-3.5 py-1.5 rounded-full border border-rose-200 text-xs font-heading font-bold">
                <AlertTriangle className="w-4 h-4" /> Sin stock en esta variante
              </div>
            )}
            <span className="text-[11px] font-heading font-semibold text-zinc-400">SKU: {activeVariant?.sku}</span>
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-3 mb-4">
            <div className="flex items-center border border-zinc-300 rounded-xl px-2">
              <button
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-2.5 py-3 text-zinc-500 hover:text-zinc-950 font-bold disabled:opacity-30"
              >
                -
              </button>
              <span className="px-3 font-heading font-bold text-sm">{quantity}</span>
              <button
                disabled={!activeVariant || quantity >= activeVariant.stock}
                onClick={() => setQuantity((q) => q + 1)}
                className="px-2.5 py-3 text-zinc-500 hover:text-zinc-950 font-bold disabled:opacity-30"
              >
                +
              </button>
            </div>

            <button
              disabled={!activeVariant || activeVariant.stock <= 0}
              onClick={handleAdd}
              className={`flex-1 py-4 px-6 rounded-xl font-heading font-black text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-md ${
                addedAnimation
                  ? 'bg-emerald-600 text-white'
                  : activeVariant && activeVariant.stock > 0
                  ? 'bg-zinc-950 text-white hover:bg-zinc-800 hover:scale-[1.01] active:scale-[0.99]'
                  : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
              }`}
            >
              {addedAnimation ? (
                <>
                  <Check className="w-4 h-4" /> ¡AGREGADO AL CARRITO!
                </>
              ) : (
                'AGREGAR AL CARRITO'
              )}
            </button>
          </div>

          {/* Botón WhatsApp de Consulta Directa */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#25D366]/10 hover:bg-[#25D366]/20 text-emerald-950 border border-[#25D366]/50 py-3.5 rounded-xl font-heading text-xs font-extrabold flex items-center justify-center gap-2 mb-6 transition-all"
          >
            <MessageCircle className="w-4 h-4 text-[#25D366]" />
            CONSULTAR POR WHATSAPP CON UN ASESOR
          </a>

          {/* Sellos de Confianza */}
          <div className="space-y-2.5 pt-4 border-t border-zinc-100 text-xs text-zinc-600">
            <div className="flex items-center gap-2.5">
              <Truck className="w-4 h-4 text-zinc-900 shrink-0" />
              <span>Envíos asegurados a todo el país vía Andreani o retiro en Oroño 1234.</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-zinc-900 shrink-0" />
              <span>Factura A o B emitida automáticamente por ARCA (AFIP).</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Wrench className="w-4 h-4 text-zinc-900 shrink-0" />
              <span>Primer service de calibración incluido sin cargo en nuestro taller.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
