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
}
