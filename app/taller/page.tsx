'use client';

import React from 'react';
import { Header } from '@/app/components/layout/Header';
import { WorkshopBookingWizard } from '@/app/components/workshop/WorkshopBookingWizard';
import { Wrench, ShieldCheck, Clock, Award } from 'lucide-react';

export default function TallerPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Header />

      <main className="flex-1 py-12 px-4">
        {/* Banner Taller */}
        <div className="max-w-4xl mx-auto text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-zinc-200 text-zinc-800 text-xs px-3 py-1 rounded-sm uppercase tracking-wider font-mono mb-3">
            <Wrench className="w-3.5 h-3.5" /> Servicio Técnico Oficial • Rosario
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-zinc-950 tracking-tight mb-3">
            Taller Mecánico de Alto Rendimiento
          </h1>
          <p className="text-zinc-600 text-sm max-w-xl mx-auto leading-relaxed">
            Reserva tu turno online. Mantenimiento especializado para bicicletas de montaña, gravel y ruta con herramientas de precisión y mecánicos certificados.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 max-w-2xl mx-auto text-left text-xs">
            <div className="bg-white p-3.5 rounded border border-zinc-200 flex items-center gap-3">
              <Award className="w-5 h-5 text-zinc-900 shrink-0" />
              <span>Certificación Park Tool & Shimano Service Center</span>
            </div>
            <div className="bg-white p-3.5 rounded border border-zinc-200 flex items-center gap-3">
              <Clock className="w-5 h-5 text-zinc-900 shrink-0" />
              <span>Tiempos de entrega estrictos (24 a 48 hs)</span>
            </div>
            <div className="bg-white p-3.5 rounded border border-zinc-200 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-zinc-900 shrink-0" />
              <span>Garantía de mano de obra en cada intervención</span>
            </div>
          </div>
        </div>

        {/* Wizard Interactivo de Reserva */}
        <WorkshopBookingWizard />
      </main>
    </div>
  );
}
