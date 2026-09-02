'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ProductsService } from '@/lib/services/products.service';
import { OrdersService } from '@/lib/services/orders.service';
import { ArcaAfipService } from '@/lib/services/arca.service';
import { ALL_PRODUCTS_CATALOG } from '@/lib/data/bikes';
import { ProductVariant, Product } from '@/lib/supabase/types';
import {
  Search,
  Barcode,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  Receipt,
  CheckCircle,
  Printer,
  QrCode,
  User,
  Zap,
  Bike,
  Package,
  Wrench,
  Layers,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface CartItem {
  variant: ProductVariant & { product: Product };
  quantity: number;
}

export function PointOfSaleInterface() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(ProductVariant & { product: Product })[]>([]);
  const [activeCatalogCategory, setActiveCatalogCategory] = useState<'TODOS' | 'BICICLETAS' | 'COMPONENTES' | 'ACCESORIOS'>('TODOS');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Checkout & Facturación States
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pos_debit' | 'pos_credit' | 'transfer'>('cash');
  const [billingType, setBillingType] = useState<'FACTURA_B' | 'FACTURA_A' | 'TICKET_LOCAL'>('FACTURA_B');
  const [docType, setDocType] = useState<'DNI' | 'CUIT'>('DNI');
  const [docNumber, setDocNumber] = useState('0');
  const [customerName, setCustomerName] = useState('Consumidor Final');
  const [customerEmail, setCustomerEmail] = useState('pos@oronobike.com.ar');
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Status & Modal de Factura Emitida
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [issuedInvoice, setIssuedInvoice] = useState<any>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Búsqueda predictiva ultrarrápida en memoria y por código de barras
  useEffect(() => {
    const handleSearch = async () => {
      if (searchQuery.trim().length >= 1) {
        const results = await ProductsService.searchVariantsForPOS(searchQuery);
        setSearchResults(results);

        // Si es escaneo exacto de código de barras (ej. 11-13 dígitos) y hay 1 match exacto
        if (
          results.length === 1 &&
          (results[0].barcode === searchQuery.trim() || results[0].sku?.toLowerCase() === searchQuery.trim().toLowerCase())
        ) {
          addToCart(results[0]);
          setSearchQuery('');
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
      }
    };

    const timer = setTimeout(handleSearch, 100);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const addToCart = (variant: ProductVariant & { product: Product }) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.variant.id === variant.id);
      if (existing) {
        return prev.map((item) =>
          item.variant.id === variant.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { variant, quantity: 1 }];
    });
  };

  const updateQuantity = (variantId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.variant.id === variantId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (variantId: string) => {
    setCart((prev) => prev.filter((item) => item.variant.id !== variantId));
  };

  // Cálculos de Totales
  const subtotal = cart.reduce((acc, item) => acc + item.variant.price * item.quantity, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const total = subtotal - discountAmount;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleCheckoutAndInvoice = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    try {
      // 1. Crear Orden en POS
      const orderRes = await OrdersService.createOrder({
        channel: 'pos',
        customerName,
        customerEmail,
        customerPhone: '000000000',
        billingType: billingType as any,
        docType: docType as any,
        docNumber: docNumber || '0',
        shippingType: 'local_pickup',
        paymentMethod,
        paymentStatus: 'paid',
        subtotal,
        discount: discountAmount,
        total,
        items: cart.map((c) => ({
          productVariantId: c.variant.id,
          title: c.variant.product.title,
          variantDetails: `Talle ${c.variant.size} - Rodado ${c.variant.wheel_size || 'N/A'} - ${c.variant.color}`,
          quantity: c.quantity,
          unitPrice: c.variant.price,
        })),
      });

      if (!orderRes.success || !orderRes.order) {
        throw new Error(orderRes.error || 'Error creando orden POS');
      }

      // 2. Si no es simple ticket interno, emitir comprobante ARCA
      let arcaResult: any = null;
      if (billingType === 'FACTURA_A' || billingType === 'FACTURA_B') {
        arcaResult = await ArcaAfipService.emitInvoice({
          order: orderRes.order,
          tipoComprobante: billingType,
        });
      }

      setIssuedInvoice({
        order: orderRes.order,
        arca: arcaResult,
        items: cart,
        total,
      });

      // Limpiar carro
      setCart([]);
      setDiscountPercent(0);
    } catch (err: any) {
      alert(`Error al procesar venta POS: ${err?.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Productos de catálogo filtrados por categoría activa para selección rápida
  const catalogVariants = React.useMemo(() => {
    const list: (ProductVariant & { product: Product })[] = [];
    ALL_PRODUCTS_CATALOG.forEach((p) => {
      if (
        activeCatalogCategory === 'TODOS' ||
        (activeCatalogCategory === 'BICICLETAS' && (p.category === 'MTB' || p.category === 'RUTA' || p.category === 'GRAVEL' || p.category === 'BMX' || p.category === 'PASEO' || p.category === 'NIÑOS')) ||
        (activeCatalogCategory === 'COMPONENTES' && p.category === 'COMPONENTES') ||
        (activeCatalogCategory === 'ACCESORIOS' && p.category === 'ACCESORIOS')
      ) {
        p.variants.forEach((v) => {
          list.push({
            ...v,
            product: {
              id: p.id,
              title: p.title,
              slug: p.slug,
              brand: p.brand,
              category: p.category,
              description: p.description,
              specs: p.specs,
              images: p.images,
              is_active: p.is_active,
              created_at: p.created_at,
              updated_at: p.updated_at,
            },
          });
        });
      }
    });
    return list;
  }, [activeCatalogCategory]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-2 sm:p-4 bg-zinc-100 min-h-[750px] rounded-3xl">
      {/* Columna Izquierda: Búsqueda, Escaneo & Grid de Productos (7 Cols) */}
      <div className="lg:col-span-7 flex flex-col bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-xs">
        {/* Buscador / Scanner Bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 gap-2">
            <Barcode className="w-5 h-5 text-zinc-500" />
            <Search className="w-4 h-4 text-zinc-400" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Escanear código de barras o buscar por modelo, marca (Scott, Volta, Shimano), SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchResults.length > 0) {
                addToCart(searchResults[0]);
                setSearchQuery('');
                setSearchResults([]);
              }
            }}
            className="w-full pl-20 pr-4 py-3.5 bg-zinc-50 border-2 border-zinc-200 hover:border-zinc-400 rounded-2xl text-xs sm:text-sm font-medium text-zinc-900 focus:bg-white focus:border-zinc-950 focus:outline-none transition-all shadow-inner"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600 font-bold px-2 py-1 bg-zinc-200 rounded-md"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Resultados de Búsqueda Activa */}
        {searchQuery.trim().length > 0 ? (
          <div className="flex-1 overflow-y-auto mb-2 space-y-2 max-h-[500px] border border-zinc-200 rounded-2xl p-3 bg-zinc-50/50">
            <div className="text-[11px] font-heading font-bold uppercase text-zinc-500 mb-2 px-1">
              Resultados encontrados ({searchResults.length}):
            </div>
            {searchResults.length === 0 ? (
              <div className="text-center py-10 text-zinc-400 text-xs font-medium">
                No se encontraron artículos con "{searchQuery}". Verifica el código de barras o el nombre.
              </div>
            ) : (
              searchResults.map((variant) => (
                <div
                  key={`${variant.product_id}-${variant.id}`}
                  onClick={() => {
                    addToCart(variant);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="p-3 bg-white hover:bg-zinc-950 hover:text-white border border-zinc-200 rounded-xl flex items-center justify-between cursor-pointer transition-all shadow-xs group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={variant.product.images[0] || 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=400&q=80'}
                      alt={variant.product.title}
                      className="w-11 h-11 object-cover rounded-lg bg-zinc-100 border border-zinc-200 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-zinc-100 group-hover:bg-zinc-800 group-hover:text-zinc-200 text-[10px] font-heading font-black rounded uppercase text-zinc-700">
                          {variant.product.brand}
                        </span>
                        <h4 className="text-xs sm:text-sm font-heading font-bold leading-tight">
                          {variant.product.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-zinc-500 group-hover:text-zinc-300 font-mono mt-0.5">
                        Talle: <strong>{variant.size}</strong> • Color: {variant.color} • SKU: {variant.sku}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-2">
                    <span className="text-sm font-mono font-bold block">{formatCurrency(variant.price)}</span>
                    <span className="text-[10px] font-bold text-emerald-600 group-hover:text-emerald-300">
                      Stock: {variant.stock} u.
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Explorador Rápido por Categorías */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs de Categorías */}
            <div className="flex gap-2 mb-4 border-b border-zinc-200 pb-2">
              <button
                onClick={() => setActiveCatalogCategory('TODOS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all ${
                  activeCatalogCategory === 'TODOS'
                    ? 'bg-zinc-950 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setActiveCatalogCategory('BICICLETAS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                  activeCatalogCategory === 'BICICLETAS'
                    ? 'bg-zinc-950 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                <Bike className="w-3.5 h-3.5" /> Bicicletas
              </button>
              <button
                onClick={() => setActiveCatalogCategory('COMPONENTES')}
                className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                  activeCatalogCategory === 'COMPONENTES'
                    ? 'bg-zinc-950 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" /> Componentes
              </button>
              <button
                onClick={() => setActiveCatalogCategory('ACCESORIOS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                  activeCatalogCategory === 'ACCESORIOS'
                    ? 'bg-zinc-950 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                <Package className="w-3.5 h-3.5" /> Accesorios
              </button>
            </div>

            {/* Grid de Artículos del Catálogo */}
            <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[460px]">
              {catalogVariants.map((v) => (
                <div
                  key={`${v.product_id}-${v.id}`}
                  onClick={() => addToCart(v)}
                  className="p-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-2xl flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] active:scale-98"
                >
                  <div className="flex items-start gap-2.5 mb-2">
                    <img
                      src={v.product.images[0] || 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=400&q=80'}
                      alt={v.product.title}
                      className="w-10 h-10 object-cover rounded-lg bg-zinc-200 shrink-0"
                    />
                    <div>
                      <span className="text-[9px] font-heading font-black text-zinc-500 uppercase block">
                        {v.product.brand}
                      </span>
                      <h4 className="text-xs font-heading font-bold text-zinc-900 line-clamp-2 leading-tight">
                        {v.product.title}
                      </h4>
                    </div>
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono mb-2">
                    {v.size} • {v.color}
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-zinc-200/60">
                    <span className="font-mono font-bold text-xs text-zinc-950">
                      {formatCurrency(v.price)}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      +{v.stock}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Columna Derecha: Carrito, Medios de Pago & Facturación (5 Cols) */}
      <div className="lg:col-span-5 flex flex-col bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-xs justify-between">
        {/* Header del Ticket */}
        <div>
          <div className="flex justify-between items-center border-b border-zinc-200 pb-3 mb-4">
            <div>
              <h2 className="font-heading font-black text-base text-zinc-950">Ticket de Venta</h2>
              <span className="text-[11px] text-zinc-500 font-mono">Bv. Nicasio Oroño 1234</span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-xs text-rose-600 hover:text-rose-700 font-heading font-bold uppercase"
              >
                Vaciar
              </button>
            )}
          </div>

          {/* Items en Carrito */}
          <div className="max-h-[220px] overflow-y-auto space-y-2 mb-4 pr-1">
            {cart.length === 0 ? (
              <div className="text-center py-10 text-zinc-400 text-xs">
                No hay productos en el ticket actual.<br />
                Escanea un código de barras o haz clic en un producto.
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.variant.id}
                  className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center justify-between text-xs"
                >
                  <div className="flex-1 pr-2">
                    <strong className="text-zinc-900 block font-heading">{item.variant.product.title}</strong>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {item.variant.size} • {item.variant.color} • {formatCurrency(item.variant.price)} c/u
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-white border border-zinc-300 rounded-lg p-0.5">
                      <button
                        onClick={() => updateQuantity(item.variant.id, -1)}
                        className="w-5 h-5 flex items-center justify-center font-bold text-zinc-700 hover:bg-zinc-100 rounded"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-mono font-bold text-xs">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.variant.id, 1)}
                        className="w-5 h-5 flex items-center justify-center font-bold text-zinc-700 hover:bg-zinc-100 rounded"
                      >
                        +
                      </button>
                    </div>
                    <span className="font-mono font-bold w-20 text-right text-zinc-950">
                      {formatCurrency(item.variant.price * item.quantity)}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.variant.id)}
                      className="p-1 text-zinc-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sección de Pago, Facturación y Cierre */}
        <div className="border-t border-zinc-200 pt-4 space-y-3.5">
          {/* Tipo de Comprobante */}
          <div>
            <label className="block text-[10px] font-heading font-bold uppercase text-zinc-500 mb-1">
              Tipo de Emisión
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setBillingType('FACTURA_B')}
                className={`py-2 rounded-xl text-[11px] font-heading font-bold uppercase transition-all ${
                  billingType === 'FACTURA_B'
                    ? 'bg-zinc-950 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                Factura B
              </button>
              <button
                type="button"
                onClick={() => setBillingType('FACTURA_A')}
                className={`py-2 rounded-xl text-[11px] font-heading font-bold uppercase transition-all ${
                  billingType === 'FACTURA_A'
                    ? 'bg-zinc-950 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                Factura A
              </button>
              <button
                type="button"
                onClick={() => setBillingType('TICKET_LOCAL')}
                className={`py-2 rounded-xl text-[11px] font-heading font-bold uppercase transition-all ${
                  billingType === 'TICKET_LOCAL'
                    ? 'bg-zinc-950 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                Remito / Local
              </button>
            </div>
          </div>

          {/* Método de Pago */}
          <div>
            <label className="block text-[10px] font-heading font-bold uppercase text-zinc-500 mb-1">
              Medio de Cobro
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('cash');
                  setDiscountPercent(0);
                }}
                className={`py-2 rounded-xl text-[10px] font-heading font-bold uppercase transition-all ${
                  paymentMethod === 'cash'
                    ? 'bg-zinc-950 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                Efectivo
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('transfer');
                  setDiscountPercent(10);
                }}
                className={`py-2 rounded-xl text-[10px] font-heading font-bold uppercase transition-all ${
                  paymentMethod === 'transfer'
                    ? 'bg-emerald-600 text-white font-black'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                Transf (-10%)
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('pos_debit');
                  setDiscountPercent(0);
                }}
                className={`py-2 rounded-xl text-[10px] font-heading font-bold uppercase transition-all ${
                  paymentMethod === 'pos_debit'
                    ? 'bg-zinc-950 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                Débito
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('pos_credit');
                  setDiscountPercent(0);
                }}
                className={`py-2 rounded-xl text-[10px] font-heading font-bold uppercase transition-all ${
                  paymentMethod === 'pos_credit'
                    ? 'bg-zinc-950 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                3/6 Cuotas
              </button>
            </div>
          </div>

          {/* Totales y Botón Cobrar */}
          <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 space-y-1 text-xs">
            <div className="flex justify-between text-zinc-500 font-mono">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discountPercent > 0 && (
              <div className="flex justify-between text-emerald-600 font-mono font-bold">
                <span>Descuento ({discountPercent}%):</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-zinc-950 font-mono font-black text-lg pt-1 border-t border-zinc-200">
              <span>TOTAL:</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <button
            type="button"
            disabled={cart.length === 0 || isProcessing}
            onClick={handleCheckoutAndInvoice}
            className="w-full bg-zinc-950 hover:bg-zinc-800 disabled:opacity-30 text-white py-4 rounded-2xl font-heading text-xs font-black uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-98"
          >
            {isProcessing ? 'Emitiendo comprobante...' : (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-400" /> Cobrar {formatCurrency(total)}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal de Comprobante Emitido */}
      {issuedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-zinc-200 animate-fadeIn text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-heading font-black text-zinc-950 mb-1">
              ¡Venta Registrada Exitosamente!
            </h3>
            <p className="text-xs text-zinc-500 mb-4 font-mono">
              Comprobante #{issuedInvoice.order?.order_number || '0001-0004522'}
            </p>

            <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 text-left text-xs space-y-1.5 mb-6">
              <div className="flex justify-between">
                <span className="text-zinc-500">Monto Cobrado:</span>
                <strong className="font-mono text-zinc-950">{formatCurrency(issuedInvoice.total)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Medio de Pago:</span>
                <span className="font-bold text-zinc-800 uppercase">{paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Tipo Comprobante:</span>
                <span className="font-bold text-zinc-800">{billingType}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIssuedInvoice(null)}
                className="flex-1 py-3 border border-zinc-300 rounded-xl text-xs font-heading font-bold uppercase text-zinc-700 hover:bg-zinc-50"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 bg-zinc-950 text-white py-3 rounded-xl text-xs font-heading font-bold uppercase tracking-wider hover:bg-zinc-800 flex items-center justify-center gap-1.5 shadow-md"
              >
                <Printer className="w-4 h-4" /> Imprimir Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
