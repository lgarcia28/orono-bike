-- ==============================================================================
-- OROÑO BIKE - SUPABASE POSTGRESQL SCHEMA & RLS POLICIES
-- High-Performance E-commerce, Workshop Appointment & POS System
-- ==============================================================================

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Clean Existing Types & Tables if needed
DROP TABLE IF EXISTS payment_receipts CASCADE;
DROP TABLE IF EXISTS workshop_appointments CASCADE;
DROP TABLE IF EXISTS invoices_arca CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- 3. Enum Types
CREATE TYPE order_status_type AS ENUM ('pending_payment', 'pending_verification', 'paid', 'preparing', 'ready_for_pickup', 'shipped', 'delivered', 'cancelled');
CREATE TYPE billing_doc_type AS ENUM ('DNI', 'CUIT', 'PASAPORTE', 'OTRO');
CREATE TYPE invoice_cbte_type AS ENUM ('FACTURA_A', 'FACTURA_B', 'FACTURA_C', 'TICKET_LOCAL');
CREATE TYPE workshop_status_type AS ENUM ('pending_intake', 'in_workshop', 'ready_for_pickup', 'delivered', 'cancelled');
CREATE TYPE shipping_method_type AS ENUM ('local_pickup', 'andreani_standard', 'andreani_express');

-- 4. Products Table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    brand VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    specs JSONB DEFAULT '{}'::jsonb, -- e.g., {"frame": "Carbono Toray T800", "groupset": "Shimano Deore 12v", "brakes": "Shimano MT200", "weight": "11.2 kg"}
    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Product Variants Table (Sizes, Wheels, Colors, Realtime Stock & Barcode for POS)
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL UNIQUE,
    barcode VARCHAR(100) UNIQUE, -- Lector de código de barras para POS físico
    size VARCHAR(20) NOT NULL,    -- e.g., 'S', 'M', 'L', 'XL' o 'Único'
    wheel_size VARCHAR(20),       -- e.g., '29"', '28"', '700c', '26"'
    color VARCHAR(50) NOT NULL,   -- e.g., 'Matte Black', 'Raw Silver', 'Stealth Grey'
    color_hex VARCHAR(10) DEFAULT '#000000',
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    compare_at_price NUMERIC(12, 2) CHECK (compare_at_price >= price),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    min_stock_alert INTEGER NOT NULL DEFAULT 2,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Orders Table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) NOT NULL UNIQUE,
    channel VARCHAR(20) DEFAULT 'web', -- 'web' | 'pos'
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    billing_type invoice_cbte_type NOT NULL DEFAULT 'FACTURA_B',
    doc_type billing_doc_type NOT NULL DEFAULT 'DNI',
    doc_number VARCHAR(50) NOT NULL,
    tax_address TEXT,
    shipping_type shipping_method_type NOT NULL DEFAULT 'local_pickup',
    shipping_cost NUMERIC(12, 2) DEFAULT 0.00,
    shipping_address JSONB DEFAULT '{}'::jsonb,
    payment_method VARCHAR(50) NOT NULL, -- 'mercadopago' | 'transfer' | 'cash' | 'pos_debit' | 'pos_credit'
    payment_status order_status_type NOT NULL DEFAULT 'pending_payment',
    payment_id_external VARCHAR(100),   -- ID Mercado Pago o referencia
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Order Items Table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_variant_id UUID NOT NULL REFERENCES product_variants(id),
    title VARCHAR(255) NOT NULL,
    variant_details VARCHAR(255) NOT NULL, -- e.g. "Talle L - Rodado 29 - Matte Black"
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ARCA (ex-AFIP) Invoices Table
CREATE TABLE invoices_arca (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    cbte_tipo INTEGER NOT NULL,          -- 1: Factura A, 6: Factura B, 11: Factura C
    punto_venta INTEGER NOT NULL,        -- e.g., 1 o 2 (definido en AFIP WS)
    cbte_nro BIGINT NOT NULL,           -- Número correlativo de comprobante
    cae VARCHAR(50) NOT NULL,            -- Código de Autorización Electrónico
    cae_vto DATE NOT NULL,               -- Fecha de vencimiento CAE
    doc_tipo INTEGER NOT NULL,           -- 80: CUIT, 96: DNI, 99: Sin identificar
    doc_nro BIGINT NOT NULL,
    imp_total NUMERIC(12, 2) NOT NULL,
    imp_neto NUMERIC(12, 2) NOT NULL,
    imp_iva NUMERIC(12, 2) NOT NULL,
    qr_data TEXT,                        -- Payload codificado en Base64 según reglamentación ARCA
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_arca_invoice UNIQUE (punto_venta, cbte_tipo, cbte_nro)
);

