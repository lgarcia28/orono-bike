'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ProductWithVariants, ProductVariant } from '@/lib/supabase/types';
import { ALL_PRODUCTS_CATALOG } from '@/lib/data/bikes';
import { ProductCard } from '@/app/components/catalog/ProductCard';
import { ModernProductDetail } from '@/app/components/catalog/ModernProductDetail';
import { Search, SlidersHorizontal, Bike, Wrench, Package, Sparkles, Filter, X, ChevronDown, Check, RotateCcw } from 'lucide-react';

interface CatalogSectionProps {
  products?: ProductWithVariants[];
  onAddToCart: (variant: ProductVariant, quantity: number) => void;
}

export type MainSectionType = 'TODOS' | 'BICICLETAS' | 'COMPONENTES' | 'ACCESORIOS';

const BIKE_SUBCATEGORIES = ['Todas', 'MTB', 'RUTA', 'GRAVEL', 'BMX', 'PASEO', 'NIÑOS'];
const BRANDS = ['Todas', 'SCOTT', 'VOLTA', 'RALEIGH', 'SARS', 'ZION', 'SHIMANO'];

export function CatalogSection({ products = ALL_PRODUCTS_CATALOG, onAddToCart }: CatalogSectionProps) {
  const [mainSection, setMainSection] = useState<MainSectionType>('TODOS');
  const [selectedBikeCategory, setSelectedBikeCategory] = useState<string>('Todas');
  const [selectedBrand, setSelectedBrand] = useState<string>('Todas');
  const [selectedSize, setSelectedSize] = useState<string>('Todos');
  const [selectedWheelSize, setSelectedWheelSize] = useState<string>('Todos');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 15000000]);
  const [sortBy, setSortBy] = useState<'relevancia' | 'precio_menor' | 'precio_mayor' | 'marca'>('relevancia');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeProduct, setActiveProduct] = useState<ProductWithVariants | null>(null);
  const [customBikes, setCustomBikes] = useState<ProductWithVariants[]>([]);

  // Sincronizar reactivamente con el hash de la URL (#bicicletas, #componentes, #accesorios, #catalogo)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('componente')) {
        setMainSection('COMPONENTES');
        setSelectedBrand('Todas');
      } else if (hash.includes('accesorio')) {
        setMainSection('ACCESORIOS');
        setSelectedBrand('Todas');
      } else if (hash.includes('bici')) {
        setMainSection('BICICLETAS');
        setSelectedBrand('Todas');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);

    const handleCustomEvent = (e: any) => {
      if (e.detail) {
        setMainSection(e.detail);
        setSelectedBrand('Todas');
        setSelectedBikeCategory('Todas');
      }
    };
    window.addEventListener('changeCatalogSection', handleCustomEvent);

    return () => {
      window.removeEventListener('hashchange', handleHash);
      window.removeEventListener('changeCatalogSection', handleCustomEvent);
    };
  }, []);

  // Cargar productos personalizados guardados por el dueño
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('orono_custom_bikes') || '[]');
      if (Array.isArray(stored)) {
        setCustomBikes(stored);
      }
    } catch (e) {
      console.warn('Error reading stored bikes:', e);
    }
  }, []);

  const allProducts = useMemo(() => {
    return [...customBikes, ...products];
  }, [customBikes, products]);

  // Extraer listas dinámicas para filtros
  const availableSizes = useMemo(() => {
    const set = new Set<string>();
    allProducts.forEach((p) => p.variants.forEach((v) => { if (v.size) set.add(v.size.toUpperCase()); }));
    return ['Todos', ...Array.from(set).sort()];
  }, [allProducts]);

  const availableWheelSizes = useMemo(() => {
    const set = new Set<string>();
    allProducts.forEach((p) => p.variants.forEach((v) => { if (v.wheel_size) set.add(v.wheel_size); }));
    return ['Todos', ...Array.from(set).sort()];
  }, [allProducts]);

  // Contar filtros activos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedBrand !== 'Todas') count++;
    if (selectedBikeCategory !== 'Todas') count++;
    if (selectedSize !== 'Todos') count++;
    if (selectedWheelSize !== 'Todos') count++;
    if (priceRange[0] > 0 || priceRange[1] < 15000000) count++;
    return count;
  }, [selectedBrand, selectedBikeCategory, selectedSize, selectedWheelSize, priceRange]);

  const handleResetFilters = () => {
    setSelectedBrand('Todas');
    setSelectedBikeCategory('Todas');
    setSelectedSize('Todos');
    setSelectedWheelSize('Todos');
    setPriceRange([0, 15000000]);
    setSortBy('relevancia');
    setSearchQuery('');
  };

  // Filtrado reactivo 100% estricto por Sección Principal
  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) => {
      const cat = (p.category || '').toUpperCase().trim();
      const isComponent = cat === 'COMPONENTES';
      const isAccessory = cat === 'ACCESORIOS';
      const isBike = !isComponent && !isAccessory;

      // 1. FILTRADO ESTRICTO DE SECCIÓN
      if (mainSection === 'BICICLETAS') {
        if (!isBike) return false; // Solo bicicletas
      } else if (mainSection === 'COMPONENTES') {
        if (!isComponent) return false; // Solo componentes (NO bicis, NO accesorios)
      } else if (mainSection === 'ACCESORIOS') {
        if (!isAccessory) return false; // Solo accesorios (NO bicis, NO componentes)
      }

      // 2. FILTRADO POR SUBCATEGORÍA DE BICI
      if (isBike && selectedBikeCategory !== 'Todas') {
        if (cat !== selectedBikeCategory.toUpperCase()) return false;
      }

      // 3. FILTRADO POR MARCA
      if (selectedBrand !== 'Todas') {
        if ((p.brand || '').toUpperCase().trim() !== selectedBrand.toUpperCase().trim()) return false;
      }

      // 4. FILTRADO POR TALLE
      if (selectedSize !== 'Todos') {
        const hasSize = p.variants.some((v) => (v.size || '').toUpperCase() === selectedSize);
        if (!hasSize) return false;
      }

      // 5. FILTRADO POR RODADO
      if (selectedWheelSize !== 'Todos') {
        const hasWheel = p.variants.some((v) => (v.wheel_size || '') === selectedWheelSize);
        if (!hasWheel) return false;
      }

      // 6. FILTRADO POR PRECIO
      const minP = Math.min(...p.variants.map((v) => v.price));
      if (minP < priceRange[0] || minP > priceRange[1]) {
        return false;
      }

      // 7. BUSCADOR PREDICTIVO
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchTitle = (p.title || '').toLowerCase().includes(q);
        const matchB = (p.brand || '').toLowerCase().includes(q);
        const matchCat = (p.category || '').toLowerCase().includes(q);
        const matchSku = p.variants?.some((v) => (v.sku || '').toLowerCase().includes(q));
        if (!matchTitle && !matchB && !matchCat && !matchSku) return false;
      }

      return true;
    }).sort((a, b) => {
      // Ordenamiento por precio si el usuario lo seleccionó
      if (sortBy === 'precio_menor') {
        const minA = Math.min(...a.variants.map((v) => v.price));
        const minB = Math.min(...b.variants.map((v) => v.price));
        return minA - minB;
      }
      if (sortBy === 'precio_mayor') {
        const minA = Math.min(...a.variants.map((v) => v.price));
        const minB = Math.min(...b.variants.map((v) => v.price));
        return minB - minA;
      }
      if (sortBy === 'marca') {
        return a.brand.localeCompare(b.brand);
      }

      // Default / Relevancia: Prioridad a destacados (is_featured) o orden asignado por el dueño (featured_order)
      const aFeatured = a.is_featured ? 1 : 0;
      const bFeatured = b.is_featured ? 1 : 0;
      if (aFeatured !== bFeatured) return bFeatured - aFeatured;

      const aOrder = a.featured_order ?? 999;
      const bOrder = b.featured_order ?? 999;
      return aOrder - bOrder;
    });
  }, [allProducts, mainSection, selectedBikeCategory, selectedBrand, selectedSize, selectedWheelSize, priceRange, sortBy, searchQuery]);

  const handleSwitchSection = (section: MainSectionType) => {
    setMainSection(section);
    setSelectedBrand('Todas');
    setSelectedBikeCategory('Todas');
    setSearchQuery('');
  };

  if (activeProduct) {
    return (
      <div className="animate-fadeIn">
        <ModernProductDetail
          product={activeProduct}
          onBack={() => setActiveProduct(null)}
          onAddToCart={onAddToCart}
        />
      </div>
    );
  }

  return (
    <section id="catalogo" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 scroll-mt-20">
      {/* Invisible Anchor Targets for Smooth Scrolling */}
      <div id="bicicletas" className="scroll-mt-24" />
      <div id="componentes" className="scroll-mt-24" />
      <div id="accesorios" className="scroll-mt-24" />

      {/* Section Header Simplificado y Elegante */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-200/80 pb-6 mb-8">
        <div>
          <h2 className="text-3xl sm:text-4xl font-heading font-black text-zinc-950 tracking-tight">
            {mainSection === 'BICICLETAS'
              ? 'Bicicletas'
              : mainSection === 'COMPONENTES'
              ? 'Componentes'
              : mainSection === 'ACCESORIOS'
              ? 'Accesorios'
              : 'Catálogo'}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-xl leading-relaxed">
            {mainSection === 'BICICLETAS'
              ? 'Modelos oficiales de Scott, Volta, Raleigh, Sars y Zion con armado profesional.'
              : mainSection === 'COMPONENTES'
              ? 'Repuestos y transmisiones originales Shimano con instalación disponible en taller.'
              : mainSection === 'ACCESORIOS'
              ? 'Cascos, infladores y equipamiento esencial para tu salida.'
              : 'Bicicletas de competición, componentes oficiales y accesorios seleccionados.'}
          </p>
        </div>

        {/* Search Bar Minimalista y Botón Filtrar */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar producto, marca o modelo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 focus:bg-white focus:border-zinc-950 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsFilterDrawerOpen(true)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all shrink-0 border ${
              activeFiltersCount > 0
                ? 'bg-zinc-950 text-white border-zinc-950 shadow-sm'
                : 'bg-white text-zinc-800 border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50'
            }`}
          >
            <Filter className={`w-3.5 h-3.5 ${activeFiltersCount > 0 ? 'text-emerald-400' : 'text-zinc-500'}`} />
            <span>Filtrar</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-zinc-950 text-[10px] font-black flex items-center justify-center ml-0.5">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tabs de Secciones Principales: TODOS, BICICLETAS, COMPONENTES, ACCESORIOS */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => handleSwitchSection('TODOS')}
          className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all ${
            mainSection === 'TODOS'
              ? 'bg-zinc-950 text-white shadow-xs'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950'
          }`}
        >
          Todo ({allProducts.length})
        </button>
        <button
          type="button"
          onClick={() => handleSwitchSection('BICICLETAS')}
          className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
            mainSection === 'BICICLETAS'
              ? 'bg-zinc-950 text-white shadow-xs'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950'
          }`}
        >
          <Bike className="w-3.5 h-3.5" /> Bicicletas
        </button>
        <button
          type="button"
          onClick={() => handleSwitchSection('COMPONENTES')}
          className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
            mainSection === 'COMPONENTES'
              ? 'bg-zinc-950 text-white shadow-xs'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" /> Componentes
        </button>
        <button
          type="button"
          onClick={() => handleSwitchSection('ACCESORIOS')}
          className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
            mainSection === 'ACCESORIOS'
              ? 'bg-zinc-950 text-white shadow-xs'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950'
          }`}
        >
          <Package className="w-3.5 h-3.5" /> Accesorios
        </button>
      </div>

      {/* Subcategorías de Bicicletas (Solo cuando estamos en Bicicletas o Todos) */}
      {(mainSection === 'BICICLETAS' || mainSection === 'TODOS') && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-2 scrollbar-none">
          <span className="text-[11px] font-heading font-bold uppercase tracking-wider text-zinc-400 mr-1.5 shrink-0">
            Categoría:
          </span>
          {BIKE_SUBCATEGORIES.map((cat) => {
            const isSelected = selectedBikeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedBikeCategory(cat)}
                className={`whitespace-nowrap px-3 py-1 rounded-lg text-xs transition-all ${
                  isSelected
                    ? 'bg-zinc-950 text-white font-bold'
                    : 'bg-zinc-50 text-zinc-600 border border-zinc-200 hover:border-zinc-400 hover:text-zinc-950'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {/* Brand Selector Quick Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-3 mb-4 scrollbar-none">
        <span className="text-zinc-400 font-heading font-bold text-[11px] uppercase tracking-wider mr-1.5 flex items-center gap-1 shrink-0">
          <SlidersHorizontal className="w-3 h-3" /> Marca:
        </span>
        {BRANDS.map((brand) => {
          const isSelected = selectedBrand === brand;
          return (
            <button
              key={brand}
              type="button"
              onClick={() => setSelectedBrand(brand)}
              className={`shrink-0 px-3 py-1 rounded-lg text-xs transition-all border ${
                isSelected
                  ? 'border-zinc-950 bg-zinc-950 text-white font-bold'
                  : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400'
              }`}
            >
              {brand}
            </button>
          );
        })}
      </div>

      {/* Active Filter Tags Bar (si hay filtros aplicados) */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-zinc-50 border border-zinc-200/80 rounded-2xl mb-8">
          <span className="text-xs font-semibold text-zinc-500 mr-1">Filtros aplicados:</span>
          {selectedBrand !== 'Todas' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-zinc-200 text-zinc-900 rounded-lg text-xs font-medium">
              Marca: <b>{selectedBrand}</b>
              <button type="button" onClick={() => setSelectedBrand('Todas')} className="hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedBikeCategory !== 'Todas' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-zinc-200 text-zinc-900 rounded-lg text-xs font-medium">
              Categoría: <b>{selectedBikeCategory}</b>
              <button type="button" onClick={() => setSelectedBikeCategory('Todas')} className="hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedSize !== 'Todos' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-zinc-200 text-zinc-900 rounded-lg text-xs font-medium">
              Talle: <b>{selectedSize}</b>
              <button type="button" onClick={() => setSelectedSize('Todos')} className="hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedWheelSize !== 'Todos' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-zinc-200 text-zinc-900 rounded-lg text-xs font-medium">
              Rodado: <b>{selectedWheelSize}</b>
              <button type="button" onClick={() => setSelectedWheelSize('Todos')} className="hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {(priceRange[0] > 0 || priceRange[1] < 15000000) && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-zinc-200 text-zinc-900 rounded-lg text-xs font-medium">
              Precio: <b>${priceRange[0].toLocaleString()} - ${priceRange[1].toLocaleString()}</b>
              <button type="button" onClick={() => setPriceRange([0, 15000000])} className="hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {sortBy !== 'relevancia' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-zinc-200 text-zinc-900 rounded-lg text-xs font-medium">
              Orden: <b>{sortBy === 'precio_menor' ? 'Menor precio' : sortBy === 'precio_mayor' ? 'Mayor precio' : 'Marca'}</b>
              <button type="button" onClick={() => setSortBy('relevancia')} className="hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={handleResetFilters}
            className="ml-auto text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 px-2 py-1"
          >
            <RotateCcw className="w-3 h-3" /> Limpiar todo
          </button>
        </div>
      )}

      {/* Drawer / Modal de Filtros Avanzado */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fadeIn"
            onClick={() => setIsFilterDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <aside className="relative w-full max-w-md bg-white h-full shadow-2xl z-10 flex flex-col overflow-hidden animate-slideLeft">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200">
              <div className="flex items-center gap-2.5">
                <Filter className="w-5 h-5 text-zinc-900" />
                <h3 className="font-heading font-black text-lg text-zinc-950 uppercase tracking-wide">
                  Filtros del Catálogo
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Filters Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7">
              {/* Ordenar por */}
              <div>
                <label className="block text-xs font-heading font-bold uppercase tracking-wider text-zinc-500 mb-2.5">
                  Ordenar por
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'relevancia', label: 'Destacados' },
                    { id: 'precio_menor', label: 'Menor precio' },
                    { id: 'precio_mayor', label: 'Mayor precio' },
                    { id: 'marca', label: 'Marca (A-Z)' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSortBy(opt.id as any)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                        sortBy === opt.id
                          ? 'border-zinc-950 bg-zinc-950 text-white font-bold'
                          : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Marca */}
              <div>
                <label className="block text-xs font-heading font-bold uppercase tracking-wider text-zinc-500 mb-2.5">
                  Marca
                </label>
                <div className="flex flex-wrap gap-2">
                  {BRANDS.map((brand) => (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => setSelectedBrand(brand)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        selectedBrand === brand
                          ? 'border-zinc-950 bg-zinc-950 text-white font-bold shadow-xs'
                          : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400'
                      }`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>

              {/* Talle */}
              {availableSizes.length > 1 && (
                <div>
                  <label className="block text-xs font-heading font-bold uppercase tracking-wider text-zinc-500 mb-2.5">
                    Talle de Cuadro
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-10 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                          selectedSize === size
                            ? 'border-zinc-950 bg-zinc-950 text-white font-bold shadow-xs'
                            : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Rodado */}
              {availableWheelSizes.length > 1 && (
                <div>
                  <label className="block text-xs font-heading font-bold uppercase tracking-wider text-zinc-500 mb-2.5">
                    Rodado
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableWheelSizes.map((wheel) => (
                      <button
                        key={wheel}
                        type="button"
                        onClick={() => setSelectedWheelSize(wheel)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                          selectedWheelSize === wheel
                            ? 'border-zinc-950 bg-zinc-950 text-white font-bold shadow-xs'
                            : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400'
                        }`}
                      >
                        {wheel}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Rango de Precio */}
              <div>
                <label className="block text-xs font-heading font-bold uppercase tracking-wider text-zinc-500 mb-2.5">
                  Rango de Precio (ARS)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-zinc-400 font-medium">Mínimo</span>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">$</span>
                      <input
                        type="number"
                        value={priceRange[0] || ''}
                        onChange={(e) => setPriceRange([Number(e.target.value) || 0, priceRange[1]])}
                        placeholder="0"
                        className="w-full pl-6 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 focus:bg-white focus:border-zinc-950 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-400 font-medium">Máximo</span>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">$</span>
                      <input
                        type="number"
                        value={priceRange[1] || ''}
                        onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value) || 15000000])}
                        placeholder="15.000.000"
                        className="w-full pl-6 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 focus:bg-white focus:border-zinc-950 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
                {/* Botones de Presets de Precio Rápidos */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {[
                    { label: 'Hasta $500k', max: 500000 },
                    { label: 'Hasta $1.5M', max: 1500000 },
                    { label: 'Hasta $3M', max: 3000000 },
                    { label: '+ $3M', min: 3000000, max: 15000000 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setPriceRange([preset.min || 0, preset.max])}
                      className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-[11px] text-zinc-700 font-medium transition-all"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-5 border-t border-zinc-200 bg-zinc-50 flex items-center gap-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex-1 py-3 px-4 border border-zinc-200 bg-white hover:bg-zinc-100 rounded-xl text-xs font-heading font-bold text-zinc-700 uppercase tracking-wider transition-all text-center"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                className="flex-[2] py-3 px-4 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all text-center shadow-sm"
              >
                Ver {filteredProducts.length} {filteredProducts.length === 1 ? 'Producto' : 'Productos'}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Products Grid (Cuadrícula de a 3 Productos) */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-zinc-50 rounded-3xl border border-zinc-200 text-zinc-500">
          <Bike className="w-12 h-12 mx-auto mb-3 opacity-30 text-zinc-400" />
          <h3 className="text-base font-heading font-bold text-zinc-800">No encontramos artículos con esos filtros</h3>
          <p className="text-xs text-zinc-500 mt-1 mb-4">Intenta cambiar la categoría o el término de búsqueda.</p>
          <button
            type="button"
            onClick={() => handleSwitchSection('TODOS')}
            className="px-5 py-2.5 bg-zinc-950 text-white font-heading text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-zinc-800 shadow-sm"
          >
            Restablecer Filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={(p) => setActiveProduct(p)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
