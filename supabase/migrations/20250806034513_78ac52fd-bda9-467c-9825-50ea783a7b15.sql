-- Fix the profiles table and user creation process
-- First, let's check if we need to update existing users without outlet_id

-- Update the handle_new_user function to assign a default outlet or handle the case better
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  default_outlet_id uuid;
BEGIN
  -- Try to get the first available outlet, or create a default one if none exists
  SELECT id INTO default_outlet_id 
  FROM public.outlets 
  WHERE is_active = true 
  LIMIT 1;
  
  -- If no outlet exists, we'll insert without outlet_id for now
  -- The user will need to be assigned to an outlet by an admin
  INSERT INTO public.profiles (user_id, full_name, role, outlet_id)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'kasir',
    default_outlet_id  -- This might be null if no outlets exist
  );
  
  RETURN NEW;
END;
$$;

-- Create a function to help with user role and outlet management
CREATE OR REPLACE FUNCTION public.get_user_outlet_id(user_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT outlet_id FROM public.profiles WHERE profiles.user_id = $1;
$$;

-- Update RLS policies to handle users without outlets more gracefully
-- Products policies
DROP POLICY IF EXISTS "Users can view products from their outlet" ON public.products;
CREATE POLICY "Users can view products from their outlet" 
ON public.products 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND (profiles.outlet_id = products.outlet_id OR profiles.role = 'owner')
  )
);

-- Categories policies  
DROP POLICY IF EXISTS "Users can view categories from their outlet" ON public.categories;
CREATE POLICY "Users can view categories from their outlet" 
ON public.categories 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND (profiles.outlet_id = categories.outlet_id OR profiles.role = 'owner')
  )
);

-- Customers policies
DROP POLICY IF EXISTS "Users can view customers from their outlet" ON public.customers;
DROP POLICY IF EXISTS "Users can manage customers from their outlet" ON public.customers;
CREATE POLICY "Users can view customers from their outlet" 
ON public.customers 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND (profiles.outlet_id = customers.outlet_id OR profiles.role = 'owner')
  )
);

CREATE POLICY "Users can manage customers from their outlet" 
ON public.customers 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND (profiles.outlet_id = customers.outlet_id OR profiles.role = 'owner')
  )
);

-- Transactions policies
DROP POLICY IF EXISTS "Users can view transactions from their outlet" ON public.transactions;
CREATE POLICY "Users can view transactions from their outlet" 
ON public.transactions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND (profiles.outlet_id = transactions.outlet_id OR profiles.role = 'owner')
  )
);

-- Stock movements policies  
DROP POLICY IF EXISTS "Users can view stock movements from their outlet" ON public.stock_movements;
CREATE POLICY "Users can view stock movements from their outlet" 
ON public.stock_movements 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND (profiles.outlet_id = stock_movements.outlet_id OR profiles.role = 'owner')
  )
);

-- Create a default outlet for testing if none exists
INSERT INTO public.outlets (name, address, phone, owner_id)
SELECT 
  'Outlet Default',
  'Alamat Default', 
  '08123456789',
  (SELECT id FROM auth.users LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.outlets);

-- Update existing users without outlet_id to use the default outlet
UPDATE public.profiles 
SET outlet_id = (SELECT id FROM public.outlets WHERE is_active = true LIMIT 1)
WHERE outlet_id IS NULL;