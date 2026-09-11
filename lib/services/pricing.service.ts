export interface FinancingRate {
  installments: number; // 3, 6, 9, 12, 18, 24
  surchargePercent: number; // e.g. 10 for +10%
}

export interface PricingPolicySettings {
  defaultProfitMarginPercent: number; // 60% ganancia sobre costo
  cashDiscountLocalPercent: number;   // 20% descuento exclusivo en local físico
  usdExchangeRate: number;            // Cotización dólar (ej. Banco Nación)
  autoUpdateDollarBNA: boolean;       // Actualizar automáticamente con Banco Nación
  dollarLastUpdated?: string;         // Timestamp de última sincronización
  financingRates: FinancingRate[];
}

export const DEFAULT_PRICING_POLICY: PricingPolicySettings = {
  defaultProfitMarginPercent: 60,
  cashDiscountLocalPercent: 20,
  usdExchangeRate: 1535,
  autoUpdateDollarBNA: true,
  financingRates: [
    { installments: 3, surchargePercent: 10 },
    { installments: 6, surchargePercent: 15 },
    { installments: 9, surchargePercent: 25 },
    { installments: 12, surchargePercent: 35 },
    { installments: 18, surchargePercent: 50 },
    { installments: 24, surchargePercent: 65 },
  ],
};

const STORAGE_KEY = 'orono_pricing_policy';

export class PricingService {
  static getSettings(): PricingPolicySettings {
    if (typeof window === 'undefined') return DEFAULT_PRICING_POLICY;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_PRICING_POLICY, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Error reading pricing policy settings:', e);
    }
    return DEFAULT_PRICING_POLICY;
  }

  static saveSettings(settings: PricingPolicySettings): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      window.dispatchEvent(new Event('pricingPolicyUpdated'));
    } catch (e) {
      console.error('Error saving pricing policy:', e);
    }
  }

  /**
   * Consulta la cotización oficial del Banco Nación en vivo y actualiza settings si está activo.
   */
  static async fetchBNADollarRate(): Promise<{ success: boolean; rate: number; source: string }> {
    try {
      const res = await fetch('/api/dollar');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      if (data.rate) {
        const current = this.getSettings();
        if (current.autoUpdateDollarBNA) {
          this.saveSettings({
            ...current,
            usdExchangeRate: data.rate,
            dollarLastUpdated: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
          });
        }
        return { success: true, rate: data.rate, source: data.source || 'Banco Nación' };
      }
    } catch (e) {
      console.warn('Could not fetch BNA dollar:', e);
    }
    return { success: false, rate: this.getSettings().usdExchangeRate, source: 'Local' };
  }

  /**
   * Calcula el precio para Débito / Transferencia a partir del costo.
   * Precio = Costo * (1 + margin / 100)
   */
  static calculateTransferPriceFromCost(cost: number, marginPercent?: number): number {
    const margin = marginPercent ?? this.getSettings().defaultProfitMarginPercent;
    return Math.round(cost * (1 + margin / 100));
  }

  /**
   * Calcula el precio en efectivo exclusivo para local físico (-20%).
   */
  static calculateLocalCashPrice(debitTransferPrice: number): number {
    const discount = this.getSettings().cashDiscountLocalPercent;
    return Math.round(debitTransferPrice * (1 - discount / 100));
  }

  /**
   * Calcula el precio en dólares a partir de la cotización configurada.
   */
  static calculateUsdPrice(debitTransferPrice: number): { usd: number; rate: number } {
    const rate = this.getSettings().usdExchangeRate || 1420;
    return {
      usd: Math.round(debitTransferPrice / rate),
      rate,
    };
  }

  /**
   * Calcula el plan de financiación en cuotas con Mercado Pago para la ficha de producto.
   */
  static calculateFinancingPlan(debitTransferPrice: number) {
    const { financingRates } = this.getSettings();
    return financingRates.map((rate) => {
      const totalAmount = Math.round(debitTransferPrice * (1 + rate.surchargePercent / 100));
      const installmentAmount = Math.round(totalAmount / rate.installments);
      return {
        installments: rate.installments,
        installmentAmount,
        totalAmount,
        surchargePercent: rate.surchargePercent,
      };
    });
  }
}
