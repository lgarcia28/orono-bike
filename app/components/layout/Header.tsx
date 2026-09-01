'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Search, Wrench, MonitorDot, Menu, X, Phone, MessageCircle } from 'lucide-react';

interface HeaderProps {
  cartCount?: number;
  onOpenCart?: () => void;
}

export function Header({ cartCount = 0, onOpenCart }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const basePhone = process.env.NEXT_PUBLIC_LOCAL_WHATSAPP || '5493410000000';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200 shadow-xs">
      {/* Top Notification Bar (Estilo Fusion / Bertolina) */}
      <div className="bg-zinc-950 text-white text-[11px] font-heading font-semibold py-1.5 px-4 tracking-wider uppercase flex justify-between items-center max-w-7xl mx-auto">
        <div className="hidden sm:flex items-center gap-4">
          <span>📍 Rosario: Bv. Nicasio Oroño 1234</span>
          <span>•</span>
          <span>⚡ 10% OFF en Transferencia Bancaria</span>
        </div>
        <div className="mx-auto sm:mx-0 flex items-center gap-3">
          <span className="text-amber-400 font-bold">💳 3 Y 6 CUOTAS SIN INTERÉS</span>
          <span className="hidden md:inline">•</span>
          <a
            href={`https://wa.me/${basePhone}?text=Hola%20Oroño%20Bike!`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold"
          >
            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp Directo
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-6">
        {/* Brand Logo (Modern Sports Typography) */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <div className="w-10 h-10 bg-zinc-950 text-white font-heading font-black flex items-center justify-center rounded-lg text-lg tracking-tighter shadow-md group-hover:bg-zinc-800 transition-colors">
            OB
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-black tracking-tight text-zinc-950 text-xl sm:text-2xl leading-none">
              OROÑO<span className="text-zinc-500 font-medium">BIKE</span>
            </span>
            <span className="text-[10px] tracking-[0.25em] uppercase text-zinc-500 font-heading font-bold mt-0.5">
              Performance Store
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8 font-heading text-xs font-bold uppercase tracking-wider text-zinc-700">
          <a href="/#bicicletas" className="hover:text-zinc-950 transition-colors py-2 border-b-2 border-transparent hover:border-zinc-950">
            Bicicletas
          </a>
          <a href="/#bicicletas" className="hover:text-zinc-950 transition-colors py-2 border-b-2 border-transparent hover:border-zinc-950">
            Gravel & MTB
          </a>
          <a href="/#bicicletas" className="hover:text-zinc-950 transition-colors py-2 border-b-2 border-transparent hover:border-zinc-950">
            Ruta & Competición
          </a>
          <Link
            href="/taller"
            className="flex items-center gap-1.5 text-zinc-950 font-black hover:text-zinc-700 transition-colors bg-zinc-100 hover:bg-zinc-200 px-3.5 py-2 rounded-lg"
          >
            <Wrench className="w-3.5 h-3.5" /> Taller & Turnos
          </Link>
          <Link
            href="/pos"
            className="flex items-center gap-1 text-zinc-500 hover:text-zinc-950 transition-colors"
          >
            <MonitorDot className="w-3.5 h-3.5" /> POS Mostrador
          </Link>
          <Link
            href="/admin/productos/nuevo"
            className="flex items-center gap-1 text-zinc-500 hover:text-zinc-950 transition-colors"
          >
            + Cargar Bici
          </Link>
        </nav>

        {/* Actions Cluster */}
        <div className="flex items-center gap-3">
          <a
            href="#bicicletas"
            aria-label="Buscar bicicletas"
            className="p-2.5 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg transition-all"
          >
            <Search className="w-5 h-5" />
          </a>

          <button
            type="button"
            onClick={onOpenCart}
            aria-label="Abrir carrito"
            className="relative p-2.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg transition-all flex items-center gap-2 shadow-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline font-heading text-xs font-bold uppercase tracking-wider">
              Carrito
            </span>
            {cartCount > 0 && (
              <span className="bg-white text-zinc-950 text-[10px] font-heading font-black w-5 h-5 rounded-full flex items-center justify-center shadow">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-zinc-700 hover:text-zinc-950"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-zinc-200 bg-white px-6 py-6 flex flex-col gap-4 font-heading text-sm font-bold uppercase tracking-wider text-zinc-800 shadow-xl">
          <a href="/#bicicletas" onClick={() => setMobileMenuOpen(false)}>
            Bicicletas
          </a>
          <a href="/#bicicletas" onClick={() => setMobileMenuOpen(false)}>
            Gravel & MTB
          </a>
          <a href="/#bicicletas" onClick={() => setMobileMenuOpen(false)}>
            Ruta & Competición
          </a>
          <Link href="/taller" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 text-zinc-950">
            <Wrench className="w-4 h-4" /> Taller Mecánico & Turnos
          </Link>
          <Link href="/pos" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 text-zinc-600">
            <MonitorDot className="w-4 h-4" /> POS Mostrador
          </Link>
        </div>
      )}
    </header>
  );
}
