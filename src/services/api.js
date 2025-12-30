// src/services/api.js

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ApiService = {

// ===== AUTHENTICATION =====

async login(email, password) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();

    if (error) throw error;
    return { data: { user: data }, error: null };
  } catch (error) {
    return { data: null, error };
  }
},

logout() {
  return { error: null };
},

// ===== REFERENCE ID GENERATION =====

async generateReferenceNo() {
  try {
    const fixedPrefix = '10-43-11-';

    const { data, error } = await supabase
      .from('registrants')
      .select('reference_no')
      .like('reference_no', `${fixedPrefix}%`)
      .order('reference_no', { ascending: false })
      .limit(1);

    if (error) throw error;

    let nextNumber = 1;

    if (data && data.length > 0 && data[0].reference_no) {
      const lastRefNo = data[0].reference_no;
      // Extract the numeric part after the prefix (remove dashes)
      // Format: 10-43-11-XXX-XXXXXX
      const numericPart = lastRefNo.replace(fixedPrefix, '').replace('-', '');
      nextNumber = parseInt(numericPart) + 1;
    }

    // Format as XXX-XXXXXX (9 total digits with dash after first 3)
    const paddedNumber = String(nextNumber).padStart(9, '0');
    const firstPart = paddedNumber.substring(0, 3);
    const secondPart = paddedNumber.substring(3, 9);
    
    return `${fixedPrefix}${firstPart}-${secondPart}`;
  } catch (error) {
    console.error('Error generating reference number:', error);
    throw error;
  }
},

// ===== REGISTRATION FUNCTIONS =====

async createRegistrant(data) {
  try {
    const { data: result, error } = await supabase
      .from('registrants')
      .insert([{ 
        ...data,
        // reference_no is now provided by the user via the form
        status: 'Created' // ✅ Set initial status
      }])
      .select()
      .single();

    if (error) throw error;
    return result;
  } catch (error) {
    throw error;
  }
},

// ✅ Update registrant with tracking and status change
async updateRegistrant(id, data, updatedBy, updatedByName) {
  console.log('📡 API: Updating registrant...', { id, updatedBy, updatedByName });
  try {
    const { data: result, error } = await supabase
      .from('registrants')
      .update({
        ...data,
        status: 'Updated', // ✅ Change status to Updated
        updated_at: new Date().toISOString(),
        updated_by: updatedBy,
        updated_by_name: updatedByName
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }
    
    console.log('✅ API: Update successful', result);
    return result;
  } catch (error) {
    console.error('❌ API: Update failed', error);
    throw error;
  }
},

async createAddress(data) {
  const { data: result, error } = await supabase
    .from('addresses')
    .insert(data)
    .select();

  if (error) throw error;
  return result;
},

async createFarmParcel(data) {
  const { data: result, error } = await supabase
    .from('farm_parcels')
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return result;
},

async createParcelInfos(data) {
  const { data: result, error } = await supabase
    .from('parcel_infos')
    .insert(data)
    .select();

  if (error) throw error;
  return result;
},

async createCrops(data) {
  const { data: result, error } = await supabase
    .from('crops')
    .insert(data)
    .select();

  if (error) throw error;
  return result;
},

async createLivestock(data) {
  const { data: result, error } = await supabase
    .from('livestock')
    .insert(data)
    .select();

  if (error) throw error;
  return result;
},

async createPoultry(data) {
  const { data: result, error } = await supabase
    .from('poultry')
    .insert(data)
    .select();

  if (error) throw error;
  return result;
},

async createFishingActivities(data) {
  const { data: result, error } = await supabase
    .from('fishing_activities')
    .insert(data)
    .select();

  if (error) throw error;
  return result;
},

async createWorkTypes(data) {
  const { data: result, error } = await supabase
    .from('work_types')
    .insert(data)
    .select();

  if (error) throw error;
  return result;
},

async createInvolvementTypes(data) {
  const { data: result, error } = await supabase
    .from('involvement_types')
    .insert(data)
    .select();

  if (error) throw error;
  return result;
},

async createFinancialInfo(data) {
  const { data: result, error } = await supabase
    .from('financial_infos')
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return result;
},

// ===== STORAGE FUNCTIONS =====

async uploadImage(file, bucket = 'farm-photos') {
  try {
    // 1. Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, JPG, and PNG are allowed.');
    }

    // 2. Validate file size (3MB)
    const maxSize = 3 * 1024 * 1024; // 3MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds the 3MB limit.');
    }

    // 3. Generate unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    // 4. Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // 5. Get Public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;

  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
},

// ===== QUERY FUNCTIONS =====

async getRegistrants() {
  const { data, error } = await supabase
    .from('registrants')
    .select(`
      *,
      addresses(*),
      crops(*),
      livestock(*),
      poultry(*),
      farm_parcels(*),
      financial_infos(*),
      fishing_activities(*)
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
},

async getRegistrantById(id) {
  const { data, error } = await supabase
    .from('registrants')
    .select(`
      *,
      addresses(*),
      farm_parcels(*, parcel_infos(*)),
      crops(*),
      livestock(*),
      poultry(*),
      fishing_activities(*),
      work_types(*),
      involvement_types(*),
      financial_infos(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
},

// ===== ACTIVITY LOGS =====

async createActivityLog(userId, userName, action, target, ipAddress = null) {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .insert([{
        user_id: userId,
        user_name: userName,
        action,
        target,
        ip_address: ipAddress
      }]);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating activity log:', error);
    return null;
  }
},

async getActivityLogs(limit = 50) {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
},

async getLogArchives() {
  const { data, error } = await supabase
    .from('log_archives')
    .select('*')
    .order('archive_date', { ascending: false });

  if (error) throw error;
  return data;
},

// ===== SOFT DELETE & RESTORE =====

async softDeleteRegistrant(id, deletedBy, deleteReason) {
  const { data, error } = await supabase
    .from('registrants')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: deletedBy,
      delete_reason: deleteReason
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
},

async getDeletedRegistrants() {
  const { data, error } = await supabase
    .from('registrants')
    .select(`
      *,
      addresses (
        barangay,
        purok,
        municipality_city,
        province
      )
    `)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });

  if (error) throw error;
  return data;
},

async restoreRegistrant(id) {
  const { data, error } = await supabase
    .from('registrants')
    .update({
      deleted_at: null,
      deleted_by: null,
      delete_reason: null
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
},

async permanentDeleteRegistrant(id) {
  const { data, error } = await supabase
    .from('registrants')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return data;
},

// ===== UTILITY FUNCTIONS =====

async getUserIpAddress() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Error fetching IP:', error);
    return null;
  }
},

// ===== DASHBOARD DATA FUNCTIONS =====

async getAllRegistrants() {
  try {
    const { data, error } = await supabase
      .from('registrants')
      .select(`
        *,
        addresses(*),
        farm_parcels(
          *,
          parcel_infos(*)
        )
      `);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all registrants:', error);
    throw error;
  }
},

async getAllCrops() {
  try {
    const { data, error } = await supabase
      .from('crops')
      .select('*');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all crops:', error);
    throw error;
  }
},

async getAllLivestock() {
  try {
    const { data, error } = await supabase
      .from('livestock')
      .select('*');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all livestock:', error);
    throw error;
  }
},

async getAllPoultry() {
  try {
    const { data, error } = await supabase
      .from('poultry')
      .select('*');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all poultry:', error);
    throw error;
  }
},

async getAllParcelInfos() {
  try {
    const { data, error } = await supabase
      .from('parcel_infos')
      .select('*');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all parcel infos:', error);
    throw error;
  }
},

};

export default ApiService;
