'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Loader2, 
  CheckCircle2, 
  Upload, 
  Clock 
} from 'lucide-react';

interface KYCDetails {
  id_number?: string;
  id_document_url?: string;
  status?: string;
  admin_notes?: string;
}

interface ProfileClientProps {
  profile: {
    first_name: string;
    last_name: string;
    phone: string;
    kyc_status: string;
    referral_code: string;
  };
  email: string;
  kycDoc: KYCDetails | null;
}

export default function ProfileClient({
  profile,
  email,
  kycDoc,
}: ProfileClientProps) {
  const router = useRouter();

  // Profile update states
  const [firstName, setFirstName] = useState(profile.first_name);
  const [lastName, setLastName] = useState(profile.last_name);
  const [phone, setPhone] = useState(profile.phone || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // KYC States
  const [idNumber, setIdNumber] = useState(kycDoc?.id_number || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [kycLoading, setKycLoading] = useState(false);
  const [kycError, setKycError] = useState<string | null>(null);
  const [kycSuccess, setKycSuccess] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(false);

    try {
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, phone }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to update profile');
      }

      setProfileSuccess(true);
      router.refresh();
    } catch (err: unknown) {
    const errorObj = err as Error;
      setProfileError(errorObj.message || 'An unexpected error occurred.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleKYCSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setKycLoading(true);
    setKycError(null);
    setKycSuccess(false);

    if (!idNumber) {
      setKycError('Please enter a valid NIN or ID document number.');
      setKycLoading(false);
      return;
    }
    if (!selectedFile && !kycDoc?.id_document_url) {
      setKycError('Please upload an image of your ID document.');
      setKycLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('idNumber', idNumber);
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const response = await fetch('/api/kyc/submit', {
        method: 'POST',
        body: formData,
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to submit KYC documents');
      }

      setKycSuccess(true);
      setSelectedFile(null);
      router.refresh();
    } catch (err: unknown) {
    const errorObj = err as Error;
      setKycError(errorObj.message || 'An unexpected error occurred.');
    } finally {
      setKycLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Overview page titles */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">Settings & KYC</h1>
        <p className="text-xs text-slate-400 mt-1">Manage profile parameters and verify your account credentials.</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        
        {/* Left Side: Profile Form */}
        <div className="lg:col-span-3 space-y-6">
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0b0f19] border border-slate-900 shadow-xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white font-heading">Personal Details</h3>
              <p className="text-xs text-slate-400 mt-1">Update name allocations and phone connections.</p>
            </div>

            {profileError && (
              <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 text-red-400 text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{profileError}</span>
              </div>
            )}

            {profileSuccess && (
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 text-xs flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Profile details updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">First Name</label>
                  <input title="First Name" aria-label="First Name" type="text" required value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Last Name</label>
                  <input title="Last Name" aria-label="Last Name" type="text" required value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address (Locked)</label>
                <input
                  title="Email Address"
                  aria-label="Email Address"
                  placeholder="Email Address"
                  type="email"
                  disabled
                  value={email}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-slate-500 text-sm cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="+234..."
                />
              </div>

              <button
                type="submit"
                disabled={profileLoading}
                className="py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2"
              >
                {profileLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Save Profile Changes</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: KYC Upload */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0b0f19] border border-slate-900 shadow-xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white font-heading">KYC Verification</h3>
              <p className="text-xs text-slate-400 mt-1">Upload a government issued identity card (NIN / Driver&apos;s license / Passport).</p>
            </div>

            {/* KYC status blocks */}
            {profile.kyc_status === 'verified' && (
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 text-xs flex items-start space-x-2.5">
                <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                <div>
                  <div className="font-bold uppercase">Account Verified</div>
                  <p className="mt-1 text-[10px] text-emerald-400/80 leading-normal">Your identity has been fully approved by compliance. Withdrawal limits have been unlocked.</p>
                </div>
              </div>
            )}

            {profile.kyc_status === 'pending' && (
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-400 text-xs flex items-start space-x-2.5">
                <Clock className="w-5 h-5 flex-shrink-0" />
                <div>
                  <div className="font-bold uppercase">Awaiting Approval</div>
                  <p className="mt-1 text-[10px] text-amber-400/80 leading-normal">Your document has been submitted and is currently being audited by our security team. Expected wait time: 2-6 hours.</p>
                </div>
              </div>
            )}

            {profile.kyc_status === 'rejected' && (
              <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 text-red-400 text-xs flex items-start space-x-2.5">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <div className="font-bold uppercase">Verification Rejected</div>
                  <p className="mt-1 text-[10px] text-red-400/80 leading-normal">
                    Reason: <strong className="text-white">{kycDoc?.admin_notes || 'Invalid ID document clarity'}</strong>. Please upload a clear picture of your ID to re-apply.
                  </p>
                </div>
              </div>
            )}

            {/* Upload form if not verified and not pending */}
            {(profile.kyc_status === 'pending' || profile.kyc_status === 'verified') ? (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 font-mono text-[10px] space-y-2 text-slate-500">
                <div className="flex justify-between">
                  <span>ID Number on file:</span>
                  <span className="text-slate-300 font-bold">{kycDoc?.id_number || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span>ID Image status:</span>
                  <span className="text-slate-300 capitalize">{kycDoc?.status || 'None'}</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleKYCSubmit} className="space-y-4">
                {kycError && (
                  <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 text-red-400 text-xs flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{kycError}</span>
                  </div>
                )}

                {kycSuccess && (
                  <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 text-xs flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>Documents submitted for verification!</span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    ID Card or NIN Document Number
                  </label>
                  <input
                    type="text"
                    required
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. 12345678901"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Document Image Upload
                  </label>
                  <div className="relative border border-dashed border-slate-800 rounded-xl p-6 text-center hover:border-emerald-500/50 transition-colors bg-slate-950">
                    <input
                      title="ID Document Upload"
                      aria-label="ID Document Upload"
                      placeholder="Upload ID Document"
                      type="file"
                      required
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                    <span className="text-xs font-bold text-slate-400 block">
                      {selectedFile ? selectedFile.name : 'Select ID Card Image'}
                    </span>
                    <span className="text-[9px] text-slate-600 mt-1 block">PNG, JPG or JPEG up to 5MB</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={kycLoading}
                  className="w-full py-3 rounded-xl bg-slate-100 hover:bg-white text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  {kycLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Submit Documents</span>
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
