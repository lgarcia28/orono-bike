'use client';

import React from 'react';
import { X, Trash2, ArrowRight, ShieldCheck } from 'lucide-react';
import { ProductVariant, Product } from '@/lib/supabase/types';

export interface CartDrawerItem {
  variant: ProductVariant & { product: Product };
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartDrawerItem[];
  onRemoveItem: (variantId: string) => void;
  onCheckout: () => void;
}

export function CartDrawer({ isOpen, onClose, items, onRemoveItem, onCheckout }: CartDrawerProps) {
  if (!isOpen) return null;

  const total = items.reduce((acc, item) => acc + item.variant.price * item.quantity, 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-zinc-200 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-5 border-b border-zinc-200 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950">
              Carrito de Compras ({items.length})
            </h2>
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-950 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Items */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 text-xs text-center">
                <p className="mb-4">Tu carrito está vacío.</p>
                <button
                  onClick={onClose}
                  className="bg-zinc-950 text-white px-4 py-2 rounded text-xs font-semibold hover:bg-zinc-800"
                >
                  Explorar Catálogo
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.variant.id} className="flex gap-4 border-b border-zinc-100 pb-4">
                  <div className="w-16 h-16 bg-zinc-100 rounded border border-zinc-200 overflow-hidden shrink-0">
                    <img
                      src={item.variant.product.images[0] || 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=300&q=80'}
                      alt={item.variant.product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-zinc-950 truncate">{item.variant.product.title}</h4>
                    <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                      Talle {item.variant.size} | Rodado {item.variant.wheel_size || '-'} | {item.variant.color}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs font-mono font-bold text-zinc-950">
                        {item.quantity} x {formatCurrency(item.variant.price)}
                      </span>
                      <button
                        onClick={() => onRemoveItem(item.variant.id)}
                        className="text-zinc-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout */}
          {items.length > 0 && (
            <div className="p-5 border-t border-zinc-200 bg-zinc-50">
              <div className="flex justify-between text-sm font-bold text-zinc-950 mb-1">
                <span>Subtotal Estimado:</span>
                <span className="font-mono">{formatCurrency(total)}</span>
              </div>
              <p className="text-[11px] text-zinc-500 mb-4">
                Impuestos y cálculo de envío Andreani calculados en el checkout.
              </p>

              <button
                onClick={onCheckout}
                className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-semibold py-3.5 rounded-md text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                Iniciar Checkout Seguro <ArrowRight className="w-4 h-4" />
              </button>

              <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-700" />
                <span>Facturación oficial ARCA (A/B) y garantía directa.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
