import { NextRequest, NextResponse } from 'next/server';
import { EmailService, SendInvoiceEmailParams } from '@/lib/services/email.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, customerName, invoiceNumber, invoiceType, date, totalAmount, paymentMethod, items, cae, caeVto, notes } = body;

    if (!to || !to.includes('@')) {
      return NextResponse.json(
        { error: 'Debe proporcionar una dirección de email válida.' },
        { status: 400 }
      );
    }

    if (!invoiceNumber || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Datos de la factura incompletos para el envío.' },
        { status: 400 }
      );
    }

    const emailParams: SendInvoiceEmailParams = {
      to: to.trim(),
      customerName: customerName || 'Estimado/a Cliente',
      invoiceNumber,
      invoiceType: invoiceType || 'B',
      date: date || new Date().toISOString().slice(0, 10),
      totalAmount: Number(totalAmount) || 0,
      paymentMethod: paymentMethod || 'Efectivo',
      items: items.map((it: any) => ({
        title: it.title || it.productTitle || 'Artículo',
        variantDetails: it.variantDetails || '',
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice) || 0,
        subtotal: Number(it.subtotal) || 0,
      })),
      cae,
      caeVto,
      notes,
    };

    const result = await EmailService.sendInvoiceEmail(emailParams);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error en /api/invoices/send-email:', error);
    return NextResponse.json(
      { error: error?.message || 'Error interno al enviar la factura por email' },
      { status: 500 }
    );
  }
}
