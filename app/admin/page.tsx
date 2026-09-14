'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Header } from '@/app/components/layout/Header';
import { ALL_PRODUCTS_CATALOG } from '@/lib/data/bikes';
import { ProductWithVariants, ProductVariant } from '@/lib/supabase/types';
import { WorkshopService, WorkshopServiceItem } from '@/lib/services/workshop.service';
import { PointOfSaleInterface } from '@/app/components/pos/PointOfSaleInterface';
import { PricingService, PricingPolicySettings, DEFAULT_PRICING_POLICY } from '@/lib/services/pricing.service';
import { PromoService, PromoPopupSettings, PromoSubscriber, DEFAULT_PROMO_SETTINGS } from '@/lib/services/promo.service';
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  Receipt,
  Wrench,
  DollarSign,
  Landmark,
  Plus,
  Search,
  SlidersHorizontal,
  Settings2,
  Star,
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
  Gift,
  Copy,
  Check,
} from 'lucide-react';

type AdminTab = 'ventas' | 'pos_facturacion' | 'inventario' | 'politicas' | 'recepcion' | 'clientes' | 'caja' | 'taller' | 'marketing';
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
  category?: string;
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
    totalPurchased: 28500000,
  },
  {
    id: 'sup-02',
    name: 'Shimano Latin America / Distribuidora Oficial',
    cuit: '30-68912384-9',
    contactPerson: 'Carlos Vedia',
    phone: '5491148889900',
    email: 'pedidos@shimanodistribucion.com.ar',
    totalPurchased: 14200000,
  },
  {
    id: 'sup-03',
    name: 'Bicicletas Volta SRL',
    cuit: '30-71458921-2',
    contactPerson: 'Esteban Rossi',
    phone: '5493415551122',
    email: 'contacto@voltabikes.com.ar',
    totalPurchased: 9800000,
  },
  {
    id: 'sup-04',
    name: 'Raleigh Argentina SA',
    cuit: '30-65498123-1',
    contactPerson: 'Gustavo Bianchi',
    phone: '5491147771234',
    email: 'distribucion@raleigh.com.ar',
    totalPurchased: 6400000,
  },
  {
    id: 'sup-05',
    name: 'Sars Performance Bikes',
    cuit: '30-71689234-8',
    contactPerson: 'Nicolás Ferrero',
    phone: '5493514889911',
    email: 'info@sarsbikes.com.ar',
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
  const [selectedCustomerForPurchases, setSelectedCustomerForPurchases] = useState<CustomerRecord | null>(null);
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
    // Soporte para artículos nuevos creados en la misma factura
    isNewProduct?: boolean;
    newProductTitle?: string;
    newProductBrand?: string;
    newProductCategory?: string;
    newProductSize?: string;
    newProductColor?: string;
  }

  const [showNewReceptionModal, setShowNewReceptionModal] = useState(false);
  const [receptionForm, setReceptionForm] = useState<{
    supplierId: string;
    invoiceType: string;
    invoicePos: string;
    invoiceNum: string;
    invoiceNumber: string;
    date: string;
    paymentMethod: 'Efectivo' | 'Transferencia' | 'Crédito' | 'Débito';
    notes: string;
    items: ReceptionItemDraft[];
  }>({
    supplierId: 'sup-01',
    invoiceType: 'A',
    invoicePos: '0001',
    invoiceNum: '',
    invoiceNumber: '',
    date: new Date().toISOString().slice(0, 10),
    paymentMethod: 'Transferencia',
    notes: '',
    items: [],
  });

  const [receptionProductSearch, setReceptionProductSearch] = useState('');
  // Modal para dar de alta producto nuevo rápidamente desde la planilla
  const [showQuickNewProductModal, setShowQuickNewProductModal] = useState(false);
  const [quickNewProductForm, setQuickNewProductForm] = useState({
    title: '',
    brand: 'SCOTT',
    category: 'MTB',
    size: 'M',
    color: 'Negro Mate',
    sku: '',
    unitCost: 0,
    quantity: 1,
    profitMargin: 60,
  });
  
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
  });
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');

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

  // Configuración de Marketing & Pop-up Promocional (Lead Magnet)
  const [promoSettings, setPromoSettings] = useState<PromoPopupSettings>(() => PromoService.getSettings());
  const [promoSubscribers, setPromoSubscribers] = useState<PromoSubscriber[]>(() => PromoService.getSubscribers());
  const [promoSavedToast, setPromoSavedToast] = useState(false);
  const [copiedEmailsToast, setCopiedEmailsToast] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setPromoSettings(PromoService.getSettings());
      setPromoSubscribers(PromoService.getSubscribers());
    };
    window.addEventListener('promoSettingsUpdated', handleUpdate);
    window.addEventListener('promoSubscribersUpdated', handleUpdate);
    return () => {
      window.removeEventListener('promoSettingsUpdated', handleUpdate);
      window.removeEventListener('promoSubscribersUpdated', handleUpdate);
    };
  }, []);

  const handleSavePromoSettings = (newSettings: PromoPopupSettings) => {
    PromoService.saveSettings(newSettings);
    setPromoSettings(newSettings);
    setPromoSavedToast(true);
    setTimeout(() => setPromoSavedToast(false), 2500);
  };

  const handleCopyAllEmails = () => {
    if (promoSubscribers.length === 0) return;
    const allEmails = promoSubscribers.map((s) => s.email).join(', ');
    navigator.clipboard.writeText(allEmails);
    setCopiedEmailsToast(true);
    setTimeout(() => setCopiedEmailsToast(false), 2500);
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

  const getInvoiceTypeBadge = (type?: string) => {
    const t = (type || '').toUpperCase();
    if (t.includes('FACTURA_A') || t === 'A' || t.includes('FC A')) {
      return { label: 'Factura A', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
    if (t.includes('FACTURA_B') || t === 'B' || t.includes('FC B')) {
      return { label: 'Factura B', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
    }
    if (t.includes('FACTURA_C') || t === 'C' || t.includes('FC C')) {
      return { label: 'Factura C', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    }
    if (t.includes('REMITO') || t.includes('REM')) {
      return { label: 'Remito Oficial', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
    }
    return { label: 'Remito / Ticket Local', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
  };

  const handleDownloadInvoice = (customer: CustomerRecord, purchase: any) => {
    const badge = getInvoiceTypeBadge(purchase.invoiceType);
    const invoiceNum = purchase.invoiceId || purchase.orderId || `FAC-${Date.now().toString().slice(-6)}`;
    const isRemito = (purchase.invoiceType || '').toUpperCase().includes('REMITO') || (purchase.invoiceType || '').toUpperCase().includes('TICKET');
    const docTitle = isRemito ? 'REMITO DE ENTREGA' : `FACTURA ELECTRÓNICA (${badge.label.toUpperCase()})`;

    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      alert('Por favor habilita las ventanas emergentes (popups) en tu navegador para descargar el comprobante.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${docTitle} - ${invoiceNum} - Oroño Bike</title>
          <meta charset="utf-8" />
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #18181b; padding: 40px; max-width: 800px; margin: 0 auto; background: #fff; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #18181b; padding-bottom: 20px; margin-bottom: 24px; }
            .brand-name { font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; }
            .brand-sub { font-size: 11px; color: #71717a; margin-top: 4px; }
            .doc-box { text-align: right; }
            .doc-type { font-size: 18px; font-weight: 800; color: #09090b; }
            .doc-number { font-family: monospace; font-size: 14px; font-weight: 700; color: #27272a; margin-top: 4px; }
            .doc-date { font-size: 11px; color: #71717a; margin-top: 2px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; font-size: 12px; background: #f4f4f5; padding: 16px; border-radius: 12px; }
            .info-col h4 { font-size: 10px; text-transform: uppercase; font-weight: 800; color: #71717a; letter-spacing: 0.5px; margin-bottom: 6px; }
            .info-row { margin-bottom: 4px; }
            .info-row strong { color: #09090b; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
            th { text-align: left; background: #18181b; color: #fff; padding: 10px 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
            td { padding: 12px; border-bottom: 1px solid #e4e4e7; }
            .item-desc { font-weight: 600; color: #09090b; }
            .item-bikes { font-size: 11px; color: #059669; font-weight: 600; margin-top: 4px; }
            .totals { display: flex; justify-content: flex-end; margin-bottom: 30px; }
            .total-card { width: 280px; background: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; padding: 16px; }
            .total-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; color: #52525b; }
            .total-row.final { border-top: 2px solid #18181b; padding-top: 8px; margin-top: 8px; font-size: 16px; font-weight: 900; color: #09090b; font-family: monospace; }
            .footer { border-top: 1px dashed #d4d4d8; padding-top: 16px; text-align: center; font-size: 11px; color: #71717a; line-height: 1.5; }
            .footer strong { color: #18181b; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand-name">Oroño Bike</div>
              <div class="brand-sub">Tienda Oficial & Taller Especializado</div>
              <div class="brand-sub">Bv. Nicasio Oroño 1234 · Rosario, Santa Fe</div>
              <div class="brand-sub">CUIT: 30-71889922-4 · IVA Resp. Inscripto</div>
            </div>
            <div class="doc-box">
              <div class="doc-type">${docTitle}</div>
              <div class="doc-number">N° ${invoiceNum}</div>
              <div class="doc-date">Fecha: ${purchase.date}</div>
              ${purchase.orderId ? `<div class="doc-date">Orden: ${purchase.orderId}</div>` : ''}
            </div>
          </div>

          <div class="info-grid">
            <div class="info-col">
              <h4>Datos del Cliente</h4>
              <div class="info-row"><strong>Nombre / Razón Social:</strong> ${customer.lastName}, ${customer.firstName}</div>
              <div class="info-row"><strong>${customer.docType}:</strong> ${customer.doc || '-'}</div>
              <div class="info-row"><strong>Teléfono:</strong> ${customer.phone || '-'}</div>
              ${customer.email ? `<div class="info-row"><strong>Email:</strong> ${customer.email}</div>` : ''}
            </div>
            <div class="info-col">
              <h4>Condiciones de Venta</h4>
              <div class="info-row"><strong>Comprobante:</strong> ${badge.label}</div>
              <div class="info-row"><strong>Condición:</strong> Pagado / Entregado</div>
              <div class="info-row"><strong>Garantía:</strong> Oficial Oroño Bike</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 60px;">Cant.</th>
                <th>Descripción / Artículo</th>
                <th style="text-align: right; width: 140px;">Precio Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="font-weight: 700; font-family: monospace;">1 u.</td>
                <td>
                  <div class="item-desc">${purchase.itemsSummary || 'Artículos varios de bicicletería'}</div>
                  ${purchase.bicyclesBought && purchase.bicyclesBought.length > 0 ? `<div class="item-bikes">🚲 ${purchase.bicyclesBought.join(', ')}</div>` : ''}
                </td>
                <td style="text-align: right; font-weight: 700; font-family: monospace;">
                  ${formatCurrency(purchase.total)}
                </td>
              </tr>
            </tbody>
          </table>

          <div class="totals">
            <div class="total-card">
              <div class="total-row">
                <span>Subtotal Neto:</span>
                <span>${formatCurrency(Math.round(purchase.total / 1.21))}</span>
              </div>
              <div class="total-row">
                <span>IVA (21%):</span>
                <span>${formatCurrency(Math.round(purchase.total - purchase.total / 1.21))}</span>
              </div>
              <div class="total-row final">
                <span>TOTAL ARS:</span>
                <span>${formatCurrency(purchase.total)}</span>
              </div>
            </div>
          </div>

          <div class="footer">
            <p><strong>¡Gracias por tu compra en Oroño Bike!</strong></p>
            <p>Comprobante válido para retiro de mercadería y activación de garantía de servicio técnico.</p>
            <p style="margin-top: 4px; font-size: 10px; color: #a1a1aa;">www.oronobike.com.ar · Rosario, Santa Fe</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
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
    setReceptionProductSearch('');
    setReceptionForm({
      supplierId: suppliers[0]?.id || 'sup-01',
      invoiceType: 'A',
      invoicePos: '0001',
      invoiceNum: '',
      invoiceNumber: 'A-0001-00000000',
      date: new Date().toISOString().slice(0, 10),
      paymentMethod: 'Transferencia',
      notes: '',
      items: [],
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

  // Filtrado de proveedores en el listado
  const filteredSuppliers = useMemo(() => {
    if (!supplierSearchQuery.trim()) return suppliers;
    const q = supplierSearchQuery.toLowerCase().trim();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.cuit.toLowerCase().includes(q) ||
        s.contactPerson.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
    );
  }, [suppliers, supplierSearchQuery]);

  const handleAddProductFromSearch = (product: ProductWithVariants, variant: ProductVariant) => {
    const cost = variant.cost || Math.round((variant.price || 0) / 1.5);
    setReceptionForm((prev) => {
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

      // 3. Cargar en el estado de la planilla separando Tipo, Punto de Venta y Número
      const rawInv = (extracted.invoiceNumber || '').trim();
      let detectedType = 'A';
      let detectedPos = '0001';
      let detectedNum = '';

      if (rawInv) {
        // Ej: FC-A-0002-00012345 o A-0002-00012345 o 0002-00012345
        const parts = rawInv.split('-').map((s: string) => s.trim());
        if (parts.length >= 3) {
          const possibleType = parts[0].replace(/[^A-Z]/gi, '');
          if (['A', 'B', 'C', 'M'].includes(possibleType)) detectedType = possibleType;
          detectedPos = parts[1].padStart(4, '0').slice(-4);
          detectedNum = parts[2].padStart(8, '0').slice(-8);
        } else if (parts.length === 2) {
          detectedPos = parts[0].padStart(4, '0').slice(-4);
          detectedNum = parts[1].padStart(8, '0').slice(-8);
        } else {
          detectedNum = rawInv.padStart(8, '0').slice(-8);
        }
      }

      setReceptionForm((prev) => ({
        ...prev,
        supplierId: targetSupplierId,
        invoiceType: detectedType,
        invoicePos: detectedPos,
        invoiceNum: detectedNum,
        invoiceNumber: `${detectedType}-${detectedPos}-${detectedNum || '00000000'}`,
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
    setReceptionForm((prev) => ({
      ...prev,
      items: prev.items.filter((it) => it.id !== rowId),
    }));
  };

  // Alta rápida de producto nuevo desde la planilla de recepción
  const handleAddQuickNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNewProductForm.title.trim()) {
      alert('Ingresá el nombre o descripción del producto');
      return;
    }

    const prodId = `prod-custom-${Date.now()}`;
    const varId = `var-${Date.now()}`;
    const cost = Math.max(0, Number(quickNewProductForm.unitCost) || 0);
    const margin = Number(quickNewProductForm.profitMargin) || 60;
    const price = Math.round(cost * (1 + margin / 100));
    const qty = Math.max(1, Number(quickNewProductForm.quantity) || 1);

    const nowIso = new Date().toISOString();
    const newProd: ProductWithVariants = {
      id: prodId,
      title: quickNewProductForm.title.trim(),
      slug: quickNewProductForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      brand: quickNewProductForm.brand.toUpperCase(),
      category: quickNewProductForm.category.toUpperCase(),
      description: `Ingresado por factura de compra`,
      specs: {},
      images: [
        'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80',
      ],
      is_active: true,
      created_at: nowIso,
      updated_at: nowIso,
      variants: [
        {
          id: varId,
          product_id: prodId,
          sku: quickNewProductForm.sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
          barcode: null,
          size: quickNewProductForm.size || 'Único',
          wheel_size: quickNewProductForm.category === 'MTB' ? '29"' : null,
          color: quickNewProductForm.color || 'Negro Mate',
          color_hex: '#18181b',
          cost,
          profit_margin_percent: margin,
          price,
          compare_at_price: null,
          stock: 0, // El stock se sumará al confirmar la factura
          min_stock_alert: 2,
          created_at: nowIso,
          updated_at: nowIso,
        },
      ],
    };

    // Agregar a la lista de productos del sistema
    setProducts((prev) => {
      const updated = [newProd, ...prev];
      try {
        localStorage.setItem('orono_custom_bikes', JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });

    // Agregar a la planilla
    setReceptionForm((prev) => {
      const newRow: ReceptionItemDraft = {
        id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId: newProd.id,
        variantId: varId,
        quantity: qty,
        unitCost: cost,
      };

      return {
        ...prev,
        items: [...prev.items, newRow],
      };
    });

    setShowQuickNewProductModal(false);
    setReceptionProductSearch('');
    setQuickNewProductForm({
      title: '',
      brand: 'SCOTT',
      category: 'MTB',
      size: 'M',
      color: 'Negro Mate',
      sku: '',
      unitCost: 0,
      quantity: 1,
      profitMargin: 60,
    });
  };

  const handleSaveReception = (e: React.FormEvent) => {
    e.preventDefault();
    if (receptionForm.items.length === 0) {
      alert('⚠️ Para guardar la factura debes ingresar al menos un producto a la planilla.');
      return;
    }

    const supplier = suppliers.find((s) => s.id === receptionForm.supplierId) || suppliers[0];
    const nowStr = `${receptionForm.date} ${new Date().toLocaleTimeString().slice(0, 5)}`;

    // Armar número de factura formal respetando tipo-PV-número con ceros automáticos
    const type = (receptionForm.invoiceType || 'A').toUpperCase().trim();
    const pos = (receptionForm.invoicePos || '1').padStart(4, '0');
    const num = (receptionForm.invoiceNum || '').padStart(8, '0');
    const computedInvoiceNumber = num ? `${type}-${pos}-${num}` : (receptionForm.invoiceNumber.trim() || `FC-INT-${Date.now().toString().slice(-6)}`);

    // VALIDACIÓN ESTRICTA: No permitir duplicados del mismo número de factura para el mismo proveedor
    const cleanCurrentNumber = computedInvoiceNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const isDuplicate = receptions.some((r) => {
      const sameSupplier = r.supplierId === supplier.id || r.supplierName.trim().toLowerCase() === supplier.name.trim().toLowerCase();
      const existingCleanNumber = (r.invoiceNumber || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      return sameSupplier && existingCleanNumber === cleanCurrentNumber;
    });

    if (isDuplicate) {
      alert(
        `⛔ Error: Ya existe una factura registrada con el número "${computedInvoiceNumber}" para el proveedor "${supplier.name}".\n\nPor favor verifica el número o punto de venta para evitar duplicar stock y egresos.`
      );
      return;
    }

    // Armar items recibidos con datos completos
    const parsedItems = receptionForm.items.map((row) => {
      const selectedProd = products.find((p) => p.id === row.productId) || products[0];
      const selectedVar = selectedProd?.variants.find((v) => v.id === row.variantId) || selectedProd?.variants[0] || {
        id: row.variantId,
        size: 'Único',
        color: 'Estándar',
      };
      const qty = Math.max(1, Number(row.quantity) || 1);
      const unitCost = Math.max(0, Number(row.unitCost) || 0);
      const subtotal = qty * unitCost;

      return {
        productId: selectedProd ? selectedProd.id : row.productId,
        productTitle: selectedProd ? selectedProd.title : 'Artículo Nuevo',
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
      invoiceNumber: computedInvoiceNumber,
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
    });
  };

  const handleDeleteSupplier = (id: string, name: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar al proveedor "${name}"?`)) {
      const updated = suppliers.filter((s) => s.id !== id);
      setSuppliers(updated);
      try {
        localStorage.setItem('orono_suppliers', JSON.stringify(updated));
      } catch (err) {}
    }
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

  const handleDeleteCustomer = (id: string, name: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar al cliente "${name}"?`)) {
      const updated = customers.filter((c) => c.id !== id);
      setCustomers(updated);
      try {
        localStorage.setItem('orono_customers', JSON.stringify(updated));
      } catch (err) {}
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

  const handleToggleFeatured = (productId: string) => {
    setProducts((prev) => {
      const updated = prev.map((p) => {
        if (p.id === productId) {
          const nextFeatured = !p.is_featured;
          return {
            ...p,
            is_featured: nextFeatured,
            featured_order: nextFeatured ? (p.featured_order ?? 1) : undefined,
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

  const handleUpdateFeaturedOrder = (productId: string, order: number) => {
    setProducts((prev) => {
      const updated = prev.map((p) => {
        if (p.id === productId) {
          return {
            ...p,
            is_featured: true,
            featured_order: Math.max(1, order),
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
    }).sort((a, b) => {
      const aFeat = a.is_featured ? 1 : 0;
      const bFeat = b.is_featured ? 1 : 0;
      if (aFeat !== bFeat) return bFeat - aFeat;
      const aOrd = a.featured_order ?? 999;
      const bOrd = b.featured_order ?? 999;
      return aOrd - bOrd;
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
          <button
            onClick={() => setActiveTab('marketing')}
            className={`px-4 py-3 font-heading text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'marketing'
                ? 'border-purple-400 text-purple-400 font-black'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-400" /> Marketing & Pop-up
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
                  Carga nuevos artículos, ajusta el <strong>Costo ($)</strong>, <strong>Margen (%)</strong> y marcá con la <strong>estrella ⭐ (Ver 1°)</strong> las bicicletas que quieras que aparezcan primero en la tienda online.
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
                      <th className="py-3.5 px-3 bg-amber-50/70 text-amber-950 text-center">Ver 1° (Prioridad)</th>
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
                            <td className="py-3 px-3 text-center bg-amber-50/40">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleToggleFeatured(p.id)}
                                  title={p.is_featured ? 'Quitar de destacados' : 'Mostrar primero en el catálogo'}
                                  className={`p-1.5 rounded-lg transition-all ${
                                    p.is_featured
                                      ? 'bg-amber-400 text-zinc-950 shadow-xs ring-1 ring-amber-500 scale-105'
                                      : 'bg-zinc-100 text-zinc-400 hover:text-amber-600 hover:bg-amber-50'
                                  }`}
                                >
                                  <Star className={`w-3.5 h-3.5 ${p.is_featured ? 'fill-zinc-950' : ''}`} />
                                </button>
                                {p.is_featured && (
                                  <input
                                    type="number"
                                    min={1}
                                    max={99}
                                    value={p.featured_order ?? 1}
                                    onChange={(e) => handleUpdateFeaturedOrder(p.id, Number(e.target.value))}
                                    title="Posición de orden (1 = primero)"
                                    className="w-10 px-1 py-0.5 bg-white border border-amber-300 rounded text-center text-xs font-mono font-bold text-zinc-950 focus:outline-none"
                                  />
                                )}
                              </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
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
                      onChange={(e) => {
                        const updated = {
                          ...pricingSettings,
                          defaultProfitMarginPercent: Number(e.target.value),
                        };
                        setPricingSettings(updated);
                        PricingService.saveSettings(updated);
                      }}
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
                      onChange={(e) => {
                        const updated = {
                          ...pricingSettings,
                          cashDiscountLocalPercent: Number(e.target.value),
                        };
                        setPricingSettings(updated);
                        PricingService.saveSettings(updated);
                      }}
                      className="w-24 px-3 py-1.5 bg-zinc-50 border-2 border-amber-400 rounded-xl text-2xl font-mono font-black text-zinc-950 focus:outline-none"
                    />
                    <span className="text-xl font-heading font-black text-amber-700">% OFF en Local</span>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    <strong>Exclusivo local físico</strong>. Se aplica automáticamente al cobrar en Efectivo en el mostrador/POS.
                  </p>
                </div>

                <div className="pt-5 mt-4 border-t border-zinc-100 text-[11px] text-zinc-500 font-mono">
                  Ejemplo: Venta de $160.000 en mostrador cobra <strong>${Math.round(160000 * (1 - pricingSettings.cashDiscountLocalPercent / 100)).toLocaleString('es-AR')}</strong> en efectivo.
                </div>
              </div>

              {/* 3. Descuento Transferencia Bancaria (Web / Checkout) */}
              <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-heading font-bold uppercase tracking-wider text-zinc-500">
                      Descuento Transferencia (Web)
                    </span>
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                      <Landmark className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={pricingSettings.bankTransferDiscountPercent ?? 0}
                      onChange={(e) => {
                        const updated = {
                          ...pricingSettings,
                          bankTransferDiscountPercent: Number(e.target.value),
                        };
                        setPricingSettings(updated);
                        PricingService.saveSettings(updated);
                      }}
                      className="w-24 px-3 py-1.5 bg-zinc-50 border-2 border-indigo-400 rounded-xl text-2xl font-mono font-black text-zinc-950 focus:outline-none"
                    />
                    <span className="text-xl font-heading font-black text-indigo-700">% OFF en Web</span>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Descuento automático en el <strong>Checkout online</strong> al pagar por transferencia. Si está en 0%, no se aplica ningún descuento.
                  </p>
                </div>

                <div className="pt-5 mt-4 border-t border-zinc-100 text-[11px] text-zinc-500 font-mono">
                  {(pricingSettings.bankTransferDiscountPercent || 0) > 0
                    ? `Activo: aplica ${pricingSettings.bankTransferDiscountPercent}% OFF en transferencias web.`
                    : 'Sin descuento activo en transferencias online (0% OFF).'}
                </div>
              </div>

              {/* 3. Cotización Dólar Banco Nación */}
              <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-heading font-bold uppercase tracking-wider text-zinc-500">
                      Cotización Dólar (u$d)
                    </span>
                    <div className="p-2 bg-sky-50 text-sky-600 rounded-xl flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-xl font-mono text-zinc-400">$</span>
                    <input
                      type="number"
                      value={pricingSettings.usdExchangeRate}
                      disabled={pricingSettings.autoUpdateDollarBNA}
                      onChange={(e) =>
                        setPricingSettings({
                          ...pricingSettings,
                          usdExchangeRate: Number(e.target.value),
                        })
                      }
                      className={`w-28 px-3 py-1.5 border-2 rounded-xl text-2xl font-mono font-black text-zinc-950 focus:outline-none ${
                        pricingSettings.autoUpdateDollarBNA
                          ? 'bg-zinc-100 border-zinc-300 cursor-not-allowed opacity-90'
                          : 'bg-zinc-50 border-sky-400'
                      }`}
                    />
                    <span className="text-sm font-heading font-bold text-zinc-600">ARS</span>
                  </div>

                  {/* Switch Auto-actualizar con Banco Nación */}
                  <div className="mt-3 p-3 bg-sky-50/70 border border-sky-200 rounded-xl space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pricingSettings.autoUpdateDollarBNA}
                        onChange={(e) => {
                          const isAuto = e.target.checked;
                          const updated = {
                            ...pricingSettings,
                            autoUpdateDollarBNA: isAuto,
                          };
                          setPricingSettings(updated);
                          PricingService.saveSettings(updated);
                          if (isAuto) {
                            PricingService.fetchBNADollarRate().then((res) => {
                              if (res.success) {
                                setPricingSettings(PricingService.getSettings());
                              }
                            });
                          }
                        }}
                        className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                      />
                      <span className="text-xs font-heading font-bold text-sky-900">
                        Auto-actualizar con Banco Nación
                      </span>
                    </label>

                    <div className="flex items-center justify-between text-[11px] text-sky-700">
                      <span>Fuente: BNA Oficial</span>
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await PricingService.fetchBNADollarRate();
                          if (res.success) {
                            setPricingSettings(PricingService.getSettings());
                            alert(`Cotización actualizada: $${res.rate} (${res.source})`);
                          }
                        }}
                        className="font-bold underline hover:text-sky-950 flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Sincronizar ya
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
                    Se calcula en tiempo real para cada producto en la tienda: <code>u$d 326 (DÓLAR BNA: ${pricingSettings.usdExchangeRate.toLocaleString('es-AR')})</code>.
                  </p>
                </div>

                <div className="pt-4 mt-3 border-t border-zinc-100 text-[10px] text-zinc-400 font-mono">
                  {pricingSettings.dollarLastUpdated
                    ? `Última sincronización: ${pricingSettings.dollarLastUpdated} hs`
                    : 'Actualización automática cada 5 minutos'}
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

            {/* Listado de Proveedores & Distribuidores */}
            <div className="bg-white rounded-3xl border border-zinc-200 shadow-xs overflow-hidden">
              <div className="p-6 border-b border-zinc-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-50/50">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-zinc-950" />
                    <h3 className="text-base font-heading font-black text-zinc-950">
                      Listado de Proveedores & Distribuidores
                    </h3>
                  </div>
                  <span className="text-xs text-zinc-500">
                    Directorio oficial de proveedores registrados para compras y facturación de mercadería.
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre, CUIT, contacto..."
                      value={supplierSearchQuery}
                      onChange={(e) => setSupplierSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-zinc-950"
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-zinc-700 bg-white border border-zinc-200 px-3 py-2 rounded-xl whitespace-nowrap shrink-0">
                    {suppliers.length} {suppliers.length === 1 ? 'Proveedor' : 'Proveedores'}
                  </span>
                  <button
                    onClick={() => setShowAddSupplierModal(true)}
                    className="bg-zinc-950 hover:bg-zinc-800 text-white font-heading text-xs font-bold uppercase px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs whitespace-nowrap shrink-0 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Nuevo Proveedor
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-100/80 border-b border-zinc-200 text-zinc-600 font-heading font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4 min-w-[220px]">Proveedor / Razón Social</th>
                      <th className="py-3 px-4 min-w-[130px]">CUIT</th>
                      <th className="py-3 px-4 min-w-[150px]">Persona de Contacto</th>
                      <th className="py-3 px-4 min-w-[160px]">Teléfono / Email</th>
                      <th className="py-3 px-4 text-right min-w-[150px]">Total Comprado ($ ARS)</th>
                      <th className="py-3 px-4 text-center w-36">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 font-medium">
                    {filteredSuppliers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-zinc-400">
                          <Building2 className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                          <p className="text-xs font-bold text-zinc-600">No se encontraron proveedores</p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            {supplierSearchQuery
                              ? 'Probá ajustando los términos de búsqueda'
                              : 'Presioná "+ Nuevo Proveedor" para registrar el primero.'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredSuppliers.map((sup) => {
                        const supInvoicesCount = receptions.filter(
                          (r) =>
                            r.supplierId === sup.id ||
                            r.supplierName.trim().toLowerCase() === sup.name.trim().toLowerCase()
                        ).length;

                        return (
                          <tr key={sup.id} className="hover:bg-zinc-50/80 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 shrink-0 font-heading font-black text-xs">
                                  {sup.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <strong className="font-heading font-bold text-zinc-950 block text-xs">
                                    {sup.name}
                                  </strong>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-mono text-zinc-700 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded text-[11px] font-semibold">
                                {sup.cuit}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-zinc-800">
                              {sup.contactPerson}
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-zinc-800 font-mono text-[11px] flex items-center gap-1">
                                <span>📞</span>
                                <span>{sup.phone}</span>
                              </div>
                              {sup.email && (
                                <span className="text-[10px] text-zinc-400 block mt-0.5 truncate max-w-[180px]" title={sup.email}>
                                  {sup.email}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="font-mono font-bold text-xs text-zinc-950 block">
                                {formatCurrency(sup.totalPurchased)}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-sans">
                                {supInvoicesCount} {supInvoicesCount === 1 ? 'factura registrada' : 'facturas registradas'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    openNewReceptionModal();
                                    setReceptionForm((prev) => ({ ...prev, supplierId: sup.id }));
                                  }}
                                  title={`Cargar factura de ${sup.name}`}
                                  className="px-2.5 py-1 bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg text-[10px] font-heading font-bold uppercase transition-colors"
                                >
                                  + Factura
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSupplier(sup.id, sup.name)}
                                  title="Eliminar proveedor"
                                  className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
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
                      <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
                        {/* 1. Proveedor (4 cols) */}
                        <div className="lg:col-span-4">
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[11px] font-heading font-bold uppercase text-zinc-700">
                              Proveedor *
                            </label>
                            <button
                              type="button"
                              onClick={() => setShowAddSupplierModal(true)}
                              className="text-[10px] font-heading font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-0.5"
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

                        {/* 2. Factura Dividida: Tipo, Pto. Venta y Número (4 cols) */}
                        <div className="lg:col-span-4">
                          <label className="block text-[11px] font-heading font-bold uppercase text-zinc-700 mb-1">
                            Comprobante: Tipo · Pto. Venta · Número *
                          </label>
                          <div className="grid grid-cols-12 gap-1.5 items-center">
                            {/* Tipo */}
                            <div className="col-span-3">
                              <select
                                value={receptionForm.invoiceType}
                                onChange={(e) => {
                                  const t = e.target.value;
                                  const pos = receptionForm.invoicePos ? receptionForm.invoicePos.padStart(4, '0') : '0001';
                                  const num = receptionForm.invoiceNum ? receptionForm.invoiceNum.padStart(8, '0') : '00000000';
                                  setReceptionForm({
                                    ...receptionForm,
                                    invoiceType: t,
                                    invoiceNumber: `${t}-${pos}-${num}`,
                                  });
                                }}
                                className="w-full px-2 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-heading font-black text-center text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                              >
                                <option value="A">FC A</option>
                                <option value="B">FC B</option>
                                <option value="C">FC C</option>
                                <option value="M">FC M</option>
                                <option value="REM">REM</option>
                              </select>
                            </div>

                            {/* Punto de Venta (4 dígitos con auto-relleno de ceros al salir o escribir) */}
                            <div className="col-span-4 relative">
                              <input
                                type="text"
                                maxLength={4}
                                required
                                placeholder="0001"
                                value={receptionForm.invoicePos}
                                onChange={(e) => {
                                  const raw = e.target.value.replace(/[^0-9]/g, '');
                                  setReceptionForm({
                                    ...receptionForm,
                                    invoicePos: raw,
                                  });
                                }}
                                onBlur={(e) => {
                                  const raw = e.target.value.replace(/[^0-9]/g, '');
                                  const padded = raw ? raw.padStart(4, '0') : '0001';
                                  const num = receptionForm.invoiceNum ? receptionForm.invoiceNum.padStart(8, '0') : '00000000';
                                  setReceptionForm({
                                    ...receptionForm,
                                    invoicePos: padded,
                                    invoiceNumber: `${receptionForm.invoiceType}-${padded}-${num}`,
                                  });
                                }}
                                className="w-full px-2 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-mono font-black text-center text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                                title="Punto de venta (4 dígitos, se completan ceros automáticamente)"
                              />
                            </div>

                            {/* Número de Factura (8 dígitos con auto-relleno de ceros) */}
                            <div className="col-span-5 relative">
                              <input
                                type="text"
                                maxLength={8}
                                required
                                placeholder="00012345"
                                value={receptionForm.invoiceNum}
                                onChange={(e) => {
                                  const raw = e.target.value.replace(/[^0-9]/g, '');
                                  setReceptionForm({
                                    ...receptionForm,
                                    invoiceNum: raw,
                                  });
                                }}
                                onBlur={(e) => {
                                  const raw = e.target.value.replace(/[^0-9]/g, '');
                                  const padded = raw ? raw.padStart(8, '0') : '';
                                  const pos = receptionForm.invoicePos ? receptionForm.invoicePos.padStart(4, '0') : '0001';
                                  setReceptionForm({
                                    ...receptionForm,
                                    invoiceNum: padded,
                                    invoiceNumber: `${receptionForm.invoiceType}-${pos}-${padded || '00000000'}`,
                                  });
                                }}
                                className="w-full px-2 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-mono font-black text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                                title="Número de comprobante (hasta 8 dígitos, se completan ceros a la izquierda automáticamente)"
                              />
                            </div>
                          </div>
                        </div>

                        {/* 3. Fecha Factura (2 cols) */}
                        <div className="lg:col-span-2">
                          <label className="block text-[11px] font-heading font-bold uppercase text-zinc-700 mb-1">
                            Fecha Factura *
                          </label>
                          <input
                            type="date"
                            required
                            value={receptionForm.date}
                            onChange={(e) => setReceptionForm({ ...receptionForm, date: e.target.value })}
                            className="w-full px-2.5 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-zinc-950"
                          />
                        </div>

                        {/* 4. Medio de Pago (2 cols) */}
                        <div className="lg:col-span-2">
                          <label className="block text-[11px] font-heading font-bold uppercase text-zinc-700 mb-1">
                            Medio de Pago *
                          </label>
                          <select
                            value={receptionForm.paymentMethod}
                            onChange={(e) => setReceptionForm({ ...receptionForm, paymentMethod: e.target.value as any })}
                            className="w-full px-2.5 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-bold uppercase focus:outline-none focus:ring-1 focus:ring-zinc-950"
                          >
                            <option value="Transferencia">Transferencia</option>
                            <option value="Efectivo">Efectivo Caja</option>
                            <option value="Crédito">Cta. Cte. / Crédito</option>
                            <option value="Débito">Débito</option>
                          </select>
                        </div>
                      </div>

                      {/* Buscador Rápido de Producto por Descripción / Código con Alta Rápida de Producto Nuevo */}
                      <div className="relative">
                        <div className="flex gap-2">
                          <div className="relative flex-1 flex items-center">
                            <Search className="w-4 h-4 absolute left-3.5 text-zinc-400 pointer-events-none" />
                            <input
                              type="text"
                              placeholder="🔍 Buscar artículo por descripción, nombre o código SKU (ej: Spark, Cuadro Volta, Cadena Shimano, Casco, etc)..."
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

                          <button
                            type="button"
                            onClick={() => {
                              setQuickNewProductForm((prev) => ({
                                ...prev,
                                title: receptionProductSearch.trim(),
                              }));
                              setShowQuickNewProductModal(true);
                            }}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all shrink-0"
                            title="Dar de alta un producto nuevo en el catálogo y stock"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Nuevo Producto</span>
                          </button>
                        </div>

                        {/* Desplegable de Resultados de Búsqueda por Palabras o Código */}
                        {filteredReceptionSearchResults.length > 0 && (
                          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-zinc-200 rounded-2xl shadow-2xl z-30 max-h-64 overflow-y-auto divide-y divide-zinc-100 animate-fadeIn">
                            <div className="px-3.5 py-2 bg-zinc-50 text-[10px] font-heading font-bold uppercase text-zinc-500 tracking-wider flex justify-between items-center">
                              <span>Coincidencias encontradas ({filteredReceptionSearchResults.length})</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setQuickNewProductForm((prev) => ({
                                    ...prev,
                                    title: receptionProductSearch.trim(),
                                  }));
                                  setShowQuickNewProductModal(true);
                                }}
                                className="text-emerald-700 font-bold hover:underline"
                              >
                                ¿No está? + Ingresar como Producto Nuevo
                              </button>
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
                        {receptionProductSearch.trim().length > 1 && filteredReceptionSearchResults.length === 0 && (
                          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-zinc-200 rounded-2xl shadow-xl z-30 p-4 text-center animate-fadeIn">
                            <p className="text-xs text-zinc-600 mb-2">
                              No se encontró ningún artículo con la descripción <strong>"{receptionProductSearch}"</strong>
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setQuickNewProductForm((prev) => ({
                                  ...prev,
                                  title: receptionProductSearch.trim(),
                                }));
                                setShowQuickNewProductModal(true);
                              }}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-heading font-bold uppercase inline-flex items-center gap-1.5 shadow-sm"
                            >
                              <Plus className="w-3.5 h-3.5" /> Ingresar "{receptionProductSearch}" como Producto Nuevo
                            </button>
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
                              {receptionForm.items.length === 0 ? (
                                <tr>
                                  <td colSpan={8} className="py-12 px-4 text-center bg-white">
                                    <div className="max-w-md mx-auto flex flex-col items-center justify-center text-zinc-400 gap-2">
                                      <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 mb-1">
                                        <Layers className="w-5 h-5" />
                                      </div>
                                      <p className="text-xs font-heading font-bold text-zinc-700 uppercase tracking-wide">
                                        Planilla de factura vacía
                                      </p>
                                      <p className="text-[11px] text-zinc-500 leading-relaxed">
                                        Buscá productos arriba por nombre o código, cargá un <strong className="text-emerald-700 font-bold">+ Nuevo Producto</strong>, o hacé clic en <strong className="text-zinc-800 font-bold">+ Agregar Artículo</strong> para empezar a cargar.
                                      </p>
                                    </div>
                                  </td>
                                </tr>
                              ) : (
                                receptionForm.items.map((row, index) => {
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
                              })
                            )}
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

            {/* Modal para Dar de Alta Producto Nuevo Rápido desde la Planilla */}
            {showQuickNewProductModal && (
              <div className="fixed inset-0 z-[75] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-zinc-200 animate-fadeIn">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-200">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                        <Plus className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-heading font-black text-zinc-950">
                          Ingresar Producto Nuevo al Stock
                        </h3>
                        <p className="text-[11px] text-zinc-500">
                          Se agregará al catálogo y a esta factura de compra
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowQuickNewProductModal(false)}
                      className="text-zinc-400 hover:text-zinc-700 text-base font-bold p-1 rounded-lg"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleAddQuickNewProduct} className="space-y-4">
                    {/* Título / Descripción */}
                    <div>
                      <label className="block text-xs font-heading font-bold uppercase text-zinc-700 mb-1">
                        Descripción o Nombre del Producto *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Spark RC Team Issue 2024 / Cadena Shimano Deore 12v / Casco Scott Centric"
                        value={quickNewProductForm.title}
                        onChange={(e) => setQuickNewProductForm({ ...quickNewProductForm, title: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-zinc-950"
                      />
                    </div>

                    {/* Marca & Categoría */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-heading font-bold uppercase text-zinc-700 mb-1">
                          Marca *
                        </label>
                        <select
                          value={quickNewProductForm.brand}
                          onChange={(e) => setQuickNewProductForm({ ...quickNewProductForm, brand: e.target.value })}
                          className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold uppercase focus:outline-none"
                        >
                          <option value="SCOTT">SCOTT</option>
                          <option value="VOLTA">VOLTA</option>
                          <option value="RALEIGH">RALEIGH</option>
                          <option value="SARS">SARS</option>
                          <option value="ZION">ZION</option>
                          <option value="SHIMANO">SHIMANO</option>
                          <option value="GENERAL">OTRA / GENERAL</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-heading font-bold uppercase text-zinc-700 mb-1">
                          Categoría *
                        </label>
                        <select
                          value={quickNewProductForm.category}
                          onChange={(e) => setQuickNewProductForm({ ...quickNewProductForm, category: e.target.value })}
                          className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold uppercase focus:outline-none"
                        >
                          <option value="MTB">MTB</option>
                          <option value="RUTA">RUTA</option>
                          <option value="GRAVEL">GRAVEL</option>
                          <option value="COMPONENTES">COMPONENTES</option>
                          <option value="ACCESORIOS">ACCESORIOS</option>
                          <option value="PASEO">PASEO</option>
                          <option value="NIÑOS">NIÑOS</option>
                        </select>
                      </div>
                    </div>

                    {/* Talle, Color y SKU */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] font-heading font-bold uppercase text-zinc-700 mb-1">
                          Talle / Medida
                        </label>
                        <input
                          type="text"
                          placeholder="M / L / 29 / Único"
                          value={quickNewProductForm.size}
                          onChange={(e) => setQuickNewProductForm({ ...quickNewProductForm, size: e.target.value })}
                          className="w-full px-2.5 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-medium focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-heading font-bold uppercase text-zinc-700 mb-1">
                          Color
                        </label>
                        <input
                          type="text"
                          placeholder="Negro Mate / Raw"
                          value={quickNewProductForm.color}
                          onChange={(e) => setQuickNewProductForm({ ...quickNewProductForm, color: e.target.value })}
                          className="w-full px-2.5 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-medium focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-heading font-bold uppercase text-zinc-700 mb-1">
                          Código SKU
                        </label>
                        <input
                          type="text"
                          placeholder="Auto si se omite"
                          value={quickNewProductForm.sku}
                          onChange={(e) => setQuickNewProductForm({ ...quickNewProductForm, sku: e.target.value })}
                          className="w-full px-2.5 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Costo, Margen y Cantidad de la Factura */}
                    <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-heading font-bold uppercase text-zinc-700 mb-1">
                          Cant. a Ingresar *
                        </label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={quickNewProductForm.quantity}
                          onChange={(e) => setQuickNewProductForm({ ...quickNewProductForm, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                          className="w-full px-2.5 py-1.5 bg-white border border-zinc-300 rounded-xl text-xs font-mono font-black text-center focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-heading font-bold uppercase text-zinc-700 mb-1">
                          Costo Unit. ($) *
                        </label>
                        <input
                          type="number"
                          min={0}
                          required
                          placeholder="0"
                          value={quickNewProductForm.unitCost || ''}
                          onChange={(e) => setQuickNewProductForm({ ...quickNewProductForm, unitCost: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="w-full px-2.5 py-1.5 bg-white border border-zinc-300 rounded-xl text-xs font-mono font-black text-right focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-heading font-bold uppercase text-zinc-700 mb-1">
                          Margen Ganancia %
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={quickNewProductForm.profitMargin}
                          onChange={(e) => setQuickNewProductForm({ ...quickNewProductForm, profitMargin: parseInt(e.target.value) || 60 })}
                          className="w-full px-2.5 py-1.5 bg-white border border-zinc-300 rounded-xl text-xs font-mono font-black text-center focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Resumen de Precio de Venta Calculado */}
                    <div className="flex items-center justify-between px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                      <span className="font-heading font-bold text-emerald-900">
                        Precio Débito/Transferencia calculado:
                      </span>
                      <span className="font-heading font-black text-sm text-emerald-800">
                        {formatCurrency(Math.round((quickNewProductForm.unitCost || 0) * (1 + (quickNewProductForm.profitMargin || 60) / 100)))}
                      </span>
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowQuickNewProductModal(false)}
                        className="px-4 py-2 border border-zinc-300 rounded-xl text-xs font-heading font-bold uppercase text-zinc-700 hover:bg-zinc-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Agregar a la Planilla & Stock
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

            {/* Listado Oficial de Clientes & Compras */}
            <div className="bg-white rounded-3xl border border-zinc-200 shadow-xs overflow-hidden">
              <div className="p-6 border-b border-zinc-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-50/50">
                <div>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-zinc-950" />
                    <h3 className="text-base font-heading font-black text-zinc-950">
                      Listado de Clientes Registrados
                    </h3>
                  </div>
                  <span className="text-xs text-zinc-500">
                    Directorio de clientes con historial de compras, facturas y remitos asociados.
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-72">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre, DNI, teléfono o bici..."
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-zinc-950"
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-zinc-700 bg-white border border-zinc-200 px-3 py-2 rounded-xl whitespace-nowrap shrink-0">
                    {customers.length} {customers.length === 1 ? 'Cliente' : 'Clientes'}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-100/80 border-b border-zinc-200 text-zinc-600 font-heading font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4 min-w-[220px]">Cliente / Nombre y Apellido</th>
                      <th className="py-3 px-4 min-w-[130px]">Documento</th>
                      <th className="py-3 px-4 min-w-[160px]">Contacto (Tel / Email)</th>
                      <th className="py-3 px-4 min-w-[180px]">Compras Realizadas</th>
                      <th className="py-3 px-4 text-right min-w-[150px]">Total Invertido ($ ARS)</th>
                      <th className="py-3 px-4 text-center w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 font-medium">
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-zinc-400">
                          <Users className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                          <p className="text-xs font-bold text-zinc-600">No se encontraron clientes</p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            {customerSearchQuery
                              ? 'Probá ajustando el término de búsqueda'
                              : 'Presioná "+ Cargar Cliente Manual" para registrar uno.'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map((cust) => {
                        const purchasesCount = cust.purchases?.length || 0;
                        const initials = `${cust.firstName?.[0] || ''}${cust.lastName?.[0] || ''}`.toUpperCase() || 'CL';

                        return (
                          <tr key={cust.id} className="hover:bg-zinc-50/80 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 shrink-0 font-heading font-black text-xs">
                                  {initials}
                                </div>
                                <div>
                                  <strong className="font-heading font-bold text-zinc-950 block text-xs">
                                    {cust.lastName}, {cust.firstName}
                                  </strong>
                                  <span className="text-[10px] text-zinc-400 block font-sans">
                                    Registrado: {cust.createdAt || 'Reciente'}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-mono text-zinc-700 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded text-[11px] font-semibold">
                                {cust.docType}: {cust.doc}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className="text-zinc-800 font-mono text-[11px] font-semibold">
                                  {cust.phone}
                                </span>
                                <a
                                  href={`https://wa.me/${cust.phone.replace(/[^0-9]/g, '')}?text=Hola%20${encodeURIComponent(
                                    cust.firstName
                                  )}!%20Te%20contactamos%20de%20Oroño%20Bike.`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={`Escribir por WhatsApp a ${cust.firstName}`}
                                  className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-all inline-flex items-center shrink-0"
                                >
                                  <svg className="w-4 h-4 fill-emerald-600" viewBox="0 0 24 24">
                                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.075-2.001-.468-1.579-.655-2.574-2.275-2.651-2.381-.077-.105-.634-.844-.634-1.611 0-.767.401-1.144.544-1.301.144-.157.315-.196.421-.196.105 0 .21.002.302.007.097.005.228-.037.356.27.133.319.455 1.109.495 1.191.04.082.067.178.013.285-.054.107-.081.174-.16.268-.079.094-.167.21-.238.282-.08.081-.163.169-.07.329.093.16.413.682.886 1.103.609.542 1.123.71 1.282.79.16.08.254.067.348-.041.094-.108.402-.468.51-.628.107-.16.214-.134.361-.08.147.054.938.442 1.1.523.161.08.269.12.309.187.04.067.04.389-.104.794zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.434 5.176L2 22l4.954-1.385A9.956 9.956 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.093c-1.636 0-3.158-.49-4.433-1.332l-.318-.21-2.934.833.848-2.859-.228-.337A8.064 8.064 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8.093-8 8.093z" />
                                  </svg>
                                </a>
                              </div>
                              {cust.email && (
                                <span className="text-[10px] text-zinc-400 block mt-0.5 truncate max-w-[180px]" title={cust.email}>
                                  {cust.email}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <button
                                type="button"
                                onClick={() => setSelectedCustomerForPurchases(cust)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-2xs group cursor-pointer"
                                title="Ver listado de compras con facturas y remitos"
                              >
                                <Receipt className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                                <span>{purchasesCount} {purchasesCount === 1 ? 'compra' : 'compras'}</span>
                                <span className="text-[10px] uppercase font-mono font-black text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                                  Ver Compras
                                </span>
                              </button>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="font-mono font-bold text-xs text-zinc-950 block">
                                {formatCurrency(cust.totalSpent)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteCustomer(cust.id, `${cust.firstName} ${cust.lastName}`)}
                                title="Eliminar cliente"
                                className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center justify-center"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

            {/* Modal de Compras, Facturas y Remitos del Cliente */}
            {selectedCustomerForPurchases && (
              <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-3xl w-full shadow-2xl border border-zinc-200 animate-fadeIn my-auto max-h-[92vh] flex flex-col">
                  {/* Modal Header */}
                  <div className="flex items-start justify-between pb-4 border-b border-zinc-200">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-zinc-950 text-white flex items-center justify-center shadow-sm">
                          <Receipt className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-heading font-black text-zinc-950 leading-tight">
                            Historial de Compras & Comprobantes
                          </h3>
                          <p className="text-xs text-zinc-600 font-medium mt-0.5">
                            Cliente: <strong className="text-zinc-950 font-bold">{selectedCustomerForPurchases.lastName}, {selectedCustomerForPurchases.firstName}</strong> ({selectedCustomerForPurchases.docType}: {selectedCustomerForPurchases.doc})
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedCustomerForPurchases(null)}
                      className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-xl hover:bg-zinc-100 transition-colors text-base font-bold"
                      title="Cerrar ventana"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Resumen KPI del Cliente */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
                    <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-2xl">
                      <span className="text-[10px] font-heading font-bold uppercase text-zinc-400 block">Total Compras</span>
                      <strong className="text-base font-mono font-bold text-zinc-950">
                        {selectedCustomerForPurchases.purchases?.length || 0} {selectedCustomerForPurchases.purchases?.length === 1 ? 'operación' : 'operaciones'}
                      </strong>
                    </div>
                    <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-2xl">
                      <span className="text-[10px] font-heading font-bold uppercase text-zinc-400 block">Total Invertido</span>
                      <strong className="text-base font-mono font-bold text-emerald-700">
                        {formatCurrency(selectedCustomerForPurchases.totalSpent)}
                      </strong>
                    </div>
                    <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-2xl">
                      <span className="text-[10px] font-heading font-bold uppercase text-zinc-400 block">Teléfono de Contacto</span>
                      <strong className="text-xs font-mono font-bold text-zinc-800 block truncate">
                        {selectedCustomerForPurchases.phone}
                      </strong>
                    </div>
                  </div>

                  {/* Listado de Compras con Factura / Remito */}
                  <div className="flex-1 overflow-y-auto min-h-[220px] max-h-[50vh] border border-zinc-200 rounded-2xl bg-white">
                    {(!selectedCustomerForPurchases.purchases || selectedCustomerForPurchases.purchases.length === 0) ? (
                      <div className="p-10 text-center text-zinc-400">
                        <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                        <p className="text-xs font-bold text-zinc-600">Este cliente no tiene compras registradas</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Las ventas realizadas en mostrador (POS) o web se asociarán automáticamente aquí.
                        </p>
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-zinc-100/90 border-b border-zinc-200 text-zinc-600 font-heading font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10">
                          <tr>
                            <th className="py-2.5 px-3.5">Fecha</th>
                            <th className="py-2.5 px-3.5">Comprobante (Factura / Remito)</th>
                            <th className="py-2.5 px-3.5 min-w-[200px]">Artículos / Bicicletas</th>
                            <th className="py-2.5 px-3.5 text-right">Monto Total</th>
                            <th className="py-2.5 px-3.5 text-center w-28">Descargar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 font-medium">
                          {selectedCustomerForPurchases.purchases.map((pur, idx) => {
                            const badge = getInvoiceTypeBadge(pur.invoiceType);
                            const invoiceNum = pur.invoiceId || pur.orderId || `COMP-${idx + 1}`;

                            return (
                              <tr key={idx} className="hover:bg-zinc-50/80 transition-colors">
                                <td className="py-3 px-3.5 font-mono text-[11px] text-zinc-500 whitespace-nowrap align-top">
                                  {pur.date}
                                </td>
                                <td className="py-3 px-3.5 align-top">
                                  <div className="space-y-1">
                                    <span className={`inline-block px-2 py-0.5 text-[10px] font-heading font-bold uppercase rounded border ${badge.bg}`}>
                                      {badge.label}
                                    </span>
                                    <div className="font-mono font-bold text-xs text-zinc-950 flex items-center gap-1">
                                      <FileText className="w-3 h-3 text-zinc-400 shrink-0" />
                                      <span>{invoiceNum}</span>
                                    </div>
                                    {pur.orderId && pur.orderId !== pur.invoiceId && (
                                      <span className="text-[10px] text-zinc-400 font-mono block">
                                        Ref: {pur.orderId}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-3.5 align-top">
                                  <div className="text-zinc-900 font-semibold text-xs flex items-start gap-1.5">
                                    <Bike className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>{pur.itemsSummary || 'Artículos varios'}</span>
                                  </div>
                                  {pur.bicyclesBought && pur.bicyclesBought.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                      {pur.bicyclesBought.map((b, bIdx) => (
                                        <span
                                          key={bIdx}
                                          className="text-[10px] bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-md border border-zinc-200 font-mono"
                                        >
                                          🚲 {b}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 px-3.5 text-right font-mono font-bold text-xs text-emerald-700 align-top whitespace-nowrap">
                                  {formatCurrency(pur.total)}
                                </td>
                                <td className="py-3 px-3.5 text-center align-top whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadInvoice(selectedCustomerForPurchases, pur)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-[10px] font-heading font-bold uppercase tracking-wider transition-all shadow-xs hover:shadow-sm active:scale-95 cursor-pointer"
                                    title="Descargar o imprimir comprobante en PDF"
                                  >
                                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Descargar</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="pt-4 mt-4 border-t border-zinc-200 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <a
                      href={`https://wa.me/${selectedCustomerForPurchases.phone.replace(/[^0-9]/g, '')}?text=Hola%20${encodeURIComponent(
                        selectedCustomerForPurchases.firstName
                      )}!%20Te%20contactamos%20de%20Oroño%20Bike%20por%20tu%20compra.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-heading font-bold uppercase flex items-center justify-center gap-2 transition-colors shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" /> Contactar por WhatsApp
                    </a>

                    <button
                      type="button"
                      onClick={() => setSelectedCustomerForPurchases(null)}
                      className="w-full sm:w-auto px-5 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-heading font-bold uppercase transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal para Agregar Cliente Manual */}
            {showAddCustomerModal && (
              <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
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
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 9: MARKETING & POP-UP PROMOS (LEAD MAGNET)            */}
        {/* ========================================================= */}
        {activeTab === 'marketing' && (
          <div className="space-y-6">
            {/* Cabecera de la Pestaña */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-heading font-black tracking-wider uppercase rounded-md">
                    Lead Magnet & Promociones
                  </span>
                  {promoSettings.enabled ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                      ● Activo en la Tienda
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-[10px] font-bold rounded-md">
                      ○ Desactivado
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-heading font-black text-zinc-950 tracking-tight">
                  Ventana Emergente de Captación (Pop-up)
                </h2>
                <p className="text-xs text-zinc-500 mt-1 max-w-2xl leading-relaxed">
                  Configurá el pop-up que verán los visitantes al entrar a la web para captar sus correos electrónicos a cambio de un descuento o un regalo físico (como una luz LED).
                </p>
              </div>

              <div className="flex items-center gap-3">
                {promoSavedToast && (
                  <span className="text-xs font-heading font-bold text-emerald-600 animate-fade-in flex items-center gap-1">
                    <Check className="w-4 h-4" /> ¡Guardado!
                  </span>
                )}
                <button
                  onClick={() => handleSavePromoSettings(promoSettings)}
                  className="bg-zinc-950 hover:bg-zinc-800 text-white font-heading text-xs font-black uppercase tracking-wider px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg transition-transform active:scale-95 shrink-0"
                >
                  <Save className="w-4 h-4 text-purple-400" /> Guardar Cambios
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Formulario de Configuración (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* 1. Interruptor On/Off y Temporizador */}
                <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs space-y-4">
                  <h3 className="text-sm font-heading font-black uppercase text-zinc-950 flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-purple-600" />
                    Estado y Disparo de la Ventana
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                      promoSettings.enabled
                        ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                        : 'border-zinc-200 bg-zinc-50 hover:border-zinc-300'
                    }`}>
                      <div>
                        <span className="text-xs font-heading font-bold text-zinc-950 block">
                          Mostrar en la Tienda
                        </span>
                        <span className="text-[11px] text-zinc-500 block mt-0.5">
                          {promoSettings.enabled ? 'La ventana emergente está visible para nuevos visitantes.' : 'La ventana emergente está apagada y no se muestra.'}
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={promoSettings.enabled}
                        onChange={(e) => {
                          const updated = { ...promoSettings, enabled: e.target.checked };
                          setPromoSettings(updated);
                          PromoService.saveSettings(updated);
                        }}
                        className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                    </label>

                    <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-1">
                      <label className="block text-[11px] font-heading font-bold uppercase text-zinc-700">
                        Demora antes de saltar (segundos)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={60}
                          value={promoSettings.delaySeconds}
                          onChange={(e) => {
                            const updated = { ...promoSettings, delaySeconds: Number(e.target.value) };
                            setPromoSettings(updated);
                            PromoService.saveSettings(updated);
                          }}
                          className="w-20 px-3 py-1.5 bg-white border border-zinc-300 rounded-xl text-sm font-mono font-bold text-zinc-900"
                        />
                        <span className="text-xs text-zinc-500">segundos después de entrar</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 block pt-1">
                        (También se dispara si en PC mueven el mouse hacia arriba para salir).
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Textos y Contenido Visual */}
                <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs space-y-4">
                  <h3 className="text-sm font-heading font-black uppercase text-zinc-950 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    Textos de la Promoción
                  </h3>

                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-1">
                        <label className="block text-[11px] font-heading font-bold uppercase text-zinc-700 mb-1">
                          Etiqueta / Badge
                        </label>
                        <input
                          type="text"
                          placeholder="BENEFICIO EXCLUSIVO"
                          value={promoSettings.badgeText}
                          onChange={(e) => {
                            const updated = { ...promoSettings, badgeText: e.target.value };
                            setPromoSettings(updated);
                            PromoService.saveSettings(updated);
                          }}
                          className="w-full h-10 px-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold text-zinc-900"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[11px] font-heading font-bold uppercase text-zinc-700 mb-1">
                          Título Principal *
                        </label>
                        <input
                          type="text"
                          placeholder="¡10% OFF EN TU PRIMERA COMPRA!"
                          value={promoSettings.title}
                          onChange={(e) => {
                            const updated = { ...promoSettings, title: e.target.value };
                            setPromoSettings(updated);
                            PromoService.saveSettings(updated);
                          }}
                          className="w-full h-10 px-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold text-zinc-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-heading font-bold uppercase text-zinc-700 mb-1">
                        Subtítulo / Mensaje Explicativo *
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Dejanos tu email y recibí tu cupón exclusivo..."
                        value={promoSettings.subtitle}
                        onChange={(e) => {
                          const updated = { ...promoSettings, subtitle: e.target.value };
                          setPromoSettings(updated);
                          PromoService.saveSettings(updated);
                        }}
                        className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-medium text-zinc-900 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-heading font-bold uppercase text-zinc-700 mb-1">
                        URL de Imagen de Fondo (Bicicleta / Tienda)
                      </label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={promoSettings.imageUrl || ''}
                        onChange={(e) => {
                          const updated = { ...promoSettings, imageUrl: e.target.value };
                          setPromoSettings(updated);
                          PromoService.saveSettings(updated);
                        }}
                        className="w-full h-10 px-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono text-zinc-600"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Tipo de Beneficio: Descuento vs Regalo Físico */}
                <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs space-y-4">
                  <h3 className="text-sm font-heading font-black uppercase text-zinc-950 flex items-center gap-2">
                    <Gift className="w-4 h-4 text-purple-600" />
                    Beneficio que se Entrega al Cliente
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Opción Descuento en % */}
                    <label
                      onClick={() => {
                        const updated: PromoPopupSettings = { ...promoSettings, benefitType: 'discount', couponCode: promoSettings.couponCode || 'BIENVENIDO10' };
                        setPromoSettings(updated);
                        PromoService.saveSettings(updated);
                      }}
                      className={`p-4 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all ${
                        promoSettings.benefitType === 'discount'
                          ? 'border-zinc-950 bg-zinc-50 ring-1 ring-zinc-950'
                          : 'border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="radio"
                          name="benefitType"
                          checked={promoSettings.benefitType === 'discount'}
                          onChange={() => {}}
                          className="text-zinc-950 focus:ring-zinc-950"
                        />
                        <Tag className="w-4 h-4 text-zinc-700" />
                        <span className="text-xs font-heading font-bold text-zinc-950">
                          Descuento Porcentual (% OFF)
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2 pt-2 border-t border-zinc-200">
                        <input
                          type="number"
                          min={1}
                          max={90}
                          value={promoSettings.discountPercent}
                          onChange={(e) => {
                            const updated = { ...promoSettings, discountPercent: Number(e.target.value) };
                            setPromoSettings(updated);
                            PromoService.saveSettings(updated);
                          }}
                          className="w-20 px-2.5 py-1 bg-white border border-zinc-300 rounded-lg text-sm font-mono font-black text-zinc-900"
                        />
                        <span className="text-xs font-heading font-bold text-zinc-600">% de Descuento</span>
                      </div>
                    </label>

                    {/* Opción Regalo Físico (ej. Luz LED) */}
                    <label
                      onClick={() => {
                        const updated: PromoPopupSettings = { ...promoSettings, benefitType: 'gift', couponCode: promoSettings.couponCode || 'LUZGRATIS' };
                        setPromoSettings(updated);
                        PromoService.saveSettings(updated);
                      }}
                      className={`p-4 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all ${
                        promoSettings.benefitType === 'gift'
                          ? 'border-purple-600 bg-purple-50/50 ring-1 ring-purple-600'
                          : 'border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="radio"
                          name="benefitType"
                          checked={promoSettings.benefitType === 'gift'}
                          onChange={() => {}}
                          className="text-purple-600 focus:ring-purple-600"
                        />
                        <Gift className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-heading font-bold text-zinc-950">
                          Regalo / Obsequio Físico
                        </span>
                      </div>
                      <div className="pt-2 border-t border-purple-200">
                        <input
                          type="text"
                          placeholder="Ej: Luz LED Trasera Recargable USB"
                          value={promoSettings.giftItemName}
                          onChange={(e) => {
                            const updated = { ...promoSettings, giftItemName: e.target.value };
                            setPromoSettings(updated);
                            PromoService.saveSettings(updated);
                          }}
                          className="w-full px-2.5 py-1 bg-white border border-zinc-300 rounded-lg text-xs font-bold text-zinc-900"
                        />
                      </div>
                    </label>
                  </div>

                  {/* Código de Cupón Oficial */}
                  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center justify-between gap-4">
                    <div>
                      <label className="block text-[11px] font-heading font-bold uppercase text-zinc-700">
                        Código de Cupón para el Checkout *
                      </label>
                      <span className="text-[11px] text-zinc-500 block mt-0.5">
                        Este es el código que el cliente recibirá y pondrá al comprar.
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={promoSettings.couponCode}
                        onChange={(e) => {
                          const updated = { ...promoSettings, couponCode: e.target.value.toUpperCase().replace(/\s/g, '') };
                          setPromoSettings(updated);
                          PromoService.saveSettings(updated);
                        }}
                        className="w-40 h-10 px-3 bg-white border-2 border-zinc-950 rounded-xl text-center font-mono font-black text-sm text-zinc-950 uppercase focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Restricción: Exclusivo Primera Compra */}
                  <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-2xl flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-heading font-bold text-zinc-950">
                          Exclusivo para la Primera Compra
                        </span>
                        <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 bg-purple-200 text-purple-900 rounded-full">
                          Antifraude
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-600 block mt-0.5">
                        {promoSettings.firstPurchaseOnly !== false
                          ? 'Activado: El checkout valida por Email y DNI/CUIT que el cliente no tenga compras previas.'
                          : 'Desactivado: Cualquier cliente puede utilizar el cupón, incluso si ya compró antes.'}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={promoSettings.firstPurchaseOnly !== false}
                      onChange={(e) => {
                        const updated = { ...promoSettings, firstPurchaseOnly: e.target.checked };
                        setPromoSettings(updated);
                        PromoService.saveSettings(updated);
                      }}
                      className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Previsualización en Vivo y Suscriptores (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Previsualización en Vivo */}
                <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-xs space-y-3">
                  <span className="text-xs font-heading font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-purple-600" /> Previsualización en Vivo del Pop-up
                  </span>

                  {/* Mockup del Pop-up */}
                  <div className="bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 shadow-lg text-white">
                    <div className="relative h-28 w-full overflow-hidden">
                      <img
                        src={promoSettings.imageUrl || 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=600&q=80'}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
                      <div className="absolute bottom-2 left-4">
                        <span className="inline-block px-2 py-0.5 bg-amber-400 text-zinc-950 text-[9px] font-heading font-black uppercase rounded-full">
                          {promoSettings.badgeText || 'BENEFICIO EXCLUSIVO'}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <h4 className="text-sm font-heading font-black text-white leading-tight">
                        {promoSettings.title || 'Título de la promoción'}
                      </h4>
                      <p className="text-[11px] text-zinc-400 line-clamp-2">
                        {promoSettings.subtitle || 'Descripción de la promoción...'}
                      </p>

                      <div className="flex gap-1.5 pt-1">
                        <div className="flex-1 h-8 bg-zinc-900 border border-zinc-700 rounded-lg px-2 text-[10px] text-zinc-500 flex items-center">
                          ejemplo@email.com
                        </div>
                        <div className="h-8 px-3 bg-amber-400 text-zinc-950 font-heading text-[10px] font-black uppercase rounded-lg flex items-center justify-center">
                          {promoSettings.benefitType === 'gift' ? 'Quiero mi Regalo' : `Quiero mi ${promoSettings.discountPercent}% OFF`}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-zinc-800 flex justify-between items-center text-[10px] text-zinc-500">
                        <span>Cupón entregado: <strong className="font-mono text-amber-400">{promoSettings.couponCode}</strong></span>
                        <span className="text-zinc-600">Demora: {promoSettings.delaySeconds}s</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lista de Suscriptores / Leads Captados */}
                <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                    <div>
                      <h3 className="text-sm font-heading font-black uppercase text-zinc-950 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-purple-600" />
                        Suscriptores Captados
                      </h3>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        {promoSubscribers.length} {promoSubscribers.length === 1 ? 'cliente registrado' : 'clientes registrados'}
                      </p>
                    </div>

                    {promoSubscribers.length > 0 && (
                      <button
                        onClick={handleCopyAllEmails}
                        className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-heading font-bold uppercase rounded-xl flex items-center gap-1.5 transition-colors"
                      >
                        {copiedEmailsToast ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" /> ¡Copiados!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-zinc-600" /> Copiar Mails
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {promoSubscribers.length === 0 ? (
                    <div className="p-6 text-center text-zinc-400 text-xs bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                      Aún no se registraron suscriptores. Los correos que dejen los clientes aparecerán listados aquí.
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto divide-y divide-zinc-100 pr-1 text-xs">
                      {promoSubscribers.map((sub) => (
                        <div key={sub.id} className="py-2.5 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <span className="font-semibold text-zinc-900 block truncate">{sub.email}</span>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              {sub.subscribedAt} • Cupón: {sub.couponCode}
                            </span>
                          </div>
                          <button
                            onClick={() => PromoService.deleteSubscriber(sub.id)}
                            className="text-zinc-400 hover:text-rose-600 p-1"
                            title="Eliminar de la lista"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
