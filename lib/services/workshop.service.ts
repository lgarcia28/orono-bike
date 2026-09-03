import { createClient } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/server';
import { WorkshopAppointment } from '@/lib/supabase/types';

export interface CreateAppointmentDTO {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  serviceType: string;
  bikeBrand: string;
  bikeModel: string;
  wheelSize?: string;
  appointmentDate: string; // YYYY-MM-DD
  timeSlot: string;       // e.g. '09:00 - 11:00'
  clientNotes?: string;
}

export interface WorkshopServiceItem {
  id: string;
  title: string;
  description: string;
  duration: string;
  price: number;
}

export const DEFAULT_WORKSHOP_SERVICES: WorkshopServiceItem[] = [
  {
    id: 'service-general',
    title: 'Service General & Puesta a Punto',
    description: 'Ajuste integral de cambios, frenos, centrado de ruedas, lubricación de transmisión y torque de seguridad.',
    duration: '48 hs',
    price: 45000,
  },
  {
    id: 'calibracion-transmision',
    title: 'Calibración de Transmisión',
    description: 'Alineación de pata de cambio con calibre, regulación de topes H/L, tensión de cable o emparejamiento AXS/Di2.',
    duration: '24 hs',
    price: 22000,
  },
  {
    id: 'purga-frenos',
    title: 'Purga de Frenos Hidráulicos',
    description: 'Vaciado, purga con fluido mineral / DOT y reemplazo de pastillas para máxima potencia de frenado.',
    duration: '24 hs',
    price: 28000,
  },
  {
    id: 'mantenimiento-suspension',
    title: 'Mantenimiento de Suspensión (Horquilla / Shock)',
    description: 'Cambio de retenes SKF/Fox, aceite hidráulico, lubricación de botellas y presurización.',
    duration: '72 hs',
    price: 65000,
  },
  {
    id: 'tubelizado',
    title: 'Tubelizado & Carga de Sellante',
    description: 'Instalación de cinta tubeless de alta presión, válvulas y sellante Stan’s NoTubes.',
    duration: '24 hs',
    price: 20000,
  },
  {
    id: 'centrado-ruedas',
    title: 'Centrado y Tensión de Rayos',
    description: 'Nivelación lateral y radial con tensiómetro Park Tool y reemplazo de niples dañados.',
    duration: '24 hs',
    price: 18000,
  },
];

export class WorkshopService {
  /**
   * Obtiene la lista actual de servicios de taller
   */
  static getServices(): WorkshopServiceItem[] {
    if (typeof window === 'undefined') return DEFAULT_WORKSHOP_SERVICES;
    try {
      const stored = localStorage.getItem('orono_workshop_services');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading workshop services from localStorage:', e);
    }
    return DEFAULT_WORKSHOP_SERVICES;
  }

  /**
   * Guarda y sincroniza la lista de servicios en localStorage
   */
  static saveServices(services: WorkshopServiceItem[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('orono_workshop_services', JSON.stringify(services));
      window.dispatchEvent(new CustomEvent('workshopServicesUpdated', { detail: services }));
    } catch (e) {
      console.error('Error saving workshop services to localStorage:', e);
    }
  }

  /**
   * Agrega un nuevo servicio de taller
   */
  static addService(service: Omit<WorkshopServiceItem, 'id'>): WorkshopServiceItem {
    const list = this.getServices();
    const newService: WorkshopServiceItem = {
      ...service,
      id: `srv-${Date.now()}`,
    };
    const updated = [newService, ...list];
    this.saveServices(updated);
    return newService;
  }

  /**
   * Modifica un servicio existente
   */
  static updateService(id: string, updates: Partial<WorkshopServiceItem>): WorkshopServiceItem | null {
    const list = this.getServices();
    let target: WorkshopServiceItem | null = null;
    const updated = list.map((s) => {
      if (s.id === id) {
        target = { ...s, ...updates };
        return target;
      }
      return s;
    });
    if (target) {
      this.saveServices(updated);
    }
    return target;
  }

  /**
   * Elimina un servicio
   */
  static deleteService(id: string): void {
    const list = this.getServices();
    const updated = list.filter((s) => s.id !== id);
    this.saveServices(updated);
  }

  /**
   * Obtiene los turnos ocupados para una fecha dada para bloquear horarios
   */
  static async getBookedSlotsForDate(dateStr: string): Promise<string[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('workshop_appointments')
      .select('time_slot')
      .eq('appointment_date', dateStr)
      .neq('status', 'cancelled');

    if (error) {
      console.error('Error getting booked workshop slots:', error);
      return [];
    }

    return ((data as any[]) || []).map((row) => row.time_slot);
  }

  /**
   * Crea un nuevo turno de taller y genera su código único
   */
  static async bookAppointment(
    data: CreateAppointmentDTO
  ): Promise<{ success: boolean; appointment?: WorkshopAppointment; error?: string }> {
    const supabase = createClient();

    // Comprobar si el turno ya fue ocupado
    const booked = await this.getBookedSlotsForDate(data.appointmentDate);
    if (booked.includes(data.timeSlot)) {
      return { success: false, error: 'El horario seleccionado ya no se encuentra disponible.' };
    }

    const code = `TAL-${Date.now().toString().slice(-6)}`;

    const { data: appointment, error } = await (supabase
      .from('workshop_appointments') as any)
      .insert({
        appointment_code: code,
        client_name: data.clientName,
        client_phone: data.clientPhone,
        client_email: data.clientEmail,
        service_type: data.serviceType,
        bike_brand: data.bikeBrand,
        bike_model: data.bikeModel,
        wheel_size: data.wheelSize || null,
        appointment_date: data.appointmentDate,
        time_slot: data.timeSlot,
        status: 'pending_intake',
        client_notes: data.clientNotes || null,
      })
      .select()
      .single();

    if (error || !appointment) {
      console.error('Error booking workshop appointment:', error);
      return { success: false, error: error?.message || 'Error al agendar el turno' };
    }

    return { success: true, appointment };
  }

  /**
   * Lista todos los turnos para el panel Kanban de taller
   */
  static async getAllAppointments(): Promise<WorkshopAppointment[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('workshop_appointments')
      .select('*')
      .order('appointment_date', { ascending: true });

    if (error) {
      console.error('Error fetching workshop appointments:', error);
      return [];
    }

    return (data as unknown as WorkshopAppointment[]) || [];
  }

  /**
   * Actualiza el estado del turno (Kanban: pending_intake -> in_workshop -> ready_for_pickup -> delivered)
   */
  static async updateAppointmentStatus(
    appointmentId: string,
    newStatus: 'pending_intake' | 'in_workshop' | 'ready_for_pickup' | 'delivered' | 'cancelled'
  ): Promise<boolean> {
    const supabase = createClient();
    const { error } = await (supabase
      .from('workshop_appointments') as any)
      .update({ status: newStatus })
      .eq('id', appointmentId);

    if (error) {
      console.error('Error updating appointment status:', error);
      return false;
    }

    return true;
  }
}
