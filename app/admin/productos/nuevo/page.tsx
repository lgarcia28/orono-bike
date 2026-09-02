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
} from 'lucide-react';

interface VariantFormItem {
  id: string;
  size: string;
  wheel_size: string;
  color: string;
  color_hex: string;
  sku: string;
  barcode: string;
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
const PRESET_CATEGORIES = ['MTB', 'RUTA', 'GRAVEL', 'BMX', 'PASEO', 'NIÑOS', 'OTRA'];

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

  // Lista de Variantes
  const [variants, setVariants] = useState<VariantFormItem[]>([
    {
      id: '1',
      size: 'M',
      wheel_size: '29"',
      color: 'Negro Mate',
      color_hex: '#18181b',
      sku: 'ORN-BIKE-M-01',
      barcode: '779001122334',
      price: 2450000,
      compare_at_price: 2750000,
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
        price: 2450000,
        compare_at_price: 2750000,
        stock: 2,
      },
    ]);
  };

  const removeVariantRow = (id: string) => {
    if (variants.length <= 1) return;
    setVariants((prev) => prev.filter((v) => v.id !== id));
  };

  const updateVariantField = (id: string, field: keyof VariantFormItem, value: any) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  const handleSelectPresetColor = (variantId: string, name: string, hex: string) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === variantId ? { ...v, color: name, color_hex: hex } : v))
    );
  };

  const finalBrand = brandSelection === 'OTRA' ? (customBrand.trim() || 'PERSONALIZADA') : brandSelection;
  const finalCategory = categorySelection === 'OTRA' ? (customCategory.trim() || 'GENERAL') : categorySelection;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Por favor ingrese el título de la bicicleta.');
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
      }, 1500);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col font-sans text-zinc-900">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-10">
        {/* Breadcrumb & Title */}
        <div className="flex items-center justify-between border-b border-zinc-200 pb-6 mb-8">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs font-heading font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-950 mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Volver al Panel de Gestión
            </Link>
            <h1 className="text-3xl font-heading font-black text-zinc-950 tracking-tight flex items-center gap-3">
              <Bike className="w-8 h-8 text-zinc-950" /> Cargar Nueva Bicicleta al Catálogo
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Crea nuevos modelos con marcas y categorías personalizadas, fotos desde tu galería y selector visual de color.
            </p>
          </div>
        </div>

        {savedSuccess ? (
          <div className="bg-white border border-emerald-200 rounded-3xl p-12 text-center shadow-lg animate-fadeIn max-w-xl mx-auto">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-heading font-black text-zinc-950 mb-2">
              ¡Bicicleta Cargada y Publicada!
            </h2>
            <p className="text-xs text-zinc-600 mb-6">
              El producto ya se encuentra registrado con su marca, fotos, matriz de colores y stock físico.
            </p>
            <span className="inline-block text-xs font-heading font-bold text-zinc-500">
              Redirigiendo al panel de gestión...
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 1. Datos Generales & Foto */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-xs">
              <h2 className="font-heading font-black text-lg text-zinc-950 mb-6 flex items-center gap-2 border-b border-zinc-100 pb-3">
                <Layers className="w-5 h-5 text-zinc-950" /> 1. Información Principal del Modelo
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-heading font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Título / Nombre del Modelo *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Ej. Scott Spark RC World Cup EVO AXS"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-medium focus:bg-white focus:border-zinc-950 focus:outline-none"
                  />
                </div>

                {/* Selección y Creación de Marca */}
                <div>
                  <label className="block text-xs font-heading font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Marca del Fabricante *
                  </label>
                  <select
                    value={brandSelection}
                    onChange={(e) => setBrandSelection(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-heading font-bold uppercase focus:bg-white focus:border-zinc-950 focus:outline-none mb-2"
                  >
                    {PRESET_BRANDS.map((b) => (
                      <option key={b} value={b}>
                        {b === 'OTRA' ? '+ Crear / Escribir Otra Marca' : b}
                      </option>
                    ))}
                  </select>

                  {brandSelection === 'OTRA' && (
                    <div className="mt-2 animate-fadeIn">
                      <input
                        type="text"
                        required
                        placeholder="Escribe el nombre de la nueva marca..."
                        value={customBrand}
                        onChange={(e) => setCustomBrand(e.target.value)}
                        className="w-full px-4 py-2.5 bg-amber-50/50 border border-amber-300 rounded-xl text-xs font-heading font-bold uppercase focus:bg-white focus:border-zinc-950 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Selección y Creación de Categoría */}
                <div>
                  <label className="block text-xs font-heading font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Categoría de Ciclismo *
                  </label>
                  <select
                    value={categorySelection}
                    onChange={(e) => setCategorySelection(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-heading font-bold uppercase focus:bg-white focus:border-zinc-950 focus:outline-none mb-2"
                  >
                    {PRESET_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c === 'OTRA' ? '+ Crear / Escribir Otra Categoría' : c}
                      </option>
                    ))}
                  </select>

                  {categorySelection === 'OTRA' && (
                    <div className="mt-2 animate-fadeIn">
                      <input
                        type="text"
                        required
                        placeholder="Escribe la nueva categoría (Ej. E-BIKE, DOWNHILL)..."
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className="w-full px-4 py-2.5 bg-amber-50/50 border border-amber-300 rounded-xl text-xs font-heading font-bold uppercase focus:bg-white focus:border-zinc-950 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-heading font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Descripción Comercial
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe las virtudes del modelo, tipo de uso, tecnologías y sensaciones de pedaleo..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-medium focus:bg-white focus:border-zinc-950 focus:outline-none"
                />
              </div>

              {/* Subir Foto desde Galería / Dispositivo */}
              <div className="border-t border-zinc-100 pt-6">
                <label className="block text-xs font-heading font-bold uppercase tracking-wider text-zinc-700 mb-2">
                  Fotografía Principal del Producto
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                  {/* Área de Dropzone / Botón de Galería */}
                  <div className="sm:col-span-7">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-zinc-300 hover:border-zinc-950 bg-zinc-50 hover:bg-zinc-100/80 rounded-2xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2"
                    >
                      <div className="p-3 bg-white rounded-full shadow-xs border border-zinc-200 text-zinc-700">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div className="text-xs font-heading font-bold text-zinc-800">
                        Haz clic aquí para seleccionar foto de tu galería
                      </div>
                      <span className="text-[11px] text-zinc-400">
                        Formatos JPG, PNG, WEBP de alta resolución
                      </span>
                    </div>

                    <div className="mt-3">
                      <span className="text-[10px] text-zinc-400 font-heading font-bold uppercase block mb-1">
                        O pega un enlace de imagen externo:
                      </span>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/photo-..."
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-medium focus:bg-white focus:border-zinc-950 focus:outline-none"
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

            {/* 2. Ficha Técnica y Componentes */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-xs">
              <h2 className="font-heading font-black text-lg text-zinc-950 mb-6 flex items-center gap-2 border-b border-zinc-100 pb-3">
                <Wrench className="w-5 h-5 text-zinc-950" /> 2. Ficha Técnica & Especificaciones
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-zinc-600 mb-1">
                    Cuadro
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Carbono Monocoque HMX Boost"
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
                    placeholder="Ej. RockShox SID Ultimate 120mm"
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
                    placeholder="Ej. Shimano MT200 hidráulico"
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
                    placeholder="Ej. Doble Pared 29x2.35 Tubeless Ready"
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
                    placeholder="Ej. 11.2 kg"
                    value={specs.peso}
                    onChange={(e) => setSpecs({ ...specs, peso: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-medium focus:bg-white focus:border-zinc-950 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 3. Matriz de Variantes con Paleta de Colores Interactiva */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-zinc-100 pb-4 mb-6">
                <div>
                  <h2 className="font-heading font-black text-lg text-zinc-950 flex items-center gap-2">
                    <Barcode className="w-5 h-5 text-zinc-950" /> 3. Matriz de Variantes, Paleta de Colores & Stock
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Selecciona el color exacto con la paleta interactiva, talle, precio y código de barras.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addVariantRow}
                  className="bg-zinc-950 text-white px-4 py-2.5 rounded-xl text-xs font-heading font-bold uppercase tracking-wider hover:bg-zinc-800 flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar Variante
                </button>
              </div>

              <div className="space-y-6">
                {variants.map((v) => (
                  <div
                    key={v.id}
                    className="p-5 bg-zinc-50/90 border border-zinc-200 rounded-2xl space-y-4"
                  >
                    {/* Campos de Talle, Rodado, Precio y Stock */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-heading font-bold uppercase text-zinc-500 mb-1">
                          Talle
                        </label>
                        <input
                          type="text"
                          value={v.size}
                          onChange={(e) => updateVariantField(v.id, 'size', e.target.value)}
                          placeholder="S, M, L, XL, 52..."
                          className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-bold"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-heading font-bold uppercase text-zinc-500 mb-1">
                          Rodado
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
                          Precio ($ ARS)
                        </label>
                        <input
                          type="number"
                          value={v.price}
                          onChange={(e) => updateVariantField(v.id, 'price', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-bold font-mono"
                        />
                      </div>

                      <div className="sm:col-span-2">
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

                      <div className="sm:col-span-2">
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

                      <div className="sm:col-span-1 flex justify-center pb-1">
                        <button
                          type="button"
                          disabled={variants.length <= 1}
                          onClick={() => removeVariantRow(v.id)}
                          className="p-2 text-zinc-400 hover:text-rose-600 disabled:opacity-20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Paleta de Colores Interactiva de la Variante */}
                    <div className="bg-white p-4 rounded-xl border border-zinc-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <Palette className="w-4 h-4 text-zinc-700" />
                          <span className="text-xs font-heading font-bold uppercase text-zinc-800">
                            Color de la Bicicleta:
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
                ))}
              </div>
            </div>

            {/* Submit Bar */}
            <div className="flex justify-end gap-4 pt-4">
              <Link
                href="/admin"
                className="px-6 py-3.5 border border-zinc-300 rounded-xl font-heading text-xs font-bold uppercase tracking-wider text-zinc-700 hover:border-zinc-950 transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className="bg-zinc-950 hover:bg-zinc-800 text-white px-8 py-3.5 rounded-xl font-heading text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-2 transition-transform active:scale-98"
              >
                {isSaving ? 'Guardando...' : (
                  <>
                    <Save className="w-4 h-4" /> Guardar y Publicar Bicicleta
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
