// src/services/businesses.ts
import { supabase } from './supabase';

export interface Business {
    id: string;
    name: string;
    category: string;
    latitude: number;
    longitude: number;
    address: string;
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
    created_at: string;
    updated_at: string;
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
        .single();
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