'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Header } from '@/app/components/layout/Header';
import { ALL_PRODUCTS_CATALOG } from '@/lib/data/bikes';
import { ProductWithVariants, ProductVariant } from '@/lib/supabase/types';
import { WorkshopService, WorkshopServiceItem } from '@/lib/services/workshop.service';
import { PointOfSaleInterface } from '@/app/components/pos/PointOfSaleInterface';
import { PricingService, PricingPolicySettings, DEFAULT_PRICING_POLICY } from '@/lib/services/pricing.service';
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
  Settings2,
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
  Truck,
  Users,
  Building2,
  Phone,
  Mail,
  UserPlus,
  ArrowDownLeft,
  Briefcase,
  Camera,
  Sparkles,
  Key,
  Loader2,
  Upload,
} from 'lucide-react';

type AdminTab = 'ventas' | 'pos_facturacion' | 'inventario' | 'politicas' | 'recepcion' | 'clientes' | 'caja' | 'taller';
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

export interface CustomerRecord {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  doc: string;
  docType: 'DNI' | 'CUIT';
  purchases: {
    date: string;
    orderId: string;
    invoiceId?: string;
    invoiceType?: string;
    itemsSummary: string;
    bicyclesBought: string[];
    total: number;
  }[];
  totalSpent: number;
  createdAt: string;
}

export interface SupplierRecord {
  id: string;
  name: string;
  cuit: string;
  contactPerson: string;
  phone: string;
  email: string;
  category: string;
  totalPurchased: number;
}

export interface ReceptionRecord {
  id: string;
  supplierId: string;
  supplierName: string;
  invoiceNumber: string;
  date: string;
  paymentMethod: 'Efectivo' | 'Transferencia' | 'Crédito' | 'Débito';
  items: {
    productId: string;
    productTitle: string;
    variantId: string;
    variantDetails: string;
    quantity: number;
    unitCost: number;
    subtotal: number;
  }[];
  totalAmount: number;
  notes?: string;
}

const DEFAULT_SUPPLIERS: SupplierRecord[] = [
  {
    id: 'sup-01',
    name: 'Dalsanto Scott Argentina SA',
    cuit: '30-70891234-5',
    contactPerson: 'Mariano Dalsanto',
    phone: '5491145558800',
    email: 'ventas@dalsantoscott.com.ar',
    category: 'Bicicletas Scott & Syncros',
    totalPurchased: 28500000,
  },
  {
    id: 'sup-02',
    name: 'Shimano Latin America / Distribuidora Oficial',
    cuit: '30-68912384-9',
    contactPerson: 'Carlos Vedia',
    phone: '5491148889900',
    email: 'pedidos@shimanodistribucion.com.ar',
    category: 'Grupos Transmisión & Frenos',
    totalPurchased: 14200000,
  },
  {
    id: 'sup-03',
    name: 'Bicicletas Volta SRL',
    cuit: '30-71458921-2',
    contactPerson: 'Esteban Rossi',
    phone: '5493415551122',
    email: 'contacto@voltabikes.com.ar',
    category: 'Bicicletas Carbono & MTB',
    totalPurchased: 9800000,
  },
  {
    id: 'sup-04',
    name: 'Raleigh Argentina SA',
    cuit: '30-65498123-1',
    contactPerson: 'Gustavo Bianchi',
    phone: '5491147771234',
    email: 'distribucion@raleigh.com.ar',
    category: 'Bicicletas Mojave & Accesorios',
    totalPurchased: 6400000,
  },
  {
    id: 'sup-05',
    name: 'Sars Performance Bikes',
    cuit: '30-71689234-8',
    contactPerson: 'Nicolás Ferrero',
    phone: '5493514889911',
    email: 'info@sarsbikes.com.ar',
    category: 'Bicicletas de Ruta & Gravel',
    totalPurchased: 8900000,
  },
];

