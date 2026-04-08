
DROP POLICY "Authenticated users can add products" ON public.products;
CREATE POLICY "Authenticated users can add own products" ON public.products FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
