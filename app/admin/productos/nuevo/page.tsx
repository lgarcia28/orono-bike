'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/app/components/layout/Header';
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Bike,
  Wrench,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  Layers,
  Barcode,
  Palette,
  Sparkles,
  Calculator,
  Percent,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

interface VariantFormItem {
  id: string;
  size: string;
  wheel_size: string;
  color: string;
  color_hex: string;
  sku: string;
  barcode: string;
  cost: number;
  profit_margin_percent: number;
  price: number;
  compare_at_price: number;
  stock: number;
}

const PRESET_COLORS = [
  { name: 'Negro Mate', hex: '#18181b' },
  { name: 'Blanco Puro', hex: '#fafafa' },
  { name: 'Rojo Carmín', hex: '#b91c1c' },
  { name: 'Azul Eléctrico', hex: '#0284c7' },
  { name: 'Naranja Neón', hex: '#ea580c' },
  { name: 'Verde Bosque', hex: '#15803d' },
  { name: 'Gris Raw', hex: '#71717a' },
  { name: 'Dorado / Crema', hex: '#d97706' },
  { name: 'Turquesa', hex: '#06b6d4' },
  { name: 'Violeta / Púrpura', hex: '#7e22ce' },
];

const PRESET_BRANDS = ['SCOTT', 'VOLTA', 'RALEIGH', 'MOOVE', 'ZION', 'SARS', 'SHIMANO', 'OTRA'];
const PRESET_CATEGORIES = ['MTB', 'RUTA', 'GRAVEL', 'BMX', 'PASEO', 'NIÑOS', 'COMPONENTES', 'ACCESORIOS', 'OTRA'];

const MARGIN_PRESETS = [30, 40, 50, 70, 100];

export default function NuevoProductoPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Selector de Marca (con opción de crear nueva)
  const [brandSelection, setBrandSelection] = useState('SCOTT');
  const [customBrand, setCustomBrand] = useState('');

  // Selector de Categoría (con opción de crear nueva)
  const [categorySelection, setCategorySelection] = useState('MTB');
  const [customCategory, setCustomCategory] = useState('');

  // Datos principales del producto
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1200&q=80',
  });

  // Ficha técnica
  const [specs, setSpecs] = useState({
    cuadro: '',
    horquilla: '',
    transmision: '',
    frenos: '',
    ruedas: '',
    peso: '',
  });

  // Lista de Variantes con Costo, Margen de Ganancia % y Precio Calculado
  const [variants, setVariants] = useState<VariantFormItem[]>([
    {
      id: '1',
      size: 'M',
      wheel_size: '29"',
      color: 'Negro Mate',
      color_hex: '#18181b',
      sku: 'ORN-BIKE-M-01',
      barcode: '779001122334',
      cost: 1600000,
      profit_margin_percent: 50,
      price: 2400000, // 1.600.000 * 1.50
      compare_at_price: 2700000,
      stock: 3,
    },
  ]);

  // Manejador de subida de fotos desde la galería del dispositivo
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData((prev) => ({
            ...prev,
            imageUrl: event.target!.result as string,
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addVariantRow = () => {
    const nextId = (variants.length + 1).toString();
    const baseCost = variants[0]?.cost || 1600000;
    const baseMargin = variants[0]?.profit_margin_percent || 50;
    const calcPrice = Math.round(baseCost * (1 + baseMargin / 100));

    setVariants((prev) => [
      ...prev,
      {
        id: nextId,
        size: 'L',
        wheel_size: '29"',
        color: 'Negro Mate',
        color_hex: '#18181b',
        sku: `ORN-BIKE-L-0${nextId}`,
        barcode: `77900112233${nextId}`,
        cost: baseCost,
        profit_margin_percent: baseMargin,
        price: calcPrice,
        compare_at_price: Math.round(calcPrice * 1.15),
        stock: 2,
      },
    ]);
  };

  const removeVariantRow = (id: string) => {
    if (variants.length <= 1) return;
    setVariants((prev) => prev.filter((v) => v.id !== id));
  };

  // Actualizar campo general
  const updateVariantField = (id: string, field: keyof VariantFormItem, value: any) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  // Manejador del Costo: Recalcula Precio de Venta automáticamente
  const handleCostChange = (id: string, newCost: number) => {
    setVariants((prev) =>
      prev.map((v) => {
        if (v.id === id) {
          const validCost = Math.max(0, newCost);
          const calculatedPrice = Math.round(validCost * (1 + (v.profit_margin_percent || 0) / 100));
          return {
            ...v,
            cost: validCost,
            price: calculatedPrice,
          };
        }
        return v;
      })
    );
  };

  // Manejador del Margen %: Recalcula Precio de Venta automáticamente
  const handleMarginChange = (id: string, newMargin: number) => {
    setVariants((prev) =>
      prev.map((v) => {
        if (v.id === id) {
          const validMargin = Math.max(0, newMargin);
          const calculatedPrice = Math.round((v.cost || 0) * (1 + validMargin / 100));
          return {
            ...v,
            profit_margin_percent: validMargin,
            price: calculatedPrice,
          };
        }
        return v;
      })
    );
  };

  // Manejador de Precio de Venta manual: Recalcula Margen % automáticamente
  const handlePriceChange = (id: string, newPrice: number) => {
    setVariants((prev) =>
      prev.map((v) => {
        if (v.id === id) {
          const validPrice = Math.max(0, newPrice);
          let newMargin = v.profit_margin_percent;
          if (v.cost > 0) {
            newMargin = Math.round(((validPrice - v.cost) / v.cost) * 100);
          }
          return {
            ...v,
            price: validPrice,
            profit_margin_percent: newMargin,
          };
        }
        return v;
      })
    );
  };

  const handleSelectPresetColor = (variantId: string, name: string, hex: string) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === variantId ? { ...v, color: name, color_hex: hex } : v))
    );
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const finalBrand = brandSelection === 'OTRA' ? (customBrand.trim() || 'PERSONALIZADA') : brandSelection;
  const finalCategory = categorySelection === 'OTRA' ? (customCategory.trim() || 'GENERAL') : categorySelection;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Por favor ingrese el título del producto.');
      return;
    }

    setIsSaving(true);

    const newProduct = {
      id: `custom-${Date.now()}`,
      title: formData.title,
      slug: formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      brand: finalBrand.toUpperCase(),
      category: finalCategory.toUpperCase(),
      description: formData.description,
      specs: specs,
      images: [formData.imageUrl],
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      variants: variants.map((v) => ({
        ...v,
        product_id: `custom-${Date.now()}`,
        min_stock_alert: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })),
    };

    try {
      const stored = JSON.parse(localStorage.getItem('orono_custom_bikes') || '[]');
      stored.unshift(newProduct);
      localStorage.setItem('orono_custom_bikes', JSON.stringify(stored));
    } catch (err) {
      console.warn('LocalStorage error:', err);
    }

    setTimeout(() => {
      setIsSaving(false);
      setSavedSuccess(true);
      setTimeout(() => {
        router.push('/admin');
      }, 1200);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col font-sans text-zinc-900 pb-20">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 flex-1 w-full">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-heading font-black text-zinc-500 hover:text-zinc-950 uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al Panel de Gestión
          </Link>
          <div className="text-right">
            <span className="text-[10px] font-heading font-black uppercase text-zinc-400 block tracking-widest">
              Oroño Bike • Alta de Catálogo
            </span>
          </div>
        </div>

        {savedSuccess && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl flex items-center gap-3 animate-fadeIn shadow-sm">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <strong className="block text-sm font-heading font-black">
                ¡Producto y Variantes Creados con Éxito!
              </strong>
              <span className="text-xs">
                Guardado en el inventario con costo, margen y precio de venta calculados. Redirigiendo...
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Header del Formulario */}
          <div className="bg-zinc-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-[10px] font-heading font-black uppercase tracking-widest text-emerald-400 mb-1">
                <Sparkles className="w-3.5 h-3.5" /> Nuevo Artículo en Catálogo
              </div>
              <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight">
                Carga de Bicicleta, Componente o Accesorio
              </h1>
              <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
                Ingresa los datos generales, sube una foto desde tu galería, define el costo y margen de ganancia para calcular automáticamente el precio de venta.
              </p>
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-heading text-xs font-black uppercase tracking-wider px-6 py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 shrink-0"
            >
              <Save className="w-4 h-4" /> {isSaving ? 'Guardando...' : 'Publicar Artículo'}
            </button>
          </div>

          {/* 1. Información General del Producto */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <h2 className="font-heading font-black text-lg text-zinc-950 flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Bike className="w-5 h-5 text-zinc-950" /> 1. Información Principal
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-heading font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Título del Producto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Scott Aspect 950 Disc 18v / Grupo Shimano XT 12v / Casco Fox MIPS"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-2xl text-xs sm:text-sm font-medium focus:bg-white focus:border-zinc-950 focus:outline-none transition-all"
                />
              </div>

              {/* Selector de Marca */}
              <div>
                <label className="block text-xs font-heading font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Marca *
                </label>
                <select
                  value={brandSelection}
                  onChange={(e) => setBrandSelection(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-2xl text-xs font-heading font-bold uppercase focus:bg-white focus:border-zinc-950 focus:outline-none"
                >
                  {PRESET_BRANDS.map((b) => (
                    <option key={b} value={b}>
                      {b === 'OTRA' ? '+ Crear / Escribir Otra Marca' : b}
                    </option>
                  ))}
                </select>

                {brandSelection === 'OTRA' && (
                  <div className="mt-2.5 animate-fadeIn">
                    <input
                      type="text"
                      required
                      placeholder="Escribe el nombre de la nueva marca (Ej. Trek, Specialized, Cannondale, Maxxis)..."
                      value={customBrand}
                      onChange={(e) => setCustomBrand(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-emerald-50/60 border-2 border-emerald-500 rounded-xl text-xs font-bold text-zinc-900 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Selector de Categoría */}
              <div>
                <label className="block text-xs font-heading font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Categoría *
                </label>
                <select
                  value={categorySelection}
                  onChange={(e) => setCategorySelection(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-2xl text-xs font-heading font-bold uppercase focus:bg-white focus:border-zinc-950 focus:outline-none"
                >
                  {PRESET_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c === 'OTRA' ? '+ Crear / Escribir Otra Categoría' : c}
                    </option>
                  ))}
                </select>

                {categorySelection === 'OTRA' && (
                  <div className="mt-2.5 animate-fadeIn">
                    <input
                      type="text"
                      required
                      placeholder="Escribe la nueva categoría (Ej. E-BIKE, INDUMENTARIA, HERRAMIENTAS)..."
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-emerald-50/60 border-2 border-emerald-500 rounded-xl text-xs font-bold text-zinc-900 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-heading font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Descripción Comercial
                </label>
                <textarea
                  rows={3}
                  placeholder="Detalles sobre el uso, geometría, equipamiento, garantía y características destacadas..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-2xl text-xs font-medium focus:bg-white focus:border-zinc-950 focus:outline-none"
                />
              </div>

              {/* Subida de Imagen desde Galería del Dispositivo o URL */}
              <div className="sm:col-span-2 bg-zinc-50/80 p-5 rounded-2xl border border-zinc-200">
                <label className="block text-xs font-heading font-bold uppercase tracking-wider text-zinc-700 mb-2">
                  Fotografía de Portada del Producto
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  <div className="sm:col-span-7 space-y-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full bg-white hover:bg-zinc-100 border-2 border-dashed border-zinc-300 hover:border-zinc-950 p-4 rounded-2xl flex items-center justify-center gap-2 text-xs font-heading font-bold uppercase tracking-wider text-zinc-800 transition-all shadow-xs"
                    >
                      <Upload className="w-4 h-4 text-zinc-700" /> Subir Foto de la Galería del Dispositivo
                    </button>

                    <div className="relative">
                      <span className="text-[10px] font-heading font-bold text-zinc-400 uppercase block mb-1">
                        O pegar URL directa de la imagen:
                      </span>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        className="w-full px-3.5 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-mono text-zinc-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Vista Previa de la Foto */}
                  <div className="sm:col-span-5 flex flex-col items-center justify-center">
                    <div className="w-full aspect-16/10 rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200 shadow-inner relative flex items-center justify-center">
                      {formData.imageUrl ? (
                        <img
                          src={formData.imageUrl}
                          alt="Vista previa"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-10 h-10 text-zinc-300" />
                      )}
                    </div>
                    <span className="text-[10px] font-heading font-bold text-zinc-400 mt-1.5 uppercase">
                      Vista previa de portada
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Ficha Técnica y Componentes */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="font-heading font-black text-lg text-zinc-950 mb-6 flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Wrench className="w-5 h-5 text-zinc-950" /> 2. Ficha Técnica & Especificaciones
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Cuadro / Estructura
                </label>
                <input
                  type="text"
                  placeholder="Ej. Carbono Monocoque HMX Boost / Aluminio 6061"
                  value={specs.cuadro}
                  onChange={(e) => setSpecs({ ...specs, cuadro: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-medium focus:bg-white focus:border-zinc-950 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Horquilla / Suspensión
                </label>
                <input
                  type="text"
                  placeholder="Ej. RockShox SID Ultimate 120mm / Rígida"
                  value={specs.horquilla}
                  onChange={(e) => setSpecs({ ...specs, horquilla: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-medium focus:bg-white focus:border-zinc-950 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Transmisión / Grupo
                </label>
                <input
                  type="text"
                  placeholder="Ej. Shimano Deore 1x12v / SRAM AXS"
                  value={specs.transmision}
                  onChange={(e) => setSpecs({ ...specs, transmision: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-medium focus:bg-white focus:border-zinc-950 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Frenos
                </label>
                <input
                  type="text"
                  placeholder="Ej. Shimano SLX M7100 hidráulico"
                  value={specs.frenos}
                  onChange={(e) => setSpecs({ ...specs, frenos: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-medium focus:bg-white focus:border-zinc-950 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Ruedas / Cubiertas
                </label>
                <input
                  type="text"
                  placeholder="Ej. Maxxis Ikon 29x2.20 Tubeless Ready"
                  value={specs.ruedas}
                  onChange={(e) => setSpecs({ ...specs, ruedas: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-medium focus:bg-white focus:border-zinc-950 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Peso Total Estimado
                </label>
                <input
                  type="text"
                  placeholder="Ej. 11.2 kg / 380 gr"
                  value={specs.peso}
                  onChange={(e) => setSpecs({ ...specs, peso: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-medium focus:bg-white focus:border-zinc-950 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 3. Variantes con Calculadora Automática de Costo & Margen de Ganancia */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3 mb-6">
              <div>
                <h2 className="font-heading font-black text-lg text-zinc-950 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-zinc-950" /> 3. Variantes, Costos y Precios de Venta
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Carga el <strong>Costo</strong> y el <strong>Margen de Ganancia (%)</strong> para calcular automáticamente el precio de venta final.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {variants.map((v, idx) => {
                const profitAmount = (v.price || 0) - (v.cost || 0);
                return (
                  <div
                    key={v.id}
                    className="p-5 sm:p-6 bg-zinc-50/90 border border-zinc-200 rounded-2xl space-y-4 relative"
                  >
                    {/* Header de la Variante */}
                    <div className="flex justify-between items-center">
                      <span className="font-heading font-black text-xs uppercase tracking-wider text-zinc-800 bg-white border border-zinc-200 px-3 py-1 rounded-lg">
                        Variante #{idx + 1}
                      </span>
                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariantRow(v.id)}
                          className="text-rose-600 hover:text-rose-700 font-heading font-bold text-xs uppercase flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Borrar Variante
                        </button>
                      )}
                    </div>

                    {/* Talle, Medida, Stock y SKU */}
                    <div className="grid grid-cols-2 sm:grid-cols-12 gap-3.5">
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-heading font-bold uppercase text-zinc-500 mb-1">
                          Talle / Tamaño
                        </label>
                        <input
                          type="text"
                          value={v.size}
                          onChange={(e) => updateVariantField(v.id, 'size', e.target.value)}
                          placeholder="S, M, L, XL, 29x2.20..."
                          className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-bold"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-heading font-bold uppercase text-zinc-500 mb-1">
                          Rodado / Medida
                        </label>
                        <input
                          type="text"
                          value={v.wheel_size}
                          onChange={(e) => updateVariantField(v.id, 'wheel_size', e.target.value)}
                          placeholder="29, 700c, 20..."
                          className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-heading font-bold uppercase text-zinc-500 mb-1">
                          Stock Físico
                        </label>
                        <input
                          type="number"
                          value={v.stock}
                          onChange={(e) => updateVariantField(v.id, 'stock', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-bold text-center"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-heading font-bold uppercase text-zinc-500 mb-1">
                          Código de Barras / SKU
                        </label>
                        <input
                          type="text"
                          value={v.barcode}
                          onChange={(e) => updateVariantField(v.id, 'barcode', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-[11px] font-mono"
                        />
                      </div>
                    </div>

                    {/* BLOQUE DE CÁLCULO DE COSTO, MARGEN % Y PRECIO DE VENTA */}
                    <div className="bg-emerald-50/70 p-4 sm:p-5 rounded-2xl border-2 border-emerald-200/80 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-heading font-black uppercase text-emerald-900">
                        <Calculator className="w-4 h-4 text-emerald-700" />
                        <span>Fórmula Automática de Costo & Margen</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
                        {/* 1. Costo del Producto */}
                        <div className="sm:col-span-4">
                          <label className="block text-[10px] font-heading font-black uppercase text-zinc-700 mb-1">
                            Costo de Compra ($ ARS) *
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-zinc-500 text-xs">$</span>
                            <input
                              type="number"
                              required
                              value={v.cost || ''}
                              onChange={(e) => handleCostChange(v.id, Number(e.target.value))}
                              placeholder="0"
                              className="w-full pl-7 pr-3 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm font-mono font-bold text-zinc-900 focus:outline-none focus:border-zinc-950 shadow-xs"
                            />
                          </div>
                        </div>

                        {/* 2. Margen de Ganancia (%) */}
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-heading font-black uppercase text-zinc-700 mb-1">
                            Margen de Ganancia (%) *
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              required
                              value={v.profit_margin_percent || ''}
                              onChange={(e) => handleMarginChange(v.id, Number(e.target.value))}
                              placeholder="50"
                              className="w-full pl-3 pr-7 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm font-mono font-bold text-zinc-900 focus:outline-none focus:border-zinc-950 shadow-xs"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-heading font-bold text-zinc-500 text-xs">%</span>
                          </div>
                        </div>

                        {/* 3. Precio de Venta Calculado Automáticamente */}
                        <div className="sm:col-span-5">
                          <label className="block text-[10px] font-heading font-black uppercase text-emerald-950 mb-1 flex items-center justify-between">
                            <span>Precio de Venta Calculado ($ ARS)</span>
                            <span className="text-[9px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">
                              Auto-calculado
                            </span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-zinc-500 text-xs">$</span>
                            <input
                              type="number"
                              required
                              value={v.price || ''}
                              onChange={(e) => handlePriceChange(v.id, Number(e.target.value))}
                              className="w-full pl-7 pr-3 py-2.5 bg-white border-2 border-emerald-500 rounded-xl text-base font-mono font-black text-zinc-950 focus:outline-none focus:border-emerald-700 shadow-sm"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Presets Rápidos de Margen & Ganancia Neta */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-200/60 text-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-heading font-bold uppercase text-zinc-600">
                            Margen Rápido:
                          </span>
                          {MARGIN_PRESETS.map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => handleMarginChange(v.id, m)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-heading font-black transition-all ${
                                v.profit_margin_percent === m
                                  ? 'bg-zinc-950 text-white shadow-xs'
                                  : 'bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100'
                              }`}
                            >
                              +{m}%
                            </button>
                          ))}
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] font-heading font-black text-emerald-800">
                            Ganancia Neta: <strong className="font-mono">{formatCurrency(profitAmount)}</strong> / unidad
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Paleta de Colores Interactiva de la Variante */}
                    <div className="bg-white p-4 rounded-xl border border-zinc-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <Palette className="w-4 h-4 text-zinc-700" />
                          <span className="text-xs font-heading font-bold uppercase text-zinc-800">
                            Color del Producto:
                          </span>
                          <input
                            type="text"
                            value={v.color}
                            onChange={(e) => updateVariantField(v.id, 'color', e.target.value)}
                            placeholder="Nombre del color (Ej. Negro Mate)"
                            className="px-2.5 py-1 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-bold"
                          />
                        </div>

                        {/* Color Picker HTML5 */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-zinc-400 font-mono">{v.color_hex}</span>
                          <input
                            type="color"
                            value={v.color_hex}
                            onChange={(e) => updateVariantField(v.id, 'color_hex', e.target.value)}
                            className="w-8 h-8 rounded-lg cursor-pointer border border-zinc-300 p-0.5"
                            title="Elegir cualquier color personalizado"
                          />
                        </div>
                      </div>

                      {/* Botones de Colores Rápidos */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-100">
                        <span className="text-[10px] font-heading font-bold uppercase text-zinc-400 mr-1">
                          Tonos Frecuentes:
                        </span>
                        {PRESET_COLORS.map((preset) => (
                          <button
                            key={preset.hex}
                            type="button"
                            onClick={() => handleSelectPresetColor(v.id, preset.name, preset.hex)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-heading font-bold transition-all border ${
                              v.color_hex === preset.hex
                                ? 'border-zinc-950 bg-zinc-100 text-zinc-950 ring-1 ring-zinc-950'
                                : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400'
                            }`}
                          >
                            <span
                              className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                              style={{ backgroundColor: preset.hex }}
                            />
                            <span>{preset.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Botón "+ Agregar Variante" */}
            <div className="mt-6">
              <button
                type="button"
                onClick={addVariantRow}
                className="w-full py-4 border-2 border-dashed border-zinc-300 hover:border-zinc-950 bg-zinc-50 hover:bg-zinc-100/80 rounded-2xl flex items-center justify-center gap-2 text-xs font-heading font-black uppercase tracking-wider text-zinc-900 transition-all shadow-xs active:scale-99"
              >
                <Plus className="w-4 h-4 text-zinc-950" /> + Agregar Otra Variante (Talle / Color)
              </button>
            </div>
          </div>

          {/* Botón Guardar Inferior */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white font-heading text-xs font-black uppercase tracking-wider px-8 py-4 rounded-2xl flex items-center gap-2 shadow-xl transition-transform active:scale-95"
            >
              <Save className="w-4 h-4" /> {isSaving ? 'Guardando...' : 'Publicar Artículo en Catálogo'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
