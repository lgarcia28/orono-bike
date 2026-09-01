'use client';

import React from 'react';
import Link from 'next/link';
import { PointOfSaleInterface } from '@/app/components/pos/PointOfSaleInterface';
import { ArrowLeft, MonitorDot } from 'lucide-react';

export default function PosPage() {
  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col">
      {/* POS Top Bar */}
      <header className="bg-zinc-950 text-white h-14 px-6 flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-zinc-400 hover:text-white flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a Tienda Web
          </Link>
          <span className="text-zinc-700">|</span>
          <div className="flex items-center gap-2">
            <MonitorDot className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-sm tracking-wide">POS MOSTRADOR — LOCAL OROÑO</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
          <span>Punto de Venta: 0001</span>
          <span>ARCA Status: <strong className="text-emerald-400">Conectado (WSFEv1)</strong></span>
          <span>Cajero: Operador Mostrador</span>
        </div>
      </header>

      {/* POS Counter Main Component */}
      <main className="flex-1">
        <PointOfSaleInterface />
      </main>
    </div>
  );
}
