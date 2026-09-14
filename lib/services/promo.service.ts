export interface PromoPopupSettings {
  enabled: boolean;
  title: string;
  subtitle: string;
  badgeText: string;
  benefitType: 'discount' | 'gift';
  discountPercent: number;
  giftItemName: string;
  couponCode: string;
  delaySeconds: number;
  imageUrl?: string;
  firstPurchaseOnly: boolean;
}

export interface PromoSubscriber {
  id: string;
  email: string;
  subscribedAt: string;
  couponCode: string;
}

export const DEFAULT_PROMO_SETTINGS: PromoPopupSettings = {
  enabled: true,
  title: '¡10% OFF EN TU PRIMERA COMPRA!',
  subtitle: 'Dejanos tu email y recibí tu cupón exclusivo para usar en tu próxima bicicleta o accesorios en Oroño Bike.',
  badgeText: 'BENEFICIO EXCLUSIVO',
  benefitType: 'discount',
  discountPercent: 10,
  giftItemName: 'Luz LED Trasera Recargable USB',
  couponCode: 'BIENVENIDO10',
  delaySeconds: 6,
  imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80',
  firstPurchaseOnly: true,
};

const SETTINGS_KEY = 'orono_promo_popup_settings';
const SUBSCRIBERS_KEY = 'orono_promo_subscribers';

export class PromoService {
  static getSettings(): PromoPopupSettings {
    if (typeof window === 'undefined') return DEFAULT_PROMO_SETTINGS;
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        return { ...DEFAULT_PROMO_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Error loading promo settings:', e);
    }
    return DEFAULT_PROMO_SETTINGS;
  }

  static saveSettings(settings: PromoPopupSettings): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      window.dispatchEvent(new Event('promoSettingsUpdated'));
    } catch (e) {
      console.error('Error saving promo settings:', e);
    }
  }

  static getSubscribers(): PromoSubscriber[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(SUBSCRIBERS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Error loading subscribers:', e);
    }
    return [];
  }

  static addSubscriber(email: string): { success: boolean; couponCode: string; message: string } {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, couponCode: '', message: 'Por favor ingresá un email válido.' };
    }

    const settings = this.getSettings();
    const currentList = this.getSubscribers();

    const exists = currentList.find((s) => s.email === cleanEmail);
    if (!exists) {
      const newSub: PromoSubscriber = {
        id: `SUB-${Date.now()}`,
        email: cleanEmail,
        subscribedAt: new Date().toLocaleString('es-AR'),
        couponCode: settings.couponCode,
      };
      const updatedList = [newSub, ...currentList];
      if (typeof window !== 'undefined') {
        localStorage.setItem(SUBSCRIBERS_KEY, JSON.stringify(updatedList));
        window.dispatchEvent(new Event('promoSubscribersUpdated'));
      }
    }

    return {
      success: true,
      couponCode: settings.couponCode,
      message: '¡Te suscribiste con éxito!',
    };
  }

  static deleteSubscriber(id: string): void {
    if (typeof window === 'undefined') return;
    const currentList = this.getSubscribers();
    const updated = currentList.filter((s) => s.id !== id);
    localStorage.setItem(SUBSCRIBERS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('promoSubscribersUpdated'));
  }

  /**
   * Verifica si un cliente ya tiene compras registradas en el sistema (por email o DNI/CUIT).
   * Revisa:
   * 1. Lista de clientes históricos (orono_customers).
   * 2. Registro local de compradores previos (orono_past_buyers).
   */
  static isCustomerFirstTimeBuyer(email?: string, docNumber?: string): { isFirstTime: boolean; reason?: string } {
    if (typeof window === 'undefined') return { isFirstTime: true };

    const cleanEmail = email?.trim().toLowerCase() || '';
    const cleanDoc = docNumber?.replace(/[^0-9]/g, '') || '';

    // 1. Verificar en orono_customers
    try {
      const storedCusts = localStorage.getItem('orono_customers');
      if (storedCusts) {
        const customers = JSON.parse(storedCusts);
        if (Array.isArray(customers)) {
          const match = customers.find((c: any) => {
            const matchEmail = cleanEmail && c.email && c.email.trim().toLowerCase() === cleanEmail;
            const matchDoc = cleanDoc && c.doc && c.doc.replace(/[^0-9]/g, '') === cleanDoc;
            const hasPurchases = (c.purchases && c.purchases.length > 0) || (c.totalSpent && c.totalSpent > 0);
            return (matchEmail || matchDoc) && hasPurchases;
          });

          if (match) {
            return {
              isFirstTime: false,
              reason: `El cliente con ${match.email === cleanEmail ? `el email "${cleanEmail}"` : `documento "${docNumber}"`} ya registra compras anteriores en el sistema.`,
            };
          }
        }
      }
    } catch (e) {
      console.warn('Error checking customers for first-time discount:', e);
    }

    // 2. Verificar en orono_past_buyers (compras web registradas localmente)
    try {
      const storedBuyers = localStorage.getItem('orono_past_buyers');
      if (storedBuyers) {
        const buyers: Array<{ email?: string; doc?: string; orderNumber?: string; date?: string }> = JSON.parse(storedBuyers);
        if (Array.isArray(buyers)) {
          const buyerMatch = buyers.find((b) => {
            const matchEmail = cleanEmail && b.email && b.email.trim().toLowerCase() === cleanEmail;
            const matchDoc = cleanDoc && b.doc && b.doc.replace(/[^0-9]/g, '') === cleanDoc;
            return matchEmail || matchDoc;
          });

          if (buyerMatch) {
            return {
              isFirstTime: false,
              reason: `Ya registrás una compra previa con nosotros (${buyerMatch.email === cleanEmail ? cleanEmail : docNumber}). Este beneficio es exclusivo para nuevos clientes.`,
            };
          }
        }
      }
    } catch (e) {}

    return { isFirstTime: true };
  }

  /**
   * Guarda un comprador en la lista de compradores para que no pueda reutilizar el cupón de bienvenida
   */
  static recordBuyer(email: string, docNumber?: string, orderNumber?: string): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('orono_past_buyers');
      const list: Array<{ email?: string; doc?: string; orderNumber?: string; date?: string }> = stored ? JSON.parse(stored) : [];
      list.push({
        email: email.trim().toLowerCase(),
        doc: docNumber ? docNumber.replace(/[^0-9]/g, '') : undefined,
        orderNumber,
        date: new Date().toISOString(),
      });
      localStorage.setItem('orono_past_buyers', JSON.stringify(list));
    } catch (e) {
      console.error('Error recording buyer:', e);
    }
  }
}
