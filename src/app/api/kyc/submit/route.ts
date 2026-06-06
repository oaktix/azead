import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import path from 'path';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const idNumber = formData.get('idNumber') as string;
    const file = formData.get('file') as File;

    if (!idNumber) {
      return NextResponse.json({ error: 'ID or NIN number is required' }, { status: 400 });
    }
    if (!file) {
      return NextResponse.json({ error: 'ID document picture is required' }, { status: 400 });
    }

    // Process file upload: We'll upload it to Supabase Storage bucket 'kyc-documents'
    const filename = `${user.id}-${crypto.randomUUID().substring(0, 6)}${path.extname(file.name)}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const adminClient = createAdminClient();

    // Upload file to bucket
    const { error: uploadError } = await adminClient
      .storage
      .from('kyc-documents')
      .upload(filename, fileBuffer, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = adminClient
      .storage
      .from('kyc-documents')
      .getPublicUrl(filename);

    const idDocumentUrl = publicUrl;

    // Insert or update KYC document record
    const { error: kycError } = await adminClient
      .from('kyc_documents')
      .upsert({
        user_id: user.id,
        id_number: idNumber,
        id_document_url: idDocumentUrl,
        status: 'pending',
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (kycError) {
      throw kycError;
    }

    // Set profile status to pending
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({ kyc_status: 'pending' })
      .eq('id', user.id);

    if (profileError) {
      throw profileError;
    }

    return NextResponse.json({ success: true, url: idDocumentUrl });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('KYC submission error:', error);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
