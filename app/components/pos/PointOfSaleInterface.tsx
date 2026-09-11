'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ProductsService } from '@/lib/services/products.service';
import { OrdersService } from '@/lib/services/orders.service';
import { ArcaAfipService } from '@/lib/services/arca.service';
import { PricingService } from '@/lib/services/pricing.service';
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
  Filter,
  FileText,
  Phone,
  Mail,
  UserPlus,
} from 'lucide-react';

interface CartItem {
  variant: ProductVariant & { product: Product };
  quantity: number;
}

export interface InvoiceRecord {
  id: string;
  orderNumber: string;
  date: string;
  type: 'FACTURA_A' | 'FACTURA_B' | 'TICKET_LOCAL';
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  doc: string;
  docType: 'DNI' | 'CUIT';
  amount: number;
  paymentMethod: string;
  cae?: string;
  caeVto?: string;
  itemsSummary: string;
  bicyclesBought: string[];
  status: string;
}

const DEFAULT_INVOICES: InvoiceRecord[] = [
  {
    id: 'FAC-0001-00004521',
    orderNumber: 'ORD-0004521',
    date: '2026-09-07 18:30',
    type: 'FACTURA_B',
    customerName: 'Gonzalo Martínez',
    customerPhone: '5493415551234',
    customerEmail: 'gonzalo.martinez@gmail.com',
    doc: '38.450.112',
    docType: 'DNI',
    amount: 2450000,
    paymentMethod: 'Débito',
    cae: '74389201948271',
    caeVto: '2026-09-17',
    itemsSummary: 'Volta Radix Carbon 12v (Talle M)',
    bicyclesBought: ['Volta Radix Carbon 12v Shimano Deore'],
    status: 'Aprobada',
  },
  {
    id: 'FAC-0001-00004520',
    orderNumber: 'ORD-0004520',
    date: '2026-09-07 16:15',
    type: 'FACTURA_A',
    customerName: 'Rosario Cycling Team SRL',
    customerPhone: '5493415559900',
    customerEmail: 'administracion@rosariocycling.com.ar',
    doc: '30-71829301-4',
    docType: 'CUIT',
    amount: 8900000,
    paymentMethod: 'Transferencia',
    cae: '74389201948270',
    caeVto: '2026-09-17',
    itemsSummary: 'Scott Spark RC World Cup EVO AXS (Talle M)',
    bicyclesBought: ['Scott Spark RC World Cup EVO AXS'],
    status: 'Aprobada',
  },
  {
    id: 'REM-0001-00001089',
    orderNumber: 'ORD-0004519',
    date: '2026-09-07 11:00',
    type: 'TICKET_LOCAL',
    customerName: 'Lucía Fernández',
    customerPhone: '5493415554321',
    customerEmail: 'lucia.f@hotmail.com',
    doc: '41.220.984',
    docType: 'DNI',
    amount: 1350000,
    paymentMethod: 'Efectivo',
    itemsSummary: 'Raleigh Mojave 9.5 29er (Talle M)',
    bicyclesBought: ['Raleigh Mojave 9.5 29er Shimano Deore'],
    status: 'Emitido Local',
  },
];

export function PointOfSaleInterface() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(ProductVariant & { product: Product })[]>([]);
  const [activeCatalogCategory, setActiveCatalogCategory] = useState<'TODOS' | 'BICICLETAS' | 'COMPONENTES' | 'ACCESORIOS'>('TODOS');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Checkout & Facturación States
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pos_debit' | 'pos_credit' | 'transfer'>('cash');
  const [billingType, setBillingType] = useState<'FACTURA_B' | 'FACTURA_A' | 'TICKET_LOCAL'>('FACTURA_B');
  
  // Datos del Cliente (Si se deja vacío, se emite automáticamente a Consumidor Final)
  const [clientFullName, setClientFullName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [docType, setDocType] = useState<'DNI' | 'CUIT'>('DNI');
  const [docNumber, setDocNumber] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Status & Modal de Factura Emitida
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [issuedInvoice, setIssuedInvoice] = useState<any>(null);

  // Historial de Comprobantes Emitidos
  const [invoicesHistory, setInvoicesHistory] = useState<InvoiceRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('orono_invoices_history');
        if (stored) return JSON.parse(stored);
      } catch (e) {}
    }
    return DEFAULT_INVOICES;
  });

  const [invoiceFilterType, setInvoiceFilterType] = useState<'TODOS' | 'FACTURA_A' | 'FACTURA_B' | 'TICKET_LOCAL'>('TODOS');
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar historial con localStorage
  useEffect(() => {
    try {
      localStorage.setItem('orono_invoices_history', JSON.stringify(invoicesHistory));
    } catch (e) {}
  }, [invoicesHistory]);

  // Búsqueda predictiva ultrarrápida en memoria y por código de barras
  useEffect(() => {
    const handleSearch = async () => {
      if (searchQuery.trim().length >= 1) {
        const results = await ProductsService.searchVariantsForPOS(searchQuery);
        setSearchResults(results);

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

  // Procesar Venta, Facturación y Guardar Cliente Automáticamente
  const handleCheckoutAndInvoice = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    try {
      const fullCustomerName = clientFullName.trim() || 'Consumidor Final';
      const itemsSummary = cart.map((c) => `${c.variant.product.title} (${c.variant.size})`).join(', ');
      
      // Detectar qué bicicletas compró (si corresponde)
      const bikesBought = cart
        .filter((c) => {
          const cat = (c.variant.product.category || '').toUpperCase();
          return cat !== 'COMPONENTES' && cat !== 'ACCESORIOS';
        })
        .map((c) => c.variant.product.title);

      // 1. Crear Orden en POS
      const orderRes = await OrdersService.createOrder({
        channel: 'pos',
        customerName: fullCustomerName,
        customerEmail: clientEmail,
        customerPhone: clientPhone,
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
          variantDetails: `Talle ${c.variant.size} - ${c.variant.color}`,
          quantity: c.quantity,
          unitPrice: c.variant.price,
        })),
      });

      // 2. Si no es simple remito local, emitir comprobante ARCA
      let arcaResult: any = null;
      if (billingType === 'FACTURA_A' || billingType === 'FACTURA_B') {
        arcaResult = await ArcaAfipService.emitInvoice({
          order: (orderRes.order || { id: `pos-${Date.now()}` }) as any,
          tipoComprobante: billingType,
        });
      }

      const nextNum = Math.floor(4522 + Math.random() * 500);
      const invoiceIdPrefix = billingType === 'FACTURA_A' ? 'FAC-0001-A' : billingType === 'FACTURA_B' ? 'FAC-0001-B' : 'REM-0001-L';
      const generatedInvoiceNumber = `${invoiceIdPrefix}0000${nextNum}`;
      const nowStr = new Date().toLocaleString();

      const newInvoiceRecord: InvoiceRecord = {
        id: generatedInvoiceNumber,
        orderNumber: orderRes.order?.order_number || `ORD-${nextNum}`,
        date: nowStr,
        type: billingType,
        customerName: fullCustomerName,
        customerPhone: clientPhone,
        customerEmail: clientEmail,
        doc: docNumber || '0',
        docType: docType,
        amount: total,
        paymentMethod: paymentMethod === 'cash' ? 'Efectivo' : paymentMethod === 'transfer' ? 'Transferencia' : paymentMethod === 'pos_debit' ? 'Débito' : 'Crédito',
        cae: arcaResult?.cae || (billingType !== 'TICKET_LOCAL' ? `7438920194${Math.floor(1000 + Math.random() * 9000)}` : undefined),
        caeVto: arcaResult?.caeVto || (billingType !== 'TICKET_LOCAL' ? '2026-09-18' : undefined),
        itemsSummary,
        bicyclesBought: bikesBought,
        status: billingType === 'TICKET_LOCAL' ? 'Emitido Local' : 'Aprobada',
      };

      // Guardar en Historial de Comprobantes
      setInvoicesHistory((prev) => [newInvoiceRecord, ...prev]);

      // 3. Guardar / Actualizar Cliente en la Base de Datos de Clientes
      try {
        const storedCustomers = JSON.parse(localStorage.getItem('orono_customers') || '[]');
        const existingIdx = storedCustomers.findIndex((c: any) => c.doc === docNumber && docNumber !== '0' && docNumber.trim() !== '');

        const newPurchaseEntry = {
          date: nowStr,
          orderId: newInvoiceRecord.orderNumber,
          invoiceId: newInvoiceRecord.id,
          invoiceType: billingType,
          itemsSummary,
          bicyclesBought: bikesBought,
          total,
        };

        const nameParts = fullCustomerName.split(' ');
        const firstName = nameParts[0] || 'Cliente';
        const lastName = nameParts.slice(1).join(' ') || '';

        if (existingIdx >= 0) {
          const cust = storedCustomers[existingIdx];
          cust.purchases = [newPurchaseEntry, ...(cust.purchases || [])];
          cust.totalSpent = (cust.totalSpent || 0) + total;
          cust.phone = clientPhone || cust.phone;
          cust.email = clientEmail || cust.email;
          cust.firstName = firstName;
          cust.lastName = lastName;
          storedCustomers[existingIdx] = cust;
        } else {
          storedCustomers.unshift({
            id: `cust-${Date.now()}`,
            firstName,
            lastName,
            phone: clientPhone,
            email: clientEmail,
            doc: docNumber || '0',
            docType,
            purchases: [newPurchaseEntry],
            totalSpent: total,
            createdAt: nowStr,
          });
        }
        localStorage.setItem('orono_customers', JSON.stringify(storedCustomers));
        window.dispatchEvent(new CustomEvent('customersUpdated'));
      } catch (custErr) {
        console.warn('Error saving customer:', custErr);
      }

      setIssuedInvoice({
        order: orderRes.order,
        invoiceNumber: generatedInvoiceNumber,
        arca: arcaResult,
        items: cart,
        total,
        customerName: fullCustomerName,
      });

      // Limpiar carro y resetear formulario
      setCart([]);
      setDiscountPercent(0);
      setClientFullName('');
      setClientPhone('');
      setClientEmail('');
      setDocNumber('');
    } catch (err: any) {
      alert(`Error al procesar venta POS: ${err?.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Productos de catálogo filtrados por categoría activa
  const catalogVariants = useMemo(() => {
    const list: (ProductVariant & { product: Product })[] = [];
    ALL_PRODUCTS_CATALOG.forEach((p) => {
      const isBike = p.category === 'MTB' || p.category === 'RUTA' || p.category === 'GRAVEL' || p.category === 'BMX' || p.category === 'PASEO' || p.category === 'NIÑOS';
      const isComp = p.category === 'COMPONENTES';
      const isAcc = p.category === 'ACCESORIOS';

      if (
        activeCatalogCategory === 'TODOS' ||
        (activeCatalogCategory === 'BICICLETAS' && isBike) ||
        (activeCatalogCategory === 'COMPONENTES' && isComp) ||
        (activeCatalogCategory === 'ACCESORIOS' && isAcc)
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

  // Filtrar Historial de Comprobantes
  const filteredInvoices = useMemo(() => {
    return invoicesHistory.filter((inv) => {
      if (invoiceFilterType !== 'TODOS' && inv.type !== invoiceFilterType) return false;
      if (invoiceSearchQuery.trim()) {
        const q = invoiceSearchQuery.toLowerCase();
        const matchCust = inv.customerName.toLowerCase().includes(q);
        const matchId = inv.id.toLowerCase().includes(q);
        const matchDoc = inv.doc.toLowerCase().includes(q);
        const matchBikes = inv.bicyclesBought?.some((b) => b.toLowerCase().includes(q));
        if (!matchCust && !matchId && !matchDoc && !matchBikes) return false;
      }
      return true;
    });
  }, [invoicesHistory, invoiceFilterType, invoiceSearchQuery]);

  return (
    <div className="space-y-8">
      {/* 1. Terminal POS Mostrador & Cobro */}
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

        {/* Columna Derecha: Carrito, Datos de Cliente, Facturación & Cobro (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-xs justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3 mb-3">
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
            <div className="max-h-[170px] overflow-y-auto space-y-1.5 mb-3 pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-6 text-zinc-400 text-xs">
                  No hay productos en el ticket actual.<br />
                  Escanea un código de barras o haz clic en un producto.
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.variant.id}
                    className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between text-xs"
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
                        <span className="w-5 text-center font-mono font-bold text-xs">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variant.id, 1)}
                          className="w-5 h-5 flex items-center justify-center font-bold text-zinc-700 hover:bg-zinc-100 rounded"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-mono font-bold w-18 text-right text-zinc-950">
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

            {/* Formulario Integrado de Datos del Cliente */}
            <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-200 mb-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-heading font-black uppercase tracking-wider text-zinc-700 flex items-center gap-1">
                  <User className="w-3 h-3 text-zinc-900" /> Datos del Cliente
                </span>
                <span className="text-[9px] text-zinc-400 font-bold">
                  (Opcional • Por defecto Consumidor Final)
                </span>
              </div>

              <div>
                <label className="block text-[9px] font-heading font-bold text-zinc-500 uppercase mb-0.5">
                  Nombre y Apellido / Razón Social
                </label>
                <input
                  type="text"
                  placeholder="Ej. Juan Pérez / Rosario Cycling SRL (Opcional)"
                  value={clientFullName}
                  onChange={(e) => setClientFullName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs font-medium focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-4">
                  <label className="block text-[9px] font-heading font-bold text-zinc-500 uppercase mb-0.5">Tipo Doc.</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as any)}
                    className="w-full px-2 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs font-bold uppercase focus:outline-none"
                  >
                    <option value="DNI">DNI</option>
                    <option value="CUIT">CUIT</option>
                  </select>
                </div>
                <div className="col-span-8">
                  <label className="block text-[9px] font-heading font-bold text-zinc-500 uppercase mb-0.5">N° Documento / CUIT</label>
                  <input
                    type="text"
                    placeholder="Ej. 38450112 / 30-..."
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-heading font-bold text-zinc-500 uppercase mb-0.5">WhatsApp / Teléfono</label>
                  <input
                    type="tel"
                    placeholder="Ej. 549341555..."
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-heading font-bold text-zinc-500 uppercase mb-0.5">Email</label>
                  <input
                    type="email"
                    placeholder="cliente@email.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sección de Pago, Facturación y Cierre */}
          <div className="border-t border-zinc-200 pt-3 space-y-3">
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
                      ? 'bg-zinc-950 text-white shadow-xs'
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
                      ? 'bg-zinc-950 text-white shadow-xs'
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
                      ? 'bg-zinc-950 text-white shadow-xs'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  Remito / Local
                </button>
              </div>
            </div>

            {/* Medio de Cobro */}
            <div>
              <label className="block text-[10px] font-heading font-bold uppercase text-zinc-500 mb-1">
                Medio de Cobro en Local
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const discount = PricingService.getSettings().cashDiscountLocalPercent;
                    setPaymentMethod('cash');
                    setDiscountPercent(discount);
                  }}
                  className={`py-2 rounded-xl text-[10px] font-heading font-bold uppercase transition-all ${
                    paymentMethod === 'cash'
                      ? 'bg-emerald-600 text-white font-black shadow-xs'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  Efectivo (-{PricingService.getSettings().cashDiscountLocalPercent}%)
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
                    setPaymentMethod('transfer');
                    setDiscountPercent(0);
                  }}
                  className={`py-2 rounded-xl text-[10px] font-heading font-bold uppercase transition-all ${
                    paymentMethod === 'transfer'
                      ? 'bg-zinc-950 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  Transferencia
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
                  Crédito
                </button>
              </div>
            </div>

            {/* Totales y Botón Cobrar */}
            <div className="bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200 space-y-1 text-xs">
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
              <div className="flex justify-between text-zinc-950 font-mono font-black text-base pt-1 border-t border-zinc-200">
                <span>TOTAL:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <button
              type="button"
              disabled={cart.length === 0 || isProcessing}
              onClick={handleCheckoutAndInvoice}
              className="w-full bg-zinc-950 hover:bg-zinc-800 disabled:opacity-30 text-white py-3.5 rounded-2xl font-heading text-xs font-black uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-98"
            >
              {isProcessing ? 'Emitiendo comprobante...' : (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> Cobrar {formatCurrency(total)}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Historial Unificado de Comprobantes Emitidos con Filtros */}
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
          <div>
            <h3 className="text-xl font-heading font-black text-zinc-950 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-zinc-950" /> Historial de Comprobantes Emitidos (Facturas & Remitos)
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Registro fiscal y comercial de ventas en mostrador con CAE y código QR oficial.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold bg-zinc-100 text-zinc-700 px-3 py-1.5 rounded-xl">
              {filteredInvoices.length} Comprobantes
            </span>
          </div>
        </div>

        {/* Barra de Búsqueda y Filtros por Tipo */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setInvoiceFilterType('TODOS')}
              className={`px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase transition-all ${
                invoiceFilterType === 'TODOS'
                  ? 'bg-zinc-950 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              Todos los Comprobantes
            </button>
            <button
              onClick={() => setInvoiceFilterType('FACTURA_A')}
              className={`px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase transition-all ${
                invoiceFilterType === 'FACTURA_A'
                  ? 'bg-zinc-950 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              Facturas A
            </button>
            <button
              onClick={() => setInvoiceFilterType('FACTURA_B')}
              className={`px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase transition-all ${
                invoiceFilterType === 'FACTURA_B'
                  ? 'bg-zinc-950 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              Facturas B
            </button>
            <button
              onClick={() => setInvoiceFilterType('TICKET_LOCAL')}
              className={`px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase transition-all ${
                invoiceFilterType === 'TICKET_LOCAL'
                  ? 'bg-zinc-950 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              Remitos / Local
            </button>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, CUIT/DNI, comprobante..."
              value={invoiceSearchQuery}
              onChange={(e) => setInvoiceSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Tabla de Comprobantes */}
        <div className="overflow-x-auto border border-zinc-200 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-100/80 border-b border-zinc-200 text-zinc-600 font-heading font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Comprobante / Fecha</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Cliente & Documento</th>
                <th className="py-3 px-4">Artículos / Bici</th>
                <th className="py-3 px-4">Medio de Pago</th>
                <th className="py-3 px-4 text-right">Total ($ ARS)</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 font-medium">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-400">
                    No se encontraron comprobantes con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <strong className="font-mono text-zinc-950 block">{inv.id}</strong>
                      <span className="text-[10px] text-zinc-400 font-mono">{inv.date}</span>
                      {inv.cae && (
                        <span className="text-[9px] text-zinc-500 font-mono block">CAE: {inv.cae}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-heading font-black uppercase ${
                          inv.type === 'FACTURA_A'
                            ? 'bg-purple-100 text-purple-800'
                            : inv.type === 'FACTURA_B'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-zinc-100 text-zinc-700'
                        }`}
                      >
                        {inv.type === 'FACTURA_A' ? 'Factura A' : inv.type === 'FACTURA_B' ? 'Factura B' : 'Remito Local'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <strong className="text-zinc-900 block font-heading">{inv.customerName}</strong>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {inv.docType}: {inv.doc} • Tel: {inv.customerPhone}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-zinc-700" title={inv.itemsSummary}>
                      {inv.bicyclesBought && inv.bicyclesBought.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-heading font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          <Bike className="w-3 h-3" /> {inv.bicyclesBought.join(', ')}
                        </span>
                      ) : (
                        inv.itemsSummary
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded text-[10px] font-heading font-bold">
                        {inv.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-sm text-zinc-950">
                      {formatCurrency(inv.amount)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          window.print();
                        }}
                        className="p-1.5 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg transition-colors inline-flex items-center gap-1 text-[10px] font-heading font-bold"
                        title="Imprimir Comprobante"
                      >
                        <Printer className="w-3.5 h-3.5" /> Reimprimir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
              Comprobante #{issuedInvoice.invoiceNumber}
            </p>

            <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 text-left text-xs space-y-1.5 mb-6">
              <div className="flex justify-between">
                <span className="text-zinc-500">Cliente:</span>
                <strong className="text-zinc-950">{issuedInvoice.customerName}</strong>
              </div>
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
