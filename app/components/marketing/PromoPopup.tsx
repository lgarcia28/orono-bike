'use client';

import React, { useState, useEffect } from 'react';
import { PromoService, PromoPopupSettings, DEFAULT_PROMO_SETTINGS } from '@/lib/services/promo.service';
import { X, Sparkles, Copy, Check, ArrowRight, Gift, Tag, Mail } from 'lucide-react';

const STORAGE_DISMISSED_KEY = 'orono_promo_dismissed';

export function PromoPopup() {
  const [settings, setSettings] = useState<PromoPopupSettings>(DEFAULT_PROMO_SETTINGS);
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const currentSettings = PromoService.getSettings();
    setSettings(currentSettings);

    const handleUpdate = () => {
      setSettings(PromoService.getSettings());
    };
    window.addEventListener('promoSettingsUpdated', handleUpdate);

    // Verificar si ya fue cerrado o suscrito previamente
    const wasDismissed = localStorage.getItem(STORAGE_DISMISSED_KEY);
    if (!currentSettings.enabled || wasDismissed) {
      return () => window.removeEventListener('promoSettingsUpdated', handleUpdate);
    }

    // 1. Disparador por tiempo (Delay en segundos)
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, Math.max(1, currentSettings.delaySeconds) * 1000);

    // 2. Disparador por intención de salida en PC (mouse sale hacia arriba)
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 10 && !localStorage.getItem(STORAGE_DISMISSED_KEY)) {
        setIsOpen(true);
      }
    };
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearTimeout(timer);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('promoSettingsUpdated', handleUpdate);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_DISMISSED_KEY, 'true');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return;

    const res = PromoService.addSubscriber(email.trim());
    if (res.success) {
      setIsSubmitted(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_DISMISSED_KEY, 'true');
      }
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(settings.couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isMounted || !isOpen || !settings.enabled) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl text-white">
        
        {/* Botón de Cierre (✕) */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 bg-black/50 hover:bg-black/80 text-zinc-300 hover:text-white rounded-full flex items-center justify-center border border-white/10 transition-colors"
          title="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Imagen de fondo / Hero Banner */}
        <div className="relative h-44 sm:h-48 w-full overflow-hidden">
          <img
            src={settings.imageUrl || 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80'}
            alt="Oroño Bike Promoción"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
          
          <div className="absolute bottom-3 left-6 right-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-zinc-950 text-[10px] font-heading font-black tracking-wider uppercase rounded-full shadow-md">
              <Sparkles className="w-3 h-3" />
              {settings.badgeText || 'BENEFICIO EXCLUSIVO'}
            </span>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 sm:p-8 pt-3 space-y-4">
          {!isSubmitted ? (
            <>
              <div>
                <h3 className="text-xl sm:text-2xl font-heading font-black tracking-tight text-white leading-tight">
                  {settings.title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">
                  {settings.subtitle}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 pt-1">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    required
                    placeholder="Ingresá tu correo electrónico..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-medium text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-11 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-heading text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  {settings.benefitType === 'gift' ? (
                    <>
                      <Gift className="w-4 h-4" />
                      Quiero mi {settings.giftItemName || 'Regalo'}
                    </>
                  ) : (
                    <>
                      <Tag className="w-4 h-4" />
                      Obtener mi {settings.discountPercent}% OFF
                    </>
                  )}
                </button>
              </form>

              <div className="text-center pt-1">
                <button
                  onClick={handleClose}
                  className="text-[11px] text-zinc-500 hover:text-zinc-400 underline transition-colors"
                >
                  No gracias, prefiero pagar precio regular
                </button>
              </div>
            </>
          ) : (
            /* Vista de Éxito con Cupón para Copiar */
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                <Check className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-heading font-black text-white">
                  ¡Felicitaciones! Acá tenés tu beneficio:
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  {settings.benefitType === 'gift'
                    ? `Ingresá este código en el checkout para sumar tu ${settings.giftItemName} sin cargo:`
                    : `Ingresá este código en el checkout para aplicar tu ${settings.discountPercent}% OFF:`}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 bg-zinc-900 p-3 rounded-2xl border border-zinc-700 max-w-xs mx-auto">
                <span className="font-mono text-base sm:text-lg font-black tracking-widest text-amber-400">
                  {settings.couponCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 bg-white hover:bg-zinc-200 text-zinc-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ¡Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copiar
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={handleClose}
                className="w-full h-11 bg-zinc-800 hover:bg-zinc-700 text-white font-heading text-xs font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                Continuar a la Tienda <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
