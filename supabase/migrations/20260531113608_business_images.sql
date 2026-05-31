-- Storage bucket for business photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-images', 'business-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public can view images
DROP POLICY IF EXISTS "public_read_business_images" ON storage.objects;
CREATE POLICY "public_read_business_images"
    ON storage.objects FOR SELECT USING (bucket_id = 'business-images');

-- Authenticated users can upload images
DROP POLICY IF EXISTS "auth_upload_business_images" ON storage.objects;
CREATE POLICY "auth_upload_business_images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'business-images' AND auth.uid() IS NOT NULL);

-- Authenticated users can delete their own images
DROP POLICY IF EXISTS "auth_delete_business_images" ON storage.objects;
CREATE POLICY "auth_delete_business_images"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'business-images' AND auth.uid() IS NOT NULL);
