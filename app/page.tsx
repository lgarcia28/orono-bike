'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/app/components/layout/Header';
import { CartDrawer, CartDrawerItem } from '@/app/components/layout/CartDrawer';
import { CatalogSection } from '@/app/components/catalog/CatalogSection';
import { ALL_PRODUCTS_CATALOG } from '@/lib/data/bikes';
import { ProductVariant } from '@/lib/supabase/types';
import {
  Wrench,
  Zap,
  ArrowRight,
  CreditCard,
  Truck,
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
      videoRef.current.playbackRate = 0.75; // Cámara lenta fluida y cinematográfica
    }
  }, []);

  const handleAddToCart = (variant: ProductVariant, quantity: number) => {
    const parentProduct =
      ALL_PRODUCTS_CATALOG.find((p) => p.id === variant.product_id) || ALL_PRODUCTS_CATALOG[0];

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

      {/* Hero Section con Video de Fondo (Solo visible en PC/Tablet, en Celular va directo al catálogo) */}
      <section className="hidden md:block relative text-white overflow-hidden py-28 sm:py-40 px-4 sm:px-6 border-b border-zinc-800">
        {/* Background Video */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            onLoadedMetadata={(e) => {
              e.currentTarget.playbackRate = 0.75;
            }}
            poster="https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1920&q=80"
            className="w-full h-full object-cover scale-105"
          >
            <source
              src="/videos/hero-mountain-trail.webm"
              type="video/webm"
            />
            <source
              src="/videos/hero-cycling.mp4"
              type="video/mp4"
            />
          </video>
          {/* High-End Dark Gradient Overlay for Maximum Text Contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/95 via-zinc-950/80 to-zinc-950/50 backdrop-blur-[0.5px]" />
          <div className="absolute inset-0 bg-black/35" />
        </div>
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-8 space-y-6">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-heading font-black tracking-tight text-white leading-[1.05]">
              BICICLETAS DE ALTO RENDIMIENTO.
            </h1>

            <p className="text-zinc-300 text-sm sm:text-base max-w-2xl leading-relaxed font-medium tracking-wide">
              Distribuidor oficial de <strong className="text-white font-bold">SCOTT, VOLTA, RALEIGH, SARS, ZION</strong> y repuestos originales <strong className="text-white font-bold">SHIMANO</strong>.
            </p>

            <div className="pt-2 flex flex-wrap gap-4 items-center">
              <a
                href="#bicicletas"
                className="bg-white text-zinc-950 px-8 py-3.5 rounded-xl font-heading text-xs font-black uppercase tracking-wider hover:bg-zinc-100 transition-all flex items-center gap-2 shadow-xl"
              >
                Ver Catálogo <ArrowRight className="w-4 h-4" />
              </a>
              <Link
                href="/taller"
                className="border border-zinc-700/80 hover:border-white text-white px-7 py-3.5 rounded-xl font-heading text-xs font-bold uppercase tracking-wider hover:bg-white/5 transition-all flex items-center gap-2 backdrop-blur-xs"
              >
                <Wrench className="w-4 h-4 text-zinc-400" /> Turnos de Taller
              </Link>
            </div>
          </div>

          {/* Banner de Beneficios Simplificado y Elegante */}
          <div className="lg:col-span-4 flex flex-col sm:grid sm:grid-cols-3 lg:flex lg:flex-col gap-3 text-left">
            <div className="bg-zinc-950/70 border border-white/10 backdrop-blur-md p-5 rounded-2xl hover:border-white/20 transition-colors">
              <CreditCard className="w-5 h-5 text-amber-400 mb-2" />
              <span className="font-heading font-black text-base text-white block">HASTA 12 CUOTAS</span>
              <span className="text-[11px] text-zinc-400 font-medium">Con todas las tarjetas</span>
            </div>
            <div className="bg-zinc-950/70 border border-white/10 backdrop-blur-md p-5 rounded-2xl hover:border-white/20 transition-colors">
              <Zap className="w-5 h-5 text-emerald-400 mb-2" />
              <span className="font-heading font-black text-base text-white block">10% OFF</span>
              <span className="text-[11px] text-zinc-400 font-medium">Abonando por transferencia bancaria</span>
            </div>
            <div className="bg-zinc-950/70 border border-white/10 backdrop-blur-md p-5 rounded-2xl hover:border-white/20 transition-colors">
              <Truck className="w-5 h-5 text-sky-400 mb-2" />
              <span className="font-heading font-black text-base text-white block">ENVÍOS</span>
              <span className="text-[11px] text-zinc-400 font-medium">Asegurados a todo el país</span>
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
          <span className="hover:text-zinc-950 transition-colors">SARS</span>
          <span className="hover:text-zinc-950 transition-colors">ZION</span>
          <span className="hover:text-zinc-950 transition-colors">SHIMANO</span>
        </div>
      </section>

      {/* Main Dynamic Multi-Product Catalog Section (Bicicletas, Componentes, Accesorios) */}
      <main className="flex-1 bg-white">
        <CatalogSection
          products={ALL_PRODUCTS_CATALOG}
          onAddToCart={handleAddToCart}
        />
      </main>



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
              <li><Link href="/admin" className="text-zinc-300 hover:text-white font-bold transition-colors flex items-center gap-1"><LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" /> Panel de Gestión (Dueño)</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-heading font-bold uppercase tracking-wider mb-4 text-xs">Medios de Pago & Envíos</h4>
            <p className="text-zinc-400 leading-relaxed">
              Tarjetas de Crédito con hasta 12 Cuotas, Transferencia Bancaria (10% OFF), Efectivo y Débito. Envíos asegurados a todo el país.
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
