import nodemailer from 'nodemailer';

export interface InvoiceEmailItem {
  title: string;
  variantDetails?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface SendInvoiceEmailParams {
  to: string;
  customerName: string;
  invoiceNumber: string;
  invoiceType?: 'A' | 'B' | 'C' | 'REM';
  date: string;
  totalAmount: number;
  paymentMethod: string;
  items: InvoiceEmailItem[];
  cae?: string;
  caeVto?: string;
  notes?: string;
}

export class EmailService {
  /**
   * Crea el transportador de correo usando Gmail SMTP
   */
  private static getTransporter() {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, ''); // Quita espacios si se pegó con espacios

    if (!user || !pass) {
      return null;
    }

    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });
  }

  /**
   * Genera el diseño HTML profesional y responsivo para el email de la factura
   */
  private static generateInvoiceHtml(params: SendInvoiceEmailParams): string {
    const formatCurrency = (val: number) => {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0,
      }).format(val);
    };

    const typeLabel =
      params.invoiceType === 'A'
        ? 'FACTURA ELECTRÓNICA A'
        : params.invoiceType === 'REM'
        ? 'REMITO OFICIAL DE ENTREGA'
        : 'FACTURA ELECTRÓNICA B';

    const itemsRows = params.items
      .map(
        (it) => `
        <tr>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e4e4e7; font-size: 13px; color: #18181b;">
            <strong>${it.title}</strong>
            ${it.variantDetails ? `<br/><span style="font-size: 11px; color: #71717a;">${it.variantDetails}</span>` : ''}
          </td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e4e4e7; font-size: 13px; text-align: center; color: #18181b; font-family: monospace;">
            ${it.quantity} u.
          </td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e4e4e7; font-size: 13px; text-align: right; color: #18181b; font-family: monospace;">
            ${formatCurrency(it.unitPrice)}
          </td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e4e4e7; font-size: 13px; text-align: right; font-weight: bold; color: #18181b; font-family: monospace;">
            ${formatCurrency(it.subtotal)}
          </td>
        </tr>
      `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Factura de Compra - OROÑO BIKE</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 24px 12px;">
          <tr>
            <td align="center">
              <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e4e4e7;">
                
                <!-- Header con Identidad OROÑO BIKE -->
                <tr>
                  <td style="background-color: #09090b; padding: 28px 32px; text-align: center;">
                    <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">
                      OROÑO BIKE
                    </h1>
                    <p style="margin: 4px 0 0 0; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #a1a1aa;">
                      Bicicletería, Taller & Boutique Ciclista · Rosario
                    </p>
                  </td>
                </tr>

                <!-- Franja de Confirmación -->
                <tr>
                  <td style="background-color: #059669; padding: 10px 24px; text-align: center;">
                    <span style="color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                      ✓ Comprobante Fiscal Oficial Emitido
                    </span>
                  </td>
                </tr>

                <!-- Cuerpo Principal -->
                <tr>
                  <td style="padding: 32px;">
                    <h2 style="margin: 0 0 8px 0; font-size: 18px; color: #09090b;">
                      ¡Hola ${params.customerName}!
                    </h2>
                    <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 1.5; color: #52525b;">
                      Te confirmamos que tu compra fue procesada con éxito. A continuación te adjuntamos el detalle de tu <strong>${typeLabel}</strong> con validez fiscal oficial.
                    </p>

                    <!-- Tarjeta de Datos de la Factura -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 14px; padding: 16px; margin-bottom: 24px;">
                      <tr>
                        <td width="50%" style="vertical-align: top; padding: 4px 8px;">
                          <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #71717a; display: block;">
                            Comprobante:
                          </span>
                          <strong style="font-size: 14px; font-family: monospace; color: #09090b;">
                            N° ${params.invoiceNumber}
                          </strong>
                        </td>
                        <td width="50%" style="vertical-align: top; padding: 4px 8px;">
                          <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #71717a; display: block;">
                            Fecha de Emisión:
                          </span>
                          <span style="font-size: 13px; font-weight: 600; color: #18181b;">
                            ${params.date}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%" style="vertical-align: top; padding: 10px 8px 4px 8px;">
                          <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #71717a; display: block;">
                            Medio de Pago:
                          </span>
                          <span style="font-size: 13px; font-weight: 600; color: #18181b;">
                            ${params.paymentMethod}
                          </span>
                        </td>
                        <td width="50%" style="vertical-align: top; padding: 10px 8px 4px 8px;">
                          ${
                            params.cae
                              ? `
                            <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #059669; display: block;">
                              CAE AFIP/ARCA:
                            </span>
                            <span style="font-size: 12px; font-family: monospace; font-weight: 700; color: #059669;">
                              ${params.cae}
                            </span>
                          `
                              : `
                            <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #71717a; display: block;">
                              Estado:
                            </span>
                            <span style="font-size: 12px; font-weight: 600; color: #18181b;">
                              Aprobado
                            </span>
                          `
                          }
                        </td>
                      </tr>
                    </table>

                    <!-- Tabla de Artículos -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; border-collapse: collapse;">
                      <thead>
                        <tr style="background-color: #f4f4f5; text-transform: uppercase; font-size: 10px; color: #71717a; font-weight: 700;">
                          <th style="padding: 8px; text-align: left; border-radius: 8px 0 0 8px;">Artículo</th>
                          <th style="padding: 8px; text-align: center;">Cant</th>
                          <th style="padding: 8px; text-align: right;">Unitario</th>
                          <th style="padding: 8px; text-align: right; border-radius: 0 8px 8px 0;">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsRows}
                      </tbody>
                    </table>

                    <!-- Total Factura -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                      <tr>
                        <td align="right">
                          <table border="0" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="padding: 4px 12px; font-size: 13px; color: #52525b; font-weight: 600;">
                                Total Abonado:
                              </td>
                              <td style="padding: 4px 16px; font-size: 20px; font-weight: 900; color: #059669; font-family: monospace; background-color: #ecfdf5; border-radius: 10px;">
                                ${formatCurrency(params.totalAmount)}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    ${
                      params.notes
                        ? `
                      <div style="background-color: #f4f4f5; border-left: 3px solid #09090b; padding: 10px 14px; margin-bottom: 24px; font-size: 12px; color: #52525b;">
                        <strong>Observaciones:</strong> ${params.notes}
                      </div>
                    `
                        : ''
                    }

                    <!-- Información de Garantía y Local -->
                    <div style="background-color: #fafafa; border: 1px dashed #d4d4d8; border-radius: 12px; padding: 16px; text-align: center;">
                      <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #18181b;">
                        🚴‍♂️ Garantía Oficial OROÑO BIKE & 1° Service Gratuito
                      </p>
                      <p style="margin: 0; font-size: 11px; line-height: 1.4; color: #71717a;">
                        Todas nuestras bicicletas incluyen garantía oficial de fábrica y ajuste gratuito a los 30 días en nuestro taller especializado.
                      </p>
                    </div>

                  </td>
                </tr>

                <!-- Footer del Email -->
                <tr>
                  <td style="background-color: #f4f4f5; padding: 20px 32px; text-align: center; border-top: 1px solid #e4e4e7;">
                    <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 700; color: #27272a;">
                      OROÑO BIKE · Rosario, Santa Fe
                    </p>
                    <p style="margin: 0 0 8px 0; font-size: 11px; color: #71717a;">
                      Bv. Nicasio Oroño 1234 · WhatsApp: +54 9 341 555-1234
                    </p>
                    <p style="margin: 0; font-size: 10px; color: #a1a1aa;">
                      Este es un correo automático de facturación fiscal generado por el sistema de OROÑO BIKE.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Envía la factura por correo electrónico al cliente usando Gmail SMTP
   */
  static async sendInvoiceEmail(params: SendInvoiceEmailParams): Promise<{
    success: boolean;
    simulated: boolean;
    message: string;
    messageId?: string;
  }> {
    try {
      const transporter = this.getTransporter();
      const htmlContent = this.generateInvoiceHtml(params);

      // Si aún no se configuró la cuenta de Gmail en el archivo .env, operamos en modo simulación
      if (!transporter) {
        console.log(
          `[EmailService] Modo Simulación/Configuración Pendiente:\n` +
            `Factura: ${params.invoiceNumber} -> Destinatario: ${params.to} (${params.customerName})\n` +
            `Para activar el envío real por Gmail, configurá GMAIL_USER y GMAIL_APP_PASSWORD en .env.local.`
        );

        return {
          success: true,
          simulated: true,
          message: `El email de la factura ${params.invoiceNumber} está listo para despacharse. (Pendiente configuración de credenciales Gmail).`,
        };
      }

      // Envío real a través del servidor SMTP de Gmail
      const fromAddress = process.env.GMAIL_USER;
      const info = await transporter.sendMail({
        from: `"OROÑO BIKE" <${fromAddress}>`,
        to: params.to,
        subject: `Factura de Compra N° ${params.invoiceNumber} - OROÑO BIKE`,
        html: htmlContent,
      });

      console.log(`[EmailService] Factura enviada exitosamente a ${params.to}. MessageId: ${info.messageId}`);

      return {
        success: true,
        simulated: false,
        message: `Factura enviada correctamente a ${params.to}.`,
        messageId: info.messageId,
      };
    } catch (error: any) {
      console.error('[EmailService] Error enviando email de factura:', error);
      return {
        success: false,
        simulated: false,
        message: error?.message || 'No se pudo enviar el correo electrónico.',
      };
    }
  }
}
