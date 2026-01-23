-- Corregir funciones con search_path

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_low_stock()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.update_stock_after_sale()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.products
    SET stock = stock - NEW.quantity
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_customer_balance()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.customers
    SET current_balance = NEW.balance_after
    WHERE id = NEW.customer_id;
    RETURN NEW;
END;
$$;