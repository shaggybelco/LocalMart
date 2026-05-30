// src/services/storage.ts
import { supabase } from './supabase';
import * as ImagePicker from 'expo-image-picker';

export async function uploadBusinessPhoto(businessId: string, imageUri: string) {
    // Convert image to blob
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    // Generate unique filename
    const fileExt = imageUri.split('.').pop();
    const fileName = `${businessId}/${Date.now()}.${fileExt}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
        .from('business-photos')
        .upload(fileName, blob, {
            contentType: 'image/jpeg',
            upsert: false,
        });
    
    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('business-photos')
        .getPublicUrl(fileName);
    
    // Update business with photo URL (add photo_url column first)
    await supabase
        .from('businesses')
        .update({ photo_url: publicUrl })
        .eq('id', businessId);
    
    return publicUrl;
}

export async function pickAndUploadImage(businessId: string) {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
        throw new Error('Permission to access gallery was denied');
    }
    
    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
    });
    
    if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        return await uploadBusinessPhoto(businessId, imageUri);
    }
    
    return null;
}