'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/context/CartContext';
import { PricingService, PricingPolicySettings, DEFAULT_PRICING_POLICY } from '@/lib/services/pricing.service';
import { OrdersService } from '@/lib/services/orders.service';
import {
  ShieldCheck,
  Truck,
  Store,
  CreditCard,
  Building2,
  DollarSign,
  ArrowLeft,
  CheckCircle2,
  Plus,
  Minus,
  Trash2,
  ExternalLink,
  MessageCircle,
  Copy,
  Lock,
} from 'lucide-react';

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(val);
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalAmount, updateQuantity, removeFromCart, clearCart } = useCart();

  // Pricing policy (descuento en transferencia y dólar)
  const [pricingSettings, setPricingSettings] = useState<PricingPolicySettings>(DEFAULT_PRICING_POLICY);

  useEffect(() => {
    setPricingSettings(PricingService.getSettings());
    const handleUpdate = () => setPricingSettings(PricingService.getSettings());
    window.addEventListener('pricingPolicyUpdated', handleUpdate);
    return () => window.removeEventListener('pricingPolicyUpdated', handleUpdate);
  }, []);

  // Formulario de Datos y Envío
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    billingType: 'FACTURA_B' as 'FACTURA_A' | 'FACTURA_B',
    docType: 'DNI' as 'DNI' | 'CUIT',
    docNumber: '',
    shippingType: 'local_pickup' as 'local_pickup' | 'andreani_standard',
    street: '',
    streetNumber: '',
    floorApt: '',
    city: 'Rosario',
    state: 'Santa Fe',
    zipCode: '2000',
    notes: '',
  });

  // Método de pago: 'transfer_ars' | 'transfer_usd' | 'mercadopago'
  const [paymentMethod, setPaymentMethod] = useState<'transfer_ars' | 'transfer_usd' | 'mercadopago'>('transfer_ars');
  const [selectedInstallments, setSelectedInstallments] = useState<number>(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Cálculos
  const shippingCost = formData.shippingType === 'andreani_standard' ? 18000 : 0;
  
  // Descuento por transferencia si está configurado en admin (> 0%)
  const transferDiscountPercent = pricingSettings.bankTransferDiscountPercent || 0;
  const isTransfer = paymentMethod === 'transfer_ars';
  const discountAmount = isTransfer && transferDiscountPercent > 0
    ? Math.round(totalAmount * (transferDiscountPercent / 100))
    : 0;

  // Financiación Mercado Pago
  const financingRateObj = pricingSettings.financingRates?.find(
    (f) => f.installments === selectedInstallments
  );
  const surchargePercent = paymentMethod === 'mercadopago' ? (financingRateObj?.surchargePercent || 0) : 0;
  const mpSurchargeAmount = paymentMethod === 'mercadopago'
    ? Math.round(totalAmount * (surchargePercent / 100))
    : 0;

  const finalTotalARS = totalAmount - discountAmount + shippingCost + mpSurchargeAmount;

  // Dólar billete
  const usdRate = pricingSettings.usdExchangeRate || 1535;
  const totalUSD = Math.round(finalTotalARS / usdRate);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleFinalizePurchase = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      alert('Tu carrito está vacío.');
      return;
    }

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      alert('Por favor completá tu Nombre y Apellido.');
      return;
    }

    if (!formData.email.trim()) {
      alert('Por favor completá tu Email para el envío del comprobante.');
      return;
    }

    if (!formData.phone.trim()) {
      alert('Por favor completá tu Teléfono / WhatsApp de contacto.');
      return;
    }

    if (!formData.docNumber.trim()) {
      alert(`Por favor completá tu número de ${formData.docType} para la emisión de la factura fiscal.`);
      return;
    }

    if (formData.shippingType === 'andreani_standard' && (!formData.street.trim() || !formData.streetNumber.trim())) {
      alert('Por favor completá la dirección de entrega a domicilio.');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        channel: 'web' as const,
        customerName: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        customerEmail: formData.email.trim(),
        customerPhone: formData.phone.trim(),
        billingType: formData.billingType,
        docType: formData.docType,
        docNumber: formData.docNumber.trim(),
        shippingType: formData.shippingType,
        shippingCost,
        shippingAddress: formData.shippingType === 'andreani_standard' ? {
          street: formData.street.trim(),
          number: formData.streetNumber.trim(),
          floorApt: formData.floorApt.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          zipCode: formData.zipCode.trim(),
        } : { localPickup: 'Bv. Nicasio Oroño 1234, Rosario, Santa Fe' },
        paymentMethod:
          paymentMethod === 'transfer_ars'
            ? 'Transferencia Bancaria ARS'
            : paymentMethod === 'transfer_usd'
            ? 'Transferencia Dólares (u$s)'
            : `Mercado Pago (${selectedInstallments} cuotas)`,
        paymentStatus: 'pending_payment' as const,
        subtotal: totalAmount,
        discount: discountAmount,
        total: finalTotalARS,
        notes: formData.notes.trim() || undefined,
        items: items.map((it) => ({
          productVariantId: it.variant.id,
          title: it.variant.product.title,
          variantDetails: `Talle ${it.variant.size} | Rodado ${it.variant.wheel_size || '-'} | ${it.variant.color}`,
          quantity: it.quantity,
          unitPrice: it.variant.price,
        })),
      };

      const result = await OrdersService.createOrder(orderPayload);

      if (result.success && result.order) {
        setCompletedOrder({
          ...result.order,
          calculatedUSD: totalUSD,
          chosenPayment: paymentMethod,
          itemsSummary: items,
          discountAmount,
        });
        clearCart();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert(`Error al generar el pedido: ${result.error || 'Intentá nuevamente.'}`);
      }
    } catch (err: any) {
      console.error('Error creating order:', err);
      alert('Ocurrió un error inesperado al procesar la orden.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Pantalla de Pedido Confirmado
  if (completedOrder) {
    const whatsappText = encodeURIComponent(
      `¡Hola Oroño Bike! 👋 Acabo de finalizar el pedido *${completedOrder.order_number}* en la web por un total de *${formatCurrency(completedOrder.total)}* (${completedOrder.payment_method}).\n\nNombre: ${formData.firstName} ${formData.lastName}\nDNI/CUIT: ${formData.docNumber}\n\nAdjunto aquí el comprobante de pago para coordinar la entrega. ¡Muchas gracias!`
    );

    return (
      <div className="min-h-screen bg-zinc-50 py-12 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-zinc-200 shadow-xl overflow-hidden">
          <div className="bg-zinc-950 p-6 sm:p-8 text-white text-center">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <span className="text-[11px] font-mono tracking-widest uppercase text-emerald-400 font-bold block mb-1">
              ¡Compra Registrada con Éxito!
            </span>
            <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight">
              Pedido {completedOrder.order_number}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-md mx-auto">
              Te enviamos una copia con todos los detalles a <strong className="text-white">{formData.email}</strong>.
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {completedOrder.chosenPayment === 'transfer_ars' && (
              <div className="p-5 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-heading font-bold uppercase text-zinc-600 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-zinc-700" />
                    Datos para Transferir en Pesos
                  </span>
                  <span className="text-sm font-mono font-black text-zinc-950">
                    {formatCurrency(completedOrder.total)}
                  </span>
                </div>

                <div className="space-y-2 pt-2 border-t border-zinc-200 text-xs">
                  <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-zinc-200">
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase font-heading">Alias Bancario</span>
                      <strong className="font-mono text-zinc-900 text-sm">ORONO.BIKE.OFICIAL</strong>
                    </div>
                    <button
                      onClick={() => handleCopy('ORONO.BIKE.OFICIAL', 'alias')}
                      className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedField === 'alias' ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>

                  <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-zinc-200">
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase font-heading">CBU</span>
                      <strong className="font-mono text-zinc-900 text-xs">0720000720000001234567</strong>
                    </div>
                    <button
                      onClick={() => handleCopy('0720000720000001234567', 'cbu')}
                      className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedField === 'cbu' ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>

                  <div className="text-[11px] text-zinc-500 pt-1">
                    Titular: <strong>Oroño Bike S.R.L.</strong> • CUIT: <strong>30-71689234-8</strong> • Banco Santander
                  </div>
                </div>
              </div>
            )}

            {completedOrder.chosenPayment === 'transfer_usd' && (
              <div className="p-5 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-heading font-bold uppercase text-emerald-800 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-700" />
                    Monto en Dólares Billete
                  </span>
                  <span className="text-base font-mono font-black text-emerald-900">
                    u$s {completedOrder.calculatedUSD}
                  </span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Podés transferir a nuestra cuenta en dólares o abonar billete al retirar en el local de Bv. Oroño 1234, Rosario. Cotización de referencia Banco Nación: ${usdRate}.
                </p>
              </div>
            )}

            {completedOrder.chosenPayment === 'mercadopago' && (
              <div className="p-5 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-heading font-bold uppercase text-sky-900 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-sky-700" />
                    Pago con Tarjeta en Cuotas
                  </span>
                  <span className="text-sm font-mono font-black text-sky-950">
                    {formatCurrency(completedOrder.total)}
                  </span>
                </div>
                <p className="text-xs text-sky-800 leading-relaxed">
                  Tu orden ya fue reservada en el sistema. Te contactaremos vía WhatsApp para enviarte el link de pago seguro de Mercado Pago o podés continuar directamente por el chat oficial.
                </p>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <a
                href={`https://wa.me/5493410000000?text=${whatsappText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-heading text-xs font-black uppercase tracking-wider py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Enviar Comprobante por WhatsApp
              </a>

              <Link
                href="/"
                className="w-full border border-zinc-300 hover:bg-zinc-50 text-zinc-700 font-heading text-xs font-bold uppercase tracking-wider py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                ← Volver a la Tienda de Oroño Bike
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Estado de Carrito Vacío
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-center items-center px-4">
        <div className="max-w-md text-center space-y-4">
          <div className="w-16 h-16 bg-zinc-100 text-zinc-400 rounded-full flex items-center justify-center mx-auto border border-zinc-200">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-heading font-black text-zinc-950 tracking-tight">
            Tu carrito está vacío
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
            No tenés productos seleccionados para finalizar la compra. Recorré nuestro catálogo oficial de bicicletas y componentes.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-white font-heading text-xs font-bold uppercase px-6 py-3 rounded-xl transition-all shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Ver Catálogo de Bicicletas
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Layout en 3 Columnas (Estilo Fusion Bikes)
  return (
    <div className="min-h-screen bg-zinc-100/60 font-sans text-zinc-900 pb-16">
      {/* Header Compacto de Checkout */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-zinc-900 group">
            <ArrowLeft className="w-4 h-4 text-zinc-400 group-hover:text-zinc-950 transition-colors" />
            <span className="font-heading font-black text-lg sm:text-xl tracking-tight">
              OROÑO<span className="text-zinc-400 font-medium">BIKE</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Checkout Oficial y Seguro • SSL 256-bit</span>
            <span className="sm:hidden text-[11px]">Compra Segura</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <form onSubmit={handleFinalizePurchase} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* =========================================================
              COLUMNA 1: TUS DATOS & ENTREGA (5 COLS)
              ========================================================= */}
          <div className="lg:col-span-5 space-y-4">
            {/* Tarjeta de Datos Personales */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h2 className="text-sm font-heading font-black uppercase text-zinc-950 flex items-center gap-2">
                  <span className="w-5 h-5 bg-zinc-950 text-white rounded-full text-[11px] font-mono flex items-center justify-center">1</span>
                  Tus Datos Personales
                </h2>
                <span className="text-[10px] text-zinc-400 font-mono">* Obligatorio</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-heading font-bold uppercase text-zinc-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Juan"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full h-10 px-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-medium text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-heading font-bold uppercase text-zinc-700 mb-1">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Pérez"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full h-10 px-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-medium text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-heading font-bold uppercase text-zinc-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="juan@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-10 px-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-medium text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-heading font-bold uppercase text-zinc-700 mb-1">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="341 555-0123"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full h-10 px-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-medium text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:bg-white"
                  />
                </div>
              </div>

              {/* Facturación Fiscal AFIP / ARCA */}
              <div className="pt-2 border-t border-zinc-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-heading font-bold uppercase text-zinc-700">
                    Facturación Fiscal Oficial
                  </label>
                  <div className="flex items-center gap-3 text-xs">
                    <label className="flex items-center gap-1 text-[11px] font-medium text-zinc-600 cursor-pointer">
                      <input
                        type="radio"
                        name="billingType"
                        checked={formData.billingType === 'FACTURA_B'}
                        onChange={() => setFormData({ ...formData, billingType: 'FACTURA_B', docType: 'DNI' })}
                        className="text-zinc-950 focus:ring-zinc-950"
                      />
                      Factura B (Consumidor Final)
                    </label>
                    <label className="flex items-center gap-1 text-[11px] font-medium text-zinc-600 cursor-pointer">
                      <input
                        type="radio"
                        name="billingType"
                        checked={formData.billingType === 'FACTURA_A'}
                        onChange={() => setFormData({ ...formData, billingType: 'FACTURA_A', docType: 'CUIT' })}
                        className="text-zinc-950 focus:ring-zinc-950"
                      />
                      Factura A (CUIT)
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-4">
                    <select
                      value={formData.docType}
                      onChange={(e) => setFormData({ ...formData, docType: e.target.value as any })}
                      className="w-full h-10 px-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-heading font-bold text-center text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                    >
                      <option value="DNI">DNI</option>
                      <option value="CUIT">CUIT</option>
                    </select>
                  </div>
                  <div className="col-span-8">
                    <input
                      type="text"
                      required
                      placeholder={formData.docType === 'CUIT' ? '20-38450112-9' : 'Número de Documento'}
                      value={formData.docNumber}
                      onChange={(e) => setFormData({ ...formData, docNumber: e.target.value })}
                      className="w-full h-10 px-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono font-bold text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tarjeta de Método de Entrega */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h2 className="text-sm font-heading font-black uppercase text-zinc-950 flex items-center gap-2">
                  <span className="w-5 h-5 bg-zinc-950 text-white rounded-full text-[11px] font-mono flex items-center justify-center">2</span>
                  Método de Entrega
                </h2>
              </div>

              <div className="space-y-2.5">
                {/* Opción Retiro en Local */}
                <label
                  onClick={() => setFormData({ ...formData, shippingType: 'local_pickup' })}
                  className={`p-3.5 rounded-xl border flex items-start justify-between cursor-pointer transition-all ${
                    formData.shippingType === 'local_pickup'
                      ? 'border-zinc-950 bg-zinc-50/70 ring-1 ring-zinc-950'
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="shippingType"
                      checked={formData.shippingType === 'local_pickup'}
                      onChange={() => setFormData({ ...formData, shippingType: 'local_pickup' })}
                      className="mt-1 text-zinc-950 focus:ring-zinc-950"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-zinc-800" />
                        <span className="text-xs font-heading font-bold text-zinc-950">
                          Retiro en el Local (Rosario)
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Bv. Nicasio Oroño 1234, Rosario. Lun a Vie 9 a 19:30 | Sáb 9 a 13:30.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    GRATIS
                  </span>
                </label>

                {/* Opción Envío a Domicilio */}
                <label
                  onClick={() => setFormData({ ...formData, shippingType: 'andreani_standard' })}
                  className={`p-3.5 rounded-xl border flex items-start justify-between cursor-pointer transition-all ${
                    formData.shippingType === 'andreani_standard'
                      ? 'border-zinc-950 bg-zinc-50/70 ring-1 ring-zinc-950'
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="shippingType"
                      checked={formData.shippingType === 'andreani_standard'}
                      onChange={() => setFormData({ ...formData, shippingType: 'andreani_standard' })}
                      className="mt-1 text-zinc-950 focus:ring-zinc-950"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-zinc-800" />
                        <span className="text-xs font-heading font-bold text-zinc-950">
                          Envío Asegurado a Domicilio (Andreani)
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Entrega segura con código de seguimiento en 2 a 5 días hábiles a todo el país.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-zinc-900">
                    {formatCurrency(18000)}
                  </span>
                </label>
              </div>

              {/* Campos de Dirección si eligió Andreani */}
              {formData.shippingType === 'andreani_standard' && (
                <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3 pt-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-heading font-bold uppercase text-zinc-600 mb-1">
                        Calle *
                      </label>
                      <input
                        type="text"
                        required={formData.shippingType === 'andreani_standard'}
                        placeholder="Av. Pellegrini"
                        value={formData.street}
                        onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                        className="w-full h-9 px-2.5 bg-white border border-zinc-300 rounded-lg text-xs font-medium text-zinc-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-heading font-bold uppercase text-zinc-600 mb-1">
                        Número *
                      </label>
                      <input
                        type="text"
                        required={formData.shippingType === 'andreani_standard'}
                        placeholder="1420"
                        value={formData.streetNumber}
                        onChange={(e) => setFormData({ ...formData, streetNumber: e.target.value })}
                        className="w-full h-9 px-2.5 bg-white border border-zinc-300 rounded-lg text-xs font-medium text-zinc-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-heading font-bold uppercase text-zinc-600 mb-1">
                        Piso / Depto
                      </label>
                      <input
                        type="text"
                        placeholder="4 B (Opcional)"
                        value={formData.floorApt}
                        onChange={(e) => setFormData({ ...formData, floorApt: e.target.value })}
                        className="w-full h-9 px-2.5 bg-white border border-zinc-300 rounded-lg text-xs font-medium text-zinc-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-heading font-bold uppercase text-zinc-600 mb-1">
                        Ciudad / Localidad *
                      </label>
                      <input
                        type="text"
                        required={formData.shippingType === 'andreani_standard'}
                        placeholder="Rosario"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full h-9 px-2.5 bg-white border border-zinc-300 rounded-lg text-xs font-medium text-zinc-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-heading font-bold uppercase text-zinc-600 mb-1">
                        Cód. Postal *
                      </label>
                      <input
                        type="text"
                        required={formData.shippingType === 'andreani_standard'}
                        placeholder="2000"
                        value={formData.zipCode}
                        onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                        className="w-full h-9 px-2.5 bg-white border border-zinc-300 rounded-lg text-xs font-medium text-zinc-900"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* =========================================================
              COLUMNA 2: TU PEDIDO (3 COLS)
              ========================================================= */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h2 className="text-sm font-heading font-black uppercase text-zinc-950 flex items-center gap-2">
                  <span className="w-5 h-5 bg-zinc-950 text-white rounded-full text-[11px] font-mono flex items-center justify-center">3</span>
                  Tu Pedido
                </h2>
                <span className="text-[11px] font-mono text-zinc-500">
                  {items.reduce((s, i) => s + i.quantity, 0)} {items.length === 1 ? 'artículo' : 'artículos'}
                </span>
              </div>

              {/* Lista de productos */}
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 divide-y divide-zinc-100">
                {items.map((item) => (
                  <div key={item.variant.id} className="pt-3 first:pt-0 flex gap-3 items-start">
                    <div className="w-14 h-14 bg-zinc-100 rounded-lg border border-zinc-200 overflow-hidden shrink-0">
                      <img
                        src={item.variant.product.images[0] || 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=300&q=80'}
                        alt={item.variant.product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-heading font-bold text-zinc-900 truncate">
                        {item.variant.product.title}
                      </h4>
                      <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                        Talle: {item.variant.size} • {item.variant.color}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-zinc-200 rounded-lg bg-zinc-50">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.variant.id, item.quantity - 1)}
                            className="p-1 hover:bg-zinc-200 rounded-l-lg transition-colors"
                          >
                            <Minus className="w-2.5 h-2.5 text-zinc-600" />
                          </button>
                          <span className="px-2 text-xs font-mono font-bold text-zinc-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.variant.id, item.quantity + 1)}
                            className="p-1 hover:bg-zinc-200 rounded-r-lg transition-colors"
                          >
                            <Plus className="w-2.5 h-2.5 text-zinc-600" />
                          </button>
                        </div>

                        <span className="text-xs font-mono font-bold text-zinc-950">
                          {formatCurrency(item.variant.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Resumen de Costos */}
              <div className="pt-3 border-t border-zinc-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatCurrency(totalAmount)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                    <span>Descuento Transferencia ({transferDiscountPercent}% OFF)</span>
                    <span className="font-mono">-{formatCurrency(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-zinc-600">
                  <span>Envío</span>
                  <span className="font-mono">
                    {shippingCost === 0 ? 'Gratis' : formatCurrency(shippingCost)}
                  </span>
                </div>

                {mpSurchargeAmount > 0 && (
                  <div className="flex justify-between text-sky-700 font-bold">
                    <span>Recargo Plan ({selectedInstallments} cuotas)</span>
                    <span className="font-mono">+{formatCurrency(mpSurchargeAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-baseline pt-3 border-t border-zinc-200">
                  <span className="text-sm font-heading font-black text-zinc-950 uppercase">Total Final</span>
                  <div className="text-right">
                    <span className="text-lg font-mono font-black text-zinc-950 block">
                      {formatCurrency(finalTotalARS)}
                    </span>
                    <span className="text-[10px] text-zinc-400 block font-mono">
                      u$s {totalUSD} (Ref: ${usdRate})
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1 text-[11px] text-zinc-500">
                <div className="flex items-center gap-1.5 text-zinc-700 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Factura Oficial AFIP (A o B)
                </div>
                <p>Todos nuestros productos cuentan con garantía directa de fábrica y servicio de posventa en taller.</p>
              </div>
            </div>
          </div>

          {/* =========================================================
              COLUMNA 3: MEDIOS DE PAGO & CUOTAS (4 COLS)
              ========================================================= */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h2 className="text-sm font-heading font-black uppercase text-zinc-950 flex items-center gap-2">
                  <span className="w-5 h-5 bg-zinc-950 text-white rounded-full text-[11px] font-mono flex items-center justify-center">4</span>
                  Medio de Pago & Cuotas
                </h2>
              </div>

              {/* Selector de Medios de Pago */}
              <div className="space-y-2.5">
                {/* 1. Transferencia en Pesos */}
                <label
                  onClick={() => setPaymentMethod('transfer_ars')}
                  className={`p-3.5 rounded-xl border flex flex-col gap-2 cursor-pointer transition-all ${
                    paymentMethod === 'transfer_ars'
                      ? 'border-zinc-950 bg-zinc-50/70 ring-1 ring-zinc-950'
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'transfer_ars'}
                        onChange={() => setPaymentMethod('transfer_ars')}
                        className="text-zinc-950 focus:ring-zinc-950"
                      />
                      <Building2 className="w-4 h-4 text-zinc-800" />
                      <span className="text-xs font-heading font-bold text-zinc-950">
                        Transferencia Bancaria
                      </span>
                    </div>
                    {transferDiscountPercent > 0 && (
                      <span className="text-[10px] font-mono font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                        {transferDiscountPercent}% OFF
                      </span>
                    )}
                  </div>

                  {paymentMethod === 'transfer_ars' && (
                    <div className="mt-1 pt-2 border-t border-zinc-200 text-xs space-y-1.5 text-zinc-600">
                      <div className="flex justify-between font-mono">
                        <span>Total a transferir:</span>
                        <strong className="text-zinc-950 text-sm font-black">
                          {formatCurrency(finalTotalARS)}
                        </strong>
                      </div>
                      <p className="text-[11px] text-zinc-500 leading-relaxed">
                        Al completar el pedido, se reserva el stock por 24 hs. Te mostraremos CBU y Alias para realizar el pago de inmediato.
                      </p>
                    </div>
                  )}
                </label>

                {/* 2. Mercado Pago con Cuotas */}
                <label
                  onClick={() => setPaymentMethod('mercadopago')}
                  className={`p-3.5 rounded-xl border flex flex-col gap-2 cursor-pointer transition-all ${
                    paymentMethod === 'mercadopago'
                      ? 'border-sky-600 bg-sky-50/40 ring-1 ring-sky-600'
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'mercadopago'}
                        onChange={() => setPaymentMethod('mercadopago')}
                        className="text-sky-600 focus:ring-sky-600"
                      />
                      <CreditCard className="w-4 h-4 text-sky-600" />
                      <span className="text-xs font-heading font-bold text-zinc-950">
                        Mercado Pago (Tarjetas / Cuotas)
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-sky-700 bg-sky-100/70 px-2 py-0.5 rounded-md">
                      Tarjetas
                    </span>
                  </div>

                  {paymentMethod === 'mercadopago' && (
                    <div className="mt-2 pt-2 border-t border-sky-200 text-xs space-y-2">
                      <label className="block text-[11px] font-heading font-bold text-zinc-800 uppercase">
                        Seleccioná tu Plan de Cuotas:
                      </label>

                      <div className="grid grid-cols-3 gap-1.5">
                        {[3, 6, 12].map((q) => {
                          const rate = pricingSettings.financingRates?.find((f) => f.installments === q);
                          const sur = rate?.surchargePercent || 0;
                          const qTotal = Math.round(totalAmount * (1 + sur / 100));
                          const qMonthly = Math.round(qTotal / q);

                          return (
                            <button
                              key={q}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedInstallments(q);
                              }}
                              className={`p-2 rounded-xl text-center border transition-all ${
                                selectedInstallments === q
                                  ? 'bg-sky-600 text-white border-sky-600 font-bold shadow-xs'
                                  : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
                              }`}
                            >
                              <span className="text-[11px] font-mono block font-black">{q} cuotas</span>
                              <span className="text-[10px] font-mono block mt-0.5">
                                {formatCurrency(qMonthly)}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="p-2.5 bg-white border border-sky-200 rounded-xl text-xs space-y-0.5">
                        <div className="flex justify-between font-medium text-zinc-700">
                          <span>Plan elegido:</span>
                          <strong className="font-mono text-zinc-900">
                            {selectedInstallments} cuotas de {formatCurrency(Math.round(finalTotalARS / selectedInstallments))}
                          </strong>
                        </div>
                        <div className="flex justify-between text-[11px] text-zinc-500">
                          <span>Total financiado:</span>
                          <span className="font-mono font-bold text-zinc-900">{formatCurrency(finalTotalARS)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </label>

                {/* 3. Transferencia Dólares Billete */}
                <label
                  onClick={() => setPaymentMethod('transfer_usd')}
                  className={`p-3.5 rounded-xl border flex flex-col gap-2 cursor-pointer transition-all ${
                    paymentMethod === 'transfer_usd'
                      ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600'
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'transfer_usd'}
                        onChange={() => setPaymentMethod('transfer_usd')}
                        className="text-emerald-600 focus:ring-emerald-600"
                      />
                      <DollarSign className="w-4 h-4 text-emerald-700" />
                      <span className="text-xs font-heading font-bold text-zinc-950">
                        Transferencia Dólares (u$s)
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      Ref: ${usdRate}
                    </span>
                  </div>

                  {paymentMethod === 'transfer_usd' && (
                    <div className="mt-1 pt-2 border-t border-emerald-200 text-xs space-y-1">
                      <div className="flex justify-between font-mono">
                        <span>Total en Dólares:</span>
                        <strong className="text-emerald-900 text-base font-black">
                          u$s {totalUSD}
                        </strong>
                      </div>
                      <p className="text-[11px] text-zinc-500 leading-relaxed">
                        Cotización Banco Nación. Podés transferir u$s o pagar billete al retirar en el local.
                      </p>
                    </div>
                  )}
                </label>
              </div>

              {/* Botón Principal: Finalizar Compra */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white font-heading text-xs font-black uppercase tracking-wider py-4 rounded-xl shadow-lg transition-transform active:scale-[0.99] flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Procesando tu pedido...</span>
                ) : (
                  <>
                    <span>
                      {paymentMethod === 'mercadopago'
                        ? `Pagar con Mercado Pago • ${formatCurrency(finalTotalARS)}`
                        : paymentMethod === 'transfer_usd'
                        ? `Finalizar Compra • u$s ${totalUSD}`
                        : `Finalizar Compra • ${formatCurrency(finalTotalARS)}`}
                    </span>
                  </>
                )}
              </button>

              <div className="text-center">
                <span className="text-[11px] text-zinc-400 flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3 text-zinc-400" /> Transacción encriptada y protegida
                </span>
              </div>
            </div>
          </div>

        </form>
      </main>
    </div>
  );
}
