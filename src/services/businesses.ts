// src/services/businesses.ts
import { supabase } from './supabase';

export interface Business {
    id: string;
    name: string;
    category: string;
    latitude: number;
    longitude: number;
    address: string;
    cover_image?: string;
    images?: string[];
    whatsapp_number: string;
    phone_number?: string;
    open_time?: string;
    close_time?: string;
    inventory: string[];
    accepts_digital_payment: boolean;
    price_range: 'R' | 'RR' | 'RRR';
    rating: number;
    total_reviews: number;
    verified: boolean;
    deletion_requested?: boolean;
    deletion_reason?: string | null;
    created_at: string;
    updated_at: string;
}

export interface Review {
    id: string;
    business_id: string;
    user_id: string;
    rating: number;
    comment: string | null;
    created_at: string;
}

export async function getBusinessReviews(businessId: string): Promise<Review[]> {
    const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });
    if (error) { console.error(error); return []; }
    return (data ?? []) as Review[];
}

export async function addReview(
    businessId: string,
    rating: number,
    comment: string,
    userId?: string,
): Promise<void> {
    const { error } = await supabase
        .from('reviews')
        .insert({ business_id: businessId, rating, comment, user_id: userId ?? null });
    if (error) throw error;
}

export interface NearbyParams {
    lat: number;
    lng: number;
    radiusKm: number;
    category?: string;
}

export async function getNearbyBusinesses({ lat, lng, radiusKm, category }: NearbyParams) {
    const { data, error } = await supabase.rpc('nearby_businesses', {
        lat: lat,
        lng: lng,
        radius_meters: radiusKm * 1000,
        category_filter: category || null,
    });
    
    if (error) {
        console.error('Error fetching nearby businesses:', error);
        return [];
    }
    
    return data as Business[];
}

export async function getBusinessById(id: string) {
    const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', id)
        .single();
    
    if (error) throw error;
    return data as Business;
}

export async function requestDeletion(businessId: string, reason: string): Promise<void> {
    const { error } = await supabase
        .from('businesses')
        .update({ deletion_requested: true, deletion_reason: reason })
        .eq('id', businessId);
    if (error) throw error;
}

export async function cancelDeletionRequest(businessId: string): Promise<void> {
    const { error } = await supabase
        .from('businesses')
        .update({ deletion_requested: false, deletion_reason: null })
        .eq('id', businessId);
    if (error) throw error;
}

export async function getMyBusinesses(userId: string): Promise<Business[]> {
    const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });
    if (error) { console.error(error); return []; }
    return (data ?? []) as Business[];
}

export async function getSavedBusinesses(userId: string): Promise<Business[]> {
    const { data, error } = await supabase
        .from('saved_businesses')
        .select('business_id, businesses(*)')
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching saved businesses:', error);
        return [];
    }

    return (data ?? []).map((row: any) => row.businesses as Business);
}

export async function saveBusiness(userId: string, businessId: string): Promise<void> {
    const { error } = await supabase
        .from('saved_businesses')
        .insert({ user_id: userId, business_id: businessId });
    if (error) throw error;
}

export async function unsaveBusiness(userId: string, businessId: string): Promise<void> {
    const { error } = await supabase
        .from('saved_businesses')
        .delete()
        .eq('user_id', userId)
        .eq('business_id', businessId);
    if (error) throw error;
}

export async function isBusinessSaved(userId: string, businessId: string): Promise<boolean> {
    const { data } = await supabase
        .from('saved_businesses')
        .select('id')
        .eq('user_id', userId)
        .eq('business_id', businessId)
        .maybeSingle();
    return data !== null;
}

export async function registerBusiness(businessData: {
    name: string;
    category: string;
    latitude: number;
    longitude: number;
    address: string;
    whatsapp_number: string;
    open_time: string;
    close_time: string;
}) {
    const { data, error } = await supabase
        .from('businesses')
        .insert({
            name: businessData.name,
            category: businessData.category,
            location: `POINT(${businessData.longitude} ${businessData.latitude})`,
            address: businessData.address,
            whatsapp_number: businessData.whatsapp_number,
            open_time: businessData.open_time,
            close_time: businessData.close_time,
            owner_id: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

export async function uploadBusinessImage(
    businessId: string,
    uri: string,
    mimeType = 'image/jpeg',
): Promise<string> {
    const ext = mimeType.split('/')[1] ?? 'jpg';
    const path = `${businessId}/${Date.now()}.${ext}`;

    const response = await fetch(uri);
    const blob = await response.blob();

    const { error } = await supabase.storage
        .from('business-images')
        .upload(path, blob, { contentType: mimeType, upsert: false });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
        .from('business-images')
        .getPublicUrl(path);

    return publicUrl;
}

export async function attachImagesToBusiness(
    businessId: string,
    imageUrls: string[],
): Promise<void> {
    const { error } = await supabase
        .from('businesses')
        .update({
            cover_image: imageUrls[0] ?? null,
            images: imageUrls,
        })
        .eq('id', businessId);

    if (error) throw error;
}