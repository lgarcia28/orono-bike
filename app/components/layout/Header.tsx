'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Menu,
  X,
  MapPin,
  Clock,
  Wrench,
  Search,
  Zap,
  CreditCard,
  Truck,
  Phone,
  LayoutDashboard,
} from 'lucide-react';

interface HeaderProps {
  cartCount?: number;
  onOpenCart?: () => void;
}

export function Header({ cartCount = 0, onOpenCart }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200">
      {/* Top Bar de Beneficios y Contacto Oficial */}
      <div className="bg-zinc-950 text-white text-[11px] font-heading font-medium tracking-wide py-2 px-4 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-zinc-300">
              <MapPin className="w-3 h-3 text-zinc-400" /> Rosario: Bv. Nicasio Oroño 1234
            </span>
            <span className="hidden sm:inline text-zinc-600">•</span>
            <span className="hidden sm:flex items-center gap-1 text-emerald-400 font-bold">
              <Zap className="w-3 h-3" /> 10% OFF en Transferencia Bancaria
            </span>
          </div>
          <div className="flex items-center gap-4 text-zinc-300 font-bold">
            <span className="flex items-center gap-1 text-amber-400">
              <CreditCard className="w-3 h-3" /> 3 Y 6 CUOTAS SIN INTERÉS
            </span>
            <span className="hidden md:inline text-zinc-600">•</span>
            <a
              href="https://wa.me/5493410000000?text=Hola%20Oroño%20Bike!%20Quisiera%20consultar%20por%20una%20bicicleta"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1 text-white hover:text-emerald-400 transition-colors"
            >
              <Phone className="w-3 h-3" /> WhatsApp Directo
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo */}
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
            MTB & Ruta
          </a>
          <a href="/#bicicletas" className="hover:text-zinc-950 transition-colors py-2 border-b-2 border-transparent hover:border-zinc-950">
            Gravel & BMX
          </a>
          <Link
            href="/taller"
            className="flex items-center gap-1.5 text-zinc-950 font-black hover:text-zinc-700 transition-colors bg-zinc-100 hover:bg-zinc-200 px-3.5 py-2 rounded-lg"
          >
            <Wrench className="w-3.5 h-3.5" /> Taller & Turnos
          </Link>
          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-white bg-zinc-950 px-3.5 py-2 rounded-lg hover:bg-zinc-800 transition-colors text-[11px] font-bold shadow-xs"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" /> Panel Dueño
          </Link>
        </nav>

        {/* Actions Cluster */}
        <div className="flex items-center gap-3">
          {/* Cart Trigger */}
          <button
            onClick={onOpenCart}
            aria-label="Abrir carrito"
            className="relative flex items-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-white px-4 py-2.5 rounded-xl font-heading text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Carrito</span>
            {cartCount > 0 && (
              <span className="bg-white text-zinc-950 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center -mr-1">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 rounded-xl text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 transition-colors border border-zinc-200"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-zinc-200 bg-white px-6 py-6 space-y-4 animate-fadeIn">
          <nav className="flex flex-col space-y-3 font-heading font-bold text-sm text-zinc-800">
            <a
              href="/#bicicletas"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-zinc-100"
            >
              Catálogo de Bicicletas
            </a>
            <Link
              href="/taller"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-zinc-100 flex items-center justify-between"
            >
              <span>Taller Mecánico & Turnos</span>
              <Wrench className="w-4 h-4 text-zinc-400" />
            </Link>
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 bg-zinc-950 text-white px-4 rounded-xl flex items-center justify-between"
            >
              <span>Panel de Gestión (Dueño)</span>
              <LayoutDashboard className="w-4 h-4 text-emerald-400" />
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
