'use client';

import React, { useState, useEffect } from 'react';
import { WorkshopService } from '@/lib/services/workshop.service';
import { Wrench, Calendar, Bike, CheckCircle2, ChevronRight, ChevronLeft, MessageCircle, MapPin, Clock } from 'lucide-react';

export function WorkshopBookingWizard() {
  const [servicesList, setServicesList] = useState(() => WorkshopService.getServices());
  const [step, setStep] = useState<number>(1);
  const [selectedService, setSelectedService] = useState<string>(() => {
    const list = WorkshopService.getServices();
    return list[0]?.title || 'Service General & Puesta a Punto';
  });

  useEffect(() => {
    setServicesList(WorkshopService.getServices());
    const handleUpdate = () => {
      setServicesList(WorkshopService.getServices());
    };
    window.addEventListener('workshopServicesUpdated', handleUpdate);
    return () => window.removeEventListener('workshopServicesUpdated', handleUpdate);
  }, []);
  
  // Selección directa de Fecha por Día
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  
  // Datos de la bicicleta y cliente
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    bikeBrand: '',
    bikeModel: '',
    wheelSize: '29"',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName || !formData.clientPhone || !selectedDate) {
      setErrorMsg('Por favor complete todos los campos obligatorios.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await WorkshopService.bookAppointment({
      clientName: formData.clientName,
      clientPhone: formData.clientPhone,
      clientEmail: formData.clientEmail,
      serviceType: selectedService,
      bikeBrand: formData.bikeBrand || 'Bicicleta',
      bikeModel: formData.bikeModel || 'General',
      wheelSize: formData.wheelSize,
      appointmentDate: selectedDate,
      timeSlot: 'Turno por Día',
      clientNotes: formData.notes,
    });

    setIsSubmitting(false);

    if (res.success && res.appointment) {
      setConfirmedBooking(res.appointment);
      setStep(4);
    } else {
      setErrorMsg(res.error || 'No se pudo agendar el turno.');
    }
  };

  const getWhatsAppConfirmationUrl = () => {
    if (!confirmedBooking) return '#';
    const basePhone = process.env.NEXT_PUBLIC_LOCAL_WHATSAPP || '5493410000000';
    const text = `¡Hola Oroño Bike! Reservé mi turno de taller:
📋 Código: ${confirmedBooking.appointment_code}
🔧 Servicio: ${confirmedBooking.service_type}
📅 Día de Ingreso: ${confirmedBooking.appointment_date}
🚴 Bicicleta: ${confirmedBooking.bike_brand} ${confirmedBooking.bike_model} (Rod. ${confirmedBooking.wheel_size})
👤 Cliente: ${confirmedBooking.client_name}`;
    return `https://wa.me/${basePhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white border border-zinc-200 rounded-3xl shadow-sm p-6 lg:p-8">
      {/* Stepper Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-6 mb-8">
        {[
          { num: 1, label: 'Servicio' },
          { num: 2, label: 'Día de Ingreso' },
          { num: 3, label: 'Bicicleta & Contacto' },
          { num: 4, label: 'Confirmación' },
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === s.num
                  ? 'bg-zinc-950 text-white'
                  : step > s.num
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-100 text-zinc-500'
              }`}
            >
              {step > s.num ? '✓' : s.num}
            </div>
            <span
              className={`hidden sm:inline text-xs font-semibold uppercase tracking-wider ${
                step === s.num ? 'text-zinc-950' : 'text-zinc-400'
              }`}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {errorMsg && (
        <div className="mb-6 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
          {errorMsg}
        </div>
      )}

      {/* PASO 1: Selección de Servicio */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-heading font-black text-zinc-950 mb-1">Selecciona el tipo de trabajo mecánico</h2>
          <p className="text-xs text-zinc-500 mb-6">
            Nuestros mecánicos certificados utilizan herramientas Park Tool y repuestos originales.
          </p>

          <div className="grid grid-cols-1 gap-3 mb-8">
            {servicesList.map((srv) => (
              <div
                key={srv.id}
                onClick={() => setSelectedService(srv.title)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex justify-between items-start ${
                  selectedService === srv.title
                    ? 'border-zinc-950 bg-zinc-50 ring-1 ring-zinc-950 shadow-xs'
                    : 'border-zinc-200 hover:border-zinc-400 bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-zinc-100 rounded-xl text-zinc-900 shrink-0 mt-0.5">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-950">{srv.title}</h3>
                    <p className="text-xs text-zinc-600 mt-0.5 leading-relaxed">{srv.description}</p>
                    <span className="inline-block mt-2 text-[11px] font-mono font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md">
                      Demora aprox: {srv.duration}
                    </span>
                  </div>
                </div>
                <span className="text-sm font-bold font-mono text-zinc-950 whitespace-nowrap ml-4">
                  {new Intl.NumberFormat('es-AR', {
                    style: 'currency',
                    currency: 'ARS',
                    maximumFractionDigits: 0,
                  }).format(srv.price)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="bg-zinc-950 text-white px-6 py-3 rounded-xl text-xs font-heading font-bold uppercase tracking-wider hover:bg-zinc-800 flex items-center gap-2 shadow-md"
            >
              Continuar al Día de Ingreso <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* PASO 2: Selección Directa de Fecha por Día */}
      {step === 2 && (
        <div>
          <h2 className="text-xl font-heading font-black text-zinc-950 mb-1">Selecciona el día de recepción en el taller</h2>
          <p className="text-xs text-zinc-500 mb-6">
            Elige el día que traerás tu bicicleta. Puedes acercarla en cualquier momento dentro de nuestro horario de atención.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 items-start">
            <div className="p-5 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3">
              <label className="text-xs font-heading font-bold uppercase tracking-wider text-zinc-800 block">
                <Calendar className="w-4 h-4 inline mr-1.5 text-zinc-700" /> Fecha / Día de Ingreso
              </label>
              <input
                type="date"
                required
                value={selectedDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full border border-zinc-300 rounded-xl px-4 py-3 text-sm font-bold font-mono focus:outline-none focus:border-zinc-950 bg-white"
              />
              <span className="text-[11px] text-zinc-500 block">
                Día seleccionado: <strong>{new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>
              </span>
            </div>

            <div className="p-5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3 text-xs text-emerald-950">
              <div className="flex items-center gap-2 font-heading font-bold uppercase text-emerald-900">
                <Clock className="w-4 h-4 text-emerald-700" />
                <span>Horarios de Atención de Taller</span>
              </div>
              <p className="leading-relaxed">
                Trae tu bicicleta el día seleccionado en cualquiera de estos horarios:
              </p>
              <ul className="space-y-1 font-mono text-[11px] font-medium text-emerald-900">
                <li>• <strong>Lunes a Viernes:</strong> 09:00 a 19:00 hs (Corrido)</li>
                <li>• <strong>Sábados:</strong> 09:00 a 13:00 hs</li>
              </ul>
              <div className="flex items-center gap-1.5 pt-2 text-[11px] text-emerald-800 border-t border-emerald-200">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>Bv. Nicasio Oroño 1234, Rosario</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="border border-zinc-300 text-zinc-700 px-5 py-2.5 rounded-xl text-xs font-heading font-bold uppercase hover:bg-zinc-50 flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Volver
            </button>
            <button
              type="button"
              disabled={!selectedDate}
              onClick={() => setStep(3)}
              className="bg-zinc-950 text-white px-6 py-3 rounded-xl text-xs font-heading font-bold uppercase tracking-wider hover:bg-zinc-800 disabled:opacity-40 flex items-center gap-2 shadow-md"
            >
              Continuar a Datos <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* PASO 3: Datos del Cliente y Bicicleta */}
      {step === 3 && (
        <form onSubmit={handleBookAppointment}>
          <h2 className="text-xl font-heading font-black text-zinc-950 mb-1">Datos del Cliente y Bicicleta</h2>
          <p className="text-xs text-zinc-500 mb-6">
            Detalla la marca y modelo de tu bicicleta y cualquier observación especial para el mecánico.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-heading font-bold uppercase text-zinc-700 block mb-1">Nombre Completo *</label>
              <input
                required
                type="text"
                placeholder="Ej. Juan Pérez"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                className="w-full border border-zinc-300 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-zinc-950 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-heading font-bold uppercase text-zinc-700 block mb-1">WhatsApp / Teléfono *</label>
              <input
                required
                type="tel"
                placeholder="Ej. 5493415551234"
                value={formData.clientPhone}
                onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                className="w-full border border-zinc-300 rounded-xl px-3.5 py-2.5 text-xs font-mono focus:border-zinc-950 focus:outline-none"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="text-xs font-heading font-bold uppercase text-zinc-700 block mb-1">Email de Contacto</label>
            <input
              type="email"
              placeholder="juan@ejemplo.com"
              value={formData.clientEmail}
              onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
              className="w-full border border-zinc-300 rounded-xl px-3.5 py-2.5 text-xs focus:border-zinc-950 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="text-xs font-heading font-bold uppercase text-zinc-700 block mb-1">Marca de Bicicleta</label>
              <input
                type="text"
                placeholder="Ej. Scott / Volta / Raleigh / Sars"
                value={formData.bikeBrand}
                onChange={(e) => setFormData({ ...formData, bikeBrand: e.target.value })}
                className="w-full border border-zinc-300 rounded-xl px-3.5 py-2.5 text-xs focus:border-zinc-950 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-heading font-bold uppercase text-zinc-700 block mb-1">Modelo / Versión</label>
              <input
                type="text"
                placeholder="Ej. Spark RC / Aspect 950 / Radix"
                value={formData.bikeModel}
                onChange={(e) => setFormData({ ...formData, bikeModel: e.target.value })}
                className="w-full border border-zinc-300 rounded-xl px-3.5 py-2.5 text-xs focus:border-zinc-950 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-heading font-bold uppercase text-zinc-700 block mb-1">Rodado</label>
              <select
                value={formData.wheelSize}
                onChange={(e) => setFormData({ ...formData, wheelSize: e.target.value })}
                className="w-full border border-zinc-300 rounded-xl px-3 py-2.5 text-xs font-bold focus:border-zinc-950 focus:outline-none"
              >
                <option value="29&quot;">29"</option>
                <option value="27.5&quot;">27.5"</option>
                <option value="26&quot;">26"</option>
                <option value="700c">700c (Ruta/Gravel)</option>
                <option value="20&quot;">20" (BMX/Kids)</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="text-xs font-heading font-bold uppercase text-zinc-700 block mb-1">Observaciones o Síntomas Mecánicos</label>
            <textarea
              rows={3}
              placeholder="Ej. Ruidos en la caja pedalera, cambios descalibrados, purga de frenos o cambio de pastillas..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full border border-zinc-300 rounded-xl px-3.5 py-2.5 text-xs focus:border-zinc-950 focus:outline-none"
            />
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="border border-zinc-300 text-zinc-700 px-5 py-2.5 rounded-xl text-xs font-heading font-bold uppercase hover:bg-zinc-50 flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Volver
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-zinc-950 text-white px-7 py-3 rounded-xl text-xs font-heading font-bold uppercase tracking-wider hover:bg-zinc-800 disabled:opacity-50 flex items-center gap-2 shadow-md"
            >
              {isSubmitting ? 'Agendando...' : 'Confirmar Turno'} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* PASO 4: Confirmación del Turno */}
      {step === 4 && confirmedBooking && (
        <div className="text-center py-6 animate-fadeIn">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-heading font-black text-zinc-950 mb-1">¡Turno Agendado con Éxito!</h2>
          <p className="text-xs text-zinc-500 mb-6">
            Te esperamos en Bv. Nicasio Oroño 1234 para recibir tu bicicleta.
          </p>

          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 text-left text-xs max-w-md mx-auto space-y-2 mb-6">
            <div className="flex justify-between border-b border-zinc-200 pb-2">
              <span className="text-zinc-500 font-bold uppercase text-[10px]">Código de Turno:</span>
              <strong className="font-mono text-zinc-950 font-black">{confirmedBooking.appointment_code}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Servicio:</span>
              <strong className="text-zinc-950">{confirmedBooking.service_type}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Día de Ingreso:</span>
              <strong className="font-mono text-zinc-950">{confirmedBooking.appointment_date}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Bicicleta:</span>
              <span className="text-zinc-900">{confirmedBooking.bike_brand} {confirmedBooking.bike_model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Cliente:</span>
              <span className="text-zinc-900">{confirmedBooking.client_name}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <a
              href={getWhatsAppConfirmationUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 text-white px-6 py-3 rounded-xl text-xs font-heading font-bold uppercase tracking-wider hover:bg-emerald-500 flex items-center justify-center gap-2 shadow-sm"
            >
              <MessageCircle className="w-4 h-4" /> Enviar Comprobante por WhatsApp
            </a>
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setConfirmedBooking(null);
              }}
              className="border border-zinc-300 text-zinc-700 px-5 py-3 rounded-xl text-xs font-heading font-bold uppercase hover:bg-zinc-50"
            >
              Agendar Otro Turno
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
