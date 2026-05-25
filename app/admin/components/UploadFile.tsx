'use client';

import { useState } from 'react';
import { UploadCloud, File as FileIcon } from 'lucide-react';

export default function UploadFile({
  onUpload,
}: {
  onUpload?: (url: string) => void;
}) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function uploadFile(file: File) {
    setLoading(true);
    setFileName(file.name);

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    setLoading(false);

    if (onUpload) onUpload(data.url);
  }

  return (
    <label className="group flex flex-col items-center justify-center w-full rounded-xl border border-dashed border-white/15 bg-[#121212] p-6 cursor-pointer hover:border-sky-500/50 hover:bg-white/5 transition-all">
      
      <input
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadFile(file);
        }}
      />

      <UploadCloud className="w-10 h-10 text-sky-400 mb-2 group-hover:scale-110 transition-transform" />

      <p className="text-sm text-white font-semibold">
        {loading ? 'Uploading...' : 'Click to upload or drag file here'}
      </p>

      {fileName && (
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
          <FileIcon className="w-4 h-4" />
          {fileName}
        </div>
      )}
    </label>
  );
}