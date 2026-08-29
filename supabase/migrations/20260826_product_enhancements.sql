-- Create Brands table
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for Brands
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Brands are viewable by everyone" ON public.brands FOR SELECT USING (true);
CREATE POLICY "Brands are insertable by admins" ON public.brands FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Brands are updatable by admins" ON public.brands FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Brands are deletable by admins" ON public.brands FOR DELETE USING (auth.role() = 'authenticated');

-- Create Product Variants table
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock INTEGER DEFAULT 0 NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for Product Variants
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Product variants are viewable by everyone" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Product variants are insertable by admins" ON public.product_variants FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Product variants are updatable by admins" ON public.product_variants FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Product variants are deletable by admins" ON public.product_variants FOR DELETE USING (auth.role() = 'authenticated');

-- Add new columns to Products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS video_provider TEXT;

