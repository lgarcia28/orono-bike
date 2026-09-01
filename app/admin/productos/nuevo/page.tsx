'use client';

import React, { useState } from 'react';
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
  UploadCloud,
  Layers,
  Barcode,
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

export default function NuevoProductoPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Datos principales del producto
  const [formData, setFormData] = useState({
    title: '',
    brand: 'Specialized',
    category: 'MTB Cross Country',
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

  // Lista de Variantes (Talles, Colores, Stock)
  const [variants, setVariants] = useState<VariantFormItem[]>([
    {
      id: '1',
      size: 'M',
      wheel_size: '29"',
      color: 'Matte Black',
      color_hex: '#18181b',
      sku: 'ORN-BIKE-M-01',
      barcode: '779001122334',
      price: 6500000,
      compare_at_price: 7000000,
      stock: 3,
    },
  ]);

  const addVariantRow = () => {
    const nextId = (variants.length + 1).toString();
    setVariants((prev) => [
      ...prev,
      {
        id: nextId,
        size: 'L',
        wheel_size: '29"',
        color: 'Matte Black',
        color_hex: '#18181b',
        sku: `ORN-BIKE-L-0${nextId}`,
        barcode: `77900112233${nextId}`,
        price: 6500000,
        compare_at_price: 7000000,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Por favor ingrese el título de la bicicleta.');
      return;
    }

    setIsSaving(true);

    // Guardar temporalmente en localStorage para visualización instantánea en la sesión del navegador
    const newProduct = {
      id: `custom-${Date.now()}`,
      title: formData.title,
      slug: formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      brand: formData.brand,
      category: formData.category,
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

    // Guardar en array de productos en memoria del cliente
    try {
      const stored = JSON.parse(localStorage.getItem('orono_custom_bikes') || '[]');
      stored.unshift(newProduct);
      localStorage.setItem('orono_custom_bikes', JSON.stringify(stored));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }

    setTimeout(() => {
      setIsSaving(false);
      setSavedSuccess(true);
      setTimeout(() => {
        router.push('/#bicicletas');
      }, 1500);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-10">
        {/* Breadcrumb & Title */}
        <div className="flex items-center justify-between border-b border-zinc-200 pb-6 mb-8">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-heading font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-950 mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Volver a la Tienda
            </Link>
            <h1 className="text-3xl font-heading font-black text-zinc-950 tracking-tight flex items-center gap-3">
              <Bike className="w-8 h-8 text-zinc-950" /> Cargar Nueva Bicicleta
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Completa los datos del modelo, ficha técnica y define la matriz de talles, rodados y stock.
            </p>
          </div>
        </div>

        {savedSuccess ? (
          <div className="bg-white border border-emerald-200 rounded-3xl p-12 text-center shadow-lg animate-fadeIn max-w-xl mx-auto">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-heading font-black text-zinc-950 mb-2">
              ¡Bicicleta Cargada con Éxito!
            </h2>
            <p className="text-xs text-zinc-600 mb-6">
              El producto ya se encuentra registrado y disponible en el catálogo online y en la terminal POS de mostrador.
            </p>
            <span className="inline-block text-xs font-heading font-bold text-zinc-500">
              Redirigiendo al catálogo...
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 1. Datos Generales */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-xs">
              <h2 className="font-heading font-black text-lg text-zinc-950 mb-6 flex items-center gap-2 border-b border-zinc-100 pb-3">
                <Layers className="w-5 h-5 text-zinc-950" /> 1. Información Principal del Modelo
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-heading font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Título / Nombre del Modelo *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Ej. Specialized S-Works Epic World Cup AXS"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-medium focus:bg-white focus:border-zinc-950 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-heading font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Marca *
                  </label>
                  <select
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-medium focus:bg-white focus:border-zinc-950 focus:outline-none"
                  >
                    <option value="Specialized">Specialized</option>
                    <option value="Cannondale">Cannondale</option>
                    <option value="Trek">Trek</option>
                    <option value="Scott">Scott</option>
                    <option value="Cervélo">Cervélo</option>
                    <option value="Giant">Giant</option>
                    <option value="BMC">BMC</option>
                    <option value="Otra">Otra Marca</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-heading font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Categoría *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-medium focus:bg-white focus:border-zinc-950 focus:outline-none"
                  >
                    <option value="MTB Cross Country">MTB Cross Country</option>
                    <option value="Gravel & Bikepacking">Gravel & Bikepacking</option>
                    <option value="Ruta & Aero Competición">Ruta & Aero Competición</option>
                    <option value="E-Bikes & Gravel">E-Bikes & Gravel</option>
                    <option value="Urbana & Paseo">Urbana & Paseo</option>
                  </select>
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-xs font-heading font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Descripción Comercial
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe las características principales, uso recomendado y ventajas del modelo..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-medium focus:bg-white focus:border-zinc-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-heading font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  URL de Foto Principal (Unsplash / Supabase Storage / Web)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-medium focus:bg-white focus:border-zinc-950 focus:outline-none"
                />
              </div>
            </div>

            {/* 2. Ficha Técnica y Componentes */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-xs">
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
                    placeholder="Ej. S-Works FACT 12m Carbon"
                    value={specs.cuadro}
                    onChange={(e) => setSpecs({ ...specs, cuadro: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-medium focus:bg-white focus:border-zinc-950 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-zinc-600 mb-1">
                    Horquilla / Suspensión
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. RockShox SID SL Ultimate BRAIN 110mm"
                    value={specs.horquilla}
                    onChange={(e) => setSpecs({ ...specs, horquilla: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-medium focus:bg-white focus:border-zinc-950 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-zinc-600 mb-1">
                    Transmisión / Grupo
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. SRAM XX SL Eagle AXS 12v"
                    value={specs.transmision}
                    onChange={(e) => setSpecs({ ...specs, transmision: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-medium focus:bg-white focus:border-zinc-950 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-zinc-600 mb-1">
                    Frenos
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. SRAM Level Ultimate Stealth 4-piston"
                    value={specs.frenos}
                    onChange={(e) => setSpecs({ ...specs, frenos: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-medium focus:bg-white focus:border-zinc-950 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-zinc-600 mb-1">
                    Ruedas / Cubiertas
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Roval Control SL Carbon 29"
                    value={specs.ruedas}
                    onChange={(e) => setSpecs({ ...specs, ruedas: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-medium focus:bg-white focus:border-zinc-950 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-zinc-600 mb-1">
                    Peso Total Estimado
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 9.25 kg"
                    value={specs.peso}
                    onChange={(e) => setSpecs({ ...specs, peso: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-medium focus:bg-white focus:border-zinc-950 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 3. Matriz de Variantes & Stock */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-xs">
              <div className="flex justify-between items-center border-b border-zinc-100 pb-3 mb-6">
                <div>
                  <h2 className="font-heading font-black text-lg text-zinc-950 flex items-center gap-2">
                    <Barcode className="w-5 h-5 text-zinc-950" /> 3. Matriz de Variantes, Precios y Stock
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Define cada combinación de talle, color, precio y código de barras para el POS.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addVariantRow}
                  className="bg-zinc-950 text-white px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider hover:bg-zinc-800 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar Variante
                </button>
              </div>

              <div className="space-y-4">
                {variants.map((v, index) => (
                  <div
                    key={v.id}
                    className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                  >
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-heading font-bold uppercase text-zinc-500 mb-1">
                        Talle
                      </label>
                      <input
                        type="text"
                        value={v.size}
                        onChange={(e) => updateVariantField(v.id, 'size', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs font-bold"
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
                        className="w-full px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-heading font-bold uppercase text-zinc-500 mb-1">
                        Color
                      </label>
                      <input
                        type="text"
                        value={v.color}
                        onChange={(e) => updateVariantField(v.id, 'color', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-heading font-bold uppercase text-zinc-500 mb-1">
                        Precio ($ ARS)
                      </label>
                      <input
                        type="number"
                        value={v.price}
                        onChange={(e) => updateVariantField(v.id, 'price', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs font-bold font-mono"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-heading font-bold uppercase text-zinc-500 mb-1">
                        Stock
                      </label>
                      <input
                        type="number"
                        value={v.stock}
                        onChange={(e) => updateVariantField(v.id, 'stock', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs font-bold text-center"
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
                        className="w-full px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg text-[11px] font-mono"
                      />
                    </div>

                    <div className="sm:col-span-1 flex justify-center">
                      <button
                        type="button"
                        disabled={variants.length <= 1}
                        onClick={() => removeVariantRow(v.id)}
                        className="p-2 text-zinc-400 hover:text-rose-600 disabled:opacity-20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Bar */}
            <div className="flex justify-end gap-4 pt-4">
              <Link
                href="/"
                className="px-6 py-3.5 border border-zinc-300 rounded-xl font-heading text-xs font-bold uppercase tracking-wider text-zinc-700 hover:border-zinc-950"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className="bg-zinc-950 hover:bg-zinc-800 text-white px-8 py-3.5 rounded-xl font-heading text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-2"
              >
                {isSaving ? 'Guardando Bicicleta...' : (
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
