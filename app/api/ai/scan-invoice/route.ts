import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface InvoiceExtractedItem {
  description: string;
  code?: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

interface InvoiceExtractedData {
  supplierName: string;
  supplierCuit?: string;
  invoiceNumber: string;
  invoiceDate: string;
  paymentMethod?: 'Transferencia' | 'Efectivo' | 'Crédito' | 'Débito';
  items: InvoiceExtractedItem[];
  totalAmount: number;
  notes?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, mimeType = 'image/jpeg', userApiKey } = body;

    const apiKey = userApiKey?.trim() || process.env.GEMINI_API_KEY?.trim();

    // Si no hay API Key configurada y se pide demostración o no hay imagen válida
    if (!apiKey) {
      // Modo Demostración inteligente para probar el flujo sin trabas
      return NextResponse.json({
        success: true,
        isDemo: true,
        message: 'Modo demostración activo: Para usar lectura en vivo real con tus fotos, ingresá tu clave gratuita de Google AI Studio.',
        data: {
          supplierName: 'Dalsanto Scott Argentina SA',
          supplierCuit: '30-70891234-5',
          invoiceNumber: `FC-0003-00${Math.floor(100000 + Math.random() * 900000)}`,
          invoiceDate: new Date().toISOString().slice(0, 10),
          paymentMethod: 'Transferencia',
          items: [
            {
              description: 'Scott Spark RC World Cup EVO AXS Talle M',
              code: 'SC-SPK-RC-M-PRP',
              quantity: 2,
              unitCost: 5800000,
              subtotal: 11600000,
            },
            {
              description: 'Cadena Shimano XT 12 Velocidades M8100',
              code: 'SHI-XT-12V-34T',
              quantity: 4,
              unitCost: 95000,
              subtotal: 380000,
            },
            {
              description: 'Pedales Shimano XT PD-M8100 SPD',
              code: 'SHI-PD-M8100',
              quantity: 3,
              unitCost: 140000,
              subtotal: 420000,
            },
          ],
          totalAmount: 12400000,
          notes: 'Factura procesada en modo demostración. Podés configurar tu clave gratuita de Google Gemini para leer cualquier foto o PDF real.',
        } as InvoiceExtractedData,
      });
    }

    if (!imageBase64) {
      return NextResponse.json(
        { success: false, error: 'No se recibió ninguna imagen o archivo para procesar.' },
        { status: 400 }
      );
    }

    // Limpiar prefijo data:image/...;base64, si viene incluido
    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');

    const prompt = `
Actúa como un sistema experto en contabilidad y digitalización de comprobantes comerciales para Argentina (facturas electrónicas AFIP A, B, C, M, remitos y órdenes de compra).
Analiza detalladamente la imagen o documento adjunto de la factura/remito.

Extrae con la máxima precisión posible los siguientes datos en un formato JSON ESTRICTO:
1. "supplierName": Nombre comercial o Razón Social del emisor / proveedor.
2. "supplierCuit": CUIT del emisor si está visible (formato 20-XXXXXXXX-X o 30-XXXXXXXX-X).
3. "invoiceNumber": Número del comprobante completo (por ejemplo: "0001-00049281", "FC-0002-00012345", o número de remito).
4. "invoiceDate": Fecha de emisión en formato "YYYY-MM-DD" (si el año tiene 2 dígitos, asume 20XX).
5. "paymentMethod": Deducir medio de pago entre: "Transferencia", "Efectivo", "Crédito", "Débito" (por defecto "Transferencia").
6. "items": Lista con CADA UNO de los artículos o ítems detallados en el cuerpo de la factura:
   - "description": Nombre o descripción del artículo tal como figura.
   - "code": Código interno, SKU o código de barra si aparece en la columna de código.
   - "quantity": Cantidad de unidades facturadas (número entero o decimal).
   - "unitCost": Precio unitario neto o costo unitario del ítem sin signos pesos (número).
   - "subtotal": Subtotal o importe total del renglón (número).
7. "totalAmount": Importe total final de la factura (número).
8. "notes": Cualquier observación relevante del comprobante (por ejemplo si figura CAE, vencimiento, o transporte).

RESPONDE ÚNICAMENTE CON EL OBJETO JSON VÁLIDO. No agregues bloques de código markdown ni texto antes o después.
`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const geminiPayload = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: cleanBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        response_mime_type: 'application/json',
      },
    };

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Error desde API de Gemini:', response.status, errText);
      return NextResponse.json(
        {
          success: false,
          error: `Error al consultar Gemini (${response.status}): ${errText.slice(0, 200)}`,
        },
        { status: 500 }
      );
    }

    const result = await response.json();
    const candidateText = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      return NextResponse.json(
        { success: false, error: 'Gemini no pudo interpretar la imagen proporcionada.' },
        { status: 422 }
      );
    }

    // Limpiar posible formato markdown en la respuesta
    const jsonStr = candidateText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedData: InvoiceExtractedData = JSON.parse(jsonStr);

    return NextResponse.json({
      success: true,
      isDemo: false,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Error procesando factura con IA:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno al procesar el comprobante con IA.' },
      { status: 500 }
    );
  }
}
