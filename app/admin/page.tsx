'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/app/components/layout/Header';
import { ALL_PRODUCTS_CATALOG } from '@/lib/data/bikes';
import { ProductWithVariants, ProductVariant } from '@/lib/supabase/types';
import { WorkshopService, WorkshopServiceItem } from '@/lib/services/workshop.service';
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
  Calendar as CalendarIcon,
  Layers,
  Bike,
  MonitorDot,
  MinusCircle,
  PlusCircle,
  Download,
  Calculator,
  Save,
  Tag,
  ShieldCheck,
} from 'lucide-react';

type AdminTab = 'ventas' | 'pos' | 'inventario' | 'facturacion' | 'taller' | 'caja';
type DatePreset = 'hoy' | 'ayer' | 'semana' | 'mes' | 'custom';

interface CashMovement {
  id: string;
  time: string;
  type: 'ingreso' | 'egreso';
  concept: string;
  category: string;
  paymentMethod: 'Efectivo' | 'Débito' | 'Crédito' | 'Transferencia';
  amount: number;
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('ventas');

  // Filtro de Fechas para Control de Ventas
  const [datePreset, setDatePreset] = useState<DatePreset>('hoy');
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Estado de Inventario
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('Todas');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [bulkPercent, setBulkPercent] = useState<number>(5);
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Estado de Gestión de Servicios de Taller (CRUD)
  const [workshopSubTab, setWorkshopSubTab] = useState<'turnos' | 'servicios'>('turnos');
  const [workshopServices, setWorkshopServices] = useState<WorkshopServiceItem[]>([]);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceFormData, setServiceFormData] = useState<{
    title: string;
    description: string;
    duration: string;
    price: number;
  }>({
    title: '',
    description: '',
    duration: '24 hs',
    price: 0,
  });

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
      serviceType: 'Service General & Puesta a Punto',
      status: 'En Taller',
      date: '2026-09-02',
      price: 45000,
    },
    {
      id: 'SER-102',
      client: 'Camila Benítez',
      phone: '5493415555678',
      bike: 'Volta Radix 29',
      serviceType: 'Calibración de Transmisión',
      status: 'Listo para Retiro',
      date: '2026-09-01',
      price: 22000,
    },
    {
      id: 'SER-103',
      client: 'Federico Gómez',
      phone: '5493415559012',
      bike: 'Sars Pro Race',
      serviceType: 'Purga de Frenos Hidráulicos',
      status: 'Pendiente',
      date: '2026-09-03',
      price: 28000,
    },
    {
      id: 'SER-104',
      client: 'Ignacio Vega',
      phone: '5493415553456',
      bike: 'Raleigh Mojave 9.5',
      serviceType: 'Tubelizado & Carga de Sellante',
      status: 'Entregado',
      date: '2026-08-31',
      price: 20000,
    },
  ]);

  // Estado de Cierre de Caja (Ingresos y Egresos)
  const [openingBalance, setOpeningBalance] = useState<number>(150000);
  const [cashMovements, setCashMovements] = useState<CashMovement[]>([
    {
      id: 'MOV-01',
      time: '09:00',
      type: 'ingreso',
      concept: 'Apertura de caja / Fondo de cambio inicial',
      category: 'Apertura',
      paymentMethod: 'Efectivo',
      amount: 150000,
    },
    {
      id: 'MOV-02',
      time: '10:30',
      type: 'ingreso',
      concept: 'Venta #1042: Volta Radix Carbon 12v (Mostrador)',
      category: 'Venta Bicicleta',
      paymentMethod: 'Débito',
      amount: 2450000,
    },
    {
      id: 'MOV-03',
      time: '11:45',
      type: 'egreso',
      concept: 'Pago a mensajería / flete de repuestos Shimano',
      category: 'Logística',
      paymentMethod: 'Efectivo',
      amount: 18000,
    },
    {
      id: 'MOV-04',
      time: '13:10',
      type: 'ingreso',
      concept: 'Cobro Service Taller #SER-102 (Camila Benítez)',
      category: 'Taller Mecánico',
      paymentMethod: 'Transferencia',
      amount: 42000,
    },
    {
      id: 'MOV-05',
      time: '15:20',
      type: 'ingreso',
      concept: 'Venta #1043: Raleigh Mojave 9.5 29er (POS 3 cuotas)',
      category: 'Venta Bicicleta',
      paymentMethod: 'Crédito',
      amount: 1350000,
    },
    {
      id: 'MOV-06',
      time: '16:00',
      type: 'egreso',
      concept: 'Compra de insumos de limpieza y taller (Ferretería)',
      category: 'Gastos Generales',
      paymentMethod: 'Efectivo',
      amount: 25000,
    },
    {
      id: 'MOV-07',
      time: '17:30',
      type: 'ingreso',
      concept: 'Venta #1044: Casco + Cubiertas Maxxis 29 (Efectivo)',
      category: 'Accesorios',
      paymentMethod: 'Efectivo',
      amount: 120000,
    },
  ]);

  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movementForm, setMovementForm] = useState<{
    type: 'ingreso' | 'egreso';
    concept: string;
    category: string;
    paymentMethod: 'Efectivo' | 'Débito' | 'Crédito' | 'Transferencia';
    amount: number;
  }>({
    type: 'egreso',
    concept: '',
    category: 'Gastos Generales',
    paymentMethod: 'Efectivo',
    amount: 0,
  });

  // Cargar inventario inicial y servicios de taller
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('orono_custom_bikes') || '[]');
      if (Array.isArray(stored) && stored.length > 0) {
        setProducts([...stored, ...ALL_PRODUCTS_CATALOG]);
      } else {
        setProducts(ALL_PRODUCTS_CATALOG);
      }
    } catch (e) {
      setProducts(ALL_PRODUCTS_CATALOG);
    }

    setWorkshopServices(WorkshopService.getServices());
  }, []);

  // Recalcular preset de fechas
  const handleSelectPreset = (preset: DatePreset) => {
    setDatePreset(preset);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === 'hoy') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'ayer') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().split('T')[0];
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === 'semana') {
      const pastWeek = new Date(today);
      pastWeek.setDate(pastWeek.getDate() - 7);
      setStartDate(pastWeek.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'mes') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(startOfMonth.toISOString().split('T')[0]);
      setEndDate(todayStr);
    }
  };

  // Cálculo de Métricas Financieras y Ventas
  const salesMetrics = useMemo(() => {
    const totalSales = 12700000;
    const ordersCount = 14;
    const avgTicket = totalSales / ordersCount;
    const cash = 1250000;
    const cards = 7450000;
    const transfer = 4000000;
    const posPercentage = 75;
    const onlinePercentage = 25;

    return {
      totalSales,
      ordersCount,
      avgTicket,
      cash,
      cards,
      transfer,
      posPercentage,
      onlinePercentage,
    };
  }, [startDate, endDate]);

  // Cálculo del Arqueo y Cierre de Caja
  const cashClosingSummary = useMemo(() => {
    let ingresosTotal = 0;
    let egresosTotal = 0;
    let efectivoTotal = 0;
    let debitoTotal = 0;
    let creditoTotal = 0;
    let transferTotal = 0;

    cashMovements.forEach((mov) => {
      if (mov.type === 'ingreso') {
        ingresosTotal += mov.amount;
        if (mov.paymentMethod === 'Efectivo') efectivoTotal += mov.amount;
        if (mov.paymentMethod === 'Débito') debitoTotal += mov.amount;
        if (mov.paymentMethod === 'Crédito') creditoTotal += mov.amount;
        if (mov.paymentMethod === 'Transferencia') transferTotal += mov.amount;
      } else {
        egresosTotal += mov.amount;
        if (mov.paymentMethod === 'Efectivo') efectivoTotal -= mov.amount;
      }
    });

    const saldoNetoCaja = ingresosTotal - egresosTotal;

    return {
      ingresosTotal,
      egresosTotal,
      saldoNetoCaja,
      efectivoTotal,
      debitoTotal,
      creditoTotal,
      transferTotal,
    };
  }, [cashMovements]);

  // Manejador para agregar movimiento de caja
  const handleAddCashMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementForm.concept.trim() || movementForm.amount <= 0) {
      alert('Por favor ingresa un concepto válido y un monto mayor a cero.');
      return;
    }

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    const newMov: CashMovement = {
      id: `MOV-${Date.now().toString().slice(-4)}`,
      time: timeStr,
      type: movementForm.type,
      concept: movementForm.concept,
      category: movementForm.category,
      paymentMethod: movementForm.paymentMethod,
      amount: movementForm.amount,
    };

    setCashMovements([newMov, ...cashMovements]);
    setShowMovementModal(false);
    setMovementForm({
      type: 'egreso',
      concept: '',
      category: 'Gastos Generales',
      paymentMethod: 'Efectivo',
      amount: 0,
    });
  };

  // ========================================================
  // GESTIÓN DE SERVICIOS DE TALLER (AGREGAR / EDITAR / BORRAR)
  // ========================================================
  const handleOpenAddService = () => {
    setEditingServiceId(null);
    setServiceFormData({
      title: '',
      description: '',
      duration: '24 hs',
      price: 0,
    });
    setShowServiceModal(true);
  };

  const handleOpenEditService = (srv: WorkshopServiceItem) => {
    setEditingServiceId(srv.id);
    setServiceFormData({
      title: srv.title,
      description: srv.description,
      duration: srv.duration,
      price: srv.price,
    });
    setShowServiceModal(true);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceFormData.title.trim() || serviceFormData.price <= 0) {
      alert('Por favor completa el nombre del servicio y un precio válido.');
      return;
    }

    if (editingServiceId) {
      WorkshopService.updateService(editingServiceId, serviceFormData);
    } else {
      WorkshopService.addService(serviceFormData);
    }

    setWorkshopServices(WorkshopService.getServices());
    setShowServiceModal(false);
  };

  const handleDeleteService = (srv: WorkshopServiceItem) => {
    if (confirm(`¿Estás seguro de que deseas eliminar el servicio "${srv.title}"?`)) {
      WorkshopService.deleteService(srv.id);
      setWorkshopServices(WorkshopService.getServices());
    }
  };

  // ========================================================
  // GESTIÓN DE INVENTARIO: COSTO, MARGEN % Y PRECIO DE VENTA
  // ========================================================
  const handleUpdateCost = (productId: string, variantId: string, newCost: number) => {
    setProducts((prev) => {
      const updated = prev.map((p) => {
        if (p.id === productId) {
          return {
            ...p,
            variants: p.variants.map((v) => {
              if (v.id === variantId) {
                const cost = Math.max(0, newCost);
                const margin = v.profit_margin_percent ?? 50;
                const price = Math.round(cost * (1 + margin / 100));
                return { ...v, cost, price, profit_margin_percent: margin };
              }
              return v;
            }),
          };
        }
        return p;
      });
      try {
        localStorage.setItem('orono_custom_bikes', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleUpdateMargin = (productId: string, variantId: string, newMargin: number) => {
    setProducts((prev) => {
      const updated = prev.map((p) => {
        if (p.id === productId) {
          return {
            ...p,
            variants: p.variants.map((v) => {
              if (v.id === variantId) {
                const margin = Math.max(0, newMargin);
                const cost = v.cost ?? Math.round(v.price * 0.65);
                const price = Math.round(cost * (1 + margin / 100));
                return { ...v, cost, profit_margin_percent: margin, price };
              }
              return v;
            }),
          };
        }
        return p;
      });
      try {
        localStorage.setItem('orono_custom_bikes', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleUpdatePrice = (productId: string, variantId: string, newPrice: number) => {
    setProducts((prev) => {
      const updated = prev.map((p) => {
        if (p.id === productId) {
          return {
            ...p,
            variants: p.variants.map((v) => {
              if (v.id === variantId) {
                const price = Math.max(0, newPrice);
                let margin = v.profit_margin_percent ?? 50;
                if (v.cost && v.cost > 0) {
                  margin = Math.round(((price - v.cost) / v.cost) * 100);
                }
                return { ...v, price, profit_margin_percent: margin };
              }
              return v;
            }),
          };
        }
        return p;
      });
      try {
        localStorage.setItem('orono_custom_bikes', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleUpdateStock = (productId: string, variantId: string, delta: number) => {
    setProducts((prev) => {
      const updated = prev.map((p) => {
        if (p.id === productId) {
          return {
            ...p,
            variants: p.variants.map((v) =>
              v.id === variantId ? { ...v, stock: Math.max(0, v.stock + delta) } : v
            ),
          };
        }
        return p;
      });
      try {
        localStorage.setItem('orono_custom_bikes', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Ajuste Masivo de Precios
  const handleBulkPriceAdjustment = () => {
    const factor = 1 + bulkPercent / 100;
    setProducts((prev) => {
      const updated = prev.map((p) => ({
        ...p,
        variants: p.variants.map((v) => {
          const newPrice = Math.round(v.price * factor);
          return {
            ...v,
            price: newPrice,
          };
        }),
      }));
      try {
        localStorage.setItem('orono_custom_bikes', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setShowBulkModal(false);
    alert(`Se incrementaron todos los precios del catálogo en un +${bulkPercent}%.`);
  };

  // Borrar variante individual
  const handleDeleteVariant = (productId: string, variantId: string, variantName: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar la variante "${variantName}"?`)) {
      setProducts((prev) => {
        const updated = prev
          .map((p) => {
            if (p.id !== productId) return p;
            const remainingVariants = p.variants.filter((v) => v.id !== variantId);
            if (remainingVariants.length === 0) return null;
            return { ...p, variants: remainingVariants };
          })
          .filter(Boolean) as ProductWithVariants[];

        try {
          localStorage.setItem('orono_custom_bikes', JSON.stringify(updated));
        } catch (e) {}

        return updated;
      });
    }
  };

  // Filtrado de Inventario
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchBrand = selectedBrand === 'Todas' || p.brand.toUpperCase() === selectedBrand.toUpperCase();
      const matchCat = selectedCategory === 'Todas' || p.category.toUpperCase() === selectedCategory.toUpperCase();
      const matchSearch =
        !searchQuery.trim() ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.variants.some((v) => v.sku.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchBrand && matchCat && matchSearch;
    });
  }, [products, selectedBrand, selectedCategory, searchQuery]);

  const totalStockValue = useMemo(() => {
    return products.reduce(
      (acc, p) => acc + p.variants.reduce((vAcc, v) => vAcc + v.price * v.stock, 0),
      0
    );
  }, [products]);

  const totalUnitsInStock = useMemo(() => {
    return products.reduce(
      (acc, p) => acc + p.variants.reduce((vAcc, v) => vAcc + v.stock, 0),
      0
    );
  }, [products]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col font-sans text-zinc-900 pb-20">
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
              Administración de ventas, punto de venta (POS), inventario con costos & márgenes, servicios de taller y caja.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/productos/nuevo"
              className="bg-white hover:bg-zinc-100 text-zinc-950 font-heading text-xs font-black uppercase tracking-wider px-5 py-3 rounded-xl flex items-center gap-2 shadow-lg transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4" /> Cargar Nuevo Artículo
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
                ? 'border-emerald-500 text-emerald-400 font-black'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MonitorDot className="w-4 h-4" /> POS Mostrador
          </button>
          <button
            onClick={() => setActiveTab('caja')}
            className={`px-5 py-3 font-heading text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'caja'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Banknote className="w-4 h-4" /> Cierre & Arqueo de Caja
          </button>
          <button
            onClick={() => setActiveTab('inventario')}
            className={`px-5 py-3 font-heading text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'inventario'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Package className="w-4 h-4" /> Inventario, Costos & Márgenes
          </button>
          <button
            onClick={() => setActiveTab('taller')}
            className={`px-5 py-3 font-heading text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'taller'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Wrench className="w-4 h-4" /> Taller & Servicios
          </button>
          <button
            onClick={() => setActiveTab('facturacion')}
            className={`px-5 py-3 font-heading text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'facturacion'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Receipt className="w-4 h-4" /> Facturación ARCA
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {/* ========================================================= */}
        {/* TAB 1: CONTROL DE VENTAS Y FECHAS                         */}
        {/* ========================================================= */}
        {activeTab === 'ventas' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Barra de Filtro de Fechas y Calendario */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-zinc-950 font-heading font-black text-sm">
                <CalendarIcon className="w-5 h-5 text-zinc-700" />
                <span>Rango de Facturación:</span>
              </div>

              {/* Botones de Presets Rápidos */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleSelectPreset('hoy')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-heading font-bold uppercase transition-all ${
                    datePreset === 'hoy'
                      ? 'bg-zinc-950 text-white shadow-xs'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  Hoy
                </button>
                <button
                  onClick={() => handleSelectPreset('ayer')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-heading font-bold uppercase transition-all ${
                    datePreset === 'ayer'
                      ? 'bg-zinc-950 text-white shadow-xs'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  Ayer
                </button>
                <button
                  onClick={() => handleSelectPreset('semana')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-heading font-bold uppercase transition-all ${
                    datePreset === 'semana'
                      ? 'bg-zinc-950 text-white shadow-xs'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  Últimos 7 Días
                </button>
                <button
                  onClick={() => handleSelectPreset('mes')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-heading font-bold uppercase transition-all ${
                    datePreset === 'mes'
                      ? 'bg-zinc-950 text-white shadow-xs'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  Este Mes
                </button>
              </div>

              {/* Selector de Rango Personalizado: Desde - Hasta */}
              <div className="flex items-center gap-2 text-xs font-heading font-bold bg-zinc-50 p-2 rounded-2xl border border-zinc-200">
                <span className="text-zinc-500 uppercase text-[10px] pl-1">Desde:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDatePreset('custom');
                  }}
                  className="px-2 py-1 bg-white border border-zinc-300 rounded-lg text-xs font-mono font-bold text-zinc-800 focus:outline-none focus:border-zinc-950"
                />
                <span className="text-zinc-500 uppercase text-[10px]">Hasta:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDatePreset('custom');
                  }}
                  className="px-2 py-1 bg-white border border-zinc-300 rounded-lg text-xs font-mono font-bold text-zinc-800 focus:outline-none focus:border-zinc-950"
                />
              </div>
            </div>

            {/* KPIs Principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs">
                <div className="flex items-center justify-between text-zinc-400 mb-3">
                  <span className="text-xs font-heading font-bold uppercase tracking-wider text-zinc-500">
                    Facturación Período
                  </span>
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-heading font-black text-zinc-950 font-mono">
                  ${salesMetrics.totalSales.toLocaleString('es-AR')}
                </div>
                <div className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +18.4% vs. período anterior
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs">
                <div className="flex items-center justify-between text-zinc-400 mb-3">
                  <span className="text-xs font-heading font-bold uppercase tracking-wider text-zinc-500">
                    Operaciones Cerradas
                  </span>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-heading font-black text-zinc-950 font-mono">
                  {salesMetrics.ordersCount}
                </div>
                <div className="text-xs text-zinc-500 mt-2">Ventas POS & Online</div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs">
                <div className="flex items-center justify-between text-zinc-400 mb-3">
                  <span className="text-xs font-heading font-bold uppercase tracking-wider text-zinc-500">
                    Ticket Promedio
                  </span>
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <Receipt className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-heading font-black text-zinc-950 font-mono">
                  ${Math.round(salesMetrics.avgTicket).toLocaleString('es-AR')}
                </div>
                <div className="text-xs text-zinc-500 mt-2">Por cliente atendido</div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs">
                <div className="flex items-center justify-between text-zinc-400 mb-3">
                  <span className="text-xs font-heading font-bold uppercase tracking-wider text-zinc-500">
                    Valor Stock en Local
                  </span>
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                    <Package className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-heading font-black text-zinc-950 font-mono">
                  ${totalStockValue.toLocaleString('es-AR')}
                </div>
                <div className="text-xs text-zinc-500 mt-2">{totalUnitsInStock} unidades en stock</div>
              </div>
            </div>

            {/* Desglose por Medios de Pago & Canales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-xs">
                <h3 className="font-heading font-black text-base text-zinc-950 mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Distribución por Canal de Venta
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-heading font-bold mb-1.5">
                      <span>Mostrador Local / POS (Bv. Oroño 1234)</span>
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

              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-xs">
                <h3 className="font-heading font-black text-base text-zinc-950 mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Cobranzas por Medio de Pago
                </h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <CreditCard className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                    <span className="text-[10px] font-heading font-bold text-zinc-400 block uppercase">
                      Tarjetas 3 y 6 Cuotas
                    </span>
                    <strong className="text-xs font-mono font-bold text-zinc-900">
                      ${salesMetrics.cards.toLocaleString('es-AR')}
                    </strong>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <Zap className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                    <span className="text-[10px] font-heading font-bold text-zinc-400 block uppercase">
                      Transferencia (10% OFF)
                    </span>
                    <strong className="text-xs font-mono font-bold text-zinc-900">
                      ${salesMetrics.transfer.toLocaleString('es-AR')}
                    </strong>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
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
        {/* TAB 2: CIERRE & ARQUEO DE CAJA DIARIA CON DETALLE         */}
        {/* ========================================================= */}
        {activeTab === 'caja' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-heading font-black text-zinc-950">
                  Arqueo & Cierre de Caja Diario
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Control en tiempo real de ingresos por ventas y egresos/gastos operativos del local.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowMovementModal(true)}
                  className="bg-zinc-950 hover:bg-zinc-800 text-white font-heading text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" /> Registrar Ingreso / Egreso
                </button>
                <button
                  onClick={() => alert('Imprimiendo reporte oficial de cierre de caja del día...')}
                  className="p-2.5 border border-zinc-300 hover:bg-zinc-50 rounded-xl text-zinc-700"
                  title="Imprimir Arqueo"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal de Registro de Movimiento Manual */}
            {showMovementModal && (
              <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-zinc-200 animate-fadeIn">
                  <h3 className="text-xl font-heading font-black text-zinc-950 mb-2">
                    Nuevo Movimiento de Caja
                  </h3>
                  <p className="text-xs text-zinc-600 mb-6">
                    Registra un gasto, retiro de efectivo o ingreso manual no proveniente del POS.
                  </p>

                  <form onSubmit={handleAddCashMovement} className="space-y-4">
                    <div>
                      <label className="block text-xs font-heading font-bold uppercase text-zinc-700 mb-1.5">
                        Tipo de Movimiento *
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setMovementForm({ ...movementForm, type: 'egreso' })}
                          className={`py-2.5 rounded-xl font-heading text-xs font-bold uppercase transition-all ${
                            movementForm.type === 'egreso'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                          }`}
                        >
                          - Egreso / Gasto
                        </button>
                        <button
                          type="button"
                          onClick={() => setMovementForm({ ...movementForm, type: 'ingreso' })}
                          className={`py-2.5 rounded-xl font-heading text-xs font-bold uppercase transition-all ${
                            movementForm.type === 'ingreso'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                          }`}
                        >
                          + Ingreso Extra
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-heading font-bold uppercase text-zinc-700 mb-1">
                        Concepto / Motivo *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Pago de flete / Repuestos / Almuerzo"
                        value={movementForm.concept}
                        onChange={(e) =>
                          setMovementForm({ ...movementForm, concept: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-heading font-bold uppercase text-zinc-700 mb-1">
                        Medio de Pago / Caja *
                      </label>
                      <select
                        value={movementForm.paymentMethod}
                        onChange={(e) =>
                          setMovementForm({
                            ...movementForm,
                            paymentMethod: e.target.value as any,
                          })
                        }
                        className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-heading font-bold uppercase focus:bg-white focus:outline-none"
                      >
                        <option value="Efectivo">Efectivo Mostrador</option>
                        <option value="Transferencia">Transferencia Bancaria</option>
                        <option value="Débito">Débito</option>
                        <option value="Crédito">Crédito</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-heading font-bold uppercase text-zinc-700 mb-1">
                        Monto ($ ARS) *
                      </label>
                      <input
                        type="number"
                        required
                        placeholder="0"
                        value={movementForm.amount || ''}
                        onChange={(e) =>
                          setMovementForm({
                            ...movementForm,
                            amount: Number(e.target.value),
                          })
                        }
                        className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-base font-mono font-bold focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-3">
                      <button
                        type="button"
                        onClick={() => setShowMovementModal(false)}
                        className="px-5 py-2.5 border border-zinc-300 rounded-xl text-xs font-heading font-bold uppercase text-zinc-700"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="bg-zinc-950 text-white px-5 py-2.5 rounded-xl text-xs font-heading font-bold uppercase tracking-wider hover:bg-zinc-800 shadow-md"
                      >
                        Guardar Movimiento
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* TABLA DE DETALLE DE INGRESOS Y EGRESOS DEL DÍA */}
            <div className="bg-white rounded-3xl border border-zinc-200 shadow-xs overflow-hidden">
              <div className="p-6 border-b border-zinc-200 flex justify-between items-center bg-zinc-50/50">
                <div>
                  <h3 className="text-base font-heading font-black text-zinc-950">
                    Detalle Cronológico de Movimientos
                  </h3>
                  <span className="text-xs text-zinc-500">
                    Historial de entradas y salidas de fondos registradas hoy.
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-zinc-600 bg-white border border-zinc-200 px-3 py-1.5 rounded-xl">
                  {cashMovements.length} Registros
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-100/80 border-b border-zinc-200 text-zinc-600 font-heading font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Hora</th>
                      <th className="py-3 px-4">Tipo</th>
                      <th className="py-3 px-4">Concepto / Motivo</th>
                      <th className="py-3 px-4">Categoría</th>
                      <th className="py-3 px-4">Medio de Pago</th>
                      <th className="py-3 px-4 text-right">Monto ($ ARS)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 font-medium">
                    {cashMovements.map((mov) => (
                      <tr key={mov.id} className="hover:bg-zinc-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono text-zinc-500">{mov.time} hs</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-heading font-bold uppercase ${
                              mov.type === 'ingreso'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {mov.type === 'ingreso' ? '+' : '-'} {mov.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-heading font-bold text-zinc-900">{mov.concept}</td>
                        <td className="py-3 px-4 text-zinc-500">{mov.category}</td>
                        <td className="py-3 px-4">
                          <span className="font-heading font-bold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded">
                            {mov.paymentMethod}
                          </span>
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-mono font-bold text-sm ${
                            mov.type === 'ingreso' ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {mov.type === 'ingreso' ? '+' : '-'}${mov.amount.toLocaleString('es-AR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RESUMEN FINANCIERO DEL DÍA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white p-6 rounded-3xl border-2 border-emerald-500/80 shadow-md">
                <span className="text-[10px] font-heading font-black uppercase tracking-wider text-emerald-700 block mb-1">
                  Efectivo Físico en Caja
                </span>
                <div className="text-2xl font-mono font-black text-zinc-950">
                  ${cashClosingSummary.efectivoTotal.toLocaleString('es-AR')}
                </div>
                <span className="text-[11px] text-zinc-500 mt-1 block">Disponible para arqueo</span>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs">
                <span className="text-[10px] font-heading font-black uppercase tracking-wider text-zinc-500 block mb-1">
                  Cobros POS Débito / Crédito
                </span>
                <div className="text-2xl font-mono font-black text-zinc-950">
                  ${(cashClosingSummary.debitoTotal + cashClosingSummary.creditoTotal).toLocaleString('es-AR')}
                </div>
                <span className="text-[11px] text-zinc-500 mt-1 block">Acredita en cuenta comercio</span>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs">
                <span className="text-[10px] font-heading font-black uppercase tracking-wider text-zinc-500 block mb-1">
                  Transferencias Acreditadas
                </span>
                <div className="text-2xl font-mono font-black text-zinc-950">
                  ${cashClosingSummary.transferTotal.toLocaleString('es-AR')}
                </div>
                <span className="text-[11px] text-zinc-500 mt-1 block">Home Banking CBU/Alias</span>
              </div>

              <div className="bg-zinc-950 text-white p-6 rounded-3xl shadow-xl">
                <span className="text-[10px] font-heading font-black uppercase tracking-wider text-emerald-400 block mb-1">
                  Total Neto Operativo del Día
                </span>
                <div className="text-2xl font-mono font-black text-white">
                  ${cashClosingSummary.saldoNetoCaja.toLocaleString('es-AR')}
                </div>
                <span className="text-[11px] text-zinc-400 mt-1 block">
                  Ingresos: ${cashClosingSummary.ingresosTotal.toLocaleString('es-AR')} | Egresos: ${cashClosingSummary.egresosTotal.toLocaleString('es-AR')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: POS MOSTRADOR                                      */}
        {/* ========================================================= */}
        {activeTab === 'pos' && (
          <div className="space-y-6 animate-fadeIn">
            <PointOfSaleInterface />
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: INVENTARIO, COSTOS & MARGEN DE GANANCIA (%)        */}
        {/* ========================================================= */}
        {activeTab === 'inventario' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header de Inventario */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-xl font-heading font-black text-zinc-950">
                    Gestión de Inventario, Costos & Precios de Venta
                  </h2>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Edita el <strong>Costo ($)</strong> o el <strong>Margen (%)</strong> para recalcular en tiempo real el precio de venta final al público.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowBulkModal(true)}
                  className="bg-zinc-950 hover:bg-zinc-800 text-white font-heading text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
                >
                  <Percent className="w-3.5 h-3.5" /> Ajuste Masivo (%)
                </button>
                <Link
                  href="/admin/productos/nuevo"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-heading text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> + Cargar Artículo
                </Link>
              </div>
            </div>

            {/* Buscador y Filtros */}
            <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Buscar en inventario por modelo, marca (Scott, Shimano), SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
                />
              </div>

              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-heading font-bold uppercase"
              >
                <option value="Todas">Todas las Marcas</option>
                <option value="SCOTT">Scott</option>
                <option value="VOLTA">Volta</option>
                <option value="RALEIGH">Raleigh</option>
                <option value="MOOVE">Moove</option>
                <option value="ZION">Zion</option>
                <option value="SARS">Sars</option>
                <option value="SHIMANO">Shimano</option>
                <option value="MAXXIS">Maxxis</option>
                <option value="ROCKSHOX">RockShox</option>
                <option value="FOX">Fox</option>
                <option value="GARMIN">Garmin</option>
                <option value="KRYPTONITE">Kryptonite</option>
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-heading font-bold uppercase"
              >
                <option value="Todas">Todas las Categorías</option>
                <option value="MTB">MTB</option>
                <option value="RUTA">Ruta</option>
                <option value="GRAVEL">Gravel</option>
                <option value="BMX">BMX</option>
                <option value="COMPONENTES">Componentes</option>
                <option value="ACCESORIOS">Accesorios</option>
              </select>
            </div>

            {/* Modal de Ajuste Masivo */}
            {showBulkModal && (
              <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-zinc-200 animate-fadeIn">
                  <h3 className="text-xl font-heading font-black text-zinc-950 mb-2">
                    Actualización Masiva de Precios
                  </h3>
                  <p className="text-xs text-zinc-600 mb-6">
                    Aplica un porcentaje de aumento o descuento a todos los artículos en inventario simultáneamente.
                  </p>

                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-xs font-heading font-bold uppercase text-zinc-700 mb-1">
                        Porcentaje de Ajuste (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={bulkPercent}
                          onChange={(e) => setBulkPercent(Number(e.target.value))}
                          className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-xl text-lg font-mono font-bold focus:outline-none"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-zinc-400">
                          %
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {[5, 10, 15, 20].map((pct) => (
                        <button
                          key={pct}
                          onClick={() => setBulkPercent(pct)}
                          className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-xs font-heading font-bold"
                        >
                          +{pct}%
                        </button>
                      ))}
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
                      Aplicar Ajuste Masivo
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TABLA DE INVENTARIO CON COSTO, MARGEN %, PRECIO Y GANANCIA */}
            <div className="bg-white rounded-3xl border border-zinc-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-100/90 border-b border-zinc-200 text-zinc-600 font-heading font-black uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Producto / Modelo</th>
                      <th className="py-3.5 px-3">Marca</th>
                      <th className="py-3.5 px-3">Categoría</th>
                      <th className="py-3.5 px-3">Variante</th>
                      <th className="py-3.5 px-3 bg-zinc-50">Costo ($ ARS)</th>
                      <th className="py-3.5 px-3 bg-zinc-50">Margen (%)</th>
                      <th className="py-3.5 px-3 bg-emerald-50/70 text-emerald-950">Precio Venta ($)</th>
                      <th className="py-3.5 px-3 text-emerald-700">Ganancia / u.</th>
                      <th className="py-3.5 px-3 text-center">Stock</th>
                      <th className="py-3.5 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 font-medium">
                    {filteredProducts.map((p) =>
                      p.variants.map((v) => {
                        const estimatedCost = v.cost ?? Math.round(v.price / 1.5);
                        const marginPct = v.profit_margin_percent ?? Math.round(((v.price - estimatedCost) / estimatedCost) * 100);
                        const unitProfit = v.price - estimatedCost;

                        return (
                          <tr key={`${p.id}-${v.id}`} className="hover:bg-zinc-50/90 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={p.images[0]}
                                  alt={p.title}
                                  className="w-11 h-11 object-cover rounded-xl bg-zinc-100 border border-zinc-200 shrink-0"
                                />
                                <div>
                                  <span className="font-heading font-bold text-zinc-950 block text-xs">
                                    {p.title}
                                  </span>
                                  <span className="text-[10px] font-mono text-zinc-400">SKU: {v.sku}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 font-heading font-bold text-zinc-700">{p.brand}</td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 bg-zinc-100 rounded text-[10px] font-heading font-bold text-zinc-600 uppercase">
                                {p.category}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-zinc-700">
                              <strong>{v.size}</strong> • {v.color}
                            </td>

                            {/* Columna Costo Editable */}
                            <td className="py-3 px-3 bg-zinc-50/70 font-mono">
                              <div className="flex items-center gap-1">
                                <span className="text-zinc-400">$</span>
                                <input
                                  type="number"
                                  value={estimatedCost}
                                  onChange={(e) =>
                                    handleUpdateCost(p.id, v.id, Number(e.target.value))
                                  }
                                  className="w-24 px-2 py-1 bg-white border border-zinc-300 rounded-lg text-xs font-mono font-bold focus:border-zinc-950 focus:outline-none"
                                  title="Editar costo unitario"
                                />
                              </div>
                            </td>

                            {/* Columna Margen % Editable */}
                            <td className="py-3 px-3 bg-zinc-50/70 font-mono">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={marginPct}
                                  onChange={(e) =>
                                    handleUpdateMargin(p.id, v.id, Number(e.target.value))
                                  }
                                  className="w-16 px-2 py-1 bg-white border border-zinc-300 rounded-lg text-xs font-mono font-bold text-center focus:border-zinc-950 focus:outline-none"
                                  title="Editar margen de ganancia en %"
                                />
                                <span className="text-zinc-500 font-bold">%</span>
                              </div>
                            </td>

                            {/* Columna Precio de Venta Calculado / Editable */}
                            <td className="py-3 px-3 bg-emerald-50/50 font-mono font-bold text-zinc-950">
                              <div className="flex items-center gap-1">
                                <span className="text-emerald-700 font-black">$</span>
                                <input
                                  type="number"
                                  value={v.price}
                                  onChange={(e) =>
                                    handleUpdatePrice(p.id, v.id, Number(e.target.value))
                                  }
                                  className="w-28 px-2 py-1 bg-white border-2 border-emerald-400 rounded-lg font-mono text-xs font-black text-zinc-950 focus:bg-white focus:border-zinc-950 focus:outline-none"
                                  title="Precio de venta al público"
                                />
                              </div>
                            </td>

                            {/* Ganancia Neta Calculada */}
                            <td className="py-3 px-3 font-mono font-bold text-xs text-emerald-700">
                              +{formatCurrency(unitProfit)}
                            </td>

                            {/* Stock Físico */}
                            <td className="py-3 px-3 text-center">
                              <div className="inline-flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-lg p-0.5">
                                <button
                                  onClick={() => handleUpdateStock(p.id, v.id, -1)}
                                  className="w-5 h-5 rounded bg-white hover:bg-zinc-200 font-bold flex items-center justify-center border border-zinc-200 text-zinc-700"
                                >
                                  -
                                </button>
                                <span
                                  className={`w-6 text-center font-heading font-bold text-xs ${
                                    v.stock <= 1 ? 'text-rose-600' : 'text-zinc-900'
                                  }`}
                                >
                                  {v.stock}
                                </span>
                                <button
                                  onClick={() => handleUpdateStock(p.id, v.id, 1)}
                                  className="w-5 h-5 rounded bg-white hover:bg-zinc-200 font-bold flex items-center justify-center border border-zinc-200 text-zinc-700"
                                >
                                  +
                                </button>
                              </div>
                            </td>

                            {/* Acciones */}
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() =>
                                  handleDeleteVariant(
                                    p.id,
                                    v.id,
                                    `${p.title} - ${v.size} / ${v.color}`
                                  )
                                }
                                title="Borrar esta variante (talle/color)"
                                className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors inline-flex items-center gap-1 text-[11px] font-heading font-bold"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Borrar
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: TALLER & GESTIÓN DE SERVICIOS Y PRECIOS            */}
        {/* ========================================================= */}
        {activeTab === 'taller' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Sub-navegación entre Turnos y Servicios */}
            <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-heading font-black text-zinc-950 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-zinc-950" /> Taller Mecánico Especializado
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Administra los turnos de reparación y configura los <strong>servicios, tiempos de entrega y precios oficiales</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWorkshopSubTab('turnos')}
                  className={`px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase transition-all ${
                    workshopSubTab === 'turnos'
                      ? 'bg-zinc-950 text-white shadow-xs'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  Turnos & Reparaciones ({workshopTickets.length})
                </button>
                <button
                  onClick={() => setWorkshopSubTab('servicios')}
                  className={`px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase transition-all flex items-center gap-1.5 ${
                    workshopSubTab === 'servicios'
                      ? 'bg-zinc-950 text-white shadow-xs'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" /> Servicios & Tarifas ({workshopServices.length})
                </button>
              </div>
            </div>

            {/* VISTA 1: GESTIÓN DE SERVICIOS Y PRECIOS DE TALLER (CRUD) */}
            {workshopSubTab === 'servicios' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-center bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
                  <div>
                    <h3 className="text-sm font-heading font-black text-zinc-900">
                      Catálogo de Trabajos Mecánicos y Precios
                    </h3>
                    <span className="text-xs text-zinc-500">
                      Los cambios de precio se reflejan automáticamente en la web de turnos y en el POS Mostrador.
                    </span>
                  </div>
                  <button
                    onClick={handleOpenAddService}
                    className="bg-zinc-950 hover:bg-zinc-800 text-white font-heading text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md transition-transform active:scale-95"
                  >
                    <Plus className="w-4 h-4" /> + Nuevo Servicio
                  </button>
                </div>

                {/* Grid de Servicios */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {workshopServices.map((srv) => (
                    <div
                      key={srv.id}
                      className="bg-white p-6 rounded-3xl border border-zinc-200 hover:border-zinc-400 shadow-xs flex flex-col justify-between transition-all"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[10px] font-mono font-bold text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-lg">
                            Demora: {srv.duration}
                          </span>
                          <span className="text-base font-mono font-black text-zinc-950">
                            {formatCurrency(srv.price)}
                          </span>
                        </div>

                        <h4 className="font-heading font-black text-base text-zinc-950 mb-2 leading-snug">
                          {srv.title}
                        </h4>
                        <p className="text-xs text-zinc-600 leading-relaxed mb-6">
                          {srv.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-4 border-t border-zinc-100">
                        <button
                          onClick={() => handleOpenEditService(srv)}
                          className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-xs font-heading font-bold uppercase text-zinc-800 flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" /> Modificar
                        </button>
                        <button
                          onClick={() => handleDeleteService(srv)}
                          className="p-2 text-zinc-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                          title="Borrar Servicio"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Modal para Agregar o Modificar Servicio */}
                {showServiceModal && (
                  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-zinc-200 animate-fadeIn">
                      <div className="flex items-center gap-2 mb-2">
                        <Wrench className="w-5 h-5 text-zinc-900" />
                        <h3 className="text-xl font-heading font-black text-zinc-950">
                          {editingServiceId ? 'Modificar Servicio de Taller' : 'Nuevo Servicio de Taller'}
                        </h3>
                      </div>
                      <p className="text-xs text-zinc-500 mb-6">
                        Define el título, la descripción de las tareas mecánicas, el tiempo estimado y la tarifa en pesos.
                      </p>

                      <form onSubmit={handleSaveService} className="space-y-4">
                        <div>
                          <label className="block text-xs font-heading font-bold uppercase text-zinc-700 mb-1">
                            Nombre del Servicio *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ej. Service General & Puesta a Punto"
                            value={serviceFormData.title}
                            onChange={(e) =>
                              setServiceFormData({ ...serviceFormData, title: e.target.value })
                            }
                            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-heading font-bold uppercase text-zinc-700 mb-1">
                            Descripción del Trabajo *
                          </label>
                          <textarea
                            rows={3}
                            required
                            placeholder="Detalla qué incluye el servicio (ej. ajuste de cambios, purga, lubricación, centrado)..."
                            value={serviceFormData.description}
                            onChange={(e) =>
                              setServiceFormData({ ...serviceFormData, description: e.target.value })
                            }
                            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-heading font-bold uppercase text-zinc-700 mb-1">
                              Tiempo de Demora *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Ej. 24 hs / 48 hs / 72 hs"
                              value={serviceFormData.duration}
                              onChange={(e) =>
                                setServiceFormData({ ...serviceFormData, duration: e.target.value })
                              }
                              className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-heading font-bold uppercase text-zinc-700 mb-1">
                              Precio ($ ARS) *
                            </label>
                            <input
                              type="number"
                              required
                              placeholder="0"
                              value={serviceFormData.price || ''}
                              onChange={(e) =>
                                setServiceFormData({
                                  ...serviceFormData,
                                  price: Number(e.target.value),
                                })
                              }
                              className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-mono font-bold focus:bg-white focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                          <button
                            type="button"
                            onClick={() => setShowServiceModal(false)}
                            className="px-5 py-2.5 border border-zinc-300 rounded-xl text-xs font-heading font-bold uppercase text-zinc-700 hover:bg-zinc-50"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="bg-zinc-950 text-white px-6 py-2.5 rounded-xl text-xs font-heading font-bold uppercase tracking-wider hover:bg-zinc-800 shadow-md"
                          >
                            {editingServiceId ? 'Guardar Modificación' : 'Crear Servicio'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* VISTA 2: TURNOS & REPARACIONES KANBAN */}
            {workshopSubTab === 'turnos' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {workshopTickets.map((t) => (
                    <div
                      key={t.id}
                      className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[11px] font-mono font-bold text-zinc-400">
                            #{t.id}
                          </span>
                          <select
                            value={t.status}
                            onChange={(e) => {
                              const newStatus = e.target.value;
                              setWorkshopTickets((prev) =>
                                prev.map((item) =>
                                  item.id === t.id ? { ...item, status: newStatus } : item
                                )
                              );
                            }}
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

                        <div className="p-3 bg-zinc-50 rounded-2xl space-y-1 text-xs text-zinc-600 mb-4">
                          <div>
                            <strong>Cliente:</strong> {t.client}
                          </div>
                          <div>
                            <strong>Fecha de Turno:</strong> {t.date}
                          </div>
                          <div className="text-zinc-950 font-mono font-bold pt-1">
                            Costo Estimado: {formatCurrency(t.price)}
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
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: FACTURACIÓN & EMISIÓN DE COMPROBANTES             */}
        {/* ========================================================= */}
        {activeTab === 'facturacion' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
            {/* Formulario de Emisión Rápida */}
            <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-xs">
              <h2 className="text-lg font-heading font-black text-zinc-950 mb-4 flex items-center gap-2">
                <Receipt className="w-5 h-5" /> Nueva Factura Electrónica
              </h2>
              <form
                onSubmit={(e) => {
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
                }}
                className="space-y-4"
              >
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
            <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-xs">
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
                    className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
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
                        className="p-2 border border-zinc-300 rounded-xl hover:bg-white text-zinc-600"
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
      </main>
    </div>
  );
}
