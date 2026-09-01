# Google Stitch Design System Specification: Oroño Bike
**Estilo:** High-End Minimalist Performance Cycling (Inspirado en Fusion Bikes & Bertolina Bikes)

---

## 1. Concepto Visual & Principios de Diseño
- **Ultra-Clean & High Contrast:** Base blanca pura (`#ffffff`) con secciones en `#fafafa`, acentos tipográficos en negro carbón mate (`#09090b`), y líneas divisorias sutiles en `#e4e4e7`.
- **Enfoque Técnico y Precisión:** Elementos visuales estructurados en cuadrículas estrictas, tipografía monospace para especificaciones técnicas (peso, torque, desarrollo, talles) y números de factura/stock.
- **Acciones Claras & Cero Fricción:** Botones con microinteracciones sutiles en hover (scale 1.01, transiciones de 150ms) y estados de stock visibles de inmediato.

---

## 2. Tokens Cromáticos

| Token | Hex / Valor | Uso |
|---|---|---|
| `--color-bg-primary` | `#ffffff` | Fondo principal de página y cards |
| `--color-bg-secondary` | `#fafafa` | Fondos de secciones alternas |
| `--color-bg-muted` | `#f4f4f5` | Fondos de badges, tags e inputs |
| `--color-text-primary` | `#09090b` | Títulos, precios y textos destacados |
| `--color-text-secondary` | `#52525b` | Párrafos, fichas técnicas y etiquetas |
| `--color-text-muted` | `#71717a` | Placeholders y textos auxiliares |
| `--color-border-subtle` | `#e4e4e7` | Bordes de tarjetas, tablas e inputs |
| `--color-border-strong` | `#27272a` | Bordes activos y focos |
| `--color-status-success` | `#16a34a` | Stock disponible, pago aprobado, turno confirmado |
| `--color-status-warning` | `#d97706` | Stock bajo (<3 unidades), transferencia pendiente |
| `--color-status-danger` | `#dc2626` | Agotado, error en factura ARCA |

---

## 3. Botones Flotantes Fijos (Fixed Action Cluster)

Ubicados en la esquina inferior derecha (`bottom-6 right-6`):
1. **Instagram:** Enlace a `@orono_bike` (`https://www.instagram.com/orono_bike/?hl=es-la`).
2. **WhatsApp:** Enlace con prefijo `549341` y mensaje dinámico prellenado según el contexto (consulta general, detalle de producto o reserva de service).
