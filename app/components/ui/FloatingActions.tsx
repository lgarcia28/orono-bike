'use client';

import React from 'react';
import { MessageCircle, Instagram } from 'lucide-react';

interface FloatingActionsProps {
  productTitle?: string;
  customMessage?: string;
}

export function FloatingActions({ productTitle, customMessage }: FloatingActionsProps) {
  const basePhone = process.env.NEXT_PUBLIC_LOCAL_WHATSAPP || '5493410000000';
  const defaultText = productTitle
    ? `¡Hola Oroño Bike! Quiero consultar por la bicicleta: ${productTitle}`
    : customMessage || '¡Hola Oroño Bike! Quiero consultar por disponibilidad y servicios de taller.';

  const whatsappUrl = `https://wa.me/${basePhone}?text=${encodeURIComponent(defaultText)}`;
  const instagramUrl = 'https://www.instagram.com/orono_bike/?hl=es-la';

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end">
      {/* Botón Flotante Instagram */}
      <a
        href={instagramUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Seguinos en Instagram"
        className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-zinc-900 text-white shadow-lg hover:bg-zinc-800 hover:scale-105 transition-all duration-200"
      >
        <Instagram className="w-5 h-5 group-hover:rotate-6 transition-transform" />
        <span className="absolute right-14 whitespace-nowrap bg-zinc-900 text-white text-xs font-medium px-2.5 py-1.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          @orono_bike
        </span>
      </a>

      {/* Botón Flotante WhatsApp */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar por WhatsApp"
        className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-xl hover:bg-[#1EBE5D] hover:scale-105 transition-all duration-200"
      >
        <MessageCircle className="w-7 h-7 fill-white" />
        <span className="absolute right-16 whitespace-nowrap bg-zinc-900 text-white text-xs font-medium px-3 py-1.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Consultanos por WhatsApp
        </span>
      </a>
    </div>
  );
}
