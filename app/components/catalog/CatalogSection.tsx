'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ProductWithVariants, ProductVariant } from '@/lib/supabase/types';
import { ProductCard } from '@/app/components/catalog/ProductCard';
import { ModernProductDetail } from '@/app/components/catalog/ModernProductDetail';
import { ALL_PRODUCTS_CATALOG } from '@/lib/data/bikes';
import { Search, SlidersHorizontal, Bike, Wrench, Package, Sparkles } from 'lucide-react';

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

      // 2. FILTRADO POR SUBCATEGORÍA DE BICI (solo si estamos en Bicicletas o Todos)
      if (isBike && selectedBikeCategory !== 'Todas') {
        if (cat !== selectedBikeCategory.toUpperCase()) return false;
      }

      // 3. FILTRADO POR MARCA
      if (selectedBrand !== 'Todas') {
        if ((p.brand || '').toUpperCase().trim() !== selectedBrand.toUpperCase().trim()) return false;
      }

      // 4. BUSCADOR PREDICTIVO
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchTitle = (p.title || '').toLowerCase().includes(q);
        const matchB = (p.brand || '').toLowerCase().includes(q);
        const matchCat = (p.category || '').toLowerCase().includes(q);
        const matchSku = p.variants?.some((v) => (v.sku || '').toLowerCase().includes(q));
        if (!matchTitle && !matchB && !matchCat && !matchSku) return false;
      }

      return true;
    });
  }, [allProducts, mainSection, selectedBikeCategory, selectedBrand, searchQuery]);

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

        {/* Search Bar Minimalista */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar producto, marca o modelo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 focus:bg-white focus:border-zinc-950 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Tabs de Secciones Principales: TODOS, BICICLETAS, COMPONENTES, ACCESORIOS */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
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
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-3 scrollbar-none">
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

      {/* Brand Selector Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-4 mb-8 scrollbar-none">
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
