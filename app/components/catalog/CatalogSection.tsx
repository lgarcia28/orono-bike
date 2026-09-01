'use client';

import React, { useState, useMemo } from 'react';
import { ProductWithVariants, ProductVariant } from '@/lib/supabase/types';
import { ProductCard } from '@/app/components/catalog/ProductCard';
import { ModernProductDetail } from '@/app/components/catalog/ModernProductDetail';
import { Search, SlidersHorizontal, Bike } from 'lucide-react';

interface CatalogSectionProps {
  products: ProductWithVariants[];
  onAddToCart: (variant: ProductVariant, quantity: number) => void;
}

const CATEGORIES = [
  'Todas',
  'MTB Cross Country',
  'Gravel & Bikepacking',
  'Ruta & Aero Competición',
  'E-Bikes & Gravel',
];

const BRANDS = ['Todas', 'Specialized', 'Cannondale', 'Trek', 'Scott', 'Cervélo'];

export function CatalogSection({ products, onAddToCart }: CatalogSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [selectedBrand, setSelectedBrand] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeProduct, setActiveProduct] = useState<ProductWithVariants | null>(null);
  const [customBikes, setCustomBikes] = useState<ProductWithVariants[]>([]);

  // Cargar bicicletas personalizadas guardadas
  React.useEffect(() => {
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

  // Filtrado reactivo
  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) => {
      const matchCategory =
        selectedCategory === 'Todas' || p.category.toLowerCase().includes(selectedCategory.toLowerCase());
      const matchBrand = selectedBrand === 'Todas' || p.brand.toLowerCase() === selectedBrand.toLowerCase();
      const matchSearch =
        !searchQuery.trim() ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCategory && matchBrand && matchSearch;
    });
  }, [allProducts, selectedCategory, selectedBrand, searchQuery]);

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
    <section id="bicicletas" className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-200 pb-8 mb-10">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-heading font-extrabold text-zinc-400 uppercase tracking-widest mb-2">
            <Bike className="w-4 h-4 text-zinc-950" />
            <span>Colección Oficial 2026</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black text-zinc-950 tracking-tight">
            Catálogo de Bicicletas
          </h2>
          <p className="text-sm text-zinc-600 mt-2 max-w-xl leading-relaxed">
            Explora las mejores bicicletas del mercado internacional con garantía oficial, stock en tiempo real y asesoramiento mecánico especializado en Rosario.
          </p>
        </div>

        {/* Search Bar & Add Button */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por modelo, marca, grupo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 focus:bg-white focus:border-zinc-950 focus:outline-none transition-all shadow-xs"
            />
          </div>

          <a
            href="/admin/productos/nuevo"
            className="shrink-0 bg-zinc-950 hover:bg-zinc-800 text-white px-4 py-3 rounded-xl font-heading text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5"
            title="Cargar una nueva bicicleta al catálogo"
          >
            <span>+ Cargar Bici</span>
          </a>
        </div>
      </div>

      {/* Filter Tabs & Brand Chips */}
      <div className="space-y-4 mb-12">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-5 py-2.5 rounded-full text-xs font-heading font-bold uppercase tracking-wider transition-all ${
                  isSelected
                    ? 'bg-zinc-950 text-white shadow-md'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Brand Selector Chips */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs pt-1">
          <span className="text-zinc-400 font-heading font-bold text-[11px] uppercase tracking-wider mr-1 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Marca:
          </span>
          {BRANDS.map((brand) => {
            const isSelected = selectedBrand === brand;
            return (
              <button
                key={brand}
                onClick={() => setSelectedBrand(brand)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-heading font-bold uppercase tracking-wider transition-all border ${
                  isSelected
                    ? 'border-zinc-950 bg-zinc-950 text-white shadow-xs'
                    : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400'
                }`}
              >
                {brand}
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-zinc-50 rounded-2xl border border-zinc-200 text-zinc-500">
          <Bike className="w-12 h-12 mx-auto mb-3 opacity-30 text-zinc-400" />
          <h3 className="text-base font-heading font-bold text-zinc-800">No encontramos bicicletas con esos filtros</h3>
          <p className="text-xs text-zinc-500 mt-1 mb-4">Intenta cambiar la categoría o el término de búsqueda.</p>
          <button
            onClick={() => {
              setSelectedCategory('Todas');
              setSelectedBrand('Todas');
              setSearchQuery('');
            }}
            className="px-5 py-2.5 bg-zinc-950 text-white font-heading text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-zinc-800"
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
