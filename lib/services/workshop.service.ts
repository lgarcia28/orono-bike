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

export class WorkshopService {
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
    id: string,
    status: WorkshopAppointment['status'],
    diagnosis?: string,
    estimatedCost?: number
  ): Promise<boolean> {
    const supabase = createAdminClient();
    const { error } = await (supabase
      .from('workshop_appointments') as any)
      .update({
        status,
        mechanic_diagnosis: diagnosis,
        estimated_cost: estimatedCost,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating appointment status:', error);
      return false;
    }
    return true;
  }
}