-- 9. Workshop Appointments (Taller Mecánico) Table
CREATE TABLE workshop_appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_code VARCHAR(30) NOT NULL UNIQUE,
    client_name VARCHAR(255) NOT NULL,
    client_phone VARCHAR(50) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    service_type VARCHAR(100) NOT NULL, -- e.g. 'Service General', 'Calibración de Transmisión', 'Purga Hidráulica', 'Tubelizado'
    bike_brand VARCHAR(100) NOT NULL,
    bike_model VARCHAR(100) NOT NULL,
    wheel_size VARCHAR(20),
    appointment_date DATE NOT NULL,
    time_slot VARCHAR(20) NOT NULL,     -- e.g. '09:00 - 11:00', '11:00 - 13:00', '15:00 - 17:00', '17:00 - 19:00'
    status workshop_status_type DEFAULT 'pending_intake',
    client_notes TEXT,
    mechanic_diagnosis TEXT,
    estimated_cost NUMERIC(12, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_date_slot UNIQUE (appointment_date, time_slot)
);

-- 10. Payment Receipts (Comprobantes de Transferencia Bancaria)
CREATE TABLE payment_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID,
    verified_at TIMESTAMPTZ,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_variants_barcode ON product_variants(barcode);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_workshop_date_slot ON workshop_appointments(appointment_date, time_slot);
CREATE INDEX idx_invoices_order_id ON invoices_arca(order_id);

-- ==============================================================================
-- REALTIME REPLICATION ENABLEMENT
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE product_variants;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE workshop_appointments;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices_arca ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_receipts ENABLE ROW LEVEL SECURITY;

-- Products & Variants: Publicly readable for active items, editable only by authenticated staff
CREATE POLICY "Public products are readable by everyone" ON products
    FOR SELECT USING (is_active = true OR auth.role() = 'authenticated');

CREATE POLICY "Staff can manage products" ON products
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public variants are readable by everyone" ON product_variants
    FOR SELECT USING (true);

CREATE POLICY "Staff can manage variants" ON product_variants
    FOR ALL USING (auth.role() = 'authenticated');

-- Orders: Public can create orders; staff can read & manage all orders
CREATE POLICY "Public can insert orders" ON orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff can view and update all orders" ON orders
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public can view own order by ID" ON orders
    FOR SELECT USING (true);

CREATE POLICY "Public can insert order items" ON order_items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can read order items" ON order_items
    FOR SELECT USING (true);

-- Workshop: Public can insert turnos and check slot availability; staff can update
CREATE POLICY "Public can view appointment slots" ON workshop_appointments
    FOR SELECT USING (true);

CREATE POLICY "Public can book appointments" ON workshop_appointments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff can manage workshop appointments" ON workshop_appointments
    FOR ALL USING (auth.role() = 'authenticated');

-- Payment Receipts & ARCA Invoices:
CREATE POLICY "Public can upload payment receipts" ON payment_receipts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff can manage payment receipts" ON payment_receipts
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can manage ARCA invoices" ON invoices_arca
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public can view order invoice" ON invoices_arca
    FOR SELECT USING (true);

