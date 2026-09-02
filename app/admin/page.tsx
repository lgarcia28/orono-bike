'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/app/components/layout/Header';
import { ORO_BIKES_CATALOG } from '@/lib/data/bikes';
import { ProductWithVariants, ProductVariant } from '@/lib/supabase/types';
import { PointOfSaleInterface } from '@/app/components/pos/PointOfSaleInterface';
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  Receipt,
  Wrench,
  DollarSign,
  Plus,
  Search,
  SlidersHorizontal,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  FileText,
  CreditCard,
  Banknote,
  Send,
  Eye,
  Percent,
  Zap,
  RefreshCw,
  ShoppingBag,
  Clock,
  Calendar,
  Layers,
  Bike,
  MonitorDot,
} from 'lucide-react';

type AdminTab = 'ventas' | 'pos' | 'inventario' | 'facturacion' | 'taller' | 'caja';
type TimeFilter = 'hoy' | 'semana' | 'mes';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('ventas');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('mes');

  // Estado de Inventario
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('Todas');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [bulkPercent, setBulkPercent] = useState<number>(5);
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Estado de Facturación Rápida
  const [invoiceType, setInvoiceType] = useState<'B' | 'A'>('B');
  const [invoiceCustomer, setInvoiceCustomer] = useState({ name: '', doc: '', email: '' });
  const [invoiceAmount, setInvoiceAmount] = useState<number>(0);
  const [invoicesList, setInvoicesList] = useState([
    {
      id: 'FAC-0001-00004521',
      date: '2026-09-01 18:30',
      type: 'B',
      customer: 'Gonzalo Martínez',
      doc: '38.450.112',
      amount: 2450000,
      cae: '74389201948271',
      status: 'Aprobada',
    },
    {
      id: 'FAC-0001-00004520',
      date: '2026-09-01 16:15',
      type: 'A',
      customer: 'Rosario Cycling Team SRL',
      doc: '30-71829301-4',
      amount: 8900000,
      cae: '74389201948270',
      status: 'Aprobada',
    },
    {
      id: 'FAC-0001-00004519',
      date: '2026-08-31 11:00',
      type: 'B',
      customer: 'Lucía Fernández',
      doc: '41.220.984',
      amount: 1350000,
      cae: '74389201948269',
      status: 'Aprobada',
    },
  ]);

  // Estado de Turnos de Taller
  const [workshopTickets, setWorkshopTickets] = useState([
    {
      id: 'SER-101',
      client: 'Martín Rossi',
      phone: '5493415551234',
      bike: 'Scott Spark RC (2024)',
      serviceType: 'Service Pro Integral + Purga Shimano',
      status: 'En Taller',
      date: '2026-09-02',
      price: 85000,
    },
    {
      id: 'SER-102',
      client: 'Camila Benítez',
      phone: '5493415555678',
      bike: 'Volta Radix 29',
      serviceType: 'Calibración Transmisión + Tubelizado',
      status: 'Listo para Retiro',
      date: '2026-09-01',
      price: 42000,
    },
    {
      id: 'SER-103',
      client: 'Federico Gómez',
      phone: '5493415559012',
      bike: 'Sars Pro Race',
      serviceType: 'Armado desde Caja & Ajuste de Frenos',
      status: 'Pendiente',
      date: '2026-09-03',
      price: 60000,
    },
    {
      id: 'SER-104',
      client: 'Ignacio Vega',
      phone: '5493415553456',
      bike: 'Raleigh Mojave 9.5',
      serviceType: 'Cambio de Cadena y Pastillas',
      status: 'Entregado',
      date: '2026-08-31',
      price: 38000,
    },
  ]);

  // Cargar inventario inicial
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('orono_custom_bikes') || '[]');
      if (Array.isArray(stored) && stored.length > 0) {
        setProducts([...stored, ...ORO_BIKES_CATALOG]);
      } else {
        setProducts(ORO_BIKES_CATALOG);
      }
    } catch (e) {
      setProducts(ORO_BIKES_CATALOG);
    }
  }, []);

  // Métricas dinámicas calculadas según el filtro temporal
  const salesMetrics = useMemo(() => {
    if (timeFilter === 'hoy') {
      return {
        totalRevenue: 3800000,
        ordersCount: 4,
        avgTicket: 950000,
        unitsSold: 4,
        onlinePercentage: 35,
        posPercentage: 65,
        cash: 950000,
        cards: 2100000,
        transfer: 750000,
      };
    }
    if (timeFilter === 'semana') {
      return {
        totalRevenue: 24500000,
        ordersCount: 18,
        avgTicket: 1361111,
        unitsSold: 21,
        onlinePercentage: 42,
        posPercentage: 58,
        cash: 5200000,
        cards: 13800000,
        transfer: 5500000,
      };
    }
    // Mes
    return {
      totalRevenue: 89400000,
      ordersCount: 64,
      avgTicket: 1396875,
      unitsSold: 78,
      onlinePercentage: 48,
      posPercentage: 52,
      cash: 18200000,
      cards: 49200000,
      transfer: 22000000,
    };
  }, [timeFilter]);

  // Filtrado de Inventario
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchBrand = selectedBrand === 'Todas' || p.brand.toUpperCase() === selectedBrand.toUpperCase();
      const matchCategory =
        selectedCategory === 'Todas' || p.category.toUpperCase() === selectedCategory.toUpperCase();
      const matchSearch =
        !searchQuery.trim() ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());

      return matchBrand && matchCategory && matchSearch;
    });
  }, [products, selectedBrand, selectedCategory, searchQuery]);

  // Total de stock valorizado
  const totalStockValue = useMemo(() => {
    return products.reduce((acc, p) => {
      const pTotal = p.variants.reduce((vAcc, v) => vAcc + v.price * v.stock, 0);
      return acc + pTotal;
    }, 0);
  }, [products]);

  const totalUnitsInStock = useMemo(() => {
    return products.reduce((acc, p) => {
      const pUnits = p.variants.reduce((vAcc, v) => vAcc + v.stock, 0);
      return acc + pUnits;
    }, 0);
  }, [products]);

  // Modificar stock rápido
  const handleUpdateStock = (productId: string, variantId: string, delta: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        return {
          ...p,
          variants: p.variants.map((v) => {
            if (v.id !== variantId) return v;
            return { ...v, stock: Math.max(0, v.stock + delta) };
          }),
        };
      })
    );
  };

  // Modificar precio directo
  const handleUpdatePrice = (productId: string, variantId: string, newPrice: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        return {
          ...p,
          variants: p.variants.map((v) => {
            if (v.id !== variantId) return v;
            return { ...v, price: newPrice };
          }),
        };
      })
    );
  };

  // Ajuste masivo de precios
  const handleBulkPriceAdjustment = () => {
    if (!bulkPercent || isNaN(bulkPercent)) return;
    const factor = 1 + bulkPercent / 100;
    setProducts((prev) =>
      prev.map((p) => {
        const matchBrand = selectedBrand === 'Todas' || p.brand.toUpperCase() === selectedBrand.toUpperCase();
        const matchCategory =
          selectedCategory === 'Todas' || p.category.toUpperCase() === selectedCategory.toUpperCase();
        if (!matchBrand || !matchCategory) return p;

        return {
          ...p,
          variants: p.variants.map((v) => ({
            ...v,
            price: Math.round((v.price * factor) / 1000) * 1000,
          })),
        };
      })
    );
    setShowBulkModal(false);
    alert(`Precios actualizados en un ${bulkPercent > 0 ? '+' : ''}${bulkPercent}% exitosamente.`);
  };

  // Dar de baja producto
  const handleDeleteProduct = (productId: string) => {
    if (confirm('¿Estás seguro de que deseas dar de baja este artículo del catálogo?')) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    }
  };

  // Emitir Factura
  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceCustomer.name || invoiceAmount <= 0) {
      alert('Por favor complete los datos del cliente y el monto.');
      return;
    }
    const nextNum = (invoicesList.length + 4522).toString();
    const newInv = {
      id: `FAC-0001-0000${nextNum}`,
      date: new Date().toLocaleString(),
      type: invoiceType,
      customer: invoiceCustomer.name,
      doc: invoiceCustomer.doc || '20-12345678-9',
      amount: invoiceAmount,
      cae: `7438920194${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'Aprobada',
    };
    setInvoicesList([newInv, ...invoicesList]);
    setInvoiceCustomer({ name: '', doc: '', email: '' });
    setInvoiceAmount(0);
    alert(`Comprobante ${newInv.id} generado exitosamente con CAE: ${newInv.cae}`);
  };

  // Cambiar estado de turno en taller
  const handleWorkshopStatusChange = (ticketId: string, newStatus: string) => {
    setWorkshopTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
    );
  };

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col font-sans text-zinc-900">
      <Header />

      {/* Admin Top Header */}
      <div className="bg-zinc-950 text-white border-b border-zinc-800 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-heading font-extrabold text-zinc-400 uppercase tracking-widest mb-1.5">
              <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" />
              <span>Oroño Bike • Panel de Gestión Integral</span>
            </div>
            <h1 className="text-3xl font-heading font-black text-white tracking-tight">
              Control General del Negocio
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Administración de ventas, punto de venta (POS), stock físico, actualización masiva de precios, taller y facturación.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/productos/nuevo"
              className="bg-white hover:bg-zinc-100 text-zinc-950 font-heading text-xs font-black uppercase tracking-wider px-5 py-3 rounded-xl flex items-center gap-2 shadow-lg transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4" /> Cargar Nueva Bici
            </Link>
            <button
              onClick={() => setActiveTab('pos')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-heading text-xs font-bold uppercase tracking-wider px-4 py-3 rounded-xl flex items-center gap-2 transition-colors shadow-sm"
            >
              <MonitorDot className="w-4 h-4" /> Abrir POS Mostrador
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto mt-8 flex gap-2 border-b border-zinc-800 overflow-x-auto pb-px scrollbar-none">
          <button
            onClick={() => setActiveTab('ventas')}
            className={`px-5 py-3 font-heading text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'ventas'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" /> Control de Ventas
          </button>
          <button
            onClick={() => setActiveTab('pos')}
            className={`px-5 py-3 font-heading text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'pos'
                ? 'border-emerald-400 text-emerald-400 font-black'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MonitorDot className="w-4 h-4" /> POS Mostrador
          </button>
          <button
            onClick={() => setActiveTab('inventario')}
            className={`px-5 py-3 font-heading text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'inventario'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Package className="w-4 h-4" /> Inventario & Precios ({totalUnitsInStock} u.)
          </button>
          <button
            onClick={() => setActiveTab('facturacion')}
            className={`px-5 py-3 font-heading text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'facturacion'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Receipt className="w-4 h-4" /> Facturación & Comprobantes
          </button>
          <button
            onClick={() => setActiveTab('taller')}
            className={`px-5 py-3 font-heading text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'taller'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Wrench className="w-4 h-4" /> Taller & Reparaciones ({workshopTickets.length})
          </button>
          <button
            onClick={() => setActiveTab('caja')}
            className={`px-5 py-3 font-heading text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'caja'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <DollarSign className="w-4 h-4" /> Cierre de Caja
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex-1">
        {/* ========================================================= */}
        {/* TAB: POS MOSTRADOR (PUNTO DE VENTA)                       */}
        {/* ========================================================= */}
        {activeTab === 'pos' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-heading font-bold text-zinc-800 uppercase tracking-wider">
                  Caja Mostrador Activa • Bv. Nicasio Oroño 1234
                </span>
              </div>
              <span className="text-xs font-mono text-zinc-500">
                Lector de código de barras conectado
              </span>
            </div>
            <PointOfSaleInterface />
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 1: CONTROL DE VENTAS & MÉTRICAS                       */}
        {/* ========================================================= */}
        {activeTab === 'ventas' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Filtros de tiempo */}
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs font-heading font-bold text-zinc-500 uppercase tracking-wider">
                Período de Análisis:
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setTimeFilter('hoy')}
                  className={`px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all ${
                    timeFilter === 'hoy'
                      ? 'bg-zinc-950 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  Hoy (Diario)
                </button>
                <button
                  onClick={() => setTimeFilter('semana')}
                  className={`px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all ${
                    timeFilter === 'semana'
                      ? 'bg-zinc-950 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  Esta Semana
                </button>
                <button
                  onClick={() => setTimeFilter('mes')}
                  className={`px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all ${
                    timeFilter === 'mes'
                      ? 'bg-zinc-950 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  Este Mes
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs">
                <div className="flex items-center justify-between text-zinc-400 mb-3">
                  <span className="text-xs font-heading font-bold uppercase tracking-wider text-zinc-500">
                    Facturación Total
                  </span>
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-heading font-black text-zinc-950 font-mono">
                  ${salesMetrics.totalRevenue.toLocaleString('es-AR')}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-2">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +14.2% vs período anterior
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs">
                <div className="flex items-center justify-between text-zinc-400 mb-3">
                  <span className="text-xs font-heading font-bold uppercase tracking-wider text-zinc-500">
                    Órdenes Concretadas
                  </span>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-heading font-black text-zinc-950 font-mono">
                  {salesMetrics.ordersCount}
                </div>
                <div className="text-xs text-zinc-500 mt-2">
                  {salesMetrics.unitsSold} unidades despachadas
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs">
                <div className="flex items-center justify-between text-zinc-400 mb-3">
                  <span className="text-xs font-heading font-bold uppercase tracking-wider text-zinc-500">
                    Ticket Promedio
                  </span>
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                    <Percent className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-heading font-black text-zinc-950 font-mono">
                  ${Math.round(salesMetrics.avgTicket).toLocaleString('es-AR')}
                </div>
                <div className="text-xs text-zinc-500 mt-2">Promedio por operación</div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs">
                <div className="flex items-center justify-between text-zinc-400 mb-3">
                  <span className="text-xs font-heading font-bold uppercase tracking-wider text-zinc-500">
                    Valor Stock en Tienda
                  </span>
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                    <Package className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-heading font-black text-zinc-950 font-mono">
                  ${totalStockValue.toLocaleString('es-AR')}
                </div>
                <div className="text-xs text-zinc-500 mt-2">{totalUnitsInStock} bicicletas en stock</div>
              </div>
            </div>

            {/* Desglose por Medios de Pago & Canales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Canales de Venta */}
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs">
                <h3 className="font-heading font-black text-base text-zinc-950 mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Distribución por Canal de Venta
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-heading font-bold mb-1.5">
                      <span>Mostrador Local / POS (Bv. Oroño)</span>
                      <span>{salesMetrics.posPercentage}%</span>
                    </div>
                    <div className="w-full bg-zinc-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-zinc-950 h-full rounded-full"
                        style={{ width: `${salesMetrics.posPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-heading font-bold mb-1.5">
                      <span>Tienda Online / Envíos Nacionales</span>
                      <span>{salesMetrics.onlinePercentage}%</span>
                    </div>
                    <div className="w-full bg-zinc-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${salesMetrics.onlinePercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Medios de Pago */}
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs">
                <h3 className="font-heading font-black text-base text-zinc-950 mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Cobranzas por Medio de Pago
                </h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                    <CreditCard className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                    <span className="text-[10px] font-heading font-bold text-zinc-400 block uppercase">
                      Tarjetas 3 y 6 Cuotas
                    </span>
                    <strong className="text-xs font-mono font-bold text-zinc-900">
                      ${salesMetrics.cards.toLocaleString('es-AR')}
                    </strong>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                    <Zap className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                    <span className="text-[10px] font-heading font-bold text-zinc-400 block uppercase">
                      Transferencia (10% OFF)
                    </span>
                    <strong className="text-xs font-mono font-bold text-zinc-900">
                      ${salesMetrics.transfer.toLocaleString('es-AR')}
                    </strong>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                    <Banknote className="w-5 h-5 text-sky-500 mx-auto mb-1" />
                    <span className="text-[10px] font-heading font-bold text-zinc-400 block uppercase">
                      Efectivo Mostrador
                    </span>
                    <strong className="text-xs font-mono font-bold text-zinc-900">
                      ${salesMetrics.cash.toLocaleString('es-AR')}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: INVENTARIO, STOCK & PRECIOS (ABM)                  */}
        {/* ========================================================= */}
        {activeTab === 'inventario' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header de Inventario y Acciones */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-64 sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Buscar por modelo o marca..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-zinc-950"
                  />
                </div>

                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-heading font-bold uppercase"
                >
                  <option value="Todas">Todas las Marcas</option>
                  <option value="SCOTT">SCOTT</option>
                  <option value="VOLTA">VOLTA</option>
                  <option value="RALEIGH">RALEIGH</option>
                  <option value="MOOVE">MOOVE</option>
                  <option value="ZION">ZION</option>
                  <option value="SARS">SARS</option>
                </select>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-heading font-bold uppercase"
                >
                  <option value="Todas">Todas las Categorías</option>
                  <option value="MTB">MTB</option>
                  <option value="RUTA">RUTA</option>
                  <option value="GRAVEL">GRAVEL</option>
                  <option value="BMX">BMX</option>
                  <option value="PASEO">PASEO</option>
                  <option value="NIÑOS">NIÑOS</option>
                </select>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setShowBulkModal(true)}
                  className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-heading text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Percent className="w-3.5 h-3.5" /> Ajuste Masivo Precios
                </button>
                <Link
                  href="/admin/productos/nuevo"
                  className="bg-zinc-950 hover:bg-zinc-800 text-white font-heading text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" /> Cargar Bici
                </Link>
              </div>
            </div>

            {/* Modal de Ajuste Masivo de Precios */}
            {showBulkModal && (
              <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-zinc-200 animate-fadeIn">
                  <h3 className="text-xl font-heading font-black text-zinc-950 mb-2">
                    Ajuste Masivo de Precios
                  </h3>
                  <p className="text-xs text-zinc-600 mb-6">
                    Aplica un porcentaje de aumento o descuento a todos los productos filtrados por marca y categoría.
                  </p>

                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-xs font-heading font-bold uppercase text-zinc-700 mb-1">
                        Porcentaje de Modificación (%)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={bulkPercent}
                          onChange={(e) => setBulkPercent(Number(e.target.value))}
                          placeholder="Ej. 10 para +10% o -5 para descuento"
                          className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-xl text-base font-mono font-bold"
                        />
                        <span className="text-base font-bold text-zinc-500">%</span>
                      </div>
                    </div>

                    <div className="p-3 bg-zinc-50 rounded-xl text-xs text-zinc-600">
                      <strong>Alcance:</strong> Marca <u>{selectedBrand}</u>, Categoría <u>{selectedCategory}</u>.
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowBulkModal(false)}
                      className="px-5 py-2.5 border border-zinc-300 rounded-xl text-xs font-heading font-bold uppercase text-zinc-700 hover:bg-zinc-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleBulkPriceAdjustment}
                      className="bg-zinc-950 text-white px-5 py-2.5 rounded-xl text-xs font-heading font-bold uppercase tracking-wider hover:bg-zinc-800 shadow-md"
                    >
                      Aplicar Ajuste
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tabla de Artículos y Variantes */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-heading font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Bicicleta / Modelo</th>
                      <th className="py-3.5 px-4">Marca</th>
                      <th className="py-3.5 px-4">Categoría</th>
                      <th className="py-3.5 px-4">Variante (Talle/Color)</th>
                      <th className="py-3.5 px-4">Precio Lista ($)</th>
                      <th className="py-3.5 px-4 text-center">Stock Físico</th>
                      <th className="py-3.5 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 font-medium">
                    {filteredProducts.map((p) =>
                      p.variants.map((v) => (
                        <tr key={`${p.id}-${v.id}`} className="hover:bg-zinc-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.images[0]}
                                alt={p.title}
                                className="w-10 h-10 object-cover rounded-lg bg-zinc-100 border border-zinc-200"
                              />
                              <div>
                                <span className="font-heading font-bold text-zinc-900 block text-xs">
                                  {p.title}
                                </span>
                                <span className="text-[10px] font-mono text-zinc-400">SKU: {v.sku}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-heading font-bold text-zinc-700">{p.brand}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 bg-zinc-100 rounded text-[10px] font-heading font-bold text-zinc-600">
                              {p.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-zinc-700">
                            <strong>{v.size}</strong> • {v.color} ({v.wheel_size})
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-zinc-950">
                            <div className="flex items-center gap-1.5">
                              <span>$</span>
                              <input
                                type="number"
                                value={v.price}
                                onChange={(e) =>
                                  handleUpdatePrice(p.id, v.id, Number(e.target.value))
                                }
                                className="w-28 px-2 py-1 bg-zinc-50 border border-zinc-300 rounded font-mono text-xs font-bold focus:bg-white focus:outline-none"
                              />
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg p-1">
                              <button
                                onClick={() => handleUpdateStock(p.id, v.id, -1)}
                                className="w-6 h-6 rounded bg-white hover:bg-zinc-200 font-bold flex items-center justify-center border border-zinc-200"
                              >
                                -
                              </button>
                              <span
                                className={`w-8 text-center font-heading font-bold text-xs ${
                                  v.stock <= 1 ? 'text-rose-600' : 'text-zinc-900'
                                }`}
                              >
                                {v.stock}
                              </span>
                              <button
                                onClick={() => handleUpdateStock(p.id, v.id, 1)}
                                className="w-6 h-6 rounded bg-white hover:bg-zinc-200 font-bold flex items-center justify-center border border-zinc-200"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                title="Dar de baja / Eliminar"
                                className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: FACTURACIÓN & EMISIÓN DE COMPROBANTES             */}
        {/* ========================================================= */}
        {activeTab === 'facturacion' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
            {/* Formulario de Emisión Rápida */}
            <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-2xl border border-zinc-200 shadow-xs">
              <h2 className="text-lg font-heading font-black text-zinc-950 mb-4 flex items-center gap-2">
                <Receipt className="w-5 h-5" /> Nueva Factura Electrónica
              </h2>
              <form onSubmit={handleCreateInvoice} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-zinc-600 mb-1.5">
                    Tipo de Comprobante
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setInvoiceType('B')}
                      className={`py-2.5 rounded-xl font-heading text-xs font-bold uppercase transition-all ${
                        invoiceType === 'B'
                          ? 'bg-zinc-950 text-white shadow-xs'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                    >
                      Factura B (Cons. Final)
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvoiceType('A')}
                      className={`py-2.5 rounded-xl font-heading text-xs font-bold uppercase transition-all ${
                        invoiceType === 'A'
                          ? 'bg-zinc-950 text-white shadow-xs'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                    >
                      Factura A (Responsable Insc.)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-zinc-600 mb-1">
                    Razón Social / Nombre y Apellido *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Pérez"
                    value={invoiceCustomer.name}
                    onChange={(e) =>
                      setInvoiceCustomer({ ...invoiceCustomer, name: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-zinc-600 mb-1">
                    {invoiceType === 'A' ? 'CUIT del Cliente *' : 'DNI / CUIT'}
                  </label>
                  <input
                    type="text"
                    required={invoiceType === 'A'}
                    placeholder={invoiceType === 'A' ? '30-12345678-9' : '38.450.112'}
                    value={invoiceCustomer.doc}
                    onChange={(e) =>
                      setInvoiceCustomer({ ...invoiceCustomer, doc: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-zinc-600 mb-1">
                    Monto Total a Facturar ($ ARS) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={invoiceAmount || ''}
                    onChange={(e) => setInvoiceAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-base font-mono font-bold focus:bg-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-zinc-950 hover:bg-zinc-800 text-white py-3 rounded-xl font-heading text-xs font-bold uppercase tracking-wider shadow-md transition-transform active:scale-98 flex items-center justify-center gap-2 mt-4"
                >
                  <Receipt className="w-4 h-4" /> Emitir Factura & Obtener CAE
                </button>
              </form>
            </div>

            {/* Historial de Comprobantes Emitidos */}
            <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-zinc-200 shadow-xs">
              <h2 className="text-lg font-heading font-black text-zinc-950 mb-4 flex items-center justify-between">
                <span>Historial de Comprobantes Emitidos</span>
                <span className="text-xs font-normal text-zinc-500 font-sans">
                  {invoicesList.length} comprobantes
                </span>
              </h2>

              <div className="space-y-3">
                {invoicesList.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-zinc-950 text-white rounded text-[10px] font-heading font-bold">
                          Factura {inv.type}
                        </span>
                        <strong className="text-xs font-heading font-black text-zinc-900">
                          {inv.id}
                        </strong>
                      </div>
                      <div className="text-xs text-zinc-600 mt-1">
                        <strong>Cliente:</strong> {inv.customer} ({inv.doc})
                      </div>
                      <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                        CAE: {inv.cae} • {inv.date}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:text-right">
                      <div>
                        <div className="text-sm font-mono font-bold text-zinc-950">
                          ${inv.amount.toLocaleString('es-AR')}
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Aprobada
                        </span>
                      </div>
                      <button
                        onClick={() => alert(`Imprimiendo comprobante oficial ${inv.id}...`)}
                        className="p-2 border border-zinc-300 rounded-lg hover:bg-white text-zinc-600"
                        title="Imprimir Comprobante"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: TALLER & CONTROL DE REPARACIONES                   */}
        {/* ========================================================= */}
        {activeTab === 'taller' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
              <div>
                <h2 className="text-lg font-heading font-black text-zinc-950">
                  Turnos de Service & Reparaciones
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Gestiona el estado mecánico de cada bicicleta y notifica al cliente con un click por WhatsApp.
                </p>
              </div>
              <Link
                href="/taller"
                className="bg-zinc-950 hover:bg-zinc-800 text-white font-heading text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Nuevo Turno Taller
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {workshopTickets.map((t) => (
                <div
                  key={t.id}
                  className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[11px] font-mono font-bold text-zinc-400">
                        #{t.id}
                      </span>
                      <select
                        value={t.status}
                        onChange={(e) => handleWorkshopStatusChange(t.id, e.target.value)}
                        className={`text-[10px] font-heading font-bold uppercase px-2.5 py-1 rounded-full border ${
                          t.status === 'Listo para Retiro'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : t.status === 'En Taller'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : t.status === 'Entregado'
                            ? 'bg-zinc-100 text-zinc-600 border-zinc-300'
                            : 'bg-blue-100 text-blue-800 border-blue-300'
                        }`}
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="En Taller">En Taller</option>
                        <option value="Listo para Retiro">Listo para Retiro</option>
                        <option value="Entregado">Entregado</option>
                      </select>
                    </div>

                    <h3 className="font-heading font-black text-sm text-zinc-950 mb-1">{t.bike}</h3>
                    <div className="text-xs text-zinc-600 font-medium mb-3">
                      <strong>Servicio:</strong> {t.serviceType}
                    </div>

                    <div className="p-3 bg-zinc-50 rounded-xl space-y-1 text-xs text-zinc-600 mb-4">
                      <div>
                        <strong>Cliente:</strong> {t.client}
                      </div>
                      <div>
                        <strong>Fecha de Turno:</strong> {t.date}
                      </div>
                      <div className="text-zinc-950 font-mono font-bold pt-1">
                        Costo Estimado: ${t.price.toLocaleString('es-AR')}
                      </div>
                    </div>
                  </div>

                  <a
                    href={`https://wa.me/${t.phone}?text=Hola%20${encodeURIComponent(
                      t.client
                    )}!%20Te%20escribimos%20de%20Oroño%20Bike.%20Tu%20bicicleta%20${encodeURIComponent(
                      t.bike
                    )}%20se%20encuentra%20${encodeURIComponent(
                      t.status === 'Listo para Retiro'
                        ? 'LISTA PARA RETIRAR en el taller de Bv. Oroño 1234.'
                        : 'en estado: ' + t.status
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-heading text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" /> Avisar por WhatsApp
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: CIERRE & ARQUEO DE CAJA DIARIA                    */}
        {/* ========================================================= */}
        {activeTab === 'caja' && (
          <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-sm animate-fadeIn space-y-6">
            <div className="border-b border-zinc-200 pb-4">
              <h2 className="text-xl font-heading font-black text-zinc-950">
                Arqueo & Cierre de Caja del Día
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Resumen de ingresos en efectivo, terminales de cobro POS y transferencias bancarias verificadas.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <span className="text-xs font-heading font-bold text-zinc-700 uppercase">
                  Efectivo en Caja Mostrador
                </span>
                <span className="font-mono font-bold text-base text-zinc-950">
                  ${salesMetrics.cash.toLocaleString('es-AR')}
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <span className="text-xs font-heading font-bold text-zinc-700 uppercase">
                  Cobros POS Débito / Crédito
                </span>
                <span className="font-mono font-bold text-base text-zinc-950">
                  ${salesMetrics.cards.toLocaleString('es-AR')}
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <span className="text-xs font-heading font-bold text-zinc-700 uppercase">
                  Transferencias Bancarias Acreditadas
                </span>
                <span className="font-mono font-bold text-base text-zinc-950">
                  ${salesMetrics.transfer.toLocaleString('es-AR')}
                </span>
              </div>

              <div className="flex justify-between items-center p-5 bg-zinc-950 text-white rounded-2xl shadow-md">
                <span className="text-xs font-heading font-black uppercase tracking-wider">
                  Total Ingresos del Día
                </span>
                <span className="font-mono font-black text-xl text-emerald-400">
                  ${salesMetrics.totalRevenue.toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            <button
              onClick={() =>
                alert(
                  `Cierre de caja del ${new Date().toLocaleDateString()} registrado exitosamente. Reporte enviado al dueño.`
                )
              }
              className="w-full bg-zinc-950 hover:bg-zinc-800 text-white py-3.5 rounded-xl font-heading text-xs font-black uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Realizar Cierre de Caja Diario
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
