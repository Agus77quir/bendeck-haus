-- =============================================
-- BENDECK HAUS - Sistema de Ventas Mayorista
-- =============================================

-- 1. ENUM para roles de usuario
CREATE TYPE public.app_role AS ENUM ('admin', 'seller');

-- 2. ENUM para negocios
CREATE TYPE public.business_type AS ENUM ('bendeck_tools', 'lusqtoff');

-- 3. ENUM para estados de venta
CREATE TYPE public.sale_status AS ENUM ('pending', 'completed', 'cancelled');

-- 4. Tabla de perfiles de usuario
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    business business_type,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabla de roles de usuario (separada por seguridad)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'seller',
    UNIQUE (user_id, role)
);

-- 6. Tabla de categorías de productos
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    business business_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabla de productos
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES public.categories(id),
    business business_type NOT NULL,
    purchase_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    sale_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 5,
    image_url TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Tabla de clientes
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business business_type NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    tax_id TEXT,
    credit_limit DECIMAL(12,2) DEFAULT 0,
    current_balance DECIMAL(12,2) DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business, code)
);

-- 9. Tabla de ventas
CREATE TABLE public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business business_type NOT NULL,
    sale_number SERIAL,
    customer_id UUID REFERENCES public.customers(id),
    seller_id UUID REFERENCES auth.users(id) NOT NULL,
    status sale_status DEFAULT 'completed',
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    payment_method TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Tabla de items de venta
CREATE TABLE public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    discount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Tabla de movimientos de cuenta corriente
CREATE TABLE public.account_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    sale_id UUID REFERENCES public.sales(id),
    type TEXT NOT NULL CHECK (type IN ('sale', 'payment', 'adjustment')),
    amount DECIMAL(12,2) NOT NULL,
    balance_after DECIMAL(12,2) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Tabla de notificaciones
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business business_type,
    user_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- FUNCIONES DE SEGURIDAD
-- =============================================

-- Función para verificar rol de usuario
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Función para verificar si es admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(_user_id, 'admin')
$$;

-- Función para obtener el negocio del usuario
CREATE OR REPLACE FUNCTION public.get_user_business(_user_id UUID)
RETURNS business_type
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT business
    FROM public.profiles
    WHERE id = _user_id
$$;

-- =============================================
-- HABILITAR RLS
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS RLS
-- =============================================

-- Profiles: usuarios ven su propio perfil, admin ve todos
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admin can manage all profiles" ON public.profiles
    FOR ALL USING (public.is_admin(auth.uid()));

-- User Roles: solo admin puede gestionar
CREATE POLICY "Admin can manage roles" ON public.user_roles
    FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view own role" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- Categories: admin gestiona, todos ven las de su negocio
CREATE POLICY "View categories" ON public.categories
    FOR SELECT USING (
        public.is_admin(auth.uid()) OR 
        business = public.get_user_business(auth.uid())
    );

CREATE POLICY "Admin manages categories" ON public.categories
    FOR ALL USING (public.is_admin(auth.uid()));

-- Products: admin gestiona, vendedores ven su negocio
CREATE POLICY "View products" ON public.products
    FOR SELECT USING (
        public.is_admin(auth.uid()) OR 
        business = public.get_user_business(auth.uid())
    );

CREATE POLICY "Admin manages products" ON public.products
    FOR ALL USING (public.is_admin(auth.uid()));

-- Customers: admin gestiona todo, vendedores ven/editan su negocio
CREATE POLICY "View customers" ON public.customers
    FOR SELECT USING (
        public.is_admin(auth.uid()) OR 
        business = public.get_user_business(auth.uid())
    );

CREATE POLICY "Admin manages customers" ON public.customers
    FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Sellers update own business customers" ON public.customers
    FOR UPDATE USING (business = public.get_user_business(auth.uid()));

-- Sales: vendedores crean y ven ventas de su negocio
CREATE POLICY "View sales" ON public.sales
    FOR SELECT USING (
        public.is_admin(auth.uid()) OR 
        business = public.get_user_business(auth.uid())
    );

CREATE POLICY "Create sales" ON public.sales
    FOR INSERT WITH CHECK (
        seller_id = auth.uid() AND
        business = public.get_user_business(auth.uid())
    );

CREATE POLICY "Admin manages sales" ON public.sales
    FOR ALL USING (public.is_admin(auth.uid()));

-- Sale Items
CREATE POLICY "View sale items" ON public.sale_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.sales s 
            WHERE s.id = sale_id 
            AND (public.is_admin(auth.uid()) OR s.business = public.get_user_business(auth.uid()))
        )
    );

CREATE POLICY "Create sale items" ON public.sale_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.sales s 
            WHERE s.id = sale_id AND s.seller_id = auth.uid()
        )
    );

-- Account Movements
CREATE POLICY "View account movements" ON public.account_movements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.customers c 
            WHERE c.id = customer_id 
            AND (public.is_admin(auth.uid()) OR c.business = public.get_user_business(auth.uid()))
        )
    );

CREATE POLICY "Admin manages movements" ON public.account_movements
    FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Sellers create movements" ON public.account_movements
    FOR INSERT WITH CHECK (created_by = auth.uid());

-- Notifications
CREATE POLICY "View own notifications" ON public.notifications
    FOR SELECT USING (
        user_id = auth.uid() OR 
        user_id IS NULL OR 
        public.is_admin(auth.uid())
    );

CREATE POLICY "Mark as read" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Admin creates notifications" ON public.notifications
    FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

-- =============================================
-- TRIGGERS
-- =============================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Función para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para nuevo usuario
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Función para verificar stock bajo
CREATE OR REPLACE FUNCTION public.check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stock <= NEW.min_stock THEN
        INSERT INTO public.notifications (business, title, message, type)
        VALUES (
            NEW.business,
            'Stock Bajo: ' || NEW.name,
            'El producto ' || NEW.name || ' (Código: ' || NEW.code || ') tiene stock bajo. Stock actual: ' || NEW.stock || ', Mínimo: ' || NEW.min_stock,
            'warning'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER check_product_stock
    AFTER UPDATE OF stock ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.check_low_stock();

-- Función para actualizar stock después de venta
CREATE OR REPLACE FUNCTION public.update_stock_after_sale()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.products
    SET stock = stock - NEW.quantity
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER after_sale_item_insert
    AFTER INSERT ON public.sale_items
    FOR EACH ROW EXECUTE FUNCTION public.update_stock_after_sale();

-- Función para actualizar balance de cliente
CREATE OR REPLACE FUNCTION public.update_customer_balance()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.customers
    SET current_balance = NEW.balance_after
    WHERE id = NEW.customer_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER after_account_movement
    AFTER INSERT ON public.account_movements
    FOR EACH ROW EXECUTE FUNCTION public.update_customer_balance();