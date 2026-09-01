'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ProductsService } from '@/lib/services/products.service';
import { OrdersService } from '@/lib/services/orders.service';
import { ArcaAfipService } from '@/lib/services/arca.service';
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
} from 'lucide-react';

interface CartItem {
  variant: ProductVariant & { product: Product };
  quantity: number;
}

export function PointOfSaleInterface() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(ProductVariant & { product: Product })[]>([]);
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

  // Búsqueda predictiva o escaneo de código de barras
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        const results = await ProductsService.searchVariantsForPOS(searchQuery);
        setSearchResults(results);

        // Si es escaneo exacto de código de barras (ej. 12-13 dígitos) y hay 1 match exacto
        if (results.length === 1 && (results[0].barcode === searchQuery.trim() || results[0].sku === searchQuery.trim())) {
          addToCart(results[0]);
          setSearchQuery('');
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
      }
    }, 250);

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-100px)] p-6 bg-zinc-100">
      {/* Columna Izquierda: Búsqueda, Escaneo & Grid de Productos (7 Cols) */}
      <div className="lg:col-span-7 flex flex-col bg-white border border-zinc-200 rounded-lg p-5 shadow-sm">
        {/* Buscador / Scanner Bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
            <Barcode className="w-5 h-5 mr-2" />
            <Search className="w-4 h-4" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Escanear código de barras o buscar por modelo, marca, SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-16 pr-4 py-3 bg-zinc-50 border border-zinc-300 rounded-md text-sm font-medium text-zinc-900 focus:bg-white focus:border-zinc-950 focus:outline-none transition-all"
            autoFocus
          />
        </div>

        {/* Resultados de Búsqueda Flotantes / Lista */}
        {searchResults.length > 0 && (
          <div className="mb-4 max-h-64 overflow-y-auto border border-zinc-200 rounded-md divide-y divide-zinc-100 bg-white shadow-md">
            {searchResults.map((variant) => (
              <div
                key={variant.id}
                onClick={() => {
                  addToCart(variant);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="p-3 hover:bg-zinc-50 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div>
                  <h4 className="text-sm font-semibold text-zinc-950">{variant.product?.title}</h4>
                  <p className="text-xs text-zinc-500 font-mono">
                    Talle: {variant.size} | Rodado: {variant.wheel_size || '-'} | Color: {variant.color} | SKU: {variant.sku}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold font-mono text-zinc-950">{formatCurrency(variant.price)}</span>
                  <span className="block text-[11px] text-emerald-600 font-semibold">Stock: {variant.stock}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Atajos Rápidos / Productos Frecuentes del Taller y Local */}
        <div className="flex-1 overflow-y-auto">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Accesos Directos Mostrador</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { title: 'Cámara Kenda 29x2.10 Valv. Presta', sku: 'ACC-CAM-29', price: 9500 },
              { title: 'Sellante Stan’s NoTubes 500ml', sku: 'ACC-TUB-500', price: 28500 },
              { title: 'Lubricante Cadena Squirt Lube 120ml', sku: 'ACC-LUB-120', price: 18000 },
              { title: 'Pastillas Freno Shimano B05S Resina', sku: 'ACC-SHI-B05S', price: 14000 },
              { title: 'Cadena Shimano Deore 12v M6100', sku: 'REP-SHI-CNM6100', price: 42000 },
              { title: 'Service Mecánico Express Taller', sku: 'SRV-EXP-01', price: 25000 },
            ].map((quickItem, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  addToCart({
                    id: `quick-${idx}`,
                    product_id: `prod-${idx}`,
                    sku: quickItem.sku,
                    barcode: null,
                    size: 'Único',
                    wheel_size: '29"',
                    color: 'Estándar',
                    color_hex: '#000000',
                    price: quickItem.price,
                    compare_at_price: null,
                    stock: 99,
                    min_stock_alert: 2,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    product: {
                      id: `prod-${idx}`,
                      title: quickItem.title,
                      slug: 'quick-item',
                      brand: 'Oroño Bike',
                      category: 'Accesorios',
                      description: '',
                      specs: {},
                      images: [],
                      is_active: true,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    },
                  });
                }}
                className="p-3 border border-zinc-200 hover:border-zinc-950 rounded-md text-left bg-zinc-50/50 hover:bg-white transition-all flex flex-col justify-between"
              >
                <span className="text-xs font-semibold text-zinc-900 line-clamp-2">{quickItem.title}</span>
                <span className="text-xs font-bold font-mono text-zinc-950 mt-2">{formatCurrency(quickItem.price)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Columna Derecha: Ticket, Datos Fiscales ARCA & Cobro (5 Cols) */}
      <div className="lg:col-span-5 flex flex-col bg-white border border-zinc-200 rounded-lg p-5 shadow-sm justify-between">
        {/* Ticket Header & Items */}
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="flex justify-between items-center pb-3 border-b border-zinc-200 mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950 flex items-center gap-2">
              <Receipt className="w-4 h-4" /> Detalle de Venta
            </h2>
            <span className="text-xs font-mono text-zinc-500">{cart.length} ítems</span>
          </div>

          {cart.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-zinc-400 text-xs">
              <Barcode className="w-8 h-8 mb-2 opacity-40" />
              Escanee un producto para iniciar el ticket
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.variant.id} className="flex justify-between items-start text-xs border-b border-zinc-100 pb-2">
                  <div className="flex-1 pr-2">
                    <h5 className="font-semibold text-zinc-900">{item.variant.product?.title}</h5>
                    <p className="text-[11px] text-zinc-500 font-mono">
                      {item.variant.size} - {item.variant.color} ({formatCurrency(item.variant.price)})
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-zinc-200 rounded">
                      <button
                        onClick={() => updateQuantity(item.variant.id, -1)}
                        className="px-1.5 py-0.5 text-zinc-600 hover:bg-zinc-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 font-mono font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.variant.id, 1)}
                        className="px-1.5 py-0.5 text-zinc-600 hover:bg-zinc-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="font-mono font-bold text-zinc-950 w-20 text-right">
                      {formatCurrency(item.variant.price * item.quantity)}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.variant.id)}
                      className="text-zinc-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sección de Datos Fiscales ARCA & Métodos de Pago */}
        <div className="border-t border-zinc-200 pt-4 mt-4 space-y-3">
          {/* Tipo de Comprobante Fiscal */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'FACTURA_B', label: 'Factura B' },
              { id: 'FACTURA_A', label: 'Factura A' },
              { id: 'TICKET_LOCAL', label: 'Ticket Local' },
            ].map((cbte) => (
              <button
                key={cbte.id}
                type="button"
                onClick={() => {
                  setBillingType(cbte.id as any);
                  if (cbte.id === 'FACTURA_A') {
                    setDocType('CUIT');
                  }
                }}
                className={`py-1.5 text-xs font-semibold rounded border transition-all ${
                  billingType === cbte.id
                    ? 'bg-zinc-950 text-white border-zinc-950'
                    : 'bg-zinc-50 text-zinc-700 border-zinc-300 hover:border-zinc-900'
                }`}
              >
                {cbte.label}
              </button>
            ))}
          </div>

          {/* Formulario Cliente / CUIT si es Factura A */}
          {billingType === 'FACTURA_A' && (
            <div className="grid grid-cols-2 gap-2 bg-zinc-50 p-2.5 rounded border border-zinc-200 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-zinc-700 block mb-0.5">CUIT Cliente *</label>
                <input
                  type="text"
                  placeholder="30-xxxxxxxx-x"
                  value={docNumber === '0' ? '' : docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  className="w-full border border-zinc-300 rounded px-2 py-1 bg-white focus:outline-none focus:border-zinc-950 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-700 block mb-0.5">Razón Social</label>
                <input
                  type="text"
                  placeholder="Empresa S.A."
                  value={customerName === 'Consumidor Final' ? '' : customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full border border-zinc-300 rounded px-2 py-1 bg-white focus:outline-none focus:border-zinc-950"
                />
              </div>
            </div>
          )}

          {/* Métodos de Pago */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: 'cash', label: 'Efectivo', icon: Banknote },
              { id: 'pos_debit', label: 'Débito', icon: CreditCard },
              { id: 'pos_credit', label: 'Crédito', icon: CreditCard },
              { id: 'transfer', label: 'Transf.', icon: User },
            ].map((pm) => {
              const Icon = pm.icon;
              return (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setPaymentMethod(pm.id as any)}
                  className={`py-2 px-1 text-[11px] font-medium rounded border flex flex-col items-center gap-1 transition-all ${
                    paymentMethod === pm.id
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {pm.label}
                </button>
              );
            })}
          </div>

          {/* Totales & Botón de Cobro Inmediato */}
          <div className="bg-zinc-900 text-white p-4 rounded-md mt-2">
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Subtotal:</span>
              <span className="font-mono">{formatCurrency(subtotal)}</span>
            </div>
            {discountPercent > 0 && (
              <div className="flex justify-between text-xs text-amber-400 mb-1">
                <span>Descuento ({discountPercent}%):</span>
                <span className="font-mono">-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-zinc-800">
              <span>TOTAL:</span>
              <span className="font-mono text-xl">{formatCurrency(total)}</span>
            </div>

            <button
              type="button"
              disabled={cart.length === 0 || isProcessing}
              onClick={handleCheckoutAndInvoice}
              className="w-full mt-3 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold py-3 rounded text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                'Emitiendo Comprobante ARCA...'
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" /> Cobrar y Emitir Factura
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal / Pop-up de Comprobante Emitido */}
      {issuedInvoice && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border border-zinc-300">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-zinc-950">¡Venta Registrada Exitosamente!</h3>
              <p className="text-xs text-zinc-500">Orden: {issuedInvoice.order.order_number}</p>
            </div>

            {issuedInvoice.arca?.cae && (
              <div className="bg-zinc-50 border border-zinc-200 rounded p-3 text-xs space-y-1.5 mb-4">
                <div className="flex justify-between font-mono">
                  <span className="text-zinc-500">Comprobante:</span>
                  <span className="font-bold text-zinc-900">
                    {billingType} N° 0001-{String(issuedInvoice.arca.cbteNro).padStart(8, '0')}
                  </span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-zinc-500">CAE:</span>
                  <span className="font-bold text-zinc-900">{issuedInvoice.arca.cae}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-zinc-500">Vto. CAE:</span>
                  <span className="text-zinc-900">{issuedInvoice.arca.caeVto}</span>
                </div>
                <div className="pt-2 flex justify-center">
                  <QrCode className="w-20 h-20 text-zinc-800" />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 bg-zinc-950 text-white py-2.5 rounded text-xs font-semibold flex items-center justify-center gap-2 hover:bg-zinc-800"
              >
                <Printer className="w-4 h-4" /> Imprimir Ticket
              </button>
              <button
                type="button"
                onClick={() => setIssuedInvoice(null)}
                className="px-4 border border-zinc-300 rounded text-xs font-medium text-zinc-700 hover:border-zinc-950"
              >
                Nueva Venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
