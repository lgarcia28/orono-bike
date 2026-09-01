'use client';

import React from 'react';
import { ProductWithVariants } from '@/lib/supabase/types';
import { ChevronRight, CreditCard, Zap, Check } from 'lucide-react';

interface ProductCardProps {
  product: ProductWithVariants;
  onSelect: (product: ProductWithVariants) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  const minPrice = Math.min(...product.variants.map((v) => v.price));
  const maxPrice = Math.max(...product.variants.map((v) => v.price));
  const totalStock = product.variants.reduce((acc, v) => acc + v.stock, 0);

  const transferPrice = minPrice * 0.9; // 10% OFF
  const installment3 = minPrice / 3;

  const sizes = Array.from(new Set(product.variants.map((v) => v.size)));

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div
      onClick={() => onSelect(product)}
      className="group relative bg-white border border-zinc-200 hover:border-zinc-950 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer flex flex-col justify-between"
    >
      {/* Top Floating Promo Badges */}
      <div className="absolute top-3.5 left-3.5 right-3.5 z-10 flex justify-between items-start pointer-events-none">
        <span className="bg-zinc-950 text-white text-[11px] font-heading font-black px-3 py-1 rounded-md tracking-wider uppercase shadow-sm">
          {product.brand}
        </span>
        {totalStock > 0 ? (
          <span className="bg-emerald-600 text-white text-[10px] font-heading font-bold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            EN STOCK
          </span>
        ) : (
          <span className="bg-zinc-200 text-zinc-700 text-[10px] font-heading font-bold px-2 py-0.5 rounded-md">
            BAJO PEDIDO
          </span>
        )}
      </div>

      {/* High-Resolution Clean Image */}
      <div className="relative aspect-16/11 bg-zinc-50/70 p-6 flex items-center justify-center overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.title}
          className="w-full h-full object-contain group-hover:scale-106 transition-transform duration-500 ease-out"
        />
      </div>

      {/* Card Info */}
      <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between bg-white border-t border-zinc-100">
        <div>
          <span className="text-[11px] font-heading font-bold uppercase tracking-wider text-zinc-400 block mb-1">
            {product.category}
          </span>

          <h3 className="font-heading font-extrabold text-base text-zinc-950 group-hover:text-zinc-700 transition-colors line-clamp-2 leading-snug">
            {product.title}
          </h3>

          {/* Quick Specs Highlight (Grupos y Peso) */}
          {product.specs && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {product.specs.transmision && (
                <span className="bg-zinc-100 text-zinc-700 text-[10px] font-medium px-2 py-0.5 rounded">
                  {product.specs.transmision.split(' ')[0]} {product.specs.transmision.split(' ')[1] || ''}
                </span>
              )}
              {product.specs.peso && (
                <span className="bg-zinc-100 text-zinc-700 text-[10px] font-medium px-2 py-0.5 rounded">
                  {product.specs.peso}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Pricing Breakdown (Estilo Bertolina / Fusion Bikes) */}
        <div className="mt-5 pt-4 border-t border-zinc-100 space-y-2">
          {/* Main Price */}
          <div className="flex items-baseline gap-2">
            <span className="font-heading font-black text-xl text-zinc-950">
              {formatCurrency(minPrice)}
            </span>
            {minPrice !== maxPrice && (
              <span className="text-xs text-zinc-400 font-medium">hasta {formatCurrency(maxPrice)}</span>
            )}
          </div>

          {/* Promos Box */}
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
              <Zap className="w-3 h-3 shrink-0" />
              <span>{formatCurrency(transferPrice)} con Transferencia (10% OFF)</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-600 text-[11px]">
              <CreditCard className="w-3 h-3 shrink-0 text-zinc-400" />
              <span>3 cuotas sin interés de <strong>{formatCurrency(installment3)}</strong></span>
            </div>
          </div>

          {/* Talles & CTA Button */}
          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] font-heading font-bold text-zinc-500 uppercase tracking-wider">
              Talles: {sizes.join(' · ')}
            </span>

            <span className="text-xs font-heading font-extrabold text-zinc-950 group-hover:translate-x-1 transition-transform flex items-center gap-1">
              Ver Detalle <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
