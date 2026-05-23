import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

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

    // Process file upload: We'll store it locally in the public folder for easy local testing
    const filename = `${user.id}-${uuidv4().substring(0, 6)}${path.extname(file.name)}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Ensure uploads directory exists
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, fileBuffer);
    
    const idDocumentUrl = `/uploads/${filename}`;

    // Insert or update KYC document record
    const { error: kycError } = await supabase
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
    const { error: profileError } = await supabase
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
export const config = {
  api: {
    bodyParser: false,
  },
};
