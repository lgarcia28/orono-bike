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

        {/* Información del Taller & Ubicación */}
        <section className="max-w-4xl mx-auto mt-16 bg-white border border-zinc-200 rounded-3xl p-6 sm:p-10 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-1.5 text-xs font-heading font-bold text-zinc-700 bg-zinc-100 px-3 py-1 rounded-md uppercase tracking-wider">
                <Wrench className="w-3.5 h-3.5 text-zinc-950" /> Información & Atención
              </div>
              <h2 className="text-2xl font-heading font-black text-zinc-950 tracking-tight">
                Taller Especializado Oroño Bike
              </h2>
              <p className="text-zinc-600 text-xs sm:text-sm leading-relaxed">
                Mantenimiento integral de transmisiones, purga de frenos hidráulicos, calibración, tubelizado y service general con repuestos originales y mecánicos certificados.
              </p>
              <div className="pt-2 text-xs space-y-2 text-zinc-700">
                <p>📍 <strong>Dirección:</strong> Bv. Nicasio Oroño 1234, Rosario, Santa Fe</p>
                <p>🕒 <strong>Horarios:</strong> Lunes a Viernes de 09:00 a 19:30 | Sábados de 09:00 a 13:30</p>
                <p>📱 <strong>WhatsApp Taller:</strong> Consultas y seguimiento directo de tu bicicleta</p>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden border border-zinc-200 aspect-16/10 bg-zinc-950 shadow-md">
                <img
                  src="https://images.unsplash.com/photo-1511994298241-608e28f14fde?auto=format&fit=crop&w=800&q=80"
                  alt="Taller Mecánico Oroño Bike"
                  className="w-full h-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent flex items-end p-4">
                  <div className="text-white text-xs">
                    <span className="text-[10px] text-zinc-300 block uppercase font-heading font-bold">Local & Taller</span>
                    <strong className="font-heading font-black text-sm">Bv. Nicasio Oroño 1234</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
