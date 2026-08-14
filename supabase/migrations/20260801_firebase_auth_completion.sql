-- Disable foreign key checks for the session if possible, though Postgres doesn't easily do this, we just drop constraints.

-- Drop constraints
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE public.user_addresses DROP CONSTRAINT IF EXISTS user_addresses_user_id_fkey;
ALTER TABLE public.cart_items DROP CONSTRAINT IF EXISTS cart_items_user_id_fkey;
ALTER TABLE public.wishlist_items DROP CONSTRAINT IF EXISTS wishlist_items_user_id_fkey;
ALTER TABLE public.product_reviews DROP CONSTRAINT IF EXISTS product_reviews_user_id_fkey;
ALTER TABLE public.support_tickets DROP CONSTRAINT IF EXISTS support_tickets_user_id_fkey;
ALTER TABLE public.payment_submissions DROP CONSTRAINT IF EXISTS payment_submissions_user_id_fkey;

-- Drop all policies from tables we are altering
DROP POLICY IF EXISTS "Users can view own addresses" ON public.user_addresses;
DROP POLICY IF EXISTS "Users can insert own addresses" ON public.user_addresses;
DROP POLICY IF EXISTS "Users can update own addresses" ON public.user_addresses;
DROP POLICY IF EXISTS "Users can delete own addresses" ON public.user_addresses;

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

DROP POLICY IF EXISTS "Users can view own support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can manage support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can create support tickets" ON public.support_tickets;

DROP POLICY IF EXISTS "Users can view own cart" ON public.cart_items;
DROP POLICY IF EXISTS "Users can insert own cart" ON public.cart_items;
DROP POLICY IF EXISTS "Users can update own cart" ON public.cart_items;
DROP POLICY IF EXISTS "Users can delete own cart" ON public.cart_items;

DROP POLICY IF EXISTS "Users can view own wishlist" ON public.wishlist_items;
DROP POLICY IF EXISTS "Users can insert own wishlist" ON public.wishlist_items;
DROP POLICY IF EXISTS "Users can delete own wishlist" ON public.wishlist_items;

DROP POLICY IF EXISTS "Users can insert own payment submissions" ON public.payment_submissions;
DROP POLICY IF EXISTS "Users can view own payment submissions" ON public.payment_submissions;
DROP POLICY IF EXISTS "Admins can manage payment submissions" ON public.payment_submissions;

DROP POLICY IF EXISTS "Public can view approved reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Users can manage own reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.product_reviews;

-- Drop profiles table
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Alter column types
ALTER TABLE public.orders ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.user_addresses ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.cart_items ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.wishlist_items ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.product_reviews ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.support_tickets ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.payment_submissions ALTER COLUMN user_id TYPE text USING user_id::text;

-- Re-add foreign keys
ALTER TABLE public.orders ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(uid) ON DELETE CASCADE;
ALTER TABLE public.user_addresses ADD CONSTRAINT user_addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(uid) ON DELETE CASCADE;
ALTER TABLE public.cart_items ADD CONSTRAINT cart_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(uid) ON DELETE CASCADE;
ALTER TABLE public.wishlist_items ADD CONSTRAINT wishlist_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(uid) ON DELETE CASCADE;
ALTER TABLE public.product_reviews ADD CONSTRAINT product_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(uid) ON DELETE CASCADE;
ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(uid) ON DELETE CASCADE;
ALTER TABLE public.payment_submissions ADD CONSTRAINT payment_submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(uid) ON DELETE CASCADE;

-- Recreate policies for user_addresses
CREATE POLICY "Users can view own addresses" ON public.user_addresses FOR SELECT USING (public.get_firebase_uid() = user_id);
CREATE POLICY "Users can insert own addresses" ON public.user_addresses FOR INSERT WITH CHECK (public.get_firebase_uid() = user_id);
CREATE POLICY "Users can update own addresses" ON public.user_addresses FOR UPDATE USING (public.get_firebase_uid() = user_id);
CREATE POLICY "Users can delete own addresses" ON public.user_addresses FOR DELETE USING (public.get_firebase_uid() = user_id);

