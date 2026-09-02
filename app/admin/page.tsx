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
  Calendar as CalendarIcon,
  Layers,
  Bike,
  MonitorDot,
  MinusCircle,
  PlusCircle,
  Download,
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

  // Estado de Cierre de Caja (Ingresos y Egresos)
  const [openingBalance, setOpeningBalance] = useState<number>(150000); // Fondo de cambio inicial
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

  // Modal para agregar nuevo movimiento manual de caja (Ingreso o Egreso)
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

  // Actualizar fechas según el preset
  const handleSelectDatePreset = (preset: DatePreset) => {
    setDatePreset(preset);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === 'hoy') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'ayer') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      setStartDate(yesterdayStr);
      setEndDate(yesterdayStr);
    } else if (preset === 'semana') {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - 7);
      setStartDate(startOfWeek.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'mes') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(startOfMonth.toISOString().split('T')[0]);
      setEndDate(todayStr);
    }
  };

  // Métricas dinámicas calculadas según el rango de fechas
  const salesMetrics = useMemo(() => {
    if (datePreset === 'hoy' || (startDate === endDate && startDate === new Date().toISOString().split('T')[0])) {
      return {
        totalRevenue: 3962000,
        ordersCount: 4,
        avgTicket: 990500,
        unitsSold: 4,
        onlinePercentage: 30,
        posPercentage: 70,
        cash: 270000,
        cards: 3800000,
        transfer: 42000,
      };
    }
    if (datePreset === 'ayer') {
      return {
        totalRevenue: 2850000,
        ordersCount: 3,
        avgTicket: 950000,
        unitsSold: 3,
        onlinePercentage: 40,
        posPercentage: 60,
        cash: 450000,
        cards: 1800000,
        transfer: 600000,
      };
    }
    if (datePreset === 'semana') {
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
    // Mes o personalizado
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
  }, [datePreset, startDate, endDate]);

  // Cálculos detallados de Cierre de Caja
  const cashClosingSummary = useMemo(() => {
    let totalIngresos = 0;
    let totalEgresos = 0;
    let cashIn = 0;
    let cashOut = 0;
    let debitCreditTotal = 0;
    let transferTotal = 0;

    cashMovements.forEach((m) => {
      if (m.type === 'ingreso') {
        totalIngresos += m.amount;
        if (m.paymentMethod === 'Efectivo') cashIn += m.amount;
        if (m.paymentMethod === 'Débito' || m.paymentMethod === 'Crédito')
          debitCreditTotal += m.amount;
        if (m.paymentMethod === 'Transferencia') transferTotal += m.amount;
      } else {
        totalEgresos += m.amount;
        if (m.paymentMethod === 'Efectivo') cashOut += m.amount;
      }
    });

    const cashInHand = cashIn - cashOut; // Efectivo real en cajón de mostrador

    return {
      totalIngresos,
      totalEgresos,
      cashInHand,
      debitCreditTotal,
      transferTotal,
      netTotal: totalIngresos - totalEgresos,
    };
  }, [cashMovements]);

  // Agregar movimiento manual a la caja
  const handleAddCashMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementForm.concept || movementForm.amount <= 0) {
      alert('Por favor complete la descripción y el monto.');
      return;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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

  // Dar de baja solo una variante específica (ej. un solo color o talle)
  const handleDeleteVariant = (productId: string, variantId: string, variantDesc: string) => {
    if (confirm(`¿Deseas eliminar solo la variante "${variantDesc}" de este modelo?`)) {
      setProducts((prev) => {
        const updated = prev
          .map((p) => {
            if (p.id !== productId) return p;
            const remainingVariants = p.variants.filter((v) => v.id !== variantId);
            if (remainingVariants.length === 0) return null; // Si no quedan variantes, se elimina el producto
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

  // Dar de baja el producto completo con todos sus colores
  const handleDeleteProduct = (productId: string, productTitle: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar el modelo completo "${productTitle}" y todos sus colores/variantes del catálogo?`)) {
      setProducts((prev) => {
        const updated = prev.filter((p) => p.id !== productId);
        try {
          localStorage.setItem('orono_custom_bikes', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
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
              Administración de ventas, punto de venta (POS), stock físico, actualización masiva de precios, taller y cierre de caja.
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
            onClick={() => setActiveTab('caja')}
            className={`px-5 py-3 font-heading text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'caja'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <DollarSign className="w-4 h-4" /> Cierre de Caja & Arqueo
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
            <Receipt className="w-4 h-4" /> Facturación
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
        </div>
      </div>

      {/* Tab Contents */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex-1">
        {/* ========================================================= */}
        {/* TAB 1: CONTROL DE VENTAS & SELECTOR DE CALENDARIO        */}
        {/* ========================================================= */}
        {activeTab === 'ventas' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Barra de Filtros con Selector de Calendario y Rango de Fechas */}
            <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 text-xs font-heading font-extrabold text-zinc-700 uppercase mr-2">
                  <CalendarIcon className="w-4 h-4 text-zinc-950" />
                  <span>Filtrar Período:</span>
                </div>

                <button
                  onClick={() => handleSelectDatePreset('hoy')}
                  className={`px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all ${
                    datePreset === 'hoy'
                      ? 'bg-zinc-950 text-white shadow-xs'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  Hoy
                </button>
                <button
                  onClick={() => handleSelectDatePreset('ayer')}
                  className={`px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all ${
                    datePreset === 'ayer'
                      ? 'bg-zinc-950 text-white shadow-xs'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  Ayer
                </button>
                <button
                  onClick={() => handleSelectDatePreset('semana')}
                  className={`px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all ${
                    datePreset === 'semana'
                      ? 'bg-zinc-950 text-white shadow-xs'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  Últimos 7 Días
                </button>
                <button
                  onClick={() => handleSelectDatePreset('mes')}
                  className={`px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all ${
                    datePreset === 'mes'
                      ? 'bg-zinc-950 text-white shadow-xs'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  Este Mes
                </button>
              </div>

              {/* Selector de Rango Personalizado (Desde / Hasta) */}
              <div className="flex flex-wrap items-center gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-zinc-100">
                <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-300 px-3 py-1.5 rounded-xl">
                  <span className="text-[11px] font-heading font-bold uppercase text-zinc-400">
                    Desde:
                  </span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setDatePreset('custom');
                    }}
                    className="bg-transparent text-xs font-bold text-zinc-900 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-300 px-3 py-1.5 rounded-xl">
                  <span className="text-[11px] font-heading font-bold uppercase text-zinc-400">
                    Hasta:
                  </span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setDatePreset('custom');
                    }}
                    className="bg-transparent text-xs font-bold text-zinc-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs">
                <div className="flex items-center justify-between text-zinc-400 mb-3">
                  <span className="text-xs font-heading font-bold uppercase tracking-wider text-zinc-500">
                    Facturación Total
                  </span>
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-heading font-black text-zinc-950 font-mono">
                  ${salesMetrics.totalRevenue.toLocaleString('es-AR')}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-2">
                  <ArrowUpRight className="w-3.5 h-3.5" /> Período: {startDate} al {endDate}
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs">
                <div className="flex items-center justify-between text-zinc-400 mb-3">
                  <span className="text-xs font-heading font-bold uppercase tracking-wider text-zinc-500">
                    Órdenes Concretadas
                  </span>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
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

              <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs">
                <div className="flex items-center justify-between text-zinc-400 mb-3">
                  <span className="text-xs font-heading font-bold uppercase tracking-wider text-zinc-500">
                    Ticket Promedio
                  </span>
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <Percent className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-heading font-black text-zinc-950 font-mono">
                  ${Math.round(salesMetrics.avgTicket).toLocaleString('es-AR')}
                </div>
                <div className="text-xs text-zinc-500 mt-2">Promedio por cliente</div>
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
                <div className="text-xs text-zinc-500 mt-2">{totalUnitsInStock} bicicletas en stock</div>
              </div>
            </div>

            {/* Desglose por Medios de Pago & Canales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Canales de Venta */}
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

              {/* Medios de Pago */}
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
            {/* Header del Cierre de Caja y Botón de Nuevo Movimiento */}
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
                  onClick={() =>
                    alert('Imprimiendo reporte oficial de cierre de caja del día...')
                  }
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
                          onClick={() =>
                            setMovementForm({ ...movementForm, type: 'egreso' })
                          }
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
                          onClick={() =>
                            setMovementForm({ ...movementForm, type: 'ingreso' })
                          }
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
              <div className="p-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                <h3 className="font-heading font-black text-sm text-zinc-950 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-zinc-500" /> Detalle Cronológico de Movimientos del Día
                </h3>
                <span className="text-xs text-zinc-500 font-mono">
                  {cashMovements.length} operaciones registradas
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-heading font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Hora</th>
                      <th className="py-3 px-4">Tipo</th>
                      <th className="py-3 px-4">Concepto / Detalle</th>
                      <th className="py-3 px-4">Categoría</th>
                      <th className="py-3 px-4">Medio de Pago</th>
                      <th className="py-3 px-4 text-right">Monto ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 font-medium">
                    {cashMovements.map((m) => (
                      <tr key={m.id} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono text-zinc-500">{m.time}</td>
                        <td className="py-3 px-4">
                          {m.type === 'ingreso' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-heading font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <PlusCircle className="w-3 h-3" /> Ingreso
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-heading font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <MinusCircle className="w-3 h-3" /> Egreso
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-heading font-bold text-zinc-900">
                          {m.concept}
                        </td>
                        <td className="py-3 px-4 text-zinc-500">{m.category}</td>
                        <td className="py-3 px-4 text-zinc-700">
                          <span className="px-2 py-1 bg-zinc-100 rounded-md text-[11px] font-mono">
                            {m.paymentMethod}
                          </span>
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-mono font-bold text-xs ${
                            m.type === 'ingreso' ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {m.type === 'ingreso' ? '+' : '-'}${m.amount.toLocaleString('es-AR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RESUMEN FINANCIERO DEL CIERRE DE CAJA */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-xs space-y-6">
              <h3 className="font-heading font-black text-lg text-zinc-950 border-b border-zinc-100 pb-3 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-zinc-950" /> Resumen Consolidado para el Cierre de Caja
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Efectivo en Mano */}
                <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-heading font-bold uppercase text-zinc-500">
                      Efectivo en Caja Físico
                    </span>
                    <Banknote className="w-4 h-4 text-sky-600" />
                  </div>
                  <div className="text-xl font-mono font-black text-zinc-950">
                    ${cashClosingSummary.cashInHand.toLocaleString('es-AR')}
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-1 block">
                    (Fondo inicial + Ventas cash - Gastos)
                  </span>
                </div>

                {/* Cobros POS Débito / Crédito */}
                <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-heading font-bold uppercase text-zinc-500">
                      Cobros POS Débito / Crédito
                    </span>
                    <CreditCard className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-xl font-mono font-black text-zinc-950">
                    ${cashClosingSummary.debitCreditTotal.toLocaleString('es-AR')}
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-1 block">
                    Acreditaciones por terminal de cobro
                  </span>
                </div>

                {/* Transferencias Bancarias */}
                <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-heading font-bold uppercase text-zinc-500">
                      Transferencias Acreditadas
                    </span>
                    <Zap className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-xl font-mono font-black text-zinc-950">
                    ${cashClosingSummary.transferTotal.toLocaleString('es-AR')}
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-1 block">
                    Comprobantes bancarios verificados
                  </span>
                </div>

                {/* Total Neto del Día */}
                <div className="p-5 bg-zinc-950 text-white rounded-2xl shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-heading font-black uppercase text-zinc-300">
                      Total Neto del Día
                    </span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-xl font-mono font-black text-emerald-400">
                    ${cashClosingSummary.netTotal.toLocaleString('es-AR')}
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-1 block">
                    Ingresos (${cashClosingSummary.totalIngresos.toLocaleString('es-AR')}) - Egresos (${cashClosingSummary.totalEgresos.toLocaleString('es-AR')})
                  </span>
                </div>
              </div>

              {/* Botón de Cierre de Caja Oficial */}
              <div className="pt-2 flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={() => {
                    const csvContent =
                      'data:text/csv;charset=utf-8,' +
                      'Hora,Tipo,Concepto,Medio,Monto\n' +
                      cashMovements
                        .map(
                          (m) =>
                            `${m.time},${m.type},"${m.concept}",${m.paymentMethod},${m.amount}`
                        )
                        .join('\n');
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement('a');
                    link.setAttribute('href', encodedUri);
                    link.setAttribute(
                      'download',
                      `cierre_caja_${new Date().toISOString().split('T')[0]}.csv`
                    );
                    document.body.appendChild(link);
                    link.click();
                  }}
                  className="px-6 py-3.5 border border-zinc-300 hover:border-zinc-950 rounded-xl font-heading text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Exportar Reporte Excel / CSV
                </button>

                <button
                  onClick={() =>
                    alert(
                      `¡Cierre de caja del día finalizado con éxito!\n\nEfectivo en caja: $${cashClosingSummary.cashInHand.toLocaleString(
                        'es-AR'
                      )}\nCobros POS: $${cashClosingSummary.debitCreditTotal.toLocaleString(
                        'es-AR'
                      )}\nTransferencias: $${cashClosingSummary.transferTotal.toLocaleString(
                        'es-AR'
                      )}\nTotal Neto: $${cashClosingSummary.netTotal.toLocaleString(
                        'es-AR'
                      )}`
                    )
                  }
                  className="bg-zinc-950 hover:bg-zinc-800 text-white px-8 py-3.5 rounded-xl font-heading text-xs font-black uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Realizar Cierre de Caja del Día
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: POS MOSTRADOR (PUNTO DE VENTA)                     */}
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
        {/* TAB 4: INVENTARIO, STOCK & PRECIOS (ABM)                  */}
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

            {/* Tabla de Artículos y Variantes con Fotos Específicas */}
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
                                className="w-12 h-12 object-cover rounded-xl bg-zinc-100 border border-zinc-200 shrink-0"
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
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() =>
                                  handleDeleteVariant(
                                    p.id,
                                    v.id,
                                    `${p.title} - ${v.size} / ${v.color}`
                                  )
                                }
                                title="Borrar esta variante (talle/color)"
                                className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors flex items-center gap-1 text-[10px] font-heading font-bold"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Borrar</span>
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
        {/* TAB 5: FACTURACIÓN & EMISIÓN DE COMPROBANTES             */}
        {/* ========================================================= */}
        {activeTab === 'facturacion' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
            {/* Formulario de Emisión Rápida */}
            <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-xs">
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

        {/* ========================================================= */}
        {/* TAB 6: TALLER & CONTROL DE REPARACIONES                   */}
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
      </main>
    </div>
  );
}
