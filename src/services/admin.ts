import { supabase } from './supabase';
import { Business } from './businesses';

export interface Admin {
  id: string;
  email: string;
  is_root: boolean;
  added_by_email: string | null;
  created_at: string;
}

export async function checkIsAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin');
  if (error) return false;
  return data === true;
}

export async function getPendingBusinesses(): Promise<Business[]> {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('verified', false)
    .order('created_at', { ascending: false });
  if (error) { console.error(error); return []; }
  return (data ?? []) as Business[];
}

export async function getAllBusinesses(): Promise<Business[]> {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error(error); return []; }
  return (data ?? []) as Business[];
}

export async function verifyBusiness(id: string): Promise<void> {
  const { error } = await supabase
    .from('businesses')
    .update({ verified: true })
    .eq('id', id);
  if (error) throw error;
}

export async function rejectBusiness(id: string): Promise<void> {
  const { error } = await supabase
    .from('businesses')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function getDeletionRequests(): Promise<Business[]> {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('deletion_requested', true)
    .order('created_at', { ascending: false });
  if (error) { console.error(error); return []; }
  return (data ?? []) as Business[];
}

export async function approveDeletion(id: string): Promise<void> {
  // Permanently delete the business
  await rejectBusiness(id);
}

export async function rejectDeletionRequest(id: string): Promise<void> {
  const { error } = await supabase
    .from('businesses')
    .update({ deletion_requested: false, deletion_reason: null })
    .eq('id', id);
  if (error) throw error;
}

export async function getAdmins(): Promise<Admin[]> {
  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) { console.error(error); return []; }
  return (data ?? []) as Admin[];
}

export async function addAdmin(email: string, addedByEmail: string): Promise<void> {
  const { error } = await supabase
    .from('admins')
    .insert({ email: email.toLowerCase().trim(), is_root: false, added_by_email: addedByEmail });
  if (error) throw error;
}

export async function removeAdmin(id: string): Promise<void> {
  const { error } = await supabase
    .from('admins')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