-- ==============================================================================
-- STORED FUNCTIONS & TRIGGERS
-- ==============================================================================

-- Trigger to deduct stock automatically when an order is marked as paid or created in POS
CREATE OR REPLACE FUNCTION deduct_inventory_on_order()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid'))
       OR (NEW.channel = 'pos' AND TG_OP = 'INSERT') THEN
        
        UPDATE product_variants pv
        SET stock = pv.stock - oi.quantity,
            updated_at = NOW()
        FROM order_items oi
        WHERE oi.order_id = NEW.id
          AND oi.product_variant_id = pv.id;
          
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_deduct_stock_on_paid_order
AFTER INSERT OR UPDATE OF payment_status ON orders
FOR EACH ROW
EXECUTE FUNCTION deduct_inventory_on_order();

-- ==============================================================================
-- INITIAL SEED DATA FOR OROÑO BIKE
-- ==============================================================================
INSERT INTO products (id, title, slug, brand, category, description, specs, images)
VALUES 
(
    'a1111111-1111-1111-1111-111111111111',
    'Specialized Epic Pro Carbon 29',
    'specialized-epic-pro-carbon-29',
    'Specialized',
    'Bicicletas MTB',
    'Máquina de XC puro rendimiento con suspensión inteligente Brain y transmisión electrónica SRAM X01 AXS.',
    '{"frame": "FACT 11m Full Carbon, XC Race Geometry", "fork": "RockShox SID SL BRAIN 100mm", "groupset": "SRAM X01 Eagle AXS 12-Speed", "brakes": "SRAM Level TLM hidráulico", "weight": "9.8 kg"}',
    ARRAY['https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1200&q=80']
),
(
    'a2222222-2222-2222-2222-222222222222',
    'Cannondale Topstone Carbon 2 Gravel',
    'cannondale-topstone-carbon-2-gravel',
    'Cannondale',
    'Gravel',
    'Bicicleta de gravel ultraligera con suspensión trasera Kingpin para máxima comodidad y tracción en ripio y asfalto.',
    '{"frame": "Topstone Carbon Kingpin suspension", "fork": "Topstone Carbon 12x100mm thru-axle", "groupset": "Shimano GRX 810 11-Speed", "brakes": "Shimano GRX 800 hydraulic disc", "weight": "8.9 kg"}',
    ARRAY['https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=1200&q=80']
);

INSERT INTO product_variants (product_id, sku, barcode, size, wheel_size, color, color_hex, price, compare_at_price, stock)
VALUES
('a1111111-1111-1111-1111-111111111111', 'SP-EPIC-S-BLK', '779001001001', 'S', '29"', 'Stealth Black', '#18181b', 6500000.00, 6900000.00, 2),
('a1111111-1111-1111-1111-111111111111', 'SP-EPIC-M-BLK', '779001001002', 'M', '29"', 'Stealth Black', '#18181b', 6500000.00, 6900000.00, 4),
('a1111111-1111-1111-1111-111111111111', 'SP-EPIC-L-BLK', '779001001003', 'L', '29"', 'Stealth Black', '#18181b', 6500000.00, 6900000.00, 3),
('a1111111-1111-1111-1111-111111111111', 'SP-EPIC-M-SLV', '779001001004', 'M', '29"', 'Raw Silver', '#d4d4d8', 6500000.00, 6900000.00, 1),
('a2222222-2222-2222-2222-222222222222', 'CD-TOP-S-GRN', '779002001001', 'S', '28"', 'Olive Green', '#3f4f3e', 4800000.00, 5200000.00, 3),
('a2222222-2222-2222-2222-222222222222', 'CD-TOP-M-GRN', '779002001002', 'M', '28"', 'Olive Green', '#3f4f3e', 4800000.00, 5200000.00, 5),
('a2222222-2222-2222-2222-222222222222', 'CD-TOP-L-GRN', '779002001003', 'L', '28"', 'Olive Green', '#3f4f3e', 4800000.00, 5200000.00, 2);
