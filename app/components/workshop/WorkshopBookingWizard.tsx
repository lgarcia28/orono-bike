'use client';

import React, { useState, useEffect } from 'react';
import { WorkshopService } from '@/lib/services/workshop.service';
import { Wrench, Calendar, Clock, Bike, CheckCircle2, ChevronRight, ChevronLeft, MessageCircle } from 'lucide-react';

const WORKSHOP_SERVICES = [
  {
    id: 'service-general',
    title: 'Service General & Puesta a Punto',
    description: 'Ajuste integral de cambios, frenos, centrado de ruedas, lubricación de transmisión y torque de seguridad.',
    duration: '48 hs',
    price: '$ 45.000',
  },
  {
    id: 'calibracion-transmision',
    title: 'Calibración de Transmisión',
    description: 'Alineación de pata de cambio con calibre, regulación de topes H/L, tensión de cable o emparejamiento AXS/Di2.',
    duration: '24 hs',
    price: '$ 22.000',
  },
  {
    id: 'purga-frenos',
    title: 'Purga de Frenos Hidráulicos',
    description: 'Vaciado, purga con fluido mineral / DOT y reemplazo de pastillas para máxima potencia de frenado.',
    duration: '24 hs',
    price: '$ 28.000',
  },
  {
    id: 'mantenimiento-suspension',
    title: 'Mantenimiento de Suspensión (Horquilla / Shock)',
    description: 'Cambio de retenes SKF/Fox, aceite hidráulico, lubricación de botellas y presurización.',
    duration: '72 hs',
    price: '$ 65.000',
  },
  {
    id: 'tubelizado',
    title: 'Tubelizado & Carga de Sellante',
    description: 'Instalación de cinta tubeless de alta presión, válvulas y sellante Stan’s NoTubes.',
    duration: '24 hs',
    price: '$ 20.000',
  },
];

const TIME_SLOTS = [
  '09:00 - 11:00',
  '11:00 - 13:00',
  '15:00 - 17:00',
  '17:00 - 19:00',
];