-- Recreate policies for orders
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (public.get_firebase_uid() = user_id);
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (is_admin());
CREATE POLICY "Users can insert own orders" ON public.orders FOR INSERT WITH CHECK (public.get_firebase_uid() = user_id);
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE USING (is_admin());

-- Recreate policies for support_tickets
CREATE POLICY "Users can view own support tickets" ON public.support_tickets FOR SELECT USING (public.get_firebase_uid() = user_id);
CREATE POLICY "Users can create support tickets" ON public.support_tickets FOR INSERT WITH CHECK (public.get_firebase_uid() IS NULL OR public.get_firebase_uid() = user_id);
CREATE POLICY "Admins can manage support tickets" ON public.support_tickets FOR ALL USING (is_admin());

-- Recreate policies for cart_items
CREATE POLICY "Users can view own cart" ON public.cart_items FOR SELECT USING (public.get_firebase_uid() = user_id);
CREATE POLICY "Users can insert own cart" ON public.cart_items FOR INSERT WITH CHECK (public.get_firebase_uid() = user_id);
CREATE POLICY "Users can update own cart" ON public.cart_items FOR UPDATE USING (public.get_firebase_uid() = user_id);
CREATE POLICY "Users can delete own cart" ON public.cart_items FOR DELETE USING (public.get_firebase_uid() = user_id);

-- Recreate policies for wishlist_items
CREATE POLICY "Users can view own wishlist" ON public.wishlist_items FOR SELECT USING (public.get_firebase_uid() = user_id);
CREATE POLICY "Users can insert own wishlist" ON public.wishlist_items FOR INSERT WITH CHECK (public.get_firebase_uid() = user_id);
CREATE POLICY "Users can delete own wishlist" ON public.wishlist_items FOR DELETE USING (public.get_firebase_uid() = user_id);

-- Recreate policies for payment_submissions
CREATE POLICY "Users can view own payment submissions" ON public.payment_submissions FOR SELECT USING (public.get_firebase_uid() = user_id);
CREATE POLICY "Users can insert own payment submissions" ON public.payment_submissions FOR INSERT WITH CHECK (public.get_firebase_uid() = user_id);
CREATE POLICY "Admins can manage payment submissions" ON public.payment_submissions FOR ALL USING (is_admin());

-- Recreate policies for product_reviews
CREATE POLICY "Public can view approved reviews" ON public.product_reviews FOR SELECT USING (status = 'approved');
CREATE POLICY "Users can manage own reviews" ON public.product_reviews FOR ALL USING (public.get_firebase_uid() = user_id) WITH CHECK (
  public.get_firebase_uid() = user_id AND 
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = product_reviews.order_id AND o.user_id = public.get_firebase_uid() AND o.status = 'Delivered')
);
CREATE POLICY "Admins can manage all reviews" ON public.product_reviews FOR ALL USING (is_admin());

-- Update storage policies
DROP POLICY IF EXISTS "Users can upload payment proofs" ON storage.objects;
CREATE POLICY "Users can upload payment proofs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'payment-proofs' AND public.get_firebase_uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view own payment proofs" ON storage.objects;
CREATE POLICY "Users can view own payment proofs" ON storage.objects FOR SELECT USING (bucket_id = 'payment-proofs' AND (owner = public.get_firebase_uid() OR is_admin()));

DROP POLICY IF EXISTS "Users can upload own avatars" ON storage.objects;
CREATE POLICY "Users can upload own avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND public.get_firebase_uid() IS NOT NULL AND (storage.foldername(name))[1] = public.get_firebase_uid());

DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
CREATE POLICY "Users can update own avatars" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND public.get_firebase_uid() IS NOT NULL AND (storage.foldername(name))[1] = public.get_firebase_uid());

DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
CREATE POLICY "Users can delete own avatars" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND public.get_firebase_uid() IS NOT NULL AND (storage.foldername(name))[1] = public.get_firebase_uid());
