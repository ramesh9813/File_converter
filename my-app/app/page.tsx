'use client';

import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [targetFormat, setTargetFormat] = useState('');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'converting' | 'completed' | 'failed'>('idle');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setTargetFormat('');
      setStatus('idle');
      setDownloadUrl('');
      setError('');
    }
  };

  const getAvailableFormats = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (!ext) return [];

    switch (ext) {
      case 'md': return ['html'];
      case 'json': return ['yaml'];
      case 'yaml':
      case 'yml': return ['json'];
      case 'csv': return ['json'];
      case 'png': return ['jpg', 'jpeg', 'webp'];
      case 'jpg':
      case 'jpeg': return ['png', 'webp'];
      case 'webp': return ['png', 'jpg', 'jpeg'];
      default: return [];
    }
  };

  const handleConvert = async () => {
    if (!file || !targetFormat) return;

    setStatus('uploading');
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('targetFormat', targetFormat);

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Conversion failed');
      }

      const data = await response.json();
      if (data.success) {
        setDownloadUrl(data.downloadUrl);
        setStatus('completed');
      } else {
        throw new Error(data.error || 'Conversion failed');
      }
    } catch (err: any) {
      setError(err.message);
      setStatus('failed');
    }
  };

  const availableFormats = file ? getAvailableFormats(file.name) : [];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">File Converter</h1>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Select File</label>
          <input
            type="file"
            onChange={handleFileChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {file && availableFormats.length > 0 && (
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Target Format</label>
            <select
              value={targetFormat}
              onChange={(e) => setTargetFormat(e.target.value)}
              className="w-full border p-2 rounded"
            >
              <option value="">Select Format</option>
              {availableFormats.map(fmt => (
                <option key={fmt} value={fmt}>{fmt.toUpperCase()}</option>
              ))}
            </select>
          </div>
        )}

        {file && availableFormats.length === 0 && (
            <p className="text-red-500 mb-4">No supported conversion for this file type.</p>
        )}

        <button
          onClick={handleConvert}
          disabled={!file || !targetFormat || status === 'uploading'}
          className="w-full bg-blue-500 text-white p-2 rounded disabled:bg-gray-300 hover:bg-blue-600 transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {status === 'uploading' ? 'Converting...' : 'Convert'}
        </button>

        {status === 'completed' && downloadUrl && (
          <div className="mt-6 text-center">
            <p className="text-green-600 mb-2">Conversion Successful!</p>
            <a
              href={downloadUrl}
              download
              className="inline-block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
            >
              Download Converted File
            </a>
          </div>
        )}

        {status === 'failed' && (
          <div className="mt-6 text-center text-red-500">
            <p>Error: {error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
