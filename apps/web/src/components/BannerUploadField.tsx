'use client';

import { useState } from 'react';
import { API_BASE } from '../lib/api';

type BannerUploadFieldProps = {
  token: string;
  value: string;
  onChange: (value: string) => void;
};

export function BannerUploadField({
  token,
  value,
  onChange
}: BannerUploadFieldProps) {
  const [status, setStatus] = useState('');

  const handleUpload = async (file: File | null) => {
    if (!file) {
      return;
    }
    setStatus('Uploading...');

    try {
      const presignResponse = await fetch(`${API_BASE}/uploads/presign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
          folder: 'events'
        })
      });

      if (!presignResponse.ok) {
        throw new Error(await presignResponse.text());
      }

      const presignData = (await presignResponse.json()) as {
        uploadUrl: string;
        publicUrl?: string | null;
        key: string;
      };

      const uploadResult = await fetch(presignData.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream'
        },
        body: file
      });

      if (!uploadResult.ok) {
        throw new Error('Upload failed');
      }

      onChange(presignData.publicUrl || presignData.key);
      setStatus('Uploaded.');
    } catch {
      setStatus('Upload failed.');
    }
  };

  return (
    <div className="flex flex-col gap-2 text-sm">
      <span>Banner upload (optional)</span>
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <input
          type="file"
          accept="image/*"
          onChange={(event) => handleUpload(event.target.files?.[0] || null)}
          className="text-xs text-neutral-200"
        />
        {status ? <span className="text-xs text-emerald-200">{status}</span> : null}
      </div>
      <input
        name="bannerUrl"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Banner URL or storage key"
        className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
      />
    </div>
  );
}
