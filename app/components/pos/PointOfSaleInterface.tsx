'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ProductsService } from '@/lib/services/products.service';
import { ALL_PRODUCTS_CATALOG } from '@/lib/data/bikes';
import { ProductVariant, Product } from '@/lib/supabase/types';
import {
  Search,
  Plus,
  Trash2,
  Receipt,
  Printer,
  QrCode,
  Users,
  Layers,
  FileText,
  Building2,
  CheckCircle,
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Percent,
  Eye,
  ShoppingBag,
  Mail,
} from 'lucide-react';

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

export interface SaleInvoiceItem {
  id: string;
  productId: string;
  productTitle: string;
  variantId: string;
  variantDetails: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface SaleInvoiceRecord {
  id: string; // ej: "FAC-B-0001-00004521"
  invoiceNumber: string; // ej: "B-0001-00004521"
  invoiceType: 'A' | 'B' | 'C' | 'REM';
  invoicePos: string;
  invoiceNum: string;
  date: string;
  customerId: string;
  customerName: string;
  customerDoc: string;
  customerDocType: 'DNI' | 'CUIT';
  customerPhone: string;
  customerEmail: string;
  paymentMethod: 'Transferencia' | 'Efectivo' | 'Débito' | 'Crédito' | 'Mercado Pago';
  items: SaleInvoiceItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
  cae?: string;
  caeVto?: string;
  status: 'Aprobada' | 'Emitido Local';
}

const DEFAULT_CUSTOMERS: CustomerRecord[] = [
  {
    id: 'cli-001',
    firstName: 'Gonzalo',
    lastName: 'Martínez',
    phone: '5493415551234',
    email: 'gonzalo.martinez@gmail.com',
    doc: '38.450.112',
    docType: 'DNI',
    totalSpent: 2450000,
    createdAt: '2026-08-15',
    purchases: [
      {
        date: '2026-09-07',
        orderId: 'ORD-0004521',
        invoiceId: 'B-0001-00004521',
        invoiceType: 'FACTURA_B',
        itemsSummary: 'Volta Radix Carbon 12v (Talle M)',
        bicyclesBought: ['Volta Radix Carbon 12v Shimano Deore'],
        total: 2450000,
      },
    ],
  },
  {
    id: 'cli-002',
    firstName: 'Rosario Cycling',
    lastName: 'Team SRL',
    phone: '5493415559900',
    email: 'administracion@rosariocycling.com.ar',
    doc: '30-71829301-4',
    docType: 'CUIT',
    totalSpent: 8900000,
    createdAt: '2026-08-20',
    purchases: [
      {
        date: '2026-09-07',
        orderId: 'ORD-0004520',
        invoiceId: 'A-0001-00004520',
        invoiceType: 'FACTURA_A',
        itemsSummary: 'Scott Spark RC World Cup EVO AXS (Talle M)',
        bicyclesBought: ['Scott Spark RC World Cup EVO AXS'],
        total: 8900000,
      },
    ],
  },
  {
    id: 'cli-003',
    firstName: 'Lucía',
    lastName: 'Fernández',
    phone: '5493415554321',
    email: 'lucia.f@hotmail.com',
    doc: '41.220.984',
    docType: 'DNI',
    totalSpent: 1350000,
    createdAt: '2026-09-01',
    purchases: [
      {
        date: '2026-09-07',
        orderId: 'ORD-0004519',
        invoiceId: 'B-0001-00001089',
        invoiceType: 'FACTURA_B',
        itemsSummary: 'Raleigh Mojave 9.5 29er (Talle M)',
        bicyclesBought: ['Raleigh Mojave 9.5 29er Shimano Deore'],
        total: 1350000,
      },
    ],
  },
];

const DEFAULT_INVOICES: SaleInvoiceRecord[] = [
  {
    id: 'FAC-B-0001-00004521',
    invoiceNumber: 'B-0001-00004521',
    invoiceType: 'B',
    invoicePos: '0001',
    invoiceNum: '00004521',
    date: '2026-09-07',
    customerId: 'cli-001',
    customerName: 'Gonzalo Martínez',
    customerDoc: '38.450.112',
    customerDocType: 'DNI',
    customerPhone: '5493415551234',
    customerEmail: 'gonzalo.martinez@gmail.com',
    paymentMethod: 'Débito',
    items: [
      {
        id: 'row-1',
        productId: 'bike-volta-radix',
        productTitle: 'Volta Radix Carbon 12v Shimano Deore',
        variantId: 'v-radix-m',
        variantDetails: 'Talle M (Negro Mate)',
        quantity: 1,
        unitPrice: 2450000,
        subtotal: 2450000,
      },
    ],
    subtotal: 2450000,
    discountPercent: 0,
    discountAmount: 0,
    totalAmount: 2450000,
    cae: '74389201948271',
    caeVto: '2026-09-17',
    status: 'Aprobada',
  },
  {
    id: 'FAC-A-0001-00004520',
    invoiceNumber: 'A-0001-00004520',
    invoiceType: 'A',
    invoicePos: '0001',
    invoiceNum: '00004520',
    date: '2026-09-07',
    customerId: 'cli-002',
    customerName: 'Rosario Cycling Team SRL',
    customerDoc: '30-71829301-4',
    customerDocType: 'CUIT',
    customerPhone: '5493415559900',
    customerEmail: 'administracion@rosariocycling.com.ar',
    paymentMethod: 'Transferencia',
    items: [
      {
        id: 'row-2',
        productId: 'bike-scott-spark',
        productTitle: 'Scott Spark RC World Cup EVO AXS',
        variantId: 'v-spark-m',
        variantDetails: 'Talle M (Negro Carbono)',
        quantity: 1,
        unitPrice: 8900000,
        subtotal: 8900000,
      },
    ],
    subtotal: 8900000,
    discountPercent: 0,
    discountAmount: 0,
    totalAmount: 8900000,
    cae: '74389201948270',
    caeVto: '2026-09-17',
    status: 'Aprobada',
  },
  {
    id: 'FAC-B-0001-00001089',
    invoiceNumber: 'B-0001-00001089',
    invoiceType: 'B',
    invoicePos: '0001',
    invoiceNum: '00001089',
    date: '2026-09-07',
    customerId: 'cli-003',
    customerName: 'Lucía Fernández',
    customerDoc: '41.220.984',
    customerDocType: 'DNI',
    customerPhone: '5493415554321',
    customerEmail: 'lucia.f@hotmail.com',
    paymentMethod: 'Efectivo',
    items: [
      {
        id: 'row-3',
        productId: 'bike-raleigh-mojave',
        productTitle: 'Raleigh Mojave 9.5 29er Shimano Deore',
        variantId: 'v-mojave-m',
        variantDetails: 'Talle M (Gris/Rojo)',
        quantity: 1,
        unitPrice: 1350000,
        subtotal: 1350000,
      },
    ],
    subtotal: 1350000,
    discountPercent: 0,
    discountAmount: 0,
    totalAmount: 1350000,
    status: 'Emitido Local',
  },
];

export function PointOfSaleInterface() {
  // Productos y catálogo sincronizados
  const [products, setProducts] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('orono_custom_bikes');
        if (stored) return JSON.parse(stored);
      } catch (e) {}
    }
    return ALL_PRODUCTS_CATALOG;
  });

  // Clientes
  const [customers, setCustomers] = useState<CustomerRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('orono_customers');
        if (stored) return JSON.parse(stored);
      } catch (e) {}
    }
    return DEFAULT_CUSTOMERS;
  });

  // Historial de Facturas de Venta
  const [invoices, setInvoices] = useState<SaleInvoiceRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('orono_invoices_history');
        if (stored) {
          const parsed = JSON.parse(stored);
          // Normalizar si viene del formato viejo
          return parsed.map((inv: any) => ({
            id: inv.id || `FAC-${inv.orderNumber || Date.now()}`,
            invoiceNumber: inv.invoiceNumber || inv.id || 'B-0001-00000000',
            invoiceType: inv.type === 'FACTURA_A' ? 'A' : inv.type === 'REM' ? 'REM' : 'B',
            invoicePos: inv.invoicePos || '0001',
            invoiceNum: inv.invoiceNum || (inv.id?.split('-')[2] || '00000000'),
            date: inv.date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
            customerId: inv.customerId || 'cli-001',
            customerName: inv.customerName || 'Consumidor Final',
            customerDoc: inv.doc || '',
            customerDocType: inv.docType || 'DNI',
            customerPhone: inv.customerPhone || '',
            customerEmail: inv.customerEmail || '',
            paymentMethod: inv.paymentMethod || 'Efectivo',
            items: inv.items || [
              {
                id: '1',
                productId: 'prod-legacy',
                productTitle: inv.itemsSummary || 'Artículos Varios',
                variantId: 'var-legacy',
                variantDetails: 'Estándar',
                quantity: 1,
                unitPrice: inv.amount || 0,
                subtotal: inv.amount || 0,
              },
            ],
            subtotal: inv.amount || inv.totalAmount || 0,
            discountPercent: 0,
            discountAmount: 0,
            totalAmount: inv.amount || inv.totalAmount || 0,
            notes: inv.notes || '',
            cae: inv.cae,
            caeVto: inv.caeVto,
            status: inv.status || 'Aprobada',
          }));
        }
      } catch (e) {}
    }
    return DEFAULT_INVOICES;
  });

  // Guardar en localStorage
  useEffect(() => {
    try {
      localStorage.setItem('orono_customers', JSON.stringify(customers));
    } catch (e) {}
  }, [customers]);

  useEffect(() => {
    try {
      localStorage.setItem('orono_invoices_history', JSON.stringify(invoices));
    } catch (e) {}
  }, [invoices]);

  // Búsqueda en Directorio de Clientes
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  // Búsqueda en Historial de Facturas
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');

  // Modales
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showViewInvoiceModal, setShowViewInvoiceModal] = useState(false);
  const [selectedInvoiceToView, setSelectedInvoiceToView] = useState<SaleInvoiceRecord | null>(null);
  const [selectedCustomerPurchases, setSelectedCustomerPurchases] = useState<CustomerRecord | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Formulario de Factura de Venta tipo Planilla (Spreadsheet)
  const [invoiceForm, setInvoiceForm] = useState<{
    customerId: string;
    invoiceType: 'A' | 'B' | 'C' | 'REM';
    invoicePos: string;
    invoiceNum: string;
    invoiceNumber: string;
    date: string;
    paymentMethod: 'Transferencia' | 'Efectivo' | 'Débito' | 'Crédito' | 'Mercado Pago';
    discountPercent: number;
    notes: string;
    items: SaleInvoiceItem[];
  }>({
    customerId: 'CONSUMIDOR_FINAL',
    invoiceType: 'B',
    invoicePos: '0001',
    invoiceNum: '',
    invoiceNumber: 'B-0001-00000000',
    date: new Date().toISOString().slice(0, 10),
    paymentMethod: 'Efectivo',
    discountPercent: 0,
    notes: '',
    items: [],
  });

  // Buscador rápido de artículos dentro del modal de facturación
  const [productSearchQuery, setProductSearchQuery] = useState('');

  // Buscador y desplegable de cliente en el modal de facturación
  const [customerComboboxQuery, setCustomerComboboxQuery] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar desplegable de clientes al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCustomerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Formulario rápido para Nuevo Cliente
  const [newCustomerForm, setNewCustomerForm] = useState({
    firstName: '',
    lastName: '',
    docType: 'DNI' as 'DNI' | 'CUIT',
    doc: '',
    phone: '',
    email: '',
  });

  // Generar siguiente número correlativo sugerido
  const getNextInvoiceNumber = (type: string, pos: string) => {
    const existingNums = invoices
      .filter((inv) => inv.invoiceType === type && inv.invoicePos === pos)
      .map((inv) => parseInt(inv.invoiceNum) || 0);
    if (existingNums.length > 0) {
      return String(Math.max(...existingNums) + 1).padStart(8, '0');
    }
    return pos === '0001' ? '00004522' : '00000001';
  };

  // Cambiar Punto de Venta (PV 1 o PV 2) con un clic y recalcular correlatividad
  const handleSelectPos = (pos: string) => {
    const nextNum = getNextInvoiceNumber(invoiceForm.invoiceType, pos);
    setInvoiceForm((prev) => ({
      ...prev,
      invoicePos: pos,
      invoiceNum: nextNum,
      invoiceNumber: `${prev.invoiceType}-${pos}-${nextNum}`,
    }));
  };

  // Abrir Modal de Nueva Factura
  const openNewInvoiceModal = (preselectedCustomerId?: string) => {
    const defaultPos = '0001';
    const defaultType = 'B';
    const nextNum = getNextInvoiceNumber(defaultType, defaultPos);

    const initialCustId = preselectedCustomerId || 'CONSUMIDOR_FINAL';
    setProductSearchQuery('');
    setInvoiceForm({
      customerId: initialCustId,
      invoiceType: defaultType,
      invoicePos: defaultPos,
      invoiceNum: nextNum,
      invoiceNumber: `${defaultType}-${defaultPos}-${nextNum}`,
      date: new Date().toISOString().slice(0, 10),
      paymentMethod: 'Efectivo',
      discountPercent: 0,
      notes: '',
      items: [], // Empieza vacía como en recepción
    });

    if (initialCustId === 'CONSUMIDOR_FINAL') {
      setCustomerComboboxQuery('');
    } else {
      const found = customers.find((c) => c.id === initialCustId);
      setCustomerComboboxQuery(found ? `${found.firstName} ${found.lastName}` : '');
    }
    setIsCustomerDropdownOpen(false);
    setShowNewInvoiceModal(true);
  };

  // Filtrado de clientes dentro del combobox de facturación por Nombre, Apellido, DNI o Teléfono
  const filteredCustomerOptions = useMemo(() => {
    if (!customerComboboxQuery.trim()) return customers;
    const q = customerComboboxQuery.toLowerCase().trim();
    return customers.filter(
      (c) =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
        c.doc.toLowerCase().includes(q) ||
        c.phone.includes(q)
    );
  }, [customers, customerComboboxQuery]);

  // Filtrado del buscador predictivo de productos dentro del modal
  const searchResults = useMemo(() => {
    if (!productSearchQuery.trim()) return [];
    const q = productSearchQuery.toLowerCase().trim();

    const results: { product: any; variant: ProductVariant }[] = [];
    for (const p of products) {
      const pMatch =
        p.title.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q));

      for (const v of p.variants || []) {
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
  }, [productSearchQuery, products]);

  // Agregar fila desde el buscador interactivo
  const handleAddProductFromSearch = (product: any, variant: ProductVariant) => {
    const newItem: SaleInvoiceItem = {
      id: 'item-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      productId: product.id,
      productTitle: `[${product.brand}] ${product.title}`,
      variantId: variant.id,
      variantDetails: `Talle ${variant.size} (${variant.color})`,
      quantity: 1,
      unitPrice: Number(variant.price) || 0,
      subtotal: Number(variant.price) || 0,
    };

    setInvoiceForm((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
    setProductSearchQuery('');
  };

  // Agregar fila vacía a la planilla
  const handleAddInvoiceRow = () => {
    if (products.length === 0) return;
    const defaultProduct = products[0];
    const defaultVariant = defaultProduct.variants?.[0] || { id: 'default', size: 'M', color: 'Negro', price: 0, stock: 0 };

    const newItem: SaleInvoiceItem = {
      id: 'item-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      productId: defaultProduct.id,
      productTitle: `[${defaultProduct.brand}] ${defaultProduct.title}`,
      variantId: defaultVariant.id,
      variantDetails: `Talle ${defaultVariant.size} (${defaultVariant.color})`,
      quantity: 1,
      unitPrice: Number(defaultVariant.price) || 0,
      subtotal: Number(defaultVariant.price) || 0,
    };

    setInvoiceForm((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  // Actualizar fila de la planilla
  const handleUpdateInvoiceRow = (rowId: string, updates: Partial<SaleInvoiceItem>) => {
    setInvoiceForm((prev) => {
      const updatedItems = prev.items.map((row) => {
        if (row.id !== rowId) return row;

        let finalUpdates = { ...updates };

        // Si cambió de producto
        if (updates.productId && updates.productId !== row.productId) {
          const newProd = products.find((p) => p.id === updates.productId);
          if (newProd && newProd.variants?.length > 0) {
            const firstVar = newProd.variants[0];
            finalUpdates = {
              ...finalUpdates,
              productTitle: `[${newProd.brand}] ${newProd.title}`,
              variantId: firstVar.id,
              variantDetails: `Talle ${firstVar.size} (${firstVar.color})`,
              unitPrice: Number(firstVar.price) || 0,
              subtotal: (Number(row.quantity) || 1) * (Number(firstVar.price) || 0),
            };
          }
        }

        // Si cambió la variante
        if (updates.variantId && updates.variantId !== row.variantId) {
          const currentProd = products.find((p) => p.id === (updates.productId || row.productId));
          const newVar = currentProd?.variants?.find((v: any) => v.id === updates.variantId);
          if (newVar) {
            finalUpdates = {
              ...finalUpdates,
              variantDetails: `Talle ${newVar.size} (${newVar.color})`,
              unitPrice: Number(newVar.price) || 0,
              subtotal: (Number(row.quantity) || 1) * (Number(newVar.price) || 0),
            };
          }
        }

        const merged = { ...row, ...finalUpdates };
        merged.subtotal = (Number(merged.quantity) || 0) * (Number(merged.unitPrice) || 0);
        return merged;
      });

      return { ...prev, items: updatedItems };
    });
  };

  // Eliminar fila de la planilla
  const handleRemoveInvoiceRow = (rowId: string) => {
    setInvoiceForm((prev) => ({
      ...prev,
      items: prev.items.filter((it) => it.id !== rowId),
    }));
  };

  // Cálculos de la Factura
  const invoiceSubtotal = useMemo(() => {
    return invoiceForm.items.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
  }, [invoiceForm.items]);

  const discountAmount = useMemo(() => {
    return (invoiceSubtotal * (invoiceForm.discountPercent || 0)) / 100;
  }, [invoiceSubtotal, invoiceForm.discountPercent]);

  const invoiceTotal = useMemo(() => {
    return Math.max(0, invoiceSubtotal - discountAmount);
  }, [invoiceSubtotal, discountAmount]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Guardar Nuevo Cliente
  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerForm.firstName.trim() || !newCustomerForm.phone.trim()) {
      alert('Por favor, ingresá al menos el nombre y el teléfono de contacto.');
      return;
    }

    const created: CustomerRecord = {
      id: 'cli-' + Date.now(),
      firstName: newCustomerForm.firstName.trim(),
      lastName: newCustomerForm.lastName.trim(),
      phone: newCustomerForm.phone.trim(),
      email: newCustomerForm.email.trim(),
      doc: newCustomerForm.doc.trim(),
      docType: newCustomerForm.docType,
      purchases: [],
      totalSpent: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setCustomers((prev) => [created, ...prev]);
    setShowAddCustomerModal(false);

    // Si estaba emitiendo una factura, seleccionarlo automáticamente
    if (showNewInvoiceModal) {
      setInvoiceForm((prev) => ({
        ...prev,
        customerId: created.id,
      }));
      setCustomerComboboxQuery(`${created.firstName} ${created.lastName}`);
      setIsCustomerDropdownOpen(false);
    }

    setNewCustomerForm({
      firstName: '',
      lastName: '',
      docType: 'DNI',
      doc: '',
      phone: '',
      email: '',
    });
  };

  // Guardar y Emitir Factura de Venta
  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validación: Al menos 1 producto
    if (invoiceForm.items.length === 0) {
      alert('⚠️ Para emitir la factura debés ingresar al menos un artículo en la planilla.');
      return;
    }

    // 2. Formateo de comprobante
    const cleanPos = invoiceForm.invoicePos ? invoiceForm.invoicePos.padStart(4, '0') : '0001';
    const cleanNum = invoiceForm.invoiceNum ? invoiceForm.invoiceNum.padStart(8, '0') : '';
    if (!cleanNum || cleanNum === '00000000') {
      alert('⚠️ Por favor ingresá un número de factura válido (hasta 8 dígitos).');
      return;
    }

    const fullInvoiceNumber = `${invoiceForm.invoiceType}-${cleanPos}-${cleanNum}`;

    // 3. Validación: Anti-duplicados por número de factura y tipo
    const exists = invoices.some(
      (inv) => inv.invoiceNumber.trim().toUpperCase() === fullInvoiceNumber.trim().toUpperCase()
    );
    if (exists) {
      alert(
        `⚠️ Ya existe una factura registrada con el comprobante N° ${fullInvoiceNumber}. Por favor verifica el número.`
      );
      return;
    }

    // 4. Datos del Cliente
    let custName = 'Consumidor Final';
    let custDoc = '99.999.999';
    let custDocType: 'DNI' | 'CUIT' = 'DNI';
    let custPhone = '';
    let custEmail = '';

    if (invoiceForm.customerId !== 'CONSUMIDOR_FINAL') {
      const found = customers.find((c) => c.id === invoiceForm.customerId);
      if (found) {
        custName = `${found.firstName} ${found.lastName}`.trim();
        custDoc = found.doc || '';
        custDocType = found.docType || 'DNI';
        custPhone = found.phone || '';
        custEmail = found.email || '';
      }
    }

    // 5. Generar CAE simulado para Facturas A y B
    const isAfip = invoiceForm.invoiceType === 'A' || invoiceForm.invoiceType === 'B';
    const mockCae = isAfip ? String(Math.floor(70000000000000 + Math.random() * 9999999999999)) : undefined;
    const vtoDate = new Date();
    vtoDate.setDate(vtoDate.getDate() + 10);
    const mockCaeVto = isAfip ? vtoDate.toISOString().slice(0, 10) : undefined;

    // 6. Crear Registro de Factura
    const newInvoiceRecord: SaleInvoiceRecord = {
      id: `FAC-${fullInvoiceNumber}`,
      invoiceNumber: fullInvoiceNumber,
      invoiceType: invoiceForm.invoiceType,
      invoicePos: cleanPos,
      invoiceNum: cleanNum,
      date: invoiceForm.date,
      customerId: invoiceForm.customerId,
      customerName: custName,
      customerDoc: custDoc,
      customerDocType: custDocType,
      customerPhone: custPhone,
      customerEmail: custEmail,
      paymentMethod: invoiceForm.paymentMethod,
      items: invoiceForm.items,
      subtotal: invoiceSubtotal,
      discountPercent: invoiceForm.discountPercent || 0,
      discountAmount,
      totalAmount: invoiceTotal,
      notes: invoiceForm.notes,
      cae: mockCae,
      caeVto: mockCaeVto,
      status: isAfip ? 'Aprobada' : 'Emitido Local',
    };

    // 7. Descontar Stock Físico en memoria y localStorage
    const updatedProducts = products.map((prod) => {
      const itemsForThisProduct = invoiceForm.items.filter((it) => it.productId === prod.id);
      if (itemsForThisProduct.length === 0) return prod;

      const updatedVariants = (prod.variants || []).map((v: ProductVariant) => {
        const itemForVariant = itemsForThisProduct.find((it) => it.variantId === v.id);
        if (itemForVariant) {
          const newStock = Math.max(0, (v.stock || 0) - Number(itemForVariant.quantity));
          return { ...v, stock: newStock };
        }
        return v;
      });

      return { ...prod, variants: updatedVariants };
    });

    setProducts(updatedProducts);
    try {
      localStorage.setItem('orono_custom_bikes', JSON.stringify(updatedProducts));
    } catch (e) {}

    // 8. Asentar Ingreso Financiero en Caja
    try {
      const storedCash = localStorage.getItem('orono_cash_movements');
      const cashList = storedCash ? JSON.parse(storedCash) : [];
      const newCashEntry = {
        id: `cash-${Date.now()}`,
        date: invoiceForm.date,
        type: 'in',
        concept: `Cobro Venta Factura ${fullInvoiceNumber} - ${custName}`,
        amount: invoiceTotal,
        paymentMethod: invoiceForm.paymentMethod,
        invoiceNumber: fullInvoiceNumber,
      };
      cashList.unshift(newCashEntry);
      localStorage.setItem('orono_cash_movements', JSON.stringify(cashList));
    } catch (e) {}

    // 9. Actualizar Cliente en Directorio (si no es consumidor final anónimo)
    if (invoiceForm.customerId !== 'CONSUMIDOR_FINAL') {
      const summaryItems = invoiceForm.items.map((it) => `${it.productTitle} (${it.quantity} u.)`).join(', ');
      const bikes = invoiceForm.items.map((it) => it.productTitle);

      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === invoiceForm.customerId) {
            return {
              ...c,
              totalSpent: c.totalSpent + invoiceTotal,
              purchases: [
                {
                  date: invoiceForm.date,
                  orderId: `ORD-${cleanNum}`,
                  invoiceId: fullInvoiceNumber,
                  invoiceType: `FACTURA_${invoiceForm.invoiceType}`,
                  itemsSummary: summaryItems,
                  bicyclesBought: bikes,
                  total: invoiceTotal,
                },
                ...c.purchases,
              ],
            };
          }
          return c;
        })
      );
    }

    // 10. Guardar en Historial de Facturas
    setInvoices((prev) => [newInvoiceRecord, ...prev]);

    // Cerrar modal de emisión y abrir vista previa de factura para descargar/imprimir
    setShowNewInvoiceModal(false);
    setSelectedInvoiceToView(newInvoiceRecord);
    setShowViewInvoiceModal(true);
  };

  // Enviar factura por correo electrónico al cliente vía Gmail SMTP
  const handleSendInvoiceEmail = async (invoice: SaleInvoiceRecord) => {
    let targetEmail = invoice.customerEmail?.trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      const prompted = prompt(
        `Ingresá el correo electrónico del cliente para enviar la factura ${invoice.invoiceNumber}:`,
        ''
      );
      if (!prompted || !prompted.includes('@')) {
        if (prompted !== null) {
          alert('Debés ingresar un correo electrónico válido.');
        }
        return;
      }
      targetEmail = prompted.trim();
    }

    setIsSendingEmail(true);
    try {
      const res = await fetch('/api/invoices/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: targetEmail,
          customerName: invoice.customerName,
          invoiceNumber: invoice.invoiceNumber,
          invoiceType: invoice.invoiceType,
          date: invoice.date,
          totalAmount: invoice.totalAmount,
          paymentMethod: invoice.paymentMethod,
          items: invoice.items,
          cae: invoice.cae,
          caeVto: invoice.caeVto,
          notes: invoice.notes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.simulated) {
          alert(`✉️ ${data.message}\n\nNota: Para el envío real a través de Gmail, configurá GMAIL_USER y GMAIL_APP_PASSWORD en .env.local.`);
        } else {
          alert(`✅ Factura enviada exitosamente a ${targetEmail}`);
        }
      } else {
        alert(`❌ Error al enviar el correo: ${data.error || data.message || 'Error desconocido'}`);
      }
    } catch (err: any) {
      alert(`❌ Error de conexión: ${err.message}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Filtrado de Clientes en Directorio
  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) return customers;
    const q = customerSearchQuery.toLowerCase().trim();
    return customers.filter(
      (c) =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
        c.doc.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [customers, customerSearchQuery]);

  // Filtrado de Facturas en Historial
  const filteredInvoices = useMemo(() => {
    if (!invoiceSearchQuery.trim()) return invoices;
    const q = invoiceSearchQuery.toLowerCase().trim();
    return invoices.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        inv.customerDoc.toLowerCase().includes(q) ||
        inv.items.some((it) => it.productTitle.toLowerCase().includes(q))
    );
  }, [invoices, invoiceSearchQuery]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header de Facturación de Venta */}
      <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-heading font-black text-zinc-950">
              Facturación & Comprobantes de Venta
            </h2>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Emití facturas y comprobantes oficiales tipo planilla: las cantidades{' '}
            <strong>se descontarán del stock físico</strong> y el cobro generará un{' '}
            <strong>ingreso financiero automáticamente</strong> en caja.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddCustomerModal(true)}
            className="px-4 py-2.5 border border-zinc-300 hover:bg-zinc-50 rounded-xl text-xs font-heading font-bold uppercase text-zinc-800 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Users className="w-3.5 h-3.5" /> + Nuevo Cliente
          </button>
          <button
            onClick={() => openNewInvoiceModal()}
            className="bg-zinc-950 hover:bg-zinc-800 text-white font-heading text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" /> Registrar Factura de Venta
          </button>
        </div>
      </div>

      {/* Resumen de Ventas / Facturación (KPIs como en Recepción) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs">
          <span className="text-[10px] font-heading font-black uppercase tracking-wider text-zinc-500 block mb-1">
            Clientes en Directorio
          </span>
          <div className="text-2xl font-mono font-black text-zinc-950">{customers.length}</div>
          <span className="text-[11px] text-zinc-500 mt-1 block">Base de compradores registrados</span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs">
          <span className="text-[10px] font-heading font-black uppercase tracking-wider text-zinc-500 block mb-1">
            Comprobantes Emitidos
          </span>
          <div className="text-2xl font-mono font-black text-zinc-950">{invoices.length}</div>
          <span className="text-[11px] text-zinc-500 mt-1 block">Facturas y remitos con stock descontado</span>
        </div>

        <div className="bg-zinc-950 text-white p-6 rounded-3xl shadow-xl">
          <span className="text-[10px] font-heading font-black uppercase tracking-wider text-emerald-400 block mb-1">
            Total Histórico Facturado
          </span>
          <div className="text-2xl font-mono font-black text-white">
            {formatCurrency(invoices.reduce((acc, inv) => acc + inv.totalAmount, 0))}
          </div>
          <span className="text-[11px] text-zinc-400 mt-1 block">Ingresos imputados en caja</span>
        </div>
      </div>

      {/* Listado / Directorio de Clientes & Facturación Directa */}
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-zinc-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-50/50">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-zinc-950" />
              <h3 className="text-base font-heading font-black text-zinc-950">
                Directorio de Clientes & Cuentas
              </h3>
            </div>
            <span className="text-xs text-zinc-500">
              Directorio oficial de compradores registrados. Facturá directamente a cualquier cliente desde la tabla.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, DNI/CUIT..."
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-zinc-950"
              />
            </div>
            <span className="text-xs font-mono font-bold text-zinc-700 bg-white border border-zinc-200 px-3 py-2 rounded-xl whitespace-nowrap shrink-0">
              {customers.length} {customers.length === 1 ? 'Cliente' : 'Clientes'}
            </span>
            <button
              onClick={() => setShowAddCustomerModal(true)}
              className="bg-zinc-950 hover:bg-zinc-800 text-white font-heading text-xs font-bold uppercase px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs whitespace-nowrap shrink-0 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> + Nuevo Cliente
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-100/80 border-b border-zinc-200 text-zinc-600 font-heading font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 min-w-[220px]">Cliente / Razón Social</th>
                <th className="py-3 px-4 min-w-[130px]">DNI / CUIT</th>
                <th className="py-3 px-4 min-w-[180px]">Teléfono WhatsApp / Email</th>
                <th className="py-3 px-4 text-right min-w-[150px]">Total Facturado ($ ARS)</th>
                <th className="py-3 px-4 text-center w-48">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 font-medium">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-zinc-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                    <p className="text-xs font-bold text-zinc-600">No se encontraron clientes</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {customerSearchQuery
                        ? 'Probá ajustando los términos de búsqueda'
                        : 'Presioná "+ Nuevo Cliente" para registrar el primero.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const custPurchasesCount = cust.purchases?.length || 0;
                  const cleanPhone = cust.phone ? cust.phone.replace(/[^0-9]/g, '') : '';

                  return (
                    <tr key={cust.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 shrink-0 font-heading font-black text-xs">
                            {cust.firstName?.slice(0, 1).toUpperCase()}
                            {cust.lastName?.slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <strong className="font-heading font-bold text-zinc-950 block text-xs">
                              {cust.firstName} {cust.lastName}
                            </strong>
                            <span className="text-[10px] text-zinc-400">Registrado el {cust.createdAt}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-zinc-700 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded text-[11px] font-semibold">
                          {cust.docType}: {cust.doc || 'S/D'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-zinc-800 font-mono text-[11px] flex items-center gap-1.5">
                          {cleanPhone ? (
                            <a
                              href={`https://wa.me/${cleanPhone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 hover:text-emerald-700 transition-colors"
                              title="Enviar WhatsApp"
                            >
                              <svg
                                className="w-3.5 h-3.5 fill-current inline-block"
                                viewBox="0 0 24 24"
                              >
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                              </svg>
                            </a>
                          ) : (
                            <span>📞</span>
                          )}
                          <span>{cust.phone || 'S/D'}</span>
                        </div>
                        {cust.email && (
                          <span
                            className="text-[10px] text-zinc-400 block mt-0.5 truncate max-w-[180px]"
                            title={cust.email}
                          >
                            {cust.email}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-mono font-bold text-xs text-zinc-950 block">
                          {formatCurrency(cust.totalSpent)}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-sans">
                          {custPurchasesCount} {custPurchasesCount === 1 ? 'compra registrada' : 'compras registradas'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openNewInvoiceModal(cust.id)}
                            title={`Emitir factura a ${cust.firstName} ${cust.lastName}`}
                            className="px-2.5 py-1 bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg text-[10px] font-heading font-bold uppercase transition-colors flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Facturar
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedCustomerPurchases(cust)}
                            title="Ver compras realizadas y descargar comprobantes"
                            className="px-2.5 py-1 border border-zinc-300 hover:bg-zinc-100 text-zinc-800 rounded-lg text-[10px] font-heading font-bold uppercase transition-colors flex items-center gap-1"
                          >
                            <ShoppingBag className="w-3 h-3 text-zinc-500" /> Compras
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

      {/* Historial de Facturas de Venta & Comprobantes Emitidos */}
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-zinc-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-50/50">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-zinc-950" />
              <h3 className="text-base font-heading font-black text-zinc-950">
                Historial de Facturas de Venta y Salidas de Stock
              </h3>
            </div>
            <span className="text-xs text-zinc-500">
              Detalle de comprobantes oficiales emitidos, mercadería entregada e ingresos registrados en caja.
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar por N° comprobante o cliente..."
                value={invoiceSearchQuery}
                onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-zinc-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-zinc-950"
              />
            </div>
            <span className="text-xs font-mono font-bold text-zinc-700 bg-white border border-zinc-200 px-3 py-1.5 rounded-xl shrink-0">
              {invoices.length} Comprobantes
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-100/80 border-b border-zinc-200 text-zinc-600 font-heading font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 min-w-[160px]">N° Comprobante / Fecha</th>
                <th className="py-3 px-4 min-w-[180px]">Cliente</th>
                <th className="py-3 px-4 min-w-[280px]">Mercadería Facturada (Stock -)</th>
                <th className="py-3 px-4 min-w-[130px]">Medio de Pago</th>
                <th className="py-3 px-4 text-right min-w-[140px]">Total Cobrado ($ ARS)</th>
                <th className="py-3 px-4 text-center w-36">Comprobante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 font-medium">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                    <p className="text-xs font-bold text-zinc-600">No se registraron comprobantes aún</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Hacé clic en "+ Registrar Factura de Venta" para emitir la primera.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-heading font-black text-[10px] px-1.5 py-0.5 rounded border ${
                            inv.invoiceType === 'A'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : inv.invoiceType === 'B'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-zinc-100 text-zinc-700 border-zinc-300'
                          }`}
                        >
                          FC {inv.invoiceType}
                        </span>
                        <strong className="font-mono text-zinc-950">{inv.invoiceNumber}</strong>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-mono mt-0.5 block">{inv.date}</span>
                    </td>
                    <td className="py-3 px-4">
                      <strong className="font-heading font-bold text-zinc-800 block text-xs">
                        {inv.customerName}
                      </strong>
                      {inv.customerDoc && (
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {inv.customerDocType}: {inv.customerDoc}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {inv.items.map((it, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <span className="text-rose-700 font-bold bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded text-[10px]">
                              -{it.quantity} u.
                            </span>
                            <span className="text-zinc-800 font-medium">
                              {it.productTitle} {it.variantDetails ? `(${it.variantDetails})` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-zinc-700 font-mono text-[11px] bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                        {inv.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono font-black text-xs text-zinc-950 block">
                        {formatCurrency(inv.totalAmount)}
                      </span>
                      {inv.discountPercent > 0 && (
                        <span className="text-[10px] text-emerald-600 font-bold font-sans">
                          Desc. {inv.discountPercent}%
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedInvoiceToView(inv);
                            setShowViewInvoiceModal(true);
                          }}
                          className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-heading font-bold flex items-center gap-1 transition-colors border border-zinc-200 shadow-2xs"
                          title="Ver y descargar comprobante oficial"
                        >
                          <FileText className="w-3.5 h-3.5 text-zinc-600" />
                          <span>Descargar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendInvoiceEmail(inv)}
                          disabled={isSendingEmail}
                          className="p-1.5 bg-zinc-100 hover:bg-emerald-50 text-zinc-600 hover:text-emerald-700 rounded-xl text-xs transition-colors border border-zinc-200 shadow-2xs disabled:opacity-50"
                          title={`Enviar factura ${inv.invoiceNumber} por correo electrónico`}
                        >
                          <Mail className="w-3.5 h-3.5" />
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

      {/* ========================================================================= */}
      {/* MODAL 1: PLANILLA DE EMISIÓN DE FACTURA DE VENTA (Similar a Recepción) */}
      {/* ========================================================================= */}
      {showNewInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-5xl w-full shadow-2xl border border-zinc-200 animate-fadeIn my-auto max-h-[94vh] flex flex-col relative">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-zinc-200 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <h3 className="text-xl font-heading font-black text-zinc-950 tracking-tight">
                    Planilla de Emisión de Factura de Venta
                  </h3>
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Ingresá los artículos de la venta tipo planilla: las cantidades{' '}
                  <strong>se descontarán del stock físico</strong> y el total generará un{' '}
                  <strong>ingreso financiero</strong> en caja.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(true)}
                  className="border border-zinc-300 hover:bg-zinc-50 text-zinc-700 text-xs font-heading font-bold uppercase px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>+ Nuevo Cliente</span>
                </button>
                <button
                  onClick={() => setShowNewInvoiceModal(false)}
                  className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-xl hover:bg-zinc-100 transition-colors"
                  title="Cerrar"
                >
                  <span className="text-lg font-bold">✕</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveInvoice} className="flex flex-col flex-1 overflow-hidden pt-4 gap-4">
              <div className="overflow-y-auto pr-1 space-y-4 flex-1">
                {/* Cabecera de la Factura: Cliente, Comprobante dividido, Fecha y Medio de Pago */}
                <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
                  {/* 1. Cliente / Titular con Buscador Predictivo por Nombre, Apellido o DNI/CUIT */}
                  <div className="lg:col-span-4 relative" ref={customerDropdownRef}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-heading font-bold uppercase text-zinc-700">
                        Cliente / Titular *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setNewCustomerForm((prev) => ({
                            ...prev,
                            firstName: customerComboboxQuery.trim(),
                          }));
                          setShowAddCustomerModal(true);
                        }}
                        className="text-[10px] font-heading font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-0.5"
                        title="Registrar nuevo cliente en el directorio"
                      >
                        <Plus className="w-3 h-3" /> + Nuevo Cliente
                      </button>
                    </div>

                    <div className="relative flex items-center">
                      <Search className="w-3.5 h-3.5 absolute left-3 text-zinc-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="🔍 Buscar por nombre, apellido o DNI..."
                        value={
                          isCustomerDropdownOpen
                            ? customerComboboxQuery
                            : invoiceForm.customerId === 'CONSUMIDOR_FINAL'
                            ? '👤 Consumidor Final (Venta Mostrador)'
                            : (() => {
                                const found = customers.find((c) => c.id === invoiceForm.customerId);
                                return found
                                  ? `${found.firstName} ${found.lastName} (${found.docType}: ${found.doc || 'S/D'})`
                                  : customerComboboxQuery;
                              })()
                        }
                        onFocus={() => {
                          setIsCustomerDropdownOpen(true);
                          if (invoiceForm.customerId !== 'CONSUMIDOR_FINAL') {
                            const found = customers.find((c) => c.id === invoiceForm.customerId);
                            if (found) setCustomerComboboxQuery(`${found.firstName} ${found.lastName}`);
                          } else {
                            setCustomerComboboxQuery('');
                          }
                        }}
                        onChange={(e) => {
                          setCustomerComboboxQuery(e.target.value);
                          setIsCustomerDropdownOpen(true);
                        }}
                        className="w-full pl-8.5 pr-8 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950 truncate"
                      />
                      {(invoiceForm.customerId !== 'CONSUMIDOR_FINAL' || customerComboboxQuery) && (
                        <button
                          type="button"
                          onClick={() => {
                            setInvoiceForm((prev) => ({ ...prev, customerId: 'CONSUMIDOR_FINAL' }));
                            setCustomerComboboxQuery('');
                          }}
                          className="absolute right-2.5 text-zinc-400 hover:text-zinc-700 p-0.5 rounded-full hover:bg-zinc-100 text-xs font-bold"
                          title="Restablecer a Consumidor Final"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Desplegable de búsqueda de clientes */}
                    {isCustomerDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-zinc-200 rounded-2xl shadow-2xl z-40 max-h-64 overflow-y-auto divide-y divide-zinc-100 animate-fadeIn">
                        {/* Opción 1: Consumidor Final */}
                        <div
                          onClick={() => {
                            setInvoiceForm((prev) => ({ ...prev, customerId: 'CONSUMIDOR_FINAL' }));
                            setCustomerComboboxQuery('');
                            setIsCustomerDropdownOpen(false);
                          }}
                          className={`p-2.5 hover:bg-zinc-50 cursor-pointer flex items-center justify-between transition-colors ${
                            invoiceForm.customerId === 'CONSUMIDOR_FINAL' ? 'bg-zinc-100/70 font-bold' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">👤</span>
                            <div>
                              <div className="text-xs font-bold text-zinc-900">Consumidor Final</div>
                              <div className="text-[10px] text-zinc-500">Venta mostrador sin nominación fiscal</div>
                            </div>
                          </div>
                          {invoiceForm.customerId === 'CONSUMIDOR_FINAL' && (
                            <span className="text-[10px] font-mono text-emerald-600 font-bold">Seleccionado</span>
                          )}
                        </div>

                        {/* Lista de clientes filtrados por Nombre, Apellido o DNI/CUIT */}
                        {filteredCustomerOptions.map((c) => {
                          const isSelected = invoiceForm.customerId === c.id;
                          return (
                            <div
                              key={c.id}
                              onClick={() => {
                                setInvoiceForm((prev) => ({ ...prev, customerId: c.id }));
                                setCustomerComboboxQuery(`${c.firstName} ${c.lastName}`);
                                setIsCustomerDropdownOpen(false);
                              }}
                              className={`p-2.5 hover:bg-zinc-50 cursor-pointer flex items-center justify-between transition-colors group ${
                                isSelected ? 'bg-zinc-100/70' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-6 h-6 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-700">
                                  {c.firstName[0]}
                                  {c.lastName[0] || ''}
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-zinc-950 group-hover:text-emerald-700 transition-colors">
                                    {c.firstName} {c.lastName}
                                  </div>
                                  <div className="text-[10px] text-zinc-500 font-mono">
                                    {c.docType}: <span className="font-semibold text-zinc-700">{c.doc || 'S/D'}</span>
                                    {c.phone ? ` · 📞 ${c.phone}` : ''}
                                  </div>
                                </div>
                              </div>

                              {isSelected ? (
                                <span className="text-[10px] font-mono text-emerald-600 font-bold">Seleccionado</span>
                              ) : (
                                <span className="text-[10px] text-zinc-400 group-hover:text-zinc-800 font-medium">Elegir →</span>
                              )}
                            </div>
                          );
                        })}

                        {/* Estado si no hay coincidencias */}
                        {customerComboboxQuery.trim() && filteredCustomerOptions.length === 0 && (
                          <div className="p-3 text-center text-zinc-500 text-xs">
                            No se encontraron clientes con "{customerComboboxQuery}"
                          </div>
                        )}

                        {/* Botón rápido para dar de alta nuevo cliente si no está */}
                        <div
                          onClick={() => {
                            setNewCustomerForm((prev) => ({
                              ...prev,
                              firstName: customerComboboxQuery.trim(),
                            }));
                            setIsCustomerDropdownOpen(false);
                            setShowAddCustomerModal(true);
                          }}
                          className="p-2.5 bg-emerald-50/70 hover:bg-emerald-100/70 cursor-pointer flex items-center justify-between transition-colors text-emerald-800"
                        >
                          <span className="text-xs font-heading font-bold flex items-center gap-1.5">
                            <Plus className="w-3.5 h-3.5 text-emerald-700" />
                            <span>
                              {customerComboboxQuery.trim()
                                ? `Registrar "${customerComboboxQuery.trim()}" como Nuevo Cliente`
                                : '+ Registrar Nuevo Cliente en el Directorio'}
                            </span>
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Crear</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Factura Dividida: Tipo, Punto de Venta (Botones 1 y 2) y Número editable */}
                  <div className="lg:col-span-4">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-heading font-bold uppercase text-zinc-700">
                        Comprobante: Tipo · Pto. Venta · Número *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const suggested = getNextInvoiceNumber(invoiceForm.invoiceType, invoiceForm.invoicePos);
                          setInvoiceForm((prev) => ({
                            ...prev,
                            invoiceNum: suggested,
                            invoiceNumber: `${prev.invoiceType}-${prev.invoicePos}-${suggested}`,
                          }));
                        }}
                        className="text-[10px] font-mono text-zinc-500 hover:text-zinc-900 transition-colors"
                        title="Restaurar número correlativo sugerido automáticamente"
                      >
                        N° Sugerido
                      </button>
                    </div>

                    <div className="grid grid-cols-12 gap-1.5 items-center">
                      {/* Tipo */}
                      <div className="col-span-3">
                        <select
                          value={invoiceForm.invoiceType}
                          onChange={(e) => {
                            const t = e.target.value as any;
                            const pos = invoiceForm.invoicePos ? invoiceForm.invoicePos.padStart(4, '0') : '0001';
                            const nextNum = getNextInvoiceNumber(t, pos);
                            setInvoiceForm({
                              ...invoiceForm,
                              invoiceType: t,
                              invoiceNum: nextNum,
                              invoiceNumber: `${t}-${pos}-${nextNum}`,
                            });
                          }}
                          className="w-full px-2 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-heading font-black text-center text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                        >
                          <option value="B">FC B</option>
                          <option value="A">FC A</option>
                          <option value="C">FC C</option>
                          <option value="REM">REM</option>
                        </select>
                      </div>

                      {/* Punto de Venta */}
                      <div className="col-span-4">
                        <select
                          value={invoiceForm.invoicePos}
                          onChange={(e) => handleSelectPos(e.target.value)}
                          className="w-full px-2 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-mono font-black text-center text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                        >
                          <option value="0001">PV 0001</option>
                          <option value="0002">PV 0002</option>
                          <option value="0003">PV 0003</option>
                          <option value="0004">PV 0004</option>
                          <option value="0005">PV 0005</option>
                        </select>
                      </div>

                      {/* Número de Factura: Auto-selección al hacer clic y botón ✕ para borrar directo */}
                      <div className="col-span-5 relative flex items-center">
                        <input
                          type="text"
                          maxLength={8}
                          required
                          placeholder="00012345"
                          value={invoiceForm.invoiceNum}
                          onFocus={(e) => e.target.select()}
                          onClick={(e) => e.currentTarget.select()}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^0-9]/g, '');
                            setInvoiceForm({
                              ...invoiceForm,
                              invoiceNum: raw,
                            });
                          }}
                          onBlur={() => {
                            const raw = invoiceForm.invoiceNum.replace(/[^0-9]/g, '');
                            const pos = invoiceForm.invoicePos || '0001';
                            const fallback = getNextInvoiceNumber(invoiceForm.invoiceType, pos);
                            const padded = raw ? raw.padStart(8, '0') : fallback;
                            setInvoiceForm({
                              ...invoiceForm,
                              invoiceNum: padded,
                              invoiceNumber: `${invoiceForm.invoiceType}-${pos}-${padded}`,
                            });
                          }}
                          className="w-full pl-2 pr-6 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-mono font-black text-center text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                          title="Número de comprobante: hacé clic para reemplazarlo directamente o borralo con ✕"
                        />
                        {invoiceForm.invoiceNum && (
                          <button
                            type="button"
                            onClick={() => {
                              setInvoiceForm({
                                ...invoiceForm,
                                invoiceNum: '',
                              });
                            }}
                            className="absolute right-1.5 text-zinc-400 hover:text-zinc-700 p-0.5 rounded-full hover:bg-zinc-100 text-xs font-bold"
                            title="Borrar para escribir un número nuevo"
                          >
                            ✕
                          </button>
                        )}
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
                      value={invoiceForm.date}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, date: e.target.value })}
                      className="w-full px-2.5 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-zinc-950"
                    />
                  </div>

                  {/* 4. Medio de Pago (2 cols) */}
                  <div className="lg:col-span-2">
                    <label className="block text-[11px] font-heading font-bold uppercase text-zinc-700 mb-1">
                      Medio de Pago *
                    </label>
                    <select
                      value={invoiceForm.paymentMethod}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, paymentMethod: e.target.value as any })}
                      className="w-full px-2.5 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-bold uppercase focus:outline-none focus:ring-1 focus:ring-zinc-950"
                    >
                      <option value="Efectivo">Efectivo Caja</option>
                      <option value="Transferencia">Transferencia</option>
                      <option value="Débito">Tarjeta Débito</option>
                      <option value="Crédito">Tarjeta Crédito</option>
                      <option value="Mercado Pago">Mercado Pago</option>
                    </select>
                  </div>
                </div>

                {/* Buscador Rápido de Producto por Descripción / Código SKU */}
                <div className="relative">
                  <div className="relative flex items-center">
                    <Search className="w-4 h-4 absolute left-3.5 text-zinc-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="🔍 Buscar artículo por descripción, nombre o código SKU (ej: Spark, Cuadro Volta, Cadena Shimano, Casco, etc)..."
                      value={productSearchQuery}
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-9 py-2.5 bg-white border-2 border-zinc-200 focus:border-zinc-950 rounded-2xl text-xs font-medium placeholder:text-zinc-400 focus:outline-none shadow-xs transition-colors"
                    />
                    {productSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setProductSearchQuery('')}
                        className="absolute right-3.5 text-zinc-400 hover:text-zinc-700 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Desplegable de Resultados de Búsqueda */}
                  {searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-zinc-200 rounded-2xl shadow-2xl z-30 max-h-64 overflow-y-auto divide-y divide-zinc-100 animate-fadeIn">
                      <div className="px-3.5 py-2 bg-zinc-50 text-[10px] font-heading font-bold uppercase text-zinc-500 tracking-wider flex justify-between items-center">
                        <span>Coincidencias encontradas ({searchResults.length})</span>
                        <span className="text-zinc-400">Clic en un artículo para agregarlo a la planilla</span>
                      </div>
                      {searchResults.map(({ product, variant }) => (
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
                                Talle: <span className="font-semibold text-zinc-700">{variant.size}</span> ({variant.color}) · Stock disponible:{' '}
                                <span className="font-mono font-bold text-emerald-700">{variant.stock || 0} u.</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-mono font-bold text-zinc-950 block">
                              {formatCurrency(Number(variant.price) || 0)}
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

                {/* Planilla de Artículos a Facturar (Spreadsheet) */}
                <div className="border border-zinc-200 rounded-2xl overflow-hidden shadow-xs">
                  <div className="bg-zinc-100/90 px-4 py-2.5 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-zinc-800" />
                      <span className="font-heading font-bold text-xs uppercase tracking-wider text-zinc-900">
                        Planilla de Artículos a Facturar
                      </span>
                      <span className="bg-white border border-zinc-300 text-zinc-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                        {invoiceForm.items.length} {invoiceForm.items.length === 1 ? 'artículo' : 'artículos'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddInvoiceRow}
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
                          <th className="py-2.5 px-3 text-center w-24">Stock Disp.</th>
                          <th className="py-2.5 px-3 text-center w-28">Cant. a Facturar</th>
                          <th className="py-2.5 px-3 text-right min-w-[140px]">Precio Unit. ($ ARS)</th>
                          <th className="py-2.5 px-3 text-right min-w-[140px]">Subtotal ($ ARS)</th>
                          <th className="py-2.5 px-3 text-center w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200">
                        {invoiceForm.items.length === 0 ? (
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
                                  Buscá artículos arriba por descripción o código SKU, o hacé clic en{' '}
                                  <strong className="text-zinc-800 font-bold">+ Agregar Artículo</strong> para comenzar a cargar la factura.
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          invoiceForm.items.map((row, index) => {
                            const currentProduct = products.find((p) => p.id === row.productId) || products[0];
                            const currentVariant =
                              currentProduct?.variants?.find((v: any) => v.id === row.variantId) ||
                              currentProduct?.variants?.[0];
                            const availableStock = currentVariant?.stock ?? 0;
                            const isStockLow = row.quantity > availableStock;

                            return (
                              <tr key={row.id} className="hover:bg-zinc-50/80 transition-colors">
                                <td className="py-2.5 px-3 font-mono text-xs font-bold text-zinc-400 text-center">
                                  {index + 1}
                                </td>
                                <td className="py-2.5 px-3">
                                  <select
                                    value={row.productId}
                                    onChange={(e) => handleUpdateInvoiceRow(row.id, { productId: e.target.value })}
                                    className="w-full px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                                  >
                                    {products.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        [{p.brand}] {p.title}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="py-2.5 px-3">
                                  <select
                                    value={row.variantId}
                                    onChange={(e) => handleUpdateInvoiceRow(row.id, { variantId: e.target.value })}
                                    className="w-full px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs font-medium text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                                  >
                                    {currentProduct?.variants?.map((v: any) => (
                                      <option key={v.id} value={v.id}>
                                        {v.size} ({v.color}) {v.sku ? `— Cód: ${v.sku}` : ''}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span
                                    className={`inline-block px-2 py-0.5 text-[11px] font-mono font-bold rounded-md ${
                                      availableStock > 0
                                        ? 'bg-zinc-100 text-zinc-700'
                                        : 'bg-rose-100 text-rose-700'
                                    }`}
                                  >
                                    {availableStock} u.
                                  </span>
                                </td>
                                <td className="py-2.5 px-3">
                                  <input
                                    type="number"
                                    min={1}
                                    required
                                    value={row.quantity}
                                    onChange={(e) =>
                                      handleUpdateInvoiceRow(row.id, {
                                        quantity: Math.max(1, parseInt(e.target.value) || 1),
                                      })
                                    }
                                    className={`w-full px-2 py-1.5 text-center font-mono font-bold bg-white border rounded-lg text-xs focus:outline-none focus:ring-1 ${
                                      isStockLow
                                        ? 'border-amber-500 text-amber-900 bg-amber-50/50'
                                        : 'border-zinc-300 text-zinc-950 focus:ring-zinc-950'
                                    }`}
                                    title={isStockLow ? 'Atención: la cantidad a facturar supera el stock actual disponible' : ''}
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
                                      value={row.unitPrice || ''}
                                      onChange={(e) =>
                                        handleUpdateInvoiceRow(row.id, {
                                          unitPrice: Math.max(0, parseInt(e.target.value) || 0),
                                        })
                                      }
                                      className="w-full pl-6 pr-2 py-1.5 font-mono font-bold text-right bg-white border border-zinc-300 rounded-lg text-xs text-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                                    />
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-xs text-zinc-950">
                                  {formatCurrency(row.subtotal)}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveInvoiceRow(row.id)}
                                    title="Eliminar renglón"
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
                      onClick={handleAddInvoiceRow}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 text-zinc-800 rounded-xl text-xs font-heading font-bold uppercase transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> + Agregar Otro Artículo
                    </button>

                    <div className="flex flex-wrap items-center gap-2.5 text-xs font-heading">
                      <div className="bg-white border border-zinc-200 px-3 py-1.5 rounded-xl text-zinc-700">
                        <span className="text-zinc-500 font-bold uppercase mr-1.5 text-[10px]">Líneas:</span>
                        <strong className="font-mono">{invoiceForm.items.length}</strong>
                      </div>

                      <div className="bg-white border border-zinc-200 px-3 py-1.5 rounded-xl text-zinc-700">
                        <span className="text-zinc-500 font-bold uppercase mr-1.5 text-[10px]">Total Bultos:</span>
                        <strong className="font-mono text-rose-700">
                          -{invoiceForm.items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0)} u.
                        </strong>
                      </div>

                      {/* Descuento Opcional */}
                      <div className="bg-white border border-zinc-200 px-3 py-1 rounded-xl text-zinc-700 flex items-center gap-1.5">
                        <span className="text-zinc-500 font-bold uppercase text-[10px]">Desc (%):</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={invoiceForm.discountPercent || ''}
                          onChange={(e) =>
                            setInvoiceForm({
                              ...invoiceForm,
                              discountPercent: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)),
                            })
                          }
                          placeholder="0"
                          className="w-12 text-center font-mono font-bold text-xs bg-zinc-50 border border-zinc-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                        />
                      </div>

                      {/* Total Factura destacado */}
                      <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl text-emerald-800 flex items-center gap-2 shadow-2xs">
                        <span className="text-emerald-700 font-bold uppercase text-[10px]">Total Factura:</span>
                        <strong className="font-mono text-sm sm:text-base font-black text-emerald-800">
                          {formatCurrency(invoiceTotal)}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Observaciones Opcionales */}
                <div>
                  <label className="block text-[11px] font-heading font-bold uppercase text-zinc-700 mb-1">
                    Observaciones / Notas del Comprobante (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Retira en local / Envío pactado por expreso / Garantía cuadro 2 años..."
                    value={invoiceForm.notes}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                    className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-zinc-950"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-zinc-200">
                <span className="text-[11px] text-zinc-500 hidden sm:inline">
                  Al confirmar, se descontará el stock de cada artículo y se asentará el ingreso financiero en la caja.
                </span>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setShowNewInvoiceModal(false)}
                    className="px-4 py-2 border border-zinc-300 rounded-xl text-xs font-heading font-bold uppercase text-zinc-700 hover:bg-zinc-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={invoiceForm.items.length === 0}
                    className="px-5 py-2 bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-2 shadow-md transition-all active:scale-95"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Confirmar y Emitir Factura</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: NUEVO CLIENTE */}
      {/* ========================================================================= */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-zinc-200 animate-fadeIn relative z-[101]">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-heading font-black text-zinc-950">Nuevo Cliente</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-xl hover:bg-zinc-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-heading font-bold uppercase text-zinc-700 mb-1">
                    Nombre / Razón Social *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Juan"
                    value={newCustomerForm.firstName}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-zinc-950"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-heading font-bold uppercase text-zinc-700 mb-1">
                    Apellido
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Pérez"
                    value={newCustomerForm.lastName}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-zinc-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-4">
                  <label className="block text-[11px] font-heading font-bold uppercase text-zinc-700 mb-1">
                    Tipo Doc
                  </label>
                  <select
                    value={newCustomerForm.docType}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, docType: e.target.value as any })}
                    className="w-full px-2 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-zinc-950"
                  >
                    <option value="DNI">DNI</option>
                    <option value="CUIT">CUIT</option>
                  </select>
                </div>
                <div className="col-span-8">
                  <label className="block text-[11px] font-heading font-bold uppercase text-zinc-700 mb-1">
                    Número de Documento
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 38.450.112"
                    value={newCustomerForm.doc}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, doc: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-zinc-950"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-heading font-bold uppercase text-zinc-700 mb-1">
                  Teléfono / WhatsApp *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 5493415551234"
                  value={newCustomerForm.phone}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-zinc-950"
                />
              </div>

              <div>
                <label className="block text-[11px] font-heading font-bold uppercase text-zinc-700 mb-1">
                  Email (Opcional)
                </label>
                <input
                  type="email"
                  placeholder="Ej: cliente@correo.com"
                  value={newCustomerForm.email}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-zinc-950"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 border border-zinc-300 rounded-xl text-xs font-heading font-bold uppercase text-zinc-700 hover:bg-zinc-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-heading font-bold uppercase shadow-sm"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: COMPRAS REALIZADAS POR EL CLIENTE */}
      {/* ========================================================================= */}
      {selectedCustomerPurchases && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-zinc-200 animate-fadeIn my-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
              <div>
                <h3 className="text-lg font-heading font-black text-zinc-950">
                  Historial de Compras de {selectedCustomerPurchases.firstName} {selectedCustomerPurchases.lastName}
                </h3>
                <span className="text-xs text-zinc-500">
                  {selectedCustomerPurchases.docType}: {selectedCustomerPurchases.doc || 'S/D'} · Total Gastado:{' '}
                  <strong className="text-zinc-950 font-mono">
                    {formatCurrency(selectedCustomerPurchases.totalSpent)}
                  </strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomerPurchases(null)}
                className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-xl hover:bg-zinc-100"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto py-4 space-y-3 flex-1">
              {selectedCustomerPurchases.purchases?.length === 0 ? (
                <div className="text-center py-10 text-zinc-400">
                  <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                  <p className="text-xs font-bold text-zinc-600">Este cliente aún no tiene compras registradas</p>
                </div>
              ) : (
                selectedCustomerPurchases.purchases?.map((p, idx) => {
                  const matchingInvoice = invoices.find(
                    (inv) => inv.invoiceNumber === p.invoiceId || inv.id === p.invoiceId
                  );

                  return (
                    <div
                      key={idx}
                      className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-zinc-950">
                            {p.invoiceId || p.orderId}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">{p.date}</span>
                        </div>
                        <p className="text-xs text-zinc-700 font-medium mt-1">{p.itemsSummary}</p>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <span className="font-mono font-black text-xs text-zinc-950">
                          {formatCurrency(p.total)}
                        </span>
                        {matchingInvoice && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedInvoiceToView(matchingInvoice);
                              setShowViewInvoiceModal(true);
                            }}
                            className="px-3 py-1.5 bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-800 rounded-xl text-xs font-heading font-bold uppercase transition-colors flex items-center gap-1 shadow-2xs"
                          >
                            <FileText className="w-3.5 h-3.5 text-zinc-600" />
                            <span>Descargar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-zinc-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCustomerPurchases(null)}
                className="px-4 py-2 bg-zinc-950 text-white rounded-xl text-xs font-heading font-bold uppercase"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: VISUALIZACIÓN / IMPRESIÓN OFICIAL DE FACTURA O REMITO (PDF) */}
      {/* ========================================================================= */}
      {showViewInvoiceModal && selectedInvoiceToView && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl border border-zinc-200 animate-fadeIn my-auto flex flex-col relative z-[101]">
            {/* Header de controles de la factura */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 mb-6 print:hidden">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <h4 className="font-heading font-black text-sm text-zinc-950">
                    Comprobante Fiscal Oficial · OROÑO BIKE
                  </h4>
                  <span className="text-[11px] text-zinc-500">
                    Estado: <strong className="text-emerald-700">{selectedInvoiceToView.status}</strong>
                    {selectedInvoiceToView.cae && ` · CAE: ${selectedInvoiceToView.cae}`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSendingEmail}
                  onClick={() => handleSendInvoiceEmail(selectedInvoiceToView)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-heading font-bold uppercase flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
                  title="Enviar comprobante por correo electrónico al cliente"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{isSendingEmail ? 'Enviando...' : 'Enviar por Email'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-heading font-bold uppercase flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowViewInvoiceModal(false)}
                  className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-xl hover:bg-zinc-100"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Documento Imprimible de Factura / Remito */}
            <div className="border border-zinc-300 p-6 sm:p-8 rounded-2xl bg-white text-zinc-900 font-sans space-y-6 shadow-xs">
              {/* Encabezado Fiscal */}
              <div className="grid grid-cols-12 border-b border-zinc-300 pb-5 items-center">
                <div className="col-span-5 space-y-1">
                  <h2 className="text-xl font-heading font-black tracking-tight text-zinc-950">OROÑO BIKE</h2>
                  <p className="text-[11px] text-zinc-600 font-medium">Bicicletería, Taller & Boutique Ciclista</p>
                  <p className="text-[10px] text-zinc-500">Bv. Nicasio Oroño 1234, Rosario, Santa Fe</p>
                  <p className="text-[10px] text-zinc-500">IVA Responsable Inscripto</p>
                </div>

                {/* Letra de Comprobante Central */}
                <div className="col-span-2 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 border-2 border-zinc-950 rounded-xl flex items-center justify-center font-heading font-black text-2xl text-zinc-950">
                    {selectedInvoiceToView.invoiceType}
                  </div>
                  <span className="text-[9px] font-heading font-bold uppercase text-zinc-500 mt-1">
                    CÓD. {selectedInvoiceToView.invoiceType === 'A' ? '01' : selectedInvoiceToView.invoiceType === 'B' ? '06' : '91'}
                  </span>
                </div>

                <div className="col-span-5 text-right space-y-1 font-mono">
                  <h3 className="text-sm font-heading font-black uppercase text-zinc-950 font-sans">
                    {selectedInvoiceToView.invoiceType === 'REM' ? 'REMITO OFICIAL' : 'FACTURA'}
                  </h3>
                  <div className="text-xs font-black text-zinc-900">
                    N° {selectedInvoiceToView.invoiceNumber}
                  </div>
                  <div className="text-[11px] text-zinc-600 font-sans">
                    Fecha de Emisión: <strong>{selectedInvoiceToView.date}</strong>
                  </div>
                  <div className="text-[10px] text-zinc-500">CUIT: 30-71829304-8</div>
                  <div className="text-[10px] text-zinc-500">Ing. Brutos: 902-124921-2</div>
                </div>
              </div>

              {/* Datos del Cliente */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-zinc-400 block">Cliente:</span>
                  <strong className="text-zinc-950 block truncate">{selectedInvoiceToView.customerName}</strong>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                    {selectedInvoiceToView.customerDocType || 'DNI/CUIT'}:
                  </span>
                  <span className="font-mono text-zinc-800">{selectedInvoiceToView.customerDoc || 'Consumidor Final'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-zinc-400 block">Condición IVA:</span>
                  <span className="text-zinc-800">
                    {selectedInvoiceToView.invoiceType === 'A' ? 'Responsable Inscripto' : 'Consumidor Final'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-zinc-400 block">Medio de Pago:</span>
                  <span className="font-semibold text-zinc-900">{selectedInvoiceToView.paymentMethod}</span>
                </div>
              </div>

              {/* Detalle de Artículos */}
              <table className="w-full text-left text-xs border-collapse">
                <thead className="border-y border-zinc-300 text-zinc-600 font-heading font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-2 text-center w-12">Cant</th>
                    <th className="py-2 px-2">Descripción del Artículo / Modelo</th>
                    <th className="py-2 px-2 text-right w-28">Precio Unit.</th>
                    <th className="py-2 px-2 text-right w-32">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 font-medium">
                  {selectedInvoiceToView.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-2 text-center font-mono font-bold">{it.quantity}</td>
                      <td className="py-2.5 px-2">
                        <strong className="text-zinc-950 block">{it.productTitle}</strong>
                        {it.variantDetails && (
                          <span className="text-[11px] text-zinc-500 font-normal">{it.variantDetails}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono">{formatCurrency(it.unitPrice)}</td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-zinc-950">
                        {formatCurrency(it.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totales y Pie */}
              <div className="border-t border-zinc-300 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                {/* Código QR AFIP y CAE */}
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-white border border-zinc-300 rounded-lg p-1 flex items-center justify-center">
                    <QrCode className="w-14 h-14 text-zinc-950" />
                  </div>
                  <div className="text-[10px] space-y-0.5 text-zinc-600 font-mono">
                    {selectedInvoiceToView.cae && (
                      <div>
                        CAE N°: <strong>{selectedInvoiceToView.cae}</strong>
                      </div>
                    )}
                    {selectedInvoiceToView.caeVto && (
                      <div>
                        Fecha Vto. CAE: <strong>{selectedInvoiceToView.caeVto}</strong>
                      </div>
                    )}
                    <div className="text-[9px] text-zinc-400 font-sans">
                      Comprobante Autorizado por AFIP / ARCA
                    </div>
                  </div>
                </div>

                {/* Subtotal y Total */}
                <div className="w-full sm:w-64 space-y-1 text-xs">
                  <div className="flex justify-between text-zinc-600 font-medium">
                    <span>Subtotal Neto:</span>
                    <span className="font-mono">{formatCurrency(selectedInvoiceToView.subtotal)}</span>
                  </div>
                  {selectedInvoiceToView.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Descuento ({selectedInvoiceToView.discountPercent}%):</span>
                      <span className="font-mono">-{formatCurrency(selectedInvoiceToView.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-zinc-300 pt-1 text-sm font-heading font-black text-zinc-950">
                    <span>TOTAL:</span>
                    <span className="font-mono text-base">{formatCurrency(selectedInvoiceToView.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
