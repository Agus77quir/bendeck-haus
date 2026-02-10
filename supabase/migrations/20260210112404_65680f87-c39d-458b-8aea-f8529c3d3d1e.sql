
-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  notes TEXT,
  business public.business_type NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view suppliers" ON public.suppliers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert suppliers" ON public.suppliers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update suppliers" ON public.suppliers FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete suppliers" ON public.suppliers FOR DELETE USING (auth.uid() IS NOT NULL);

-- Add supplier_id to products
ALTER TABLE public.products ADD COLUMN supplier_id UUID REFERENCES public.suppliers(id);

-- Trigger for updated_at
CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
