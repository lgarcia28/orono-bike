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
  Truck,
  Users,
  Building2,
  Phone,
  Mail,
  UserPlus,
  ArrowDownLeft,
  Briefcase,
} from 'lucide-react';

type AdminTab = 'ventas' | 'pos_facturacion' | 'inventario' | 'recepcion' | 'clientes' | 'caja' | 'taller';
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
    firstName: '',
    lastName: '',
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

  const [showNewReceptionModal, setShowNewReceptionModal] = useState(false);
  const [receptionForm, setReceptionForm] = useState<{
    supplierId: string;
    invoiceNumber: string;
    paymentMethod: 'Efectivo' | 'Transferencia' | 'Crédito' | 'Débito';
    productId: string;
    variantId: string;
    quantity: number;
    unitCost: number;
    notes: string;
  }>({
    supplierId: 'sup-01',
    invoiceNumber: '',
    paymentMethod: 'Transferencia',
    productId: 'prod-01',
    variantId: 'var-01-m',
    quantity: 1,
    unitCost: 5800000,
    notes: '',
  });

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
  ]);

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
  // RECEPCIÓN DE MERCADERÍA & FACTURAS DE COMPRA (PROVEEDORES)
  // ========================================================
  const handleSaveReception = (e: React.FormEvent) => {
    e.preventDefault();
    const supplier = suppliers.find((s) => s.id === receptionForm.supplierId) || suppliers[0];
    const selectedProd = products.find((p) => p.id === receptionForm.productId) || products[0];
    const selectedVar = selectedProd.variants.find((v) => v.id === receptionForm.variantId) || selectedProd.variants[0];

    const qty = Math.max(1, receptionForm.quantity);
    const unitCost = Math.max(0, receptionForm.unitCost);
    const subtotal = qty * unitCost;
    const nowStr = new Date().toLocaleString();

    const newReception: ReceptionRecord = {
      id: `REC-${Date.now().toString().slice(-4)}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      invoiceNumber: receptionForm.invoiceNumber || `FC-INT-${Date.now().toString().slice(-6)}`,
      date: nowStr,
      paymentMethod: receptionForm.paymentMethod,
      items: [
        {
          productId: selectedProd.id,
          productTitle: selectedProd.title,
          variantId: selectedVar.id,
          variantDetails: `${selectedVar.size} (${selectedVar.color})`,
          quantity: qty,
          unitCost,
          subtotal,
        },
      ],
      totalAmount: subtotal,
      notes: receptionForm.notes,
    };

    // 1. Guardar Recepción
    setReceptions([newReception, ...receptions]);

    // 2. ACTUALIZAR STOCK FÍSICO AUTOMÁTICAMENTE en el inventario
    setProducts((prev) => {
      const updated = prev.map((p) => {
        if (p.id === selectedProd.id) {
          return {
            ...p,
            variants: p.variants.map((v) => {
              if (v.id === selectedVar.id) {
                const newStock = (v.stock || 0) + qty;
                const newCost = unitCost > 0 ? unitCost : (v.cost ?? Math.round(v.price / 1.5));
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
        }
        return p;
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
      concept: `Compra Proveedor: ${supplier.name} (${newReception.invoiceNumber})`,
      category: 'Compra de Mercadería / Stock',
      paymentMethod: receptionForm.paymentMethod,
      amount: subtotal,
    };
    setCashMovements([newCashOutflow, ...cashMovements]);

    // 4. ACTUALIZAR TOTAL COMPRADO AL PROVEEDOR
    setSuppliers((prev) =>
      prev.map((s) => (s.id === supplier.id ? { ...s, totalPurchased: s.totalPurchased + subtotal } : s))
    );

    setShowNewReceptionModal(false);
    alert(`¡Mercadería ingresada exitosamente!\n• Se sumaron +${qty} unidades a "${selectedProd.title}".\n• Se registró un egreso de ${formatCurrency(subtotal)} en la caja.`);
  };

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierForm.name.trim()) return;

    const newSup: SupplierRecord = {
      id: `sup-${Date.now()}`,
      name: newSupplierForm.name,
      cuit: newSupplierForm.cuit || '30-00000000-0',
      contactPerson: newSupplierForm.contactPerson || 'Contacto',
      phone: newSupplierForm.phone || '00000000',
      email: newSupplierForm.email || 'proveedor@oronobike.com.ar',
      category: newSupplierForm.category,
      totalPurchased: 0,
    };

    setSuppliers([...suppliers, newSup]);
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
    if (!newCustomerForm.firstName.trim() || !newCustomerForm.phone.trim()) {
      alert('Por favor completa el nombre y teléfono del cliente.');
      return;
    }

    const newCust: CustomerRecord = {
      id: `cust-${Date.now()}`,
      firstName: newCustomerForm.firstName,
      lastName: newCustomerForm.lastName,
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
      firstName: '',
      lastName: '',
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
            <div className="inline-flex items-center gap-2 text-[11px] font-heading font-extrabold text-zinc-400 uppercase tracking-widest mb-1.5">
              <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" />
              <span>Oroño Bike • Panel de Gestión Integral</span>
            </div>
            <h1 className="text-3xl font-heading font-black text-white tracking-tight">
              Control General del Negocio
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Punto de venta & Facturación ARCA, Inventario, Recepción de compras, Base de clientes y Caja.
            </p>
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
            <Package className="w-4 h-4" /> Inventario & Precios
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
            <Wrench className="w-4 h-4" /> Taller & Servicios
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
        {/* TAB 4: RECEPCIÓN DE MERCADERÍA & PROVEEDORES              */}
        {/* ========================================================= */}
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
                  onClick={() => setShowNewReceptionModal(true)}
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

            {/* Modal para Registrar Factura de Compra & Sumar Stock */}
            {showNewReceptionModal && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-zinc-200 animate-fadeIn">
                  <div className="flex items-center gap-2 mb-1">
                    <Truck className="w-5 h-5 text-zinc-950" />
                    <h3 className="text-xl font-heading font-black text-zinc-950">
                      Registrar Factura de Compra
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-500 mb-6">
                    Al guardar, las unidades se <strong>sumarán al stock</strong> y el monto se registrará como <strong>egreso de caja</strong>.
                  </p>

                  <form onSubmit={handleSaveReception} className="space-y-4">
                    <div>
                      <label className="block text-xs font-heading font-bold uppercase text-zinc-700 mb-1">
                        Proveedor *
                      </label>
                      <select
                        value={receptionForm.supplierId}
                        onChange={(e) => setReceptionForm({ ...receptionForm, supplierId: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold uppercase focus:outline-none"
                      >
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} (CUIT: {s.cuit})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-heading font-bold uppercase text-zinc-700 mb-1">
                          N° Factura / Remito *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="FC-0002-00049281"
                          value={receptionForm.invoiceNumber}
                          onChange={(e) => setReceptionForm({ ...receptionForm, invoiceNumber: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono font-bold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-heading font-bold uppercase text-zinc-700 mb-1">
                          Medio de Pago *
                        </label>
                        <select
                          value={receptionForm.paymentMethod}
                          onChange={(e) => setReceptionForm({ ...receptionForm, paymentMethod: e.target.value as any })}
                          className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold uppercase focus:outline-none"
                        >
                          <option value="Transferencia">Transferencia Bancaria</option>
                          <option value="Efectivo">Efectivo Caja</option>
                          <option value="Crédito">Crédito / Cuenta Corriente</option>
                          <option value="Débito">Débito</option>
                        </select>
                      </div>
                    </div>

                    {/* Selector de Producto y Variante para Stock */}
                    <div>
                      <label className="block text-xs font-heading font-bold uppercase text-zinc-700 mb-1">
                        Producto a Ingresar *
                      </label>
                      <select
                        value={receptionForm.productId}
                        onChange={(e) => {
                          const pId = e.target.value;
                          const found = products.find((p) => p.id === pId);
                          const firstVar = found?.variants[0];
                          setReceptionForm({
                            ...receptionForm,
                            productId: pId,
                            variantId: firstVar?.id || '',
                            unitCost: firstVar?.cost || Math.round(firstVar?.price || 0) / 1.5,
                          });
                        }}
                        className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold focus:outline-none"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            [{p.brand}] {p.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-heading font-bold uppercase text-zinc-700 mb-1">
                          Cantidad a Recibir (Stock +) *
                        </label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={receptionForm.quantity}
                          onChange={(e) => setReceptionForm({ ...receptionForm, quantity: Number(e.target.value) })}
                          className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-bold text-center focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-heading font-bold uppercase text-zinc-700 mb-1">
                          Costo Unitario ($ ARS) *
                        </label>
                        <input
                          type="number"
                          required
                          value={receptionForm.unitCost || ''}
                          onChange={(e) => setReceptionForm({ ...receptionForm, unitCost: Number(e.target.value) })}
                          className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-mono font-bold focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs flex justify-between items-center">
                      <span className="text-zinc-600 font-bold uppercase">Total Factura (Egreso):</span>
                      <strong className="font-mono text-base text-rose-600 font-black">
                        {formatCurrency(receptionForm.quantity * receptionForm.unitCost)}
                      </strong>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowNewReceptionModal(false)}
                        className="px-5 py-2.5 border border-zinc-300 rounded-xl text-xs font-heading font-bold uppercase text-zinc-700"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="bg-zinc-950 text-white px-6 py-2.5 rounded-xl text-xs font-heading font-bold uppercase tracking-wider hover:bg-zinc-800 shadow-md"
                      >
                        Ingresar Stock & Registrar Egreso
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal para Crear Proveedor */}
            {showAddSupplierModal && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
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
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-heading font-bold uppercase text-zinc-700 mb-1">
                          Nombre *
                        </label>
                        <input
                          type="text"
                          required
                          value={newCustomerForm.firstName}
                          onChange={(e) => setNewCustomerForm({ ...newCustomerForm, firstName: e.target.value })}
                          className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-heading font-bold uppercase text-zinc-700 mb-1">
                          Apellido *
                        </label>
                        <input
                          type="text"
                          required
                          value={newCustomerForm.lastName}
                          onChange={(e) => setNewCustomerForm({ ...newCustomerForm, lastName: e.target.value })}
                          className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs focus:outline-none"
                        />
                      </div>
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
        {/* TAB 7: TALLER & SERVICIOS                                 */}
        {/* ========================================================= */}
        {activeTab === 'taller' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-heading font-black text-zinc-950 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-zinc-950" /> Taller Mecánico Especializado
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Administra los turnos de reparación y configura los servicios, tiempos de entrega y precios oficiales.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWorkshopSubTab('turnos')}
                  className={`px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase transition-all ${
                    workshopSubTab === 'turnos' ? 'bg-zinc-950 text-white shadow-xs' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  Turnos & Reparaciones ({workshopTickets.length})
                </button>
                <button
                  onClick={() => setWorkshopSubTab('servicios')}
                  className={`px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase transition-all flex items-center gap-1.5 ${
                    workshopSubTab === 'servicios' ? 'bg-zinc-950 text-white shadow-xs' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" /> Servicios & Tarifas ({workshopServices.length})
                </button>
              </div>
            </div>

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
