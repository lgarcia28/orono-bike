'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/app/components/layout/Header';
import { CartDrawer, CartDrawerItem } from '@/app/components/layout/CartDrawer';
import { CatalogSection } from '@/app/components/catalog/CatalogSection';
import { ORO_BIKES_CATALOG } from '@/lib/data/bikes';
import { ProductVariant } from '@/lib/supabase/types';
import {
  Wrench,
  ShieldCheck,
  Zap,
  ArrowRight,
  CreditCard,
  Truck,
  CheckCircle2,
  Phone,
  MessageCircle,
  LayoutDashboard,
} from 'lucide-react';

export default function HomePage() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartDrawerItem[]>([]);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  React.useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.6; // Efecto cámara lenta elegante y suave
    }
  }, []);

  const handleAddToCart = (variant: ProductVariant, quantity: number) => {
    const parentProduct =
      ORO_BIKES_CATALOG.find((p) => p.id === variant.product_id) || ORO_BIKES_CATALOG[0];

    setCartItems((prev) => {
      const existing = prev.find((item) => item.variant.id === variant.id);
      if (existing) {
        return prev.map((item) =>
          item.variant.id === variant.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { variant: { ...variant, product: parentProduct }, quantity }];
    });
    setIsCartOpen(true);
  };

  const handleRemoveFromCart = (variantId: string) => {
    setCartItems((prev) => prev.filter((item) => item.variant.id !== variantId));
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-900 font-sans">
      <Header
        cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Hero Section con Video de Fondo en Cámara Lenta */}
      <section className="relative text-white overflow-hidden py-28 sm:py-40 px-4 sm:px-6 border-b border-zinc-800">
        {/* Background Video */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            onLoadedMetadata={(e) => {
              e.currentTarget.playbackRate = 0.6;
            }}
            poster="https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1920&q=80"
            className="w-full h-full object-cover scale-105"
          >
            <source
              src="/videos/hero-cycling.webm"
              type="video/webm"
            />
          </video>
          {/* High-End Dark Gradient Overlay for Maximum Text Contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/95 via-zinc-950/80 to-zinc-950/50 backdrop-blur-[0.5px]" />
          <div className="absolute inset-0 bg-black/30" />
        </div>
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-8 space-y-6">
            <div className="inline-flex items-center gap-2 bg-zinc-900/90 border border-zinc-700/80 px-4 py-1.5 rounded-full text-xs font-heading font-bold text-zinc-200 tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>OROÑO BIKE — ROSARIO, SANTA FE</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-heading font-black tracking-tight text-white leading-[1.05]">
              BICICLETAS DE ALTO RENDIMIENTO & TALLER.
            </h1>

            <p className="text-zinc-200 text-sm sm:text-base max-w-2xl leading-relaxed font-bold tracking-wide uppercase">
              Representante oficial en Rosario de: SCOTT, VOLTA, RALEIGH, MOOVE, ZION, SARS Y OTROS.
            </p>

            <div className="pt-2 flex flex-wrap gap-4 items-center">
              <a
                href="#bicicletas"
                className="bg-white text-zinc-950 px-8 py-4 rounded-xl font-heading text-xs font-black uppercase tracking-wider hover:bg-zinc-100 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 shadow-2xl"
              >
                Ver Catálogo 2026 <ArrowRight className="w-4 h-4" />
              </a>
              <Link
                href="/taller"
                className="border border-zinc-700 hover:border-white bg-zinc-900/80 text-white px-7 py-4 rounded-xl font-heading text-xs font-bold uppercase tracking-wider hover:bg-zinc-900 transition-all flex items-center gap-2"
              >
                <Wrench className="w-4 h-4 text-zinc-400" /> Turnos de Taller Mecánico
              </Link>
            </div>
          </div>

          {/* Banner de Beneficios Destacados */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-3.5 text-left">
            <div className="bg-zinc-900/90 border border-zinc-800 p-5 rounded-2xl">
              <CreditCard className="w-6 h-6 text-amber-400 mb-2" />
              <span className="font-heading font-black text-lg text-white block">3 Y 6 CUOTAS</span>
              <span className="text-[11px] text-zinc-400 font-heading uppercase tracking-wider">Sin Interés</span>
            </div>
            <div className="bg-zinc-900/90 border border-zinc-800 p-5 rounded-2xl">
              <Zap className="w-6 h-6 text-emerald-400 mb-2" />
              <span className="font-heading font-black text-lg text-white block">10% OFF</span>
              <span className="text-[11px] text-zinc-400 font-heading uppercase tracking-wider">Transferencia</span>
            </div>
            <div className="bg-zinc-900/90 border border-zinc-800 p-5 rounded-2xl">
              <Truck className="w-6 h-6 text-sky-400 mb-2" />
              <span className="font-heading font-black text-lg text-white block">ENVÍOS</span>
              <span className="text-[11px] text-zinc-400 font-heading uppercase tracking-wider">A todo el país</span>
            </div>
            <div className="bg-zinc-900/90 border border-zinc-800 p-5 rounded-2xl">
              <ShieldCheck className="w-6 h-6 text-purple-400 mb-2" />
              <span className="font-heading font-black text-lg text-white block">FACTURA A Y B</span>
              <span className="text-[11px] text-zinc-400 font-heading uppercase tracking-wider">Comprobantes oficiales</span>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Logos Strip */}
      <section className="bg-zinc-100/70 border-b border-zinc-200 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center sm:justify-between gap-6 text-zinc-400 font-heading font-black text-sm uppercase tracking-widest">
          <span className="hover:text-zinc-950 transition-colors">SCOTT</span>
          <span className="hover:text-zinc-950 transition-colors">VOLTA</span>
          <span className="hover:text-zinc-950 transition-colors">RALEIGH</span>
          <span className="hover:text-zinc-950 transition-colors">MOOVE</span>
          <span className="hover:text-zinc-950 transition-colors">ZION</span>
          <span className="hover:text-zinc-950 transition-colors">SARS</span>
          <span className="hover:text-zinc-950 transition-colors">SHIMANO</span>
          <span className="hover:text-zinc-950 transition-colors">Y OTROS</span>
        </div>
      </section>

      {/* Main Dynamic Multi-Bike Catalog Section */}
      <main className="flex-1 bg-white">
        <CatalogSection
          products={ORO_BIKES_CATALOG}
          onAddToCart={handleAddToCart}
        />
      </main>

      {/* Workshop Section */}
      <section className="bg-zinc-50 border-t border-zinc-200 py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-1.5 text-xs font-heading font-bold text-zinc-700 bg-zinc-200 px-3 py-1 rounded-md uppercase tracking-wider">
              <Wrench className="w-4 h-4 text-zinc-950" /> SERVICIO TÉCNICO OFICIAL
            </div>
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-zinc-950 tracking-tight leading-tight">
              Taller Mecánico Especializado en Bv. Oroño
            </h2>
            <p className="text-zinc-600 text-sm leading-relaxed">
              Mantenimiento integral de suspensiones, purga y cambio de fluidos hidráulicos, calibraciones y revisiones, etc.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 text-xs">
              <div className="flex items-center gap-2.5 text-zinc-900 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Herramientas de precisión oficiales</span>
              </div>
              <div className="flex items-center gap-2.5 text-zinc-900 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Repuestos originales sellados</span>
              </div>
              <div className="flex items-center gap-2.5 text-zinc-900 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Reserva online sin esperas</span>
              </div>
              <div className="flex items-center gap-2.5 text-zinc-900 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Notificación directa por WhatsApp</span>
              </div>
            </div>

            <div className="pt-4">
              <Link
                href="/taller"
                className="inline-flex items-center gap-2 bg-zinc-950 text-white px-8 py-4 rounded-xl font-heading text-xs font-extrabold uppercase tracking-wider hover:bg-zinc-800 transition-all shadow-md"
              >
                Agendar Turno de Service <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative rounded-3xl overflow-hidden border border-zinc-200 shadow-2xl aspect-16/10 bg-zinc-950">
              <img
                src="https://images.unsplash.com/photo-1511994298241-608e28f14fde?auto=format&fit=crop&w=1200&q=80"
                alt="Taller Oroño Bike"
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent flex items-end p-8">
                <div className="text-white">
                  <span className="text-xs font-heading font-bold text-zinc-300 block uppercase tracking-wider">Local & Taller</span>
                  <strong className="text-lg font-heading font-black">Bv. Nicasio Oroño 1234, Rosario</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Clean Footer */}
      <footer className="bg-zinc-950 text-zinc-400 py-16 px-4 sm:px-6 border-t border-zinc-800 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <span className="text-white font-heading font-black text-xl tracking-tight block mb-3">
              OROÑO<span className="text-zinc-500 font-medium">BIKE</span>
            </span>
            <p className="text-zinc-400 leading-relaxed">
              Bv. Nicasio Oroño 1234, Rosario, Santa Fe.<br />
              Atención presencial: Lun a Vie 09:00 a 19:30 | Sáb 09:00 a 13:30.
            </p>
          </div>
          <div>
            <h4 className="text-white font-heading font-bold uppercase tracking-wider mb-4 text-xs">Navegación</h4>
            <ul className="space-y-2.5 text-zinc-400">
              <li><a href="#bicicletas" className="hover:text-white transition-colors">Catálogo de Bicicletas</a></li>
              <li><Link href="/taller" className="hover:text-white transition-colors">Turnos de Taller Mecánico</Link></li>
              <li><Link href="/pos" className="hover:text-white transition-colors">Punto de Venta POS Mostrador</Link></li>
              <li><Link href="/admin" className="text-zinc-300 hover:text-white font-bold transition-colors flex items-center gap-1"><LayoutDashboard className="w-3.5 h-3.5" /> Panel de Gestión (Dueño)</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-heading font-bold uppercase tracking-wider mb-4 text-xs">Medios de Pago & Envíos</h4>
            <p className="text-zinc-400 leading-relaxed">
              Tarjetas de Crédito con 3 y 6 Cuotas Sin Interés, Transferencia Bancaria (10% OFF), Efectivo y Débito. Envíos asegurados a todo el país.
            </p>
          </div>
          <div>
            <h4 className="text-white font-heading font-bold uppercase tracking-wider mb-4 text-xs">Contacto Directo</h4>
            <p className="text-zinc-400 leading-relaxed">
              Instagram: <a href="https://www.instagram.com/orono_bike/?hl=es-la" target="_blank" rel="noopener noreferrer" className="text-white underline">@orono_bike</a><br />
              WhatsApp: +54 9 341 000-0000<br />
              Rosario, Santa Fe, Argentina.
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-zinc-800 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center text-zinc-500 font-heading text-[11px] gap-4">
          <span>© 2026 Oroño Bike. Todos los derechos reservados.</span>
          <span>Bv. Nicasio Oroño 1234 • Rosario, Santa Fe</span>
        </div>
      </footer>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onRemoveItem={handleRemoveFromCart}
        onCheckout={() => alert('Redirigiendo a Checkout seguro (Mercado Pago / Transferencia)...')}
      />
    </div>
  );
}
