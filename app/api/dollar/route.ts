import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Cache por 5 minutos

export async function GET() {
  try {
    // 1. Consultar cotización oficial de DolarApi (Banco Nación / BNA Oficial)
    const res = await fetch('https://dolarapi.com/v1/dolares/oficial', {
      next: { revalidate: 300 },
    });

    if (res.ok) {
      const data = await res.json();
      // Tomamos el valor de venta del BNA
      const rate = data.venta || data.compra || 1485;
      return NextResponse.json({
        success: true,
        source: 'Banco Nación (BNA Oficial)',
        buy: data.compra,
        rate: Math.round(rate),
        updatedAt: data.fechaActualizacion || new Date().toISOString(),
      });
    }

    // 2. Fallback a Bluelytics
    const fallbackRes = await fetch('https://api.bluelytics.com.ar/v2/latest', {
      next: { revalidate: 300 },
    });
    if (fallbackRes.ok) {
      const fbData = await fallbackRes.json();
      const rate = fbData.oficial?.value_sell || 1485;
      return NextResponse.json({
        success: true,
        source: 'Banco Nación (Fallback)',
        rate: Math.round(rate),
        updatedAt: fbData.last_update || new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      source: 'Default',
      rate: 1485,
    });
  } catch (error: any) {
    console.warn('Error fetching BNA dollar rate:', error);
    return NextResponse.json({
      success: false,
      source: 'Default (Offline)',
      rate: 1485,
    });
  }
}
