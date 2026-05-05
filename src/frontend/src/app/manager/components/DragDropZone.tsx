"use client";

import React, { useState, useEffect } from 'react';
import PreviewHover from './PreviewHover';

interface DragDropZoneProps {
  label: string;
  category: string;
  wsNum: string;
  fileName?: string;
  session?: string;
  title?: string;
  onSuccess?: (filePath: string) => void;
}

export default function DragDropZone({ label, category, wsNum, fileName, session, title, onSuccess }: DragDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  
  const [expectedUri, setExpectedUri] = useState("");
  const [gcloudUrl, setGcloudUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [fileExists, setFileExists] = useState(false);
  const [fileMtime, setFileMtime] = useState(0);

  const checkFile = async () => {
    if (!fileName) return;
    try {
      const qs = new URLSearchParams({ category, wsNum, fileName, session: session || '', v: '2' }).toString();
      const res = await fetch(`/api/manager/check-file?${qs}`);
      const data = await res.json();
      if (data.success) {
        setExpectedUri(data.fileUri);
        setGcloudUrl(data.gcloudUrl);
        setWebsiteUrl(data.websiteUrl);
        // Detect file change: if mtime differs, the file was swapped on disk
        if (data.mtime && data.mtime !== fileMtime) {
          setFileMtime(data.mtime);
          // Reset upload status so the zone looks fresh after a backend swap
          if (status === 'success' || status === 'error') {
            setStatus('idle');
          }
        }
        setFileExists(data.exists);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    checkFile();
    // Poll every 5 seconds just in case it's manually downloaded in background
    const interval = setInterval(checkFile, 5000);
    return () => clearInterval(interval);
  }, [fileName, category, wsNum, session]);

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;

    setStatus("uploading");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);
    formData.append("wsNum", wsNum);
    if (fileName) formData.append("fileName", fileName);
    if (session) formData.append("session", session);

    try {
      const res = await fetch('/api/manager/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setStatus("success");
        setFileExists(true);
        if (onSuccess) onSuccess(data.path);
        // Immediately re-check to pick up new mtime and path info
        setTimeout(checkFile, 300);
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
        onDrop={handleDrop}
        className={`border-2 border-dashed p-4 text-center rounded cursor-pointer transition-colors ${
          isDragOver ? "border-sky-400 bg-sky-900 text-sky-400" : "border-slate-600 bg-slate-900 text-slate-400 hover:border-slate-400"
        }`}
      >
        {status === "idle" && <span>{label}</span>}
        {status === "uploading" && <span className="text-yellow-400">⏳ Uploading...</span>}
        {status === "success" && <span className="text-green-400">✅ Saved</span>}
        {status === "error" && <span className="text-red-400">❌ Failed</span>}
      </div>
      {status === "error" && <span className="text-xs text-red-400">{errorMsg}</span>}
      
      {fileName && expectedUri && (
        <div className="mt-1 flex items-start gap-3 bg-slate-950 p-3 rounded border border-slate-700">
          <div className="text-3xl mt-0.5 leading-none">
            {fileExists ? (
              <PreviewHover fileName={fileName!} wsNum={wsNum} session={session || (category === 'Poster' ? 'Posters' : 'General')} title={title}>
                <span className="cursor-help">✅</span>
              </PreviewHover>
            ) : '❌'}
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Local Target Path</div>
              <a 
                href={expectedUri} 
                target="_blank" 
                rel="noopener noreferrer"
                title={expectedUri}
                className={`text-[11px] block break-all hover:underline ${fileExists ? 'text-green-400 font-bold' : 'text-slate-500'}`}
              >
                {expectedUri.replace('file:///', '')}
              </a>
            </div>
            {gcloudUrl && (
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">GCloud URL</div>
                <a 
                  href={gcloudUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[11px] block break-all hover:underline text-sky-400"
                >
                  {gcloudUrl}
                </a>
              </div>
            )}
            {websiteUrl && (
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Public Website URL</div>
                <a 
                  href={websiteUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[11px] block break-all hover:underline text-purple-400"
                >
                  {websiteUrl}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