const DEFAULT_CUSTOMERS: CustomerRecord[] = [
  {
    id: 'cust-01',
    firstName: 'Gonzalo',
    lastName: 'Martínez',
    phone: '5493415551234',
    email: 'gonzalo.martinez@gmail.com',
    doc: '38.450.112',
    docType: 'DNI',
    purchases: [
      {
        date: '2026-09-07 18:30',
        orderId: 'ORD-0004521',
        invoiceId: 'FAC-0001-B00004521',
        invoiceType: 'FACTURA_B',
        itemsSummary: 'Volta Radix Carbon 12v (Talle M)',
        bicyclesBought: ['Volta Radix Carbon 12v Shimano Deore'],
        total: 2450000,
      },
    ],
    totalSpent: 2450000,
    createdAt: '2026-08-10',
  },
  {
    id: 'cust-02',
    firstName: 'Rosario Cycling',
    lastName: 'Team SRL',
    phone: '5493415559900',
    email: 'administracion@rosariocycling.com.ar',
    doc: '30-71829301-4',
    docType: 'CUIT',
    purchases: [
      {
        date: '2026-09-07 16:15',
        orderId: 'ORD-0004520',
        invoiceId: 'FAC-0001-A00004520',
        invoiceType: 'FACTURA_A',
        itemsSummary: 'Scott Spark RC World Cup EVO AXS (Talle M)',
        bicyclesBought: ['Scott Spark RC World Cup EVO AXS'],
        total: 8900000,
      },
    ],
    totalSpent: 8900000,
    createdAt: '2026-07-25',
  },
  {
    id: 'cust-03',
    firstName: 'Lucía',
    lastName: 'Fernández',
    phone: '5493415554321',
    email: 'lucia.f@hotmail.com',
    doc: '41.220.984',
    docType: 'DNI',
    purchases: [
      {
        date: '2026-09-07 11:00',
        orderId: 'ORD-0004519',
        invoiceId: 'REM-0001-L00001089',
        invoiceType: 'TICKET_LOCAL',
        itemsSummary: 'Raleigh Mojave 9.5 29er (Talle M)',
        bicyclesBought: ['Raleigh Mojave 9.5 29er Shimano Deore'],
        total: 1350000,
      },
    ],
    totalSpent: 1350000,
    createdAt: '2026-09-01',
  },
];

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

  // Estado de Clientes
  const [customers, setCustomers] = useState<CustomerRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('orono_customers');
        if (stored) return JSON.parse(stored);
      } catch (e) {}
    }
    return DEFAULT_CUSTOMERS;
  });
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    doc: '',
    docType: 'DNI' as 'DNI' | 'CUIT',
    purchasedBike: '',
  });

  // Estado de Proveedores & Recepciones
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('orono_suppliers');
        if (stored) return JSON.parse(stored);
      } catch (e) {}
    }
    return DEFAULT_SUPPLIERS;
  });

  const [receptions, setReceptions] = useState<ReceptionRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('orono_receptions');
        if (stored) return JSON.parse(stored);
      } catch (e) {}
    }
    return [
      {
        id: 'REC-001',
        supplierId: 'sup-01',
        supplierName: 'Dalsanto Scott Argentina SA',
        invoiceNumber: 'FC-0002-00049281',
        date: '2026-09-06 14:30',
        paymentMethod: 'Transferencia',
        items: [
          {
            productId: 'prod-01',
            productTitle: 'Scott Spark RC World Cup EVO AXS',
            variantId: 'var-01-m',
            variantDetails: 'Talle M (29")',
            quantity: 2,
            unitCost: 5800000,
            subtotal: 11600000,
          },
        ],
        totalAmount: 11600000,
      },
    ];
  });

  interface ReceptionItemDraft {
    id: string;
    productId: string;
    variantId: string;
    quantity: number;
    unitCost: number;
  }

  const [showNewReceptionModal, setShowNewReceptionModal] = useState(false);
  const [receptionForm, setReceptionForm] = useState<{
    supplierId: string;
    invoiceNumber: string;
    date: string;
    paymentMethod: 'Efectivo' | 'Transferencia' | 'Crédito' | 'Débito';
    notes: string;
    items: ReceptionItemDraft[];
  }>({
    supplierId: 'sup-01',
    invoiceNumber: '',
    date: new Date().toISOString().slice(0, 10),
    paymentMethod: 'Transferencia',
    notes: '',
    items: [
      {
        id: 'row-1',
        productId: 'prod-01',
        variantId: 'var-01-m',
        quantity: 1,
        unitCost: 5800000,
      },
    ],
  });

  const [receptionProductSearch, setReceptionProductSearch] = useState('');
  
  // Estado de IA para Escaneo de Facturas (Gemini 1.5 Flash)
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('orono_gemini_api_key') || '';
    }
    return '';
  });
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [isScanningInvoice, setIsScanningInvoice] = useState(false);
  const [scanStatusMessage, setScanStatusMessage] = useState('');
  const invoiceFileInputRef = useRef<HTMLInputElement | null>(null);

  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [newSupplierForm, setNewSupplierForm] = useState({
    name: '',
    cuit: '',
    contactPerson: '',
    phone: '',
    email: '',
    category: 'Bicicletas & Componentes',
  });

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

  // Estado de Turnos de Taller con Persistencia
  const [workshopTickets, setWorkshopTickets] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('orono_workshop_tickets');
        if (stored) return JSON.parse(stored);
      } catch (e) {}
    }
    return [
      {
        id: 'SER-101',
        client: 'Martín Rossi',
        phone: '5493415551234',
        bike: 'Scott Spark RC (2024)',
        serviceType: 'Service General & Puesta a Punto',
        status: 'En Taller',
        date: '2026-09-07',
        price: 45000,
        notes: 'Ajuste de amortiguador y cambios',
      },
      {
        id: 'SER-102',
        client: 'Camila Benítez',
        phone: '5493415555678',
        bike: 'Volta Radix 29',
        serviceType: 'Calibración de Transmisión',
        status: 'Listo para Retiro',
        date: '2026-09-06',
        price: 22000,
        notes: 'Lubricación y regulación de pata',
      },
      {
        id: 'SER-103',
        client: 'Federico Gómez',
        phone: '5493415559012',
        bike: 'Sars Pro Race',
        serviceType: 'Purga de Frenos Hidráulicos',
        status: 'Pendiente',
        date: '2026-09-08',
        price: 28000,
        notes: 'Cambio de líquido mineral Shimano',
      },
    ];
  });

  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newTicketForm, setNewTicketForm] = useState({
    client: '',
    phone: '',
    bike: '',
    serviceType: 'Service General & Puesta a Punto',
    date: new Date().toISOString().slice(0, 10),
    price: 45000,
    status: 'En Taller',
    notes: '',
  });

  useEffect(() => {
    try {
      localStorage.setItem('orono_workshop_tickets', JSON.stringify(workshopTickets));
    } catch (e) {}
  }, [workshopTickets]);

  // Estado de Cierre de Caja
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

  // Cargar inventario inicial, clientes y proveedores
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

    const handleCustUpdate = () => {
      try {
        const stored = localStorage.getItem('orono_customers');
        if (stored) setCustomers(JSON.parse(stored));
      } catch (e) {}
    };
    window.addEventListener('customersUpdated', handleCustUpdate);
    return () => window.removeEventListener('customersUpdated', handleCustUpdate);
  }, []);

  // Guardar clientes
  useEffect(() => {
    try {
      localStorage.setItem('orono_customers', JSON.stringify(customers));
    } catch (e) {}
  }, [customers]);

  // Guardar proveedores y recepciones
  useEffect(() => {
    try {
      localStorage.setItem('orono_suppliers', JSON.stringify(suppliers));
      localStorage.setItem('orono_receptions', JSON.stringify(receptions));
    } catch (e) {}
  }, [suppliers, receptions]);

  // Políticas de Precios, Márgenes y Financiación
  const [pricingSettings, setPricingSettings] = useState<PricingPolicySettings>(() => PricingService.getSettings());
  const [pricingSavedToast, setPricingSavedToast] = useState(false);

  const handleSavePricingPolicy = (newSettings: PricingPolicySettings) => {
    PricingService.saveSettings(newSettings);
    setPricingSettings(newSettings);
    setPricingSavedToast(true);
    setTimeout(() => setPricingSavedToast(false), 2500);
  };

  // Recalcular masivamente los precios de venta Débito/Transferencia de todo el catálogo según el costo y el margen configurado
  const handleApplyMarginToAllProducts = (marginPercent: number) => {
    setProducts((prev) => {
      const updated = prev.map((p) => ({
        ...p,
        variants: p.variants.map((v) => {
          const cost = v.cost || Math.round(v.price * 0.625);
          const newPrice = Math.round(cost * (1 + marginPercent / 100));
          return {
            ...v,
            cost,
            profit_margin_percent: marginPercent,
            price: newPrice,
          };
        }),
      }));
      try {
        localStorage.setItem('orono_custom_bikes', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    const current = PricingService.getSettings();
    handleSavePricingPolicy({
      ...current,
      defaultProfitMarginPercent: marginPercent,
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Preset de fechas
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
  // RECEPCIÓN DE MERCADERÍA & FACTURAS DE COMPRA (PLANILLA)
  // ========================================================
  const openNewReceptionModal = () => {
    const firstProd = products[0];
    const firstVar = firstProd?.variants[0];
    setReceptionProductSearch('');
    setReceptionForm({
      supplierId: suppliers[0]?.id || 'sup-01',
      invoiceNumber: '',
      date: new Date().toISOString().slice(0, 10),
      paymentMethod: 'Transferencia',
      notes: '',
      items: [
        {
          id: `row-${Date.now()}-1`,
          productId: firstProd?.id || '',
          variantId: firstVar?.id || '',
          quantity: 1,
          unitCost: firstVar?.cost || Math.round((firstVar?.price || 0) / 1.5),
        },
      ],
    });
    setShowNewReceptionModal(true);
  };

  // Buscador de productos por palabras o código SKU para recepción
  const filteredReceptionSearchResults = useMemo(() => {
    if (!receptionProductSearch.trim()) return [];
    const q = receptionProductSearch.toLowerCase().trim();

    const results: { product: ProductWithVariants; variant: ProductVariant }[] = [];
    for (const p of products) {
      const pMatch =
        p.title.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);

      for (const v of p.variants) {
        const skuMatch = v.sku && v.sku.toLowerCase().includes(q);
        const varMatch =
          (v.size && v.size.toLowerCase().includes(q)) ||
          (v.color && v.color.toLowerCase().includes(q));

        if (pMatch || skuMatch || varMatch) {
          results.push({ product: p, variant: v });
        }
      }
    }
    return results.slice(0, 8);
  }, [products, receptionProductSearch]);

  const handleAddProductFromSearch = (product: ProductWithVariants, variant: ProductVariant) => {
    const cost = variant.cost || Math.round((variant.price || 0) / 1.5);
    setReceptionForm((prev) => {
      // Si hay una única fila inicial por defecto sin editar, reemplazarla con el producto buscado
      const firstRow = prev.items[0];
      const isInitialDefaultRow =
        prev.items.length === 1 &&
        firstRow &&
        firstRow.quantity === 1 &&
        firstRow.productId === (products[0]?.id || '');

      if (isInitialDefaultRow) {
        return {
          ...prev,
          items: [
            {
              id: firstRow.id,
              productId: product.id,
              variantId: variant.id,
              quantity: 1,
              unitCost: cost,
            },
          ],
        };
      }

      // Si ya hay artículos cargados, agregar como nueva fila a la planilla
      const newRow: ReceptionItemDraft = {
        id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId: product.id,
        variantId: variant.id,
        quantity: 1,
        unitCost: cost,
      };
      return {
        ...prev,
        items: [...prev.items, newRow],
      };
    });
    setReceptionProductSearch('');
  };

  // Manejador para escanear factura mediante foto o archivo con IA
  const handleScanInvoiceFile = async (file: File) => {
    if (!file) return;

    setIsScanningInvoice(true);
    setScanStatusMessage('Leyendo archivo de la factura...');

    try {
      const base64Promise = new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });

      const base64Data = await base64Promise;
      setScanStatusMessage('Analizando comprobante con IA de Gemini 1.5 Flash...');

      const res = await fetch('/api/ai/scan-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: file.type || 'image/jpeg',
          userApiKey: geminiApiKey,
        }),
      });

      const json = await res.json();

      if (!json.success || !json.data) {
        throw new Error(json.error || 'No se pudieron extraer datos de la factura.');
      }

      setScanStatusMessage('Asociando artículos con el catálogo de Oroño Bike...');
      const extracted = json.data;

      // 1. Vincular o crear Proveedor
      let matchedSupplier = suppliers.find((s) => {
        if (extracted.supplierCuit && s.cuit) {
          const c1 = s.cuit.replace(/[^0-9]/g, '');
          const c2 = extracted.supplierCuit.replace(/[^0-9]/g, '');
          if (c1 && c2 && c1 === c2) return true;
        }
        if (extracted.supplierName && s.name) {
          return (
            s.name.toLowerCase().includes(extracted.supplierName.toLowerCase()) ||
            extracted.supplierName.toLowerCase().includes(s.name.toLowerCase())
          );
        }
        return false;
      });

      let targetSupplierId = matchedSupplier ? matchedSupplier.id : suppliers[0]?.id || 'sup-01';

      if (!matchedSupplier && extracted.supplierName) {
        const autoSupplier: SupplierRecord = {
          id: `sup-${Date.now()}`,
          name: extracted.supplierName,
          cuit: extracted.supplierCuit || '30-00000000-0',
          contactPerson: 'Contacto Facturación',
          phone: '00000000',
          email: 'facturas@proveedor.com.ar',
          category: 'General',
          totalPurchased: 0,
        };
        const updatedSuppliers = [...suppliers, autoSupplier];
        setSuppliers(updatedSuppliers);
        try {
          localStorage.setItem('orono_suppliers', JSON.stringify(updatedSuppliers));
        } catch (e) {}
        targetSupplierId = autoSupplier.id;
      }

      // 2. Mapear renglones de artículos
      const newItems: ReceptionItemDraft[] = [];

      if (extracted.items && extracted.items.length > 0) {
        for (let i = 0; i < extracted.items.length; i++) {
          const it = extracted.items[i];
          const desc = (it.description || '').toLowerCase();
          const code = (it.code || '').toLowerCase();

          let bestProd = products[0];
          let bestVar = products[0]?.variants[0];
          let found = false;

          for (const p of products) {
            const pTitle = p.title.toLowerCase();
            const pBrand = p.brand.toLowerCase();

            for (const v of p.variants) {
              const vSku = (v.sku || '').toLowerCase();
              if (code && vSku && (vSku.includes(code) || code.includes(vSku))) {
                bestProd = p;
                bestVar = v;
                found = true;
                break;
              }
              if (desc && (desc.includes(pTitle) || (desc.includes(pBrand) && desc.includes(v.size.toLowerCase())))) {
                bestProd = p;
                bestVar = v;
                found = true;
                break;
              }
            }
            if (found) break;
          }

          newItems.push({
            id: `row-${Date.now()}-${i}`,
            productId: bestProd?.id || products[0]?.id || '',
            variantId: bestVar?.id || products[0]?.variants[0]?.id || '',
            quantity: Math.max(1, Number(it.quantity) || 1),
            unitCost: Math.max(0, Number(it.unitCost) || bestVar?.cost || 0),
          });
        }
      }

      // 3. Cargar en el estado de la planilla
      setReceptionForm((prev) => ({
        ...prev,
        supplierId: targetSupplierId,
        invoiceNumber: extracted.invoiceNumber || prev.invoiceNumber,
        date: extracted.invoiceDate || prev.date,
        paymentMethod: extracted.paymentMethod || prev.paymentMethod,
        notes: extracted.notes || prev.notes,
        items: newItems.length > 0 ? newItems : prev.items,
      }));

      const demoNotice = json.isDemo
        ? '\n\n💡 Aviso: Se ejecutó en Modo Demostración porque aún no guardaste tu clave gratis de Google. Podés configurarla haciendo clic en "Clave IA (Gratis)".'
        : '';

      alert(
        `¡Factura procesada con éxito por IA! 🤖✨\n• Proveedor: ${extracted.supplierName || 'Detectado'}\n• N° Factura: ${extracted.invoiceNumber || 'Detectado'}\n• Artículos leídos: ${newItems.length}${demoNotice}`
      );
    } catch (err: any) {
      console.error(err);
      alert(`Error al procesar la factura con IA: ${err.message || 'Intenta nuevamente o verifica la imagen.'}`);
    } finally {
      setIsScanningInvoice(false);
      setScanStatusMessage('');
      if (invoiceFileInputRef.current) {
        invoiceFileInputRef.current.value = '';
      }
    }
  };

  const handleSaveGeminiKey = (key: string) => {
    const trimmed = key.trim();
    setGeminiApiKey(trimmed);
    try {
      if (trimmed) {
        localStorage.setItem('orono_gemini_api_key', trimmed);
      } else {
        localStorage.removeItem('orono_gemini_api_key');
      }
    } catch (e) {}
    setShowApiKeyModal(false);
    if (trimmed) {
      alert('¡Clave gratuita de Gemini guardada con éxito! Ahora podés escanear cualquier factura real.');
    }
  };

  const handleAddReceptionRow = () => {
    const firstProd = products[0];
    const firstVar = firstProd?.variants[0];
    const newRow: ReceptionItemDraft = {
      id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      productId: firstProd?.id || '',
      variantId: firstVar?.id || '',
      quantity: 1,
      unitCost: firstVar?.cost || Math.round((firstVar?.price || 0) / 1.5),
    };
    setReceptionForm((prev) => ({
      ...prev,
      items: [...prev.items, newRow],
    }));
  };

  const handleUpdateReceptionRow = (rowId: string, fields: Partial<ReceptionItemDraft>) => {
    setReceptionForm((prev) => ({
      ...prev,
      items: prev.items.map((it) => {
        if (it.id !== rowId) return it;
        const updated = { ...it, ...fields };
        // Si cambió el producto, asignar su primera variante y costo sugerido
        if (fields.productId && fields.productId !== it.productId) {
          const prod = products.find((p) => p.id === fields.productId);
          const fVar = prod?.variants[0];
          updated.variantId = fVar?.id || '';
          updated.unitCost = fVar?.cost || Math.round((fVar?.price || 0) / 1.5);
        } else if (fields.variantId && fields.variantId !== it.variantId) {
          // Si cambió la variante, sugerir el costo de esa variante
          const prod = products.find((p) => p.id === it.productId);
          const v = prod?.variants.find((itemVar) => itemVar.id === fields.variantId);
          if (v) {
            updated.unitCost = v.cost || Math.round(v.price / 1.5);
          }
        }
        return updated;
      }),
    }));
  };

  const handleRemoveReceptionRow = (rowId: string) => {
    if (receptionForm.items.length <= 1) {
      alert('La planilla de la factura debe tener al menos un artículo.');
      return;
    }
    setReceptionForm((prev) => ({
      ...prev,
      items: prev.items.filter((it) => it.id !== rowId),
    }));
  };

  const handleSaveReception = (e: React.FormEvent) => {
    e.preventDefault();
    if (receptionForm.items.length === 0) {
      alert('Debes ingresar al menos un artículo en la planilla.');
      return;
    }

    const supplier = suppliers.find((s) => s.id === receptionForm.supplierId) || suppliers[0];
    const nowStr = `${receptionForm.date} ${new Date().toLocaleTimeString().slice(0, 5)}`;

    // Armar items recibidos con datos completos
    const parsedItems = receptionForm.items.map((row) => {
      const selectedProd = products.find((p) => p.id === row.productId) || products[0];
      const selectedVar = selectedProd.variants.find((v) => v.id === row.variantId) || selectedProd.variants[0];
      const qty = Math.max(1, Number(row.quantity) || 1);
      const unitCost = Math.max(0, Number(row.unitCost) || 0);
      const subtotal = qty * unitCost;

      return {
        productId: selectedProd.id,
        productTitle: selectedProd.title,
        variantId: selectedVar.id,
        variantDetails: `${selectedVar.size} (${selectedVar.color})`,
        quantity: qty,
        unitCost,
        subtotal,
      };
    });

    const totalInvoiceAmount = parsedItems.reduce((acc, it) => acc + it.subtotal, 0);
    const totalUnits = parsedItems.reduce((acc, it) => acc + it.quantity, 0);

    const newReception: ReceptionRecord = {
      id: `REC-${Date.now().toString().slice(-4)}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      invoiceNumber: receptionForm.invoiceNumber.trim() || `FC-INT-${Date.now().toString().slice(-6)}`,
      date: nowStr,
      paymentMethod: receptionForm.paymentMethod,
      items: parsedItems,
      totalAmount: totalInvoiceAmount,
      notes: receptionForm.notes,
    };

    // 1. Guardar Recepción
    const updatedReceptions = [newReception, ...receptions];
    setReceptions(updatedReceptions);
    try {
      localStorage.setItem('orono_receptions', JSON.stringify(updatedReceptions));
    } catch (e) {}

    // 2. ACTUALIZAR STOCK FÍSICO Y COSTOS en el inventario para todos los artículos
    setProducts((prev) => {
      const updated = prev.map((p) => {
        const matchingItems = parsedItems.filter((it) => it.productId === p.id);
        if (matchingItems.length === 0) return p;

        return {
          ...p,
          variants: p.variants.map((v) => {
            const itemMatch = matchingItems.find((it) => it.variantId === v.id);
            if (itemMatch) {
              const newStock = (v.stock || 0) + itemMatch.quantity;
              const newCost = itemMatch.unitCost > 0 ? itemMatch.unitCost : (v.cost ?? Math.round(v.price / 1.5));
              const margin = v.profit_margin_percent ?? 50;
              const newPrice = Math.round(newCost * (1 + margin / 100));
              return {
                ...v,
                stock: newStock,
                cost: newCost,
                price: newPrice,
              };
            }
            return v;
          }),
        };
      });
      try {
        localStorage.setItem('orono_custom_bikes', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // 3. REGISTRAR EGRESO AUTOMÁTICO EN LA CAJA DIARIA
    const newCashOutflow: CashMovement = {
      id: `MOV-EGR-${Date.now().toString().slice(-4)}`,
      time: new Date().toLocaleTimeString().slice(0, 5),
      type: 'egreso',
      concept: `Compra Proveedor: ${supplier.name} (${newReception.invoiceNumber}) - ${parsedItems.length} art. (+${totalUnits} u.)`,
      category: 'Compra de Mercadería / Stock',
      paymentMethod: receptionForm.paymentMethod,
      amount: totalInvoiceAmount,
    };
    const updatedCash = [newCashOutflow, ...cashMovements];
    setCashMovements(updatedCash);
    try {
      localStorage.setItem('orono_cash_movements', JSON.stringify(updatedCash));
    } catch (e) {}

    // 4. ACTUALIZAR TOTAL COMPRADO AL PROVEEDOR
    setSuppliers((prev) => {
      const updatedSup = prev.map((s) =>
        s.id === supplier.id ? { ...s, totalPurchased: s.totalPurchased + totalInvoiceAmount } : s
      );
      try {
        localStorage.setItem('orono_suppliers', JSON.stringify(updatedSup));
      } catch (e) {}
      return updatedSup;
    });

    setShowNewReceptionModal(false);
    alert(
      `¡Factura de compra registrada con éxito!\n• ${parsedItems.length} artículos ingresados (+${totalUnits} unidades sumadas al stock).\n• Se registró un egreso de ${formatCurrency(totalInvoiceAmount)} en la caja.`
    );
  };

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierForm.name.trim()) return;

    const newSup: SupplierRecord = {
      id: `sup-${Date.now()}`,
      name: newSupplierForm.name.trim(),
      cuit: newSupplierForm.cuit.trim() || '30-00000000-0',
      contactPerson: newSupplierForm.contactPerson.trim() || 'Contacto',
      phone: newSupplierForm.phone.trim() || '00000000',
      email: newSupplierForm.email.trim() || 'proveedor@oronobike.com.ar',
      category: newSupplierForm.category,
      totalPurchased: 0,
    };

    const updatedSuppliers = [...suppliers, newSup];
    setSuppliers(updatedSuppliers);
    try {
      localStorage.setItem('orono_suppliers', JSON.stringify(updatedSuppliers));
    } catch (err) {}

    // Preseleccionar el nuevo proveedor en la planilla de recepción activa
    setReceptionForm((prev) => ({ ...prev, supplierId: newSup.id }));
    setShowAddSupplierModal(false);
    setNewSupplierForm({
      name: '',
      cuit: '',
      contactPerson: '',
      phone: '',
      email: '',
      category: 'Bicicletas & Componentes',
    });
  };

  // ========================================================
  // GESTIÓN DE CLIENTES MANUAL
  // ========================================================
  const handleAddCustomerManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerForm.fullName.trim() || !newCustomerForm.phone.trim()) {
      alert('Por favor completa el nombre/razón social y teléfono del cliente.');
      return;
    }

    const nameParts = newCustomerForm.fullName.trim().split(' ');
    const firstName = nameParts[0] || 'Cliente';
    const lastName = nameParts.slice(1).join(' ') || '';

    const newCust: CustomerRecord = {
      id: `cust-${Date.now()}`,
      firstName,
      lastName,
      phone: newCustomerForm.phone,
      email: newCustomerForm.email,
      doc: newCustomerForm.doc || '0',
      docType: newCustomerForm.docType,
      purchases: newCustomerForm.purchasedBike
        ? [
            {
              date: new Date().toLocaleString(),
              orderId: `MAN-${Date.now().toString().slice(-4)}`,
              itemsSummary: newCustomerForm.purchasedBike,
              bicyclesBought: [newCustomerForm.purchasedBike],
              total: 0,
            },
          ]
        : [],
      totalSpent: 0,
      createdAt: new Date().toLocaleDateString(),
    };

    setCustomers([newCust, ...customers]);
    setShowAddCustomerModal(false);
    setNewCustomerForm({
      fullName: '',
      phone: '',
      email: '',
      doc: '',
      docType: 'DNI',
      purchasedBike: '',
    });
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

  // Filtrado de Inventario (Solo marcas oficiales)
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

  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) return customers;
    const q = customerSearchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.doc.includes(q) ||
        c.purchases.some((pur) => pur.bicyclesBought.some((b) => b.toLowerCase().includes(q)))
    );
  }, [customers, customerSearchQuery]);

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

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col font-sans text-zinc-900 pb-20">
      <Header />

      {/* Admin Top Header */}
      <div className="bg-zinc-950 text-white border-b border-zinc-800 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-black text-white tracking-tight">
              Control General del Negocio
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('pos_facturacion')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-heading text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xl flex items-center gap-2 transition-colors shadow-md active:scale-95"
            >
              <MonitorDot className="w-4 h-4" /> Abrir POS Mostrador
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto mt-8 flex gap-2 border-b border-zinc-800 overflow-x-auto pb-px scrollbar-none">
          <button
            onClick={() => setActiveTab('ventas')}
            className={`px-4 py-3 font-heading text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'ventas' ? 'border-white text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" /> Control de Ventas
          </button>
          <button
            onClick={() => setActiveTab('pos_facturacion')}
            className={`px-4 py-3 font-heading text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'pos_facturacion'
                ? 'border-emerald-500 text-emerald-400 font-black'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Receipt className="w-4 h-4" /> POS & Facturación ARCA
          </button>
          <button
            onClick={() => setActiveTab('inventario')}
            className={`px-4 py-3 font-heading text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'inventario' ? 'border-white text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Package className="w-4 h-4" /> Inventario
          </button>
          <button
            onClick={() => setActiveTab('politicas')}
            className={`px-4 py-3 font-heading text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'politicas' ? 'border-amber-400 text-amber-400 font-black' : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Settings2 className="w-4 h-4" /> Precios & Financiación MP
          </button>
          <button
            onClick={() => setActiveTab('recepcion')}
            className={`px-4 py-3 font-heading text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'recepcion' ? 'border-white text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Truck className="w-4 h-4" /> Recepción & Proveedores
          </button>
          <button
            onClick={() => setActiveTab('clientes')}
            className={`px-4 py-3 font-heading text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'clientes' ? 'border-white text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-4 h-4" /> Clientes
          </button>
          <button
            onClick={() => setActiveTab('caja')}
            className={`px-4 py-3 font-heading text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'caja' ? 'border-white text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Banknote className="w-4 h-4" /> Cierre de Caja
          </button>
          <button
            onClick={() => setActiveTab('taller')}
            className={`px-4 py-3 font-heading text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'taller' ? 'border-white text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Wrench className="w-4 h-4" /> Taller
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {/* ========================================================= */}
        {/* TAB 1: CONTROL DE VENTAS                                  */}
        {/* ========================================================= */}
        {activeTab === 'ventas' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-zinc-950 font-heading font-black text-sm">
                <CalendarIcon className="w-5 h-5 text-zinc-700" />
                <span>Rango de Facturación:</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(['hoy', 'ayer', 'semana', 'mes'] as DatePreset[]).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handleSelectPreset(preset)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-heading font-bold uppercase transition-all ${
                      datePreset === preset ? 'bg-zinc-950 text-white shadow-xs' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    {preset === 'hoy' ? 'Hoy' : preset === 'ayer' ? 'Ayer' : preset === 'semana' ? 'Últimos 7 Días' : 'Este Mes'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs font-heading font-bold bg-zinc-50 p-2 rounded-2xl border border-zinc-200">
                <span className="text-zinc-500 uppercase text-[10px] pl-1">Desde:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDatePreset('custom');
                  }}
                  className="px-2 py-1 bg-white border border-zinc-300 rounded-lg text-xs font-mono font-bold text-zinc-800"
                />
                <span className="text-zinc-500 uppercase text-[10px]">Hasta:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDatePreset('custom');
                  }}
                  className="px-2 py-1 bg-white border border-zinc-300 rounded-lg text-xs font-mono font-bold text-zinc-800"
                />
              </div>
            </div>

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
                <div className="text-xs text-zinc-500 mt-2">Ventas Mostrador & Online</div>
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
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: POS MOSTRADOR & FACTURACIÓN UNIFICADO              */}
        {/* ========================================================= */}
        {activeTab === 'pos_facturacion' && (
          <div className="space-y-6 animate-fadeIn">
            <PointOfSaleInterface />
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: INVENTARIO, COSTOS & MARGEN DE GANANCIA (%)        */}
        {/* ========================================================= */}
        {activeTab === 'inventario' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-xl font-heading font-black text-zinc-950">
                    Gestión de Inventario, Costos & Precios de Venta
                  </h2>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Carga nuevos artículos, ajusta el <strong>Costo ($)</strong> o el <strong>Margen (%)</strong> para recalcular en tiempo real el precio de venta al público.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab('politicas')}
                  className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-heading text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
                >
                  <Settings2 className="w-3.5 h-3.5" /> Políticas & Cuotas
                </button>
                <button
                  onClick={() => setShowBulkModal(true)}
                  className="bg-zinc-950 hover:bg-zinc-800 text-white font-heading text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
                >
                  <Percent className="w-3.5 h-3.5" /> Ajuste Masivo (%)
                </button>
                <Link
                  href="/admin/productos/nuevo"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-heading text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md transition-transform active:scale-95"
                >
                  <Plus className="w-4 h-4" /> + Cargar Nuevo Artículo
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
                <option value="SARS">Sars</option>
                <option value="ZION">Zion</option>
                <option value="SHIMANO">Shimano</option>
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
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-zinc-400">%</span>
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

                            <td className="py-3 px-3 bg-zinc-50/70 font-mono">
                              <div className="flex items-center gap-1">
                                <span className="text-zinc-400">$</span>
                                <input
                                  type="number"
                                  value={estimatedCost}
                                  onChange={(e) => handleUpdateCost(p.id, v.id, Number(e.target.value))}
                                  className="w-24 px-2 py-1 bg-white border border-zinc-300 rounded-lg text-xs font-mono font-bold focus:border-zinc-950 focus:outline-none"
                                />
                              </div>
                            </td>

                            <td className="py-3 px-3 bg-zinc-50/70 font-mono">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={marginPct}
                                  onChange={(e) => handleUpdateMargin(p.id, v.id, Number(e.target.value))}
                                  className="w-16 px-2 py-1 bg-white border border-zinc-300 rounded-lg text-xs font-mono font-bold text-center focus:border-zinc-950 focus:outline-none"
                                />
                                <span className="text-zinc-500 font-bold">%</span>
                              </div>
                            </td>

                            <td className="py-3 px-3 bg-emerald-50/50 font-mono font-bold text-zinc-950">
                              <div className="flex items-center gap-1">
                                <span className="text-emerald-700 font-black">$</span>
                                <input
                                  type="number"
                                  value={v.price}
                                  onChange={(e) => handleUpdatePrice(p.id, v.id, Number(e.target.value))}
                                  className="w-28 px-2 py-1 bg-white border-2 border-emerald-400 rounded-lg font-mono text-xs font-black text-zinc-950 focus:border-zinc-950 focus:outline-none"
                                />
                              </div>
                            </td>

                            <td className="py-3 px-3 font-mono font-bold text-xs text-emerald-700">
                              +{formatCurrency(unitProfit)}
                            </td>

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

                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() =>
                                  handleDeleteVariant(p.id, v.id, `${p.title} - ${v.size} / ${v.color}`)
                                }
                                title="Borrar esta variante"
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
        {/* TAB NUEVA: POLÍTICAS DE PRECIOS, GANANCIAS & FINANCIACIÓN */}
        {/* ========================================================= */}
        {activeTab === 'politicas' && (
          <div className="space-y-8 animate-fadeIn">
            {pricingSavedToast && (
              <div className="p-4 bg-emerald-600 text-white rounded-2xl flex items-center justify-between shadow-lg animate-bounce">
                <div className="flex items-center gap-2 font-heading font-black text-sm uppercase">
                  <CheckCircle2 className="w-5 h-5" /> ¡Políticas actualizadas correctamente! El catálogo y la web ya reflejan los nuevos precios y cuotas.
                </div>
              </div>
            )}

            {/* Cabecera Principal */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-amber-500" />
                  <h2 className="text-xl font-heading font-black text-zinc-950">
                    Políticas de Precios, Márgenes & Financiación
                  </h2>
                </div>
                <p className="text-xs text-zinc-500 mt-1 max-w-2xl leading-relaxed">
                  Configurá el <strong>margen de ganancia general (+60%)</strong> sobre el costo de los productos, el <strong>descuento exclusivo en efectivo en el local físico (-20%)</strong>, la cotización de referencia en dólares y los recargos de cuotas con Mercado Pago.
                </p>
              </div>

              <button
                onClick={() => handleSavePricingPolicy(pricingSettings)}
                className="bg-zinc-950 hover:bg-zinc-800 text-white font-heading text-xs font-black uppercase tracking-wider px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg transition-transform active:scale-95 shrink-0"
              >
                <Save className="w-4 h-4 text-emerald-400" /> Guardar Políticas
              </button>
            </div>

            {/* Bloques de Configuración */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 1. Margen General de Ganancia */}
              <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-heading font-bold uppercase tracking-wider text-zinc-500">
                      Margen Ganancia Online
                    </span>
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                      <Percent className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <input
                      type="number"
                      value={pricingSettings.defaultProfitMarginPercent}
                      onChange={(e) =>
                        setPricingSettings({
                          ...pricingSettings,
                          defaultProfitMarginPercent: Number(e.target.value),
                        })
                      }
                      className="w-24 px-3 py-1.5 bg-zinc-50 border-2 border-emerald-400 rounded-xl text-2xl font-mono font-black text-zinc-950 focus:outline-none"
                    />
                    <span className="text-xl font-heading font-black text-emerald-700">% sobre Costo</span>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Determina el precio para <strong>Débito / Transferencia</strong>. Si un artículo cuesta $100.000, con +60% se publicará a $160.000.
                  </p>
                </div>

                <div className="pt-5 mt-4 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm(
                          `¿Deseas recalcular el precio de venta de TODO el catálogo aplicando un margen de +${pricingSettings.defaultProfitMarginPercent}% sobre el costo de cada producto?`
                        )
                      ) {
                        handleApplyMarginToAllProducts(pricingSettings.defaultProfitMarginPercent);
                      }
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-heading text-xs font-black uppercase tracking-wider py-2.5 rounded-xl shadow-xs transition-colors"
                  >
                    ⚡ Aplicar a Todo el Catálogo
                  </button>
                </div>
              </div>

              {/* 2. Descuento en Efectivo en Local Físico */}
              <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-heading font-bold uppercase tracking-wider text-zinc-500">
                      Descuento Efectivo (Local)
                    </span>
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                      <Banknote className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <input
                      type="number"
                      value={pricingSettings.cashDiscountLocalPercent}
                      onChange={(e) =>
                        setPricingSettings({
                          ...pricingSettings,
                          cashDiscountLocalPercent: Number(e.target.value),
                        })
                      }
                      className="w-24 px-3 py-1.5 bg-zinc-50 border-2 border-amber-400 rounded-xl text-2xl font-mono font-black text-zinc-950 focus:outline-none"
                    />
                    <span className="text-xl font-heading font-black text-amber-700">% OFF en Local</span>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    <strong>No se muestra en la web</strong> (en la tienda online solo figura Débito/Transferencia). Se aplica automáticamente al elegir Efectivo en el mostrador/POS.
                  </p>
                </div>

                <div className="pt-5 mt-4 border-t border-zinc-100 text-[11px] text-zinc-500 font-mono">
                  Ejemplo: Venta de $160.000 en mostrador cobra <strong>${Math.round(160000 * (1 - pricingSettings.cashDiscountLocalPercent / 100)).toLocaleString('es-AR')}</strong> en efectivo.
                </div>
              </div>

              {/* 3. Cotización Dólar */}
              <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-heading font-bold uppercase tracking-wider text-zinc-500">
                      Cotización Dólar (u$d)
                    </span>
                    <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-xl font-mono text-zinc-400">$</span>
                    <input
                      type="number"
                      value={pricingSettings.usdExchangeRate}
                      onChange={(e) =>
                        setPricingSettings({
                          ...pricingSettings,
                          usdExchangeRate: Number(e.target.value),
                        })
                      }
                      className="w-28 px-3 py-1.5 bg-zinc-50 border-2 border-sky-400 rounded-xl text-2xl font-mono font-black text-zinc-950 focus:outline-none"
                    />
                    <span className="text-sm font-heading font-bold text-zinc-600">ARS</span>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Se muestra en la ficha de producto en el badge verde superior junto al precio online: <code>u$d 326 (Dólar: $1.420)</code>.
                  </p>
                </div>

                <div className="pt-5 mt-4 border-t border-zinc-100 text-[11px] text-zinc-500">
                  Actualizable en cualquier momento sin recargar la página.
                </div>
              </div>
            </div>

            {/* Tabla de Tasas de Financiación de Mercado Pago */}
            <div className="bg-white rounded-3xl border border-zinc-200 shadow-xs p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4 mb-6">
                <div>
                  <h3 className="text-lg font-heading font-black text-zinc-950 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-sky-600" />
                    Tasas de Recargo por Cuotas (Mercado Pago)
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Modificá los porcentajes de recargo financiero. La web calculará automáticamente el valor de cada cuota y el total financiado.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPricingSettings({
                      ...pricingSettings,
                      financingRates: DEFAULT_PRICING_POLICY.financingRates,
                    });
                  }}
                  className="text-xs font-heading font-bold text-zinc-600 hover:text-zinc-950 underline"
                >
                  Restaurar tasas por defecto
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50/70 font-heading font-black uppercase text-[11px] text-zinc-600">
                      <th className="py-3 px-4">Plan Cuotas</th>
                      <th className="py-3 px-4">Recargo Financiero (%)</th>
                      <th className="py-3 px-4">Ejemplo ($100.000 Débito)</th>
                      <th className="py-3 px-4">Valor Cuota Ejemplo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {pricingSettings.financingRates.map((rate, idx) => {
                      const totalEjemplo = Math.round(100000 * (1 + rate.surchargePercent / 100));
                      const cuotaEjemplo = Math.round(totalEjemplo / rate.installments);
                      return (
                        <tr key={rate.installments} className="hover:bg-zinc-50/50">
                          <td className="py-3.5 px-4 font-heading font-bold text-sm text-zinc-950">
                            {rate.installments} cuotas
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                value={rate.surchargePercent}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  const updated = [...pricingSettings.financingRates];
                                  updated[idx] = { ...updated[idx], surchargePercent: val };
                                  setPricingSettings({ ...pricingSettings, financingRates: updated });
                                }}
                                className="w-20 px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono font-bold text-center focus:border-zinc-950 focus:outline-none"
                              />
                              <span className="font-heading font-bold text-zinc-600">%</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-semibold text-zinc-700">
                            Total: ${totalEjemplo.toLocaleString('es-AR')}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                            {rate.installments} cuotas de ${cuotaEjemplo.toLocaleString('es-AR')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSavePricingPolicy(pricingSettings)}
                  className="bg-zinc-950 hover:bg-zinc-800 text-white font-heading text-xs font-black uppercase tracking-wider px-6 py-3 rounded-2xl flex items-center gap-2 shadow-md transition-transform active:scale-95"
                >
                  <Save className="w-4 h-4 text-emerald-400" /> Guardar Cambios de Financiación
                </button>
              </div>
            </div>
          </div>
        )}


        {activeTab === 'recepcion' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Header de Recepción */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-zinc-950" />
                  <h2 className="text-xl font-heading font-black text-zinc-950">
                    Recepción de Mercadería & Facturas de Compra
                  </h2>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Carga facturas de compra de distribuidores para <strong>aumentar el stock físico</strong> y registrar el <strong>egreso financiero automáticamente</strong>.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAddSupplierModal(true)}
                  className="px-4 py-2.5 border border-zinc-300 hover:bg-zinc-50 rounded-xl text-xs font-heading font-bold uppercase text-zinc-800 transition-colors"
                >
                  <Building2 className="w-3.5 h-3.5 inline mr-1" /> + Nuevo Proveedor
                </button>
                <button
                  onClick={openNewReceptionModal}
                  className="bg-zinc-950 hover:bg-zinc-800 text-white font-heading text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md transition-transform active:scale-95"
                >
                  <Plus className="w-4 h-4" /> Registrar Factura de Compra
                </button>
              </div>
            </div>

            {/* Resumen de Compras a Proveedores */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs">
                <span className="text-[10px] font-heading font-black uppercase tracking-wider text-zinc-500 block mb-1">
                  Proveedores Activos
                </span>
                <div className="text-2xl font-mono font-black text-zinc-950">{suppliers.length}</div>
                <span className="text-[11px] text-zinc-500 mt-1 block">Distribuidores oficiales registrados</span>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs">
                <span className="text-[10px] font-heading font-black uppercase tracking-wider text-zinc-500 block mb-1">
                  Recepciones Registradas
                </span>
                <div className="text-2xl font-mono font-black text-zinc-950">{receptions.length}</div>
                <span className="text-[11px] text-zinc-500 mt-1 block">Ingresos con stock actualizado</span>
              </div>

              <div className="bg-zinc-950 text-white p-6 rounded-3xl shadow-xl">
                <span className="text-[10px] font-heading font-black uppercase tracking-wider text-emerald-400 block mb-1">
                  Total Histórico Invertido
                </span>
                <div className="text-2xl font-mono font-black text-white">
                  {formatCurrency(suppliers.reduce((acc, s) => acc + s.totalPurchased, 0))}
                </div>
                <span className="text-[11px] text-zinc-400 mt-1 block">Egresos imputados en caja</span>
              </div>
            </div>

            {/* Base de Datos de Proveedores */}
            <div className="bg-white rounded-3xl border border-zinc-200 shadow-xs p-6 space-y-4">
              <h3 className="font-heading font-black text-base text-zinc-950 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-zinc-700" /> Base de Datos de Proveedores & Distribuidores
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suppliers.map((sup) => (
                  <div key={sup.id} className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-2">
                    <div className="flex justify-between items-start">
                      <strong className="text-sm font-heading font-black text-zinc-950 block">{sup.name}</strong>
                      <span className="text-[9px] bg-zinc-200 text-zinc-700 font-bold px-1.5 py-0.5 rounded">
                        CUIT: {sup.cuit}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-600 space-y-0.5">
                      <div><strong>Contacto:</strong> {sup.contactPerson} ({sup.phone})</div>
                      <div><strong>Rubro:</strong> {sup.category}</div>
                    </div>
                    <div className="pt-2 border-t border-zinc-200/60 flex justify-between items-center text-xs">
                      <span className="text-zinc-500 text-[10px] uppercase font-bold">Total Comprado:</span>
                      <strong className="font-mono text-zinc-950 font-bold">{formatCurrency(sup.totalPurchased)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Historial de Facturas de Compra / Recepciones */}
            <div className="bg-white rounded-3xl border border-zinc-200 shadow-xs overflow-hidden">
              <div className="p-6 border-b border-zinc-200 flex justify-between items-center bg-zinc-50/50">
                <div>
                  <h3 className="text-base font-heading font-black text-zinc-950">
                    Historial de Facturas de Compra e Ingresos de Stock
                  </h3>
                  <span className="text-xs text-zinc-500">
                    Detalle de mercadería recibida y egresos financieros de caja.
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-zinc-700 bg-white border border-zinc-200 px-3 py-1.5 rounded-xl">
                  {receptions.length} Facturas
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-100/80 border-b border-zinc-200 text-zinc-600 font-heading font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">N° Factura Compra / Fecha</th>
                      <th className="py-3 px-4">Proveedor</th>
                      <th className="py-3 px-4">Mercadería Ingresada (Stock +)</th>
                      <th className="py-3 px-4">Medio de Pago</th>
                      <th className="py-3 px-4 text-right">Total Egreso ($ ARS)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 font-medium">
                    {receptions.map((rec) => (
                      <tr key={rec.id} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <strong className="font-mono text-zinc-950 block">{rec.invoiceNumber}</strong>
                          <span className="text-[10px] text-zinc-400 font-mono">{rec.date}</span>
                        </td>
                        <td className="py-3 px-4 font-heading font-bold text-zinc-800">{rec.supplierName}</td>
                        <td className="py-3 px-4">
                          {rec.items.map((it, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                                +{it.quantity} u.
                              </span>
                              <span className="text-zinc-800">{it.productTitle} ({it.variantDetails})</span>
                            </div>
                          ))}
                        </td>
                        <td className="py-3 px-4">
                          <span className="bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded text-[10px] font-heading font-bold">
                            {rec.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                          -{formatCurrency(rec.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal para Registrar Factura de Compra en Planilla (Multi-artículo) */}
            {showNewReceptionModal && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-5xl w-full shadow-2xl border border-zinc-200 animate-fadeIn my-auto max-h-[94vh] flex flex-col relative">
                  {/* Overlay de Escaneo con IA */}
                  {isScanningInvoice && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-3xl z-40 flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-600 flex items-center justify-center mb-4 shadow-lg animate-pulse">
                        <Sparkles className="w-8 h-8 text-emerald-600 animate-spin" />
                      </div>
                      <h4 className="text-lg font-heading font-black text-zinc-950 mb-1">
                        Escaneando Factura con IA (Gemini 1.5 Flash)
                      </h4>
                      <p className="text-xs text-zinc-600 max-w-sm mb-4">
                        {scanStatusMessage || 'Extrayendo proveedor, números de comprobante, renglones y costos...'}
                      </p>
                      <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-300 shadow-xs">
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                        <span>Leyendo y digitalizando comprobante...</span>
                      </div>
                    </div>
                  )}

                  {/* Input de archivo oculto para captura con cámara o archivo */}
                  <input
                    ref={invoiceFileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleScanInvoiceFile(file);
                      }
                    }}
                  />

                  {/* Modal Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-zinc-200 gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white flex items-center justify-center">
                          <Truck className="w-4 h-4" />
                        </div>
                        <h3 className="text-xl font-heading font-black text-zinc-950 tracking-tight">
                          Planilla de Carga de Factura de Compra
                        </h3>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">
                        Ingresá los artículos de la factura tipo planilla: las cantidades <strong>se sumarán al stock físico</strong> y el total generará un <strong>egreso financiero</strong> en caja.
                      </p>
                    </div>

                    {/* Acciones Rápidas con IA y Cerrar */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => invoiceFileInputRef.current?.click()}
                        disabled={isScanningInvoice}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-heading font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all hover:scale-105 active:scale-95"
                        title="Sacar foto o subir factura/PDF para completar automáticamente con IA"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <Camera className="w-3.5 h-3.5" />
                        <span>Escanear con IA</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setTempApiKey(geminiApiKey);
                          setShowApiKeyModal(true);
                        }}
                        className="border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-xs font-heading font-bold px-2.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
                        title="Configurar Clave Gratuita de Google Gemini"
                      >
                        <Key className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="hidden md:inline">Clave IA</span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            geminiApiKey ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-amber-400'
                          }`}
                          title={geminiApiKey ? 'Clave Gemini configurada' : 'Modo Demo (Clic para ingresar clave gratis)'}
                        />
                      </button>

                      <button
                        onClick={() => setShowNewReceptionModal(false)}
                        className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-xl hover:bg-zinc-100 transition-colors"
                        title="Cerrar"
                      >
                        <span className="text-lg font-bold">✕</span>
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleSaveReception} className="flex flex-col flex-1 overflow-hidden pt-4 gap-4">
                    <div className="overflow-y-auto pr-1 space-y-4 flex-1">
                      {/* Cabecera de la Factura */}
                      <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[11px] font-heading font-bold uppercase text-zinc-700">
                              Proveedor *
                            </label>
                            <button
                              type="button"
                              onClick={() => setShowAddSupplierModal(true)}
                              className="text-[10px] font-heading font-bold text-zinc-950 hover:underline flex items-center gap-0.5"
                              title="Crear un nuevo proveedor"
                            >
                              <Plus className="w-3 h-3" /> + Nuevo Proveedor
                            </button>
                          </div>
                          <select
                            value={receptionForm.supplierId}
                            onChange={(e) => {
                              if (e.target.value === 'NEW_SUPPLIER') {
                                setShowAddSupplierModal(true);
                              } else {
                                setReceptionForm({ ...receptionForm, supplierId: e.target.value });
                              }
                            }}
                            className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-bold uppercase focus:outline-none focus:ring-1 focus:ring-zinc-950"
                          >
                            <option value="" disabled>Seleccionar proveedor...</option>
                            {suppliers.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} (CUIT: {s.cuit})
                              </option>
                            ))}
                            <option value="NEW_SUPPLIER" className="font-bold text-emerald-700 bg-emerald-50">
                              + Agregar Nuevo Proveedor a la Lista...
                            </option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-heading font-bold uppercase text-zinc-700 mb-1">
                            N° Factura / Remito *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="FC-0002-00049281"
                            value={receptionForm.invoiceNumber}
                            onChange={(e) => setReceptionForm({ ...receptionForm, invoiceNumber: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-zinc-950"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-heading font-bold uppercase text-zinc-700 mb-1">
                            Fecha Factura *
                          </label>
                          <input
                            type="date"
                            required
                            value={receptionForm.date}
                            onChange={(e) => setReceptionForm({ ...receptionForm, date: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-zinc-950"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-heading font-bold uppercase text-zinc-700 mb-1">
                            Medio de Pago *
                          </label>
                          <select
                            value={receptionForm.paymentMethod}
                            onChange={(e) => setReceptionForm({ ...receptionForm, paymentMethod: e.target.value as any })}
                            className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-bold uppercase focus:outline-none focus:ring-1 focus:ring-zinc-950"
                          >
                            <option value="Transferencia">Transferencia Bancaria</option>
                            <option value="Efectivo">Efectivo Caja</option>
                            <option value="Crédito">Crédito / Cuenta Corriente</option>
                            <option value="Débito">Débito</option>
                          </select>
                        </div>
                      </div>

                      {/* Buscador Rápido de Producto por Palabras o Código SKU */}
                      <div className="relative">
                        <div className="relative flex items-center">
                          <Search className="w-4 h-4 absolute left-3.5 text-zinc-400 pointer-events-none" />
                          <input
                            type="text"
                            placeholder="🔍 Buscar artículo por palabras o código SKU (ej: Spark, XT, SC-SPK, SC-CAS, SHI-PD...) para agregar a la planilla..."
                            value={receptionProductSearch}
                            onChange={(e) => setReceptionProductSearch(e.target.value)}
                            className="w-full pl-10 pr-9 py-2.5 bg-white border-2 border-zinc-200 focus:border-zinc-950 rounded-2xl text-xs font-medium placeholder:text-zinc-400 focus:outline-none shadow-xs transition-colors"
                          />
                          {receptionProductSearch && (
                            <button
                              type="button"
                              onClick={() => setReceptionProductSearch('')}
                              className="absolute right-3.5 text-zinc-400 hover:text-zinc-700 text-xs font-bold"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {/* Desplegable de Resultados de Búsqueda por Palabras o Código */}
                        {filteredReceptionSearchResults.length > 0 && (
                          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-zinc-200 rounded-2xl shadow-2xl z-30 max-h-64 overflow-y-auto divide-y divide-zinc-100 animate-fadeIn">
                            <div className="px-3.5 py-2 bg-zinc-50 text-[10px] font-heading font-bold uppercase text-zinc-500 tracking-wider flex justify-between items-center">
                              <span>Coincidencias encontradas ({filteredReceptionSearchResults.length})</span>
                              <span className="text-zinc-400">Clic para sumar a la planilla</span>
                            </div>
                            {filteredReceptionSearchResults.map(({ product, variant }) => (
                              <div
                                key={`${product.id}-${variant.id}`}
                                onClick={() => handleAddProductFromSearch(product, variant)}
                                className="p-2.5 hover:bg-zinc-50 flex items-center justify-between cursor-pointer transition-colors group"
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className="text-[10px] font-mono font-bold bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded border border-zinc-200 group-hover:bg-zinc-950 group-hover:text-white transition-colors">
                                    {variant.sku || 'SIN CÓD'}
                                  </span>
                                  <div>
                                    <div className="text-xs font-bold text-zinc-950">
                                      [{product.brand}] {product.title}
                                    </div>
                                    <div className="text-[11px] text-zinc-500">
                                      Talle: <span className="font-semibold text-zinc-700">{variant.size}</span> ({variant.color}) · Stock actual: <span className="font-mono font-bold text-zinc-700">{variant.stock || 0} u.</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <span className="text-xs font-mono font-bold text-zinc-950 block">
                                    Costo: {formatCurrency(variant.cost || Math.round(variant.price / 1.5))}
                                  </span>
                                  <span className="text-[10px] text-emerald-600 font-bold uppercase group-hover:underline">
                                    + Cargar a Planilla
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Planilla de Artículos (Spreadsheet) */}
                      <div className="border border-zinc-200 rounded-2xl overflow-hidden shadow-xs">
                        <div className="bg-zinc-100/90 px-4 py-2.5 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-zinc-800" />
                            <span className="font-heading font-bold text-xs uppercase tracking-wider text-zinc-900">
                              Planilla de Artículos Recibidos
                            </span>
                            <span className="bg-white border border-zinc-300 text-zinc-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                              {receptionForm.items.length} {receptionForm.items.length === 1 ? 'artículo' : 'artículos'}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={handleAddReceptionRow}
                            className="bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-heading font-bold uppercase px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" /> Agregar Artículo
                          </button>
                        </div>

                        <div className="overflow-x-auto max-h-[380px] bg-white">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-heading font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10">
                              <tr>
                                <th className="py-2.5 px-3 text-center w-10">#</th>
                                <th className="py-2.5 px-3 min-w-[280px]">Artículo / Producto</th>
                                <th className="py-2.5 px-3 min-w-[180px]">Talle / Variante</th>
                                <th className="py-2.5 px-3 text-center w-24">Stock Actual</th>
                                <th className="py-2.5 px-3 text-center w-28">Cant. a Ingresar</th>
                                <th className="py-2.5 px-3 text-right min-w-[140px]">Costo Unit. ($ ARS)</th>
                                <th className="py-2.5 px-3 text-right min-w-[140px]">Subtotal ($ ARS)</th>
                                <th className="py-2.5 px-3 text-center w-12"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200">
                              {receptionForm.items.map((row, index) => {
                                const currentProduct = products.find((p) => p.id === row.productId) || products[0];
                                const currentVariant =
                                  currentProduct?.variants.find((v) => v.id === row.variantId) || currentProduct?.variants[0];
                                const rowSubtotal = (Number(row.quantity) || 0) * (Number(row.unitCost) || 0);

                                return (
                                  <tr key={row.id} className="hover:bg-zinc-50/80 transition-colors">
                                    <td className="py-2.5 px-3 font-mono text-xs font-bold text-zinc-400 text-center">
                                      {index + 1}
                                    </td>
                                    <td className="py-2.5 px-3">
                                      <select
                                        value={row.productId}
                                        onChange={(e) => handleUpdateReceptionRow(row.id, { productId: e.target.value })}
                                        className="w-full px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                                      >
                                        {products.map((p) => {
                                          const firstSku = p.variants[0]?.sku;
                                          return (
                                            <option key={p.id} value={p.id}>
                                              [{p.brand}] {p.title} {firstSku ? `(Cód: ${firstSku})` : ''}
                                            </option>
                                          );
                                        })}
                                      </select>
                                    </td>
                                    <td className="py-2.5 px-3">
                                      <select
                                        value={row.variantId}
                                        onChange={(e) => handleUpdateReceptionRow(row.id, { variantId: e.target.value })}
                                        className="w-full px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs font-medium text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                                      >
                                        {currentProduct?.variants.map((v) => (
                                          <option key={v.id} value={v.id}>
                                            {v.size} ({v.color}) {v.sku ? `— Cód: ${v.sku}` : ''}
                                          </option>
                                        ))}
                                      </select>
                                    </td>
                                    <td className="py-2.5 px-3 text-center">
                                      <span className="inline-block px-2 py-0.5 text-[11px] font-mono font-bold text-zinc-600 bg-zinc-100 rounded-md">
                                        {currentVariant?.stock || 0} u.
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3">
                                      <input
                                        type="number"
                                        min={1}
                                        required
                                        value={row.quantity}
                                        onChange={(e) =>
                                          handleUpdateReceptionRow(row.id, {
                                            quantity: Math.max(1, parseInt(e.target.value) || 1),
                                          })
                                        }
                                        className="w-full px-2 py-1.5 text-center font-mono font-bold bg-white border border-zinc-300 rounded-lg text-xs text-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                                      />
                                    </td>
                                    <td className="py-2.5 px-3">
                                      <div className="relative">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-400">
                                          $
                                        </span>
                                        <input
                                          type="number"
                                          min={0}
                                          required
                                          value={row.unitCost || ''}
                                          onChange={(e) =>
                                            handleUpdateReceptionRow(row.id, {
                                              unitCost: Math.max(0, parseInt(e.target.value) || 0),
                                            })
                                          }
                                          className="w-full pl-6 pr-2 py-1.5 font-mono font-bold text-right bg-white border border-zinc-300 rounded-lg text-xs text-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                                        />
                                      </div>
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-mono font-bold text-xs text-zinc-950">
                                      {formatCurrency(rowSubtotal)}
                                    </td>
                                    <td className="py-2.5 px-3 text-center">
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveReceptionRow(row.id)}
                                        title="Eliminar fila"
                                        className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Barra de Totales de la Planilla */}
                        <div className="bg-zinc-50 border-t border-zinc-200 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={handleAddReceptionRow}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 text-zinc-800 rounded-xl text-xs font-heading font-bold uppercase transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" /> + Agregar Otro Artículo
                          </button>

                          <div className="flex flex-wrap items-center gap-3 text-xs font-heading">
                            <div className="bg-white border border-zinc-200 px-3 py-1.5 rounded-xl text-zinc-700">
                              <span className="text-zinc-500 font-bold uppercase mr-1.5 text-[10px]">Líneas:</span>
                              <strong className="font-mono">{receptionForm.items.length}</strong>
                            </div>
                            <div className="bg-white border border-zinc-200 px-3 py-1.5 rounded-xl text-zinc-700">
                              <span className="text-zinc-500 font-bold uppercase mr-1.5 text-[10px]">Total Bultos:</span>
                              <strong className="font-mono text-emerald-700">
                                +{receptionForm.items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0)} u.
                              </strong>
                            </div>
                            <div className="bg-rose-50 border border-rose-200 px-3.5 py-1.5 rounded-xl text-rose-800 flex items-center gap-2">
                              <span className="text-rose-600 font-bold uppercase text-[10px]">Total Factura:</span>
                              <strong className="font-mono text-sm sm:text-base font-black text-rose-600">
                                {formatCurrency(
                                  receptionForm.items.reduce(
                                    (acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitCost) || 0),
                                    0
                                  )
                                )}
                              </strong>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Observaciones Opcionales */}
                      <div>
                        <label className="block text-[11px] font-heading font-bold uppercase text-zinc-700 mb-1">
                          Observaciones / Notas del Remito (Opcional)
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: Bultos recibidos en caja cerrada con precinto OK por expreso..."
                          value={receptionForm.notes}
                          onChange={(e) => setReceptionForm({ ...receptionForm, notes: e.target.value })}
                          className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-zinc-950"
                        />
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-zinc-200">
                      <span className="text-[11px] text-zinc-500 hidden sm:inline">
                        Al confirmar, se actualizará el stock de cada artículo y se asentará el egreso financiero en la caja.
                      </span>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          type="button"
                          onClick={() => setShowNewReceptionModal(false)}
                          className="px-4 py-2 border border-zinc-300 rounded-xl text-xs font-heading font-bold uppercase text-zinc-700 hover:bg-zinc-50 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="bg-zinc-950 hover:bg-zinc-800 text-white px-5 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider shadow-md flex items-center gap-2 transition-transform active:scale-95"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Confirmar Planilla & Guardar Factura
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal para Crear Proveedor */}
            {showAddSupplierModal && (
              <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-zinc-200 animate-fadeIn">
                  <h3 className="text-xl font-heading font-black text-zinc-950 mb-2">
                    Nuevo Proveedor / Distribuidor
                  </h3>
                  <form onSubmit={handleAddSupplier} className="space-y-4">
                    <div>
                      <label className="block text-xs font-heading font-bold uppercase text-zinc-700 mb-1">
                        Razón Social / Nombre *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Dalsanto Scott Argentina SA"
                        value={newSupplierForm.name}
                        onChange={(e) => setNewSupplierForm({ ...newSupplierForm, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-medium focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-heading font-bold uppercase text-zinc-700 mb-1">
                        CUIT
                      </label>
                      <input
                        type="text"
                        placeholder="30-71829123-4"
                        value={newSupplierForm.cuit}
                        onChange={(e) => setNewSupplierForm({ ...newSupplierForm, cuit: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-heading font-bold uppercase text-zinc-700 mb-1">
                          Persona Contacto
                        </label>
                        <input
                          type="text"
                          placeholder="Mariano"
                          value={newSupplierForm.contactPerson}
                          onChange={(e) => setNewSupplierForm({ ...newSupplierForm, contactPerson: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-heading font-bold uppercase text-zinc-700 mb-1">
                          Teléfono
                        </label>
                        <input
                          type="tel"
                          placeholder="5491145558800"
                          value={newSupplierForm.phone}
                          onChange={(e) => setNewSupplierForm({ ...newSupplierForm, phone: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-3">
                      <button
                        type="button"
                        onClick={() => setShowAddSupplierModal(false)}
                        className="px-5 py-2.5 border border-zinc-300 rounded-xl text-xs font-heading font-bold uppercase text-zinc-700"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="bg-zinc-950 text-white px-5 py-2.5 rounded-xl text-xs font-heading font-bold uppercase tracking-wider hover:bg-zinc-800 shadow-md"
                      >
                        Guardar Proveedor
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal para Configurar Clave Gratuita de Google Gemini */}
            {showApiKeyModal && (
              <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-zinc-200 animate-fadeIn">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-zinc-950 text-white flex items-center justify-center">
                      <Key className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-heading font-black text-zinc-950">
                        Clave IA Gratuita (Google Gemini)
                      </h3>
                      <span className="text-[11px] text-zinc-500 font-medium block">
                        Para lectura automática de facturas mediante foto o PDF.
                      </span>
                    </div>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 my-4 text-xs text-emerald-900 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>¡100% Gratuito y Oficial de Google!</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-emerald-800">
                      Google te permite procesar <strong>hasta 1.500 facturas por día gratis</strong> (más que suficiente para cualquier bicicletería) y <strong>no requiere ingresar tarjeta de crédito</strong>.
                    </p>
                    <div className="pt-1">
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-1.5 rounded-xl font-heading font-bold text-[11px] uppercase tracking-wider shadow-xs transition-colors"
                      >
                        <span>Obtener mi clave gratis en Google AI Studio ↗</span>
                      </a>
                    </div>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveGeminiKey(tempApiKey);
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-[11px] font-heading font-bold uppercase text-zinc-700 mb-1">
                        Pegá tu API Key de Gemini
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: AIzaSyD..."
                        value={tempApiKey}
                        onChange={(e) => setTempApiKey(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-zinc-950"
                      />
                      <span className="text-[10px] text-zinc-400 mt-1 block">
                        Se guardará de forma privada en tu navegador. Si no ingresás ninguna clave, el sistema operará en modo demostración.
                      </span>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowApiKeyModal(false)}
                        className="px-4 py-2 border border-zinc-300 rounded-xl text-xs font-heading font-bold uppercase text-zinc-700 hover:bg-zinc-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="bg-zinc-950 hover:bg-zinc-800 text-white px-5 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider shadow-md"
                      >
                        Guardar Clave IA
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: BASE DE DATOS DE CLIENTES Y COMPRAS                */}
        {/* ========================================================= */}
        {activeTab === 'clientes' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-zinc-950" />
                  <h2 className="text-xl font-heading font-black text-zinc-950">
                    Base de Datos de Clientes & Compras
                  </h2>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Registro automático de compradores de mostrador y web con historial de bicicletas adquiridas y contacto directo por WhatsApp.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAddCustomerModal(true)}
                  className="bg-zinc-950 hover:bg-zinc-800 text-white font-heading text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md transition-transform active:scale-95"
                >
                  <UserPlus className="w-4 h-4" /> + Cargar Cliente Manual
                </button>
              </div>
            </div>

            {/* Buscador de Clientes */}
            <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs flex items-center gap-3">
              <Search className="w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar cliente por apellido, nombre, teléfono, DNI o modelo de bicicleta..."
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs font-medium focus:outline-none"
              />
            </div>

            {/* Listado de Clientes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCustomers.map((cust) => (
                <div
                  key={cust.id}
                  className="bg-white p-6 rounded-3xl border border-zinc-200 hover:border-zinc-400 shadow-xs flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-heading font-black text-base text-zinc-950 leading-tight">
                          {cust.lastName}, {cust.firstName}
                        </h3>
                        <span className="text-[11px] text-zinc-400 font-mono">
                          {cust.docType}: {cust.doc}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-zinc-950 bg-zinc-100 px-2.5 py-1 rounded-lg">
                        {formatCurrency(cust.totalSpent)}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-zinc-600 mb-4 bg-zinc-50 p-3 rounded-2xl border border-zinc-100">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="font-mono">{cust.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="truncate">{cust.email}</span>
                      </div>
                    </div>

                    {/* Bicicletas / Artículos Comprados */}
                    <div>
                      <span className="text-[10px] font-heading font-black uppercase tracking-wider text-zinc-400 block mb-1.5">
                        Bicicletas / Compras Realizadas:
                      </span>
                      {cust.purchases && cust.purchases.length > 0 ? (
                        <div className="space-y-1.5">
                          {cust.purchases.map((p, idx) => (
                            <div
                              key={idx}
                              className="p-2 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs space-y-0.5"
                            >
                              <div className="flex items-center gap-1 text-emerald-950 font-heading font-bold">
                                <Bike className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span className="line-clamp-1">{p.itemsSummary}</span>
                              </div>
                              <div className="flex justify-between text-[10px] text-emerald-800 font-mono">
                                <span>{p.date.slice(0, 10)}</span>
                                <strong>{formatCurrency(p.total)}</strong>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400 italic">Sin compras registradas aún.</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-zinc-100">
                    <a
                      href={`https://wa.me/${cust.phone}?text=Hola%20${encodeURIComponent(
                        cust.firstName
                      )}!%20Te%20contactamos%20de%20Oroño%20Bike.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-heading text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" /> Enviar WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal para Agregar Cliente Manual */}
            {showAddCustomerModal && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-zinc-200 animate-fadeIn">
                  <h3 className="text-xl font-heading font-black text-zinc-950 mb-2">
                    Registrar Nuevo Cliente
                  </h3>
                  <form onSubmit={handleAddCustomerManual} className="space-y-4">
                    <div>
                      <label className="block text-xs font-heading font-bold uppercase text-zinc-700 mb-1">
                        Nombre y Apellido / Razón Social *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Juan Pérez / Rosario Cycling Team SRL"
                        value={newCustomerForm.fullName}
                        onChange={(e) => setNewCustomerForm({ ...newCustomerForm, fullName: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-4">
                        <label className="block text-xs font-heading font-bold uppercase text-zinc-700 mb-1">
                          Tipo
                        </label>
                        <select
                          value={newCustomerForm.docType}
                          onChange={(e) => setNewCustomerForm({ ...newCustomerForm, docType: e.target.value as any })}
                          className="w-full px-2 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold"
                        >
                          <option value="DNI">DNI</option>
                          <option value="CUIT">CUIT</option>
                        </select>
                      </div>
                      <div className="col-span-8">
                        <label className="block text-xs font-heading font-bold uppercase text-zinc-700 mb-1">
                          N° Documento
                        </label>
                        <input
                          type="text"
                          value={newCustomerForm.doc}
                          onChange={(e) => setNewCustomerForm({ ...newCustomerForm, doc: e.target.value })}
                          className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-heading font-bold uppercase text-zinc-700 mb-1">
                        Teléfono / WhatsApp *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="5493415551234"
                        value={newCustomerForm.phone}
                        onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-heading font-bold uppercase text-zinc-700 mb-1">
                        Bicicleta Adquirida (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Scott Spark RC World Cup / Volta Radix"
                        value={newCustomerForm.purchasedBike}
                        onChange={(e) => setNewCustomerForm({ ...newCustomerForm, purchasedBike: e.target.value })}
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddCustomerModal(false)}
                        className="px-5 py-2.5 border border-zinc-300 rounded-xl text-xs font-heading font-bold uppercase text-zinc-700"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="bg-zinc-950 text-white px-5 py-2.5 rounded-xl text-xs font-heading font-bold uppercase tracking-wider hover:bg-zinc-800 shadow-md"
                      >
                        Guardar Cliente
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: CIERRE & ARQUEO DE CAJA DIARIA                     */}
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
                              mov.type === 'ingreso' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
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
        {/* TAB 7: TALLER                                             */}
        {/* ========================================================= */}
        {activeTab === 'taller' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-heading font-black text-zinc-950 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-zinc-950" /> Taller Mecánico Especializado
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Administra los ingresos de bicicletas en reparación, seguimiento de turnos y tarifas oficiales.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowNewTicketModal(true)}
                  className="bg-zinc-950 hover:bg-zinc-800 text-white font-heading text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md transition-transform active:scale-95"
                >
                  <Plus className="w-4 h-4" /> + Ingresar Bici al Taller
                </button>
                <button
                  onClick={() => setWorkshopSubTab('turnos')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-heading font-bold uppercase transition-all ${
                    workshopSubTab === 'turnos' ? 'bg-zinc-950 text-white shadow-xs' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  Turnos & Reparaciones ({workshopTickets.length})
                </button>
                <button
                  onClick={() => setWorkshopSubTab('servicios')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-heading font-bold uppercase transition-all flex items-center gap-1.5 ${
                    workshopSubTab === 'servicios' ? 'bg-zinc-950 text-white shadow-xs' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" /> Servicios & Tarifas ({workshopServices.length})
                </button>
              </div>
            </div>

            {/* Modal para Ingresar Bicicleta al Taller */}
            {showNewTicketModal && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-zinc-200 animate-fadeIn">
                  <div className="flex items-center gap-2 mb-1">
                    <Bike className="w-5 h-5 text-zinc-950" />
                    <h3 className="text-xl font-heading font-black text-zinc-950">
                      Ingresar Bicicleta al Taller
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-500 mb-6">
                    Registra la recepción física de una bicicleta para su diagnóstico y service.
                  </p>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newTicketForm.client.trim() || !newTicketForm.bike.trim()) {
                        alert('Por favor completa el nombre del cliente y el modelo de bicicleta.');
                        return;
                      }
                      const nextNum = Math.floor(104 + Math.random() * 890);
                      const newTicket = {
                        id: `SER-${nextNum}`,
                        client: newTicketForm.client,
                        phone: newTicketForm.phone || '5493410000000',
                        bike: newTicketForm.bike,
                        serviceType: newTicketForm.serviceType,
                        status: newTicketForm.status,
                        date: newTicketForm.date || new Date().toISOString().slice(0, 10),
                        price: newTicketForm.price || 0,
                        notes: newTicketForm.notes,
                      };
                      setWorkshopTickets([newTicket, ...workshopTickets]);
                      setShowNewTicketModal(false);
                      setNewTicketForm({
                        client: '',
                        phone: '',
                        bike: '',
                        serviceType: 'Service General & Puesta a Punto',
                        date: new Date().toISOString().slice(0, 10),
                        price: 45000,
                        status: 'En Taller',
                        notes: '',
                      });
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-heading font-bold uppercase text-zinc-700 mb-1">
                        Nombre y Apellido del Cliente *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Juan Pérez"
                        value={newTicketForm.client}
                        onChange={(e) => setNewTicketForm({ ...newTicketForm, client: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-medium focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-heading font-bold uppercase text-zinc-700 mb-1">
                          WhatsApp / Teléfono *
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="5493415551234"
                          value={newTicketForm.phone}
                          onChange={(e) => setNewTicketForm({ ...newTicketForm, phone: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-heading font-bold uppercase text-zinc-700 mb-1">
                          Día de Ingreso *
                        </label>
                        <input
                          type="date"
                          required
                          value={newTicketForm.date}
                          onChange={(e) => setNewTicketForm({ ...newTicketForm, date: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono font-bold focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-heading font-bold uppercase text-zinc-700 mb-1">
                        Bicicleta (Marca y Modelo) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Scott Spark RC / Volta Radix 29 / Raleigh Mojave"
                        value={newTicketForm.bike}
                        onChange={(e) => setNewTicketForm({ ...newTicketForm, bike: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-medium focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-heading font-bold uppercase text-zinc-700 mb-1">
                          Servicio a Realizar *
                        </label>
                        <select
                          value={newTicketForm.serviceType}
                          onChange={(e) => {
                            const selected = e.target.value;
                            const found = workshopServices.find((s) => s.title === selected);
                            setNewTicketForm({
                              ...newTicketForm,
                              serviceType: selected,
                              price: found?.price || newTicketForm.price,
                            });
                          }}
                          className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold focus:outline-none"
                        >
                          {workshopServices.map((s) => (
                            <option key={s.id} value={s.title}>
                              {s.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-heading font-bold uppercase text-zinc-700 mb-1">
                          Costo Estimado ($ ARS) *
                        </label>
                        <input
                          type="number"
                          required
                          value={newTicketForm.price || ''}
                          onChange={(e) => setNewTicketForm({ ...newTicketForm, price: Number(e.target.value) })}
                          className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono font-bold focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-heading font-bold uppercase text-zinc-700 mb-1">
                        Estado Inicial
                      </label>
                      <select
                        value={newTicketForm.status}
                        onChange={(e) => setNewTicketForm({ ...newTicketForm, status: e.target.value })}
                        className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold focus:outline-none"
                      >
                        <option value="En Taller">En Taller (En Proceso)</option>
                        <option value="Pendiente">Pendiente (A la Espera)</option>
                        <option value="Listo para Retiro">Listo para Retiro</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-heading font-bold uppercase text-zinc-700 mb-1">
                        Diagnóstico / Observaciones
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Ej. Centrado de rueda trasera, purga de frenos y cambio de cadena..."
                        value={newTicketForm.notes}
                        onChange={(e) => setNewTicketForm({ ...newTicketForm, notes: e.target.value })}
                        className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowNewTicketModal(false)}
                        className="px-5 py-2.5 border border-zinc-300 rounded-xl text-xs font-heading font-bold uppercase text-zinc-700"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="bg-zinc-950 text-white px-6 py-2.5 rounded-xl text-xs font-heading font-bold uppercase tracking-wider hover:bg-zinc-800 shadow-md"
                      >
                        Ingresar al Taller
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {workshopSubTab === 'servicios' && (
              <div className="space-y-6 animate-fadeIn">
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
                          onClick={() => {
                            setEditingServiceId(srv.id);
                            setServiceFormData({
                              title: srv.title,
                              description: srv.description,
                              duration: srv.duration,
                              price: srv.price,
                            });
                            setShowServiceModal(true);
                          }}
                          className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-xs font-heading font-bold uppercase text-zinc-800 flex items-center justify-center gap-1.5"
                        >
                          <Edit className="w-3.5 h-3.5" /> Modificar
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar servicio "${srv.title}"?`)) {
                              WorkshopService.deleteService(srv.id);
                              setWorkshopServices(WorkshopService.getServices());
                            }
                          }}
                          className="p-2 text-zinc-400 hover:text-rose-600 rounded-xl hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {workshopSubTab === 'turnos' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fadeIn">
                {workshopTickets.map((t) => (
                  <div
                    key={t.id}
                    className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[11px] font-mono font-bold text-zinc-400">#{t.id}</span>
                        <select
                          value={t.status}
                          onChange={(e) => {
                            const newStatus = e.target.value;
                            setWorkshopTickets((prev) =>
                              prev.map((item) => (item.id === t.id ? { ...item, status: newStatus } : item))
                            );
                          }}
                          className="text-[10px] font-heading font-bold uppercase px-2.5 py-1 rounded-full border bg-zinc-50"
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
                        <div><strong>Cliente:</strong> {t.client}</div>
                        <div><strong>Fecha de Turno:</strong> {t.date}</div>
                        {t.notes && <div className="text-zinc-500 italic">"{t.notes}"</div>}
                        <div className="text-zinc-950 font-mono font-bold pt-1">
                          Costo Estimado: {formatCurrency(t.price)}
                        </div>
                      </div>
                    </div>

                    <a
                      href={`https://wa.me/${t.phone}?text=Hola%20${encodeURIComponent(
                        t.client
                      )}!%20Te%20escribimos%20de%20Oroño%20Bike.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-heading text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" /> Avisar por WhatsApp
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