export function WorkshopBookingWizard() {
  const [step, setStep] = useState<number>(1);
  const [selectedService, setSelectedService] = useState<string>(WORKSHOP_SERVICES[0].title);
  
  // Próximas fechas hábiles disponibles (próximos 7 días hábiles)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  
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

  // Cargar slots reservados al cambiar la fecha
  useEffect(() => {
    if (selectedDate) {
      WorkshopService.getBookedSlotsForDate(selectedDate).then((slots) => {
        setBookedSlots(slots);
        if (slots.includes(selectedSlot)) {
          setSelectedSlot('');
        }
      });
    }
  }, [selectedDate]);

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName || !formData.clientPhone || !selectedSlot) {
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
      bikeBrand: formData.bikeBrand,
      bikeModel: formData.bikeModel,
      wheelSize: formData.wheelSize,
      appointmentDate: selectedDate,
      timeSlot: selectedSlot,
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
    const text = `¡Hola Oroño Bike! Confirmé mi turno de taller:
📋 Código: ${confirmedBooking.appointment_code}
🔧 Servicio: ${confirmedBooking.service_type}
📅 Fecha: ${confirmedBooking.appointment_date} (${confirmedBooking.time_slot})
🚴 Bicicleta: ${confirmedBooking.bike_brand} ${confirmedBooking.bike_model} (Rod. ${confirmedBooking.wheel_size})
👤 Cliente: ${confirmedBooking.client_name}`;
    return `https://wa.me/${basePhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white border border-zinc-200 rounded-lg shadow-sm p-6 lg:p-8">
      {/* Stepper Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-6 mb-8">
        {[
          { num: 1, label: 'Servicio' },
          { num: 2, label: 'Fecha y Hora' },
          { num: 3, label: 'Bicicleta' },
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
        <div className="mb-6 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-md">
          {errorMsg}
        </div>
      )}

      {/* PASO 1: Selección de Servicio */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-bold text-zinc-950 mb-2">Selecciona el tipo de trabajo mecánico</h2>
          <p className="text-xs text-zinc-500 mb-6">
            Nuestros mecánicos certificados utilizan herramientas Park Tool y repuestos originales.
          </p>

          <div className="grid grid-cols-1 gap-3 mb-8">
            {WORKSHOP_SERVICES.map((srv) => (
              <div
                key={srv.id}
                onClick={() => setSelectedService(srv.title)}
                className={`p-4 rounded-md border cursor-pointer transition-all flex justify-between items-start ${
                  selectedService === srv.title
                    ? 'border-zinc-950 bg-zinc-50 ring-1 ring-zinc-950'
                    : 'border-zinc-200 hover:border-zinc-400 bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Wrench className="w-5 h-5 text-zinc-800 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-950">{srv.title}</h3>
                    <p className="text-xs text-zinc-600 mt-0.5">{srv.description}</p>
                    <span className="inline-block mt-2 text-[11px] font-mono text-zinc-500 bg-zinc-200/60 px-2 py-0.5 rounded">
                      Demora aprox: {srv.duration}
                    </span>
                  </div>
                </div>
                <span className="text-sm font-bold font-mono text-zinc-950 whitespace-nowrap ml-4">
                  {srv.price}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="bg-zinc-950 text-white px-6 py-3 rounded-md text-sm font-semibold hover:bg-zinc-800 flex items-center gap-2"
            >
              Continuar a Fecha y Hora <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* PASO 2: Selección de Fecha y Franja Horaria */}
      {step === 2 && (
        <div>
          <h2 className="text-xl font-bold text-zinc-950 mb-2">Selecciona día y horario de recepción</h2>
          <p className="text-xs text-zinc-500 mb-6">
            Ingreso en el local de Bv. Nicasio Oroño 1234, Rosario.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-800 block mb-2">
                Fecha de Ingreso
              </label>
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full border border-zinc-300 rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-zinc-950"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-800 block mb-2">
                Franja Horaria Disponible
              </label>
              <div className="grid grid-cols-1 gap-2">
                {TIME_SLOTS.map((slot) => {
                  const isBooked = bookedSlots.includes(slot);
                  const isSelected = selectedSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={isBooked}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-3 text-xs font-medium rounded-md border flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-zinc-950 text-white border-zinc-950'
                          : isBooked
                          ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed line-through'
                          : 'bg-white text-zinc-900 border-zinc-300 hover:border-zinc-900'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" /> {slot}
                      </span>
                      <span>{isBooked ? 'Ocupado' : 'Disponible'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="border border-zinc-300 text-zinc-700 px-5 py-2.5 rounded-md text-sm font-medium hover:border-zinc-900 flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Volver
            </button>
            <button
              type="button"
              disabled={!selectedSlot}
              onClick={() => setStep(3)}
              className="bg-zinc-950 text-white px-6 py-3 rounded-md text-sm font-semibold hover:bg-zinc-800 disabled:opacity-40 flex items-center gap-2"
            >
              Continuar a Datos <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* PASO 3: Datos del Cliente y Bicicleta */}
      {step === 3 && (
        <form onSubmit={handleBookAppointment}>
          <h2 className="text-xl font-bold text-zinc-950 mb-2">Datos del Cliente y Bicicleta</h2>
          <p className="text-xs text-zinc-500 mb-6">
            Detalla el estado y componentes especiales para el mecánico.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Nombre Completo *</label>
              <input
                required
                type="text"
                placeholder="Ej. Juan Pérez"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:border-zinc-950 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">WhatsApp / Teléfono *</label>
              <input
                required
                type="tel"
                placeholder="Ej. 3415123456"
                value={formData.clientPhone}
                onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:border-zinc-950 focus:outline-none"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Email de Contacto</label>
            <input
              type="email"
              placeholder="juan@ejemplo.com"
              value={formData.clientEmail}
              onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
              className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:border-zinc-950 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Marca de la Bici *</label>
              <input
                required
                type="text"
                placeholder="Ej. Specialized / Trek / Scott"
                value={formData.bikeBrand}
                onChange={(e) => setFormData({ ...formData, bikeBrand: e.target.value })}
                className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:border-zinc-950 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Modelo *</label>
              <input
                required
                type="text"
                placeholder="Ej. Epic Pro / Scale 930"
                value={formData.bikeModel}
                onChange={(e) => setFormData({ ...formData, bikeModel: e.target.value })}
                className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:border-zinc-950 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Rodado</label>
              <select
                value={formData.wheelSize}
                onChange={(e) => setFormData({ ...formData, wheelSize: e.target.value })}
                className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm bg-white focus:border-zinc-950 focus:outline-none"
              >
                <option value="29&quot;">29"</option>
                <option value="28&quot; / 700c">28" / 700c</option>
                <option value="27.5&quot;">27.5"</option>
                <option value="26&quot;">26"</option>
              </select>
            </div>
          </div>

          <div className="mb-8">
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Ruidos, fallas o indicaciones para el taller</label>
            <textarea
              rows={3}
              placeholder="Ej. Hace ruido en la caja pedalera al pedalear con fuerza; purgar freno trasero."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:border-zinc-950 focus:outline-none"
            />
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="border border-zinc-300 text-zinc-700 px-5 py-2.5 rounded-md text-sm font-medium hover:border-zinc-900 flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Volver
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-zinc-950 text-white px-6 py-3 rounded-md text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? 'Agendando...' : 'Confirmar Reserva de Turno'}
            </button>
          </div>
        </form>
      )}

      {/* PASO 4: Confirmación & Link WhatsApp */}
      {step === 4 && confirmedBooking && (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-950 mb-2">¡Turno Agendado con Éxito!</h2>
          <p className="text-xs text-zinc-600 max-w-md mx-auto mb-6">
            Te esperamos en nuestro local en Rosario el día y horario pactado. Tu código de seguimiento es:
          </p>

          <div className="inline-block bg-zinc-100 border border-zinc-300 px-6 py-3 rounded-md font-mono text-lg font-bold text-zinc-950 mb-8 tracking-wider">
            {confirmedBooking.appointment_code}
          </div>

          <div className="bg-zinc-50 border border-zinc-200 rounded-md p-4 text-left text-xs text-zinc-700 max-w-md mx-auto mb-8 space-y-2">
            <div className="flex justify-between">
              <span className="font-semibold text-zinc-500">Servicio:</span>
              <span className="font-medium text-zinc-900">{confirmedBooking.service_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-zinc-500">Fecha & Franja:</span>
              <span className="font-medium text-zinc-900">{confirmedBooking.appointment_date} ({confirmedBooking.time_slot})</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-zinc-500">Bicicleta:</span>
              <span className="font-medium text-zinc-900">{confirmedBooking.bike_brand} {confirmedBooking.bike_model}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <a
              href={getWhatsAppConfirmationUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] text-white px-6 py-3.5 rounded-md font-semibold text-sm hover:bg-[#1EBE5D] flex items-center gap-2 shadow-sm transition-all"
            >
              <MessageCircle className="w-5 h-5 fill-white" />
              Notificar Turno por WhatsApp
            </a>
            <button
              type="button"
              onClick={() => {
                setConfirmedBooking(null);
                setStep(1);
              }}
              className="border border-zinc-300 text-zinc-700 px-5 py-3 rounded-md text-sm font-medium hover:border-zinc-950"
            >
              Agendar otro servicio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
