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
  const [gcloudConsoleUri, setGcloudConsoleUri] = useState("");
  const [gcloudExists, setGcloudExists] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [localWebsiteUrl, setLocalWebsiteUrl] = useState("");
  const [devWebsiteUrl, setDevWebsiteUrl] = useState("");
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
        setGcloudConsoleUri(data.gcloudConsoleUri);
        setGcloudExists(data.gcloudExists);
        setWebsiteUrl(data.websiteUrl);
        setLocalWebsiteUrl(data.localWebsiteUrl || "");
        setDevWebsiteUrl(data.devWebsiteUrl || "");
        
        // Detect file change: if mtime differs, the file was swapped on disk
        if (data.mtime && data.mtime !== fileMtime) {
          setFileMtime(data.mtime);
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
        if (onSuccess) onSuccess(fileName || data.path);
        setTimeout(checkFile, 300);
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  };

  const handleOpenParentFolder = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!expectedUri) return;
    try {
      const cleanPath = expectedUri.replace('file:///', '');
      await fetch(`/api/manager/open-folder?path=${encodeURIComponent(cleanPath)}`);
    } catch (err) {
      console.error('Failed to open parent folder:', err);
    }
  };

  const handleDeleteLocalFile = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!fileName) return;
    if (!confirm(`Are you sure you want to delete the local file: ${fileName}?`)) return;
    
    try {
      const res = await fetch('/api/manager/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, category, wsNum, session: session || 'General' })
      });
      const data = await res.json();
      if (data.success) {
        setFileExists(false);
        checkFile();
        if (onSuccess) onSuccess('');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err: any) {
      alert('Error deleting file: ' + err.message);
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
        <div className="mt-1 flex flex-col gap-3 bg-slate-950 p-3 rounded border border-slate-800">
          <div className="flex-1 space-y-3">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                Local Target Path {fileExists && <span className="text-green-500 font-bold text-xs" title="File exists locally">✅</span>}
              </div>
              <div className="flex items-center gap-2 justify-between">
                {fileExists ? (
                  <>
                    <PreviewHover 
                      fileName={fileName} 
                      wsNum={wsNum} 
                      session={session || 'General'} 
                      title={title}
                    >
                      <a 
                        href="#" 
                        onClick={handleOpenParentFolder}
                        title="Click to open parent folder in Windows Explorer"
                        className="text-[11px] block break-all text-green-400 font-semibold hover:underline flex-1"
                      >
                        {expectedUri.replace('file:///', '')} 📂
                      </a>
                    </PreviewHover>
                    <button
                      onClick={handleDeleteLocalFile}
                      title="Delete local file"
                      className="text-red-500 hover:text-red-400 font-bold text-[10px] px-2 py-0.5 rounded border border-red-900/30 hover:border-red-500 bg-red-950/20 transition-colors"
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <span className="text-[11px] block break-all text-slate-500 line-through opacity-60">
                    {expectedUri.replace('file:///', '')}
                  </span>
                )}
              </div>
            </div>
            
            {gcloudUrl && (
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  GCloud URL
                  {fileExists ? (
                    gcloudExists ? (
                      <span className="text-green-500 font-bold text-[10px] flex items-center gap-0.5" title="Uploaded & Live">
                        ✅ Uploaded
                      </span>
                    ) : (
                      <span className="text-yellow-500 font-bold text-[10px] flex items-center gap-0.5" title="Will upload on Push to Live">
                        ⏳ Upload Pending
                      </span>
                    )
                  ) : (
                    gcloudExists ? (
                      <span className="text-red-500 font-bold text-[10px] flex items-center gap-0.5 animate-pulse" title="Will delete from live on Push to Live">
                        🗑️ Deletion Pending
                      </span>
                    ) : null
                  )}
                </div>
                {gcloudExists ? (
                  <a 
                    href={gcloudConsoleUri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    title="Open parent folder in Google Cloud Storage Console"
                    className="text-[11px] block break-all text-sky-400 hover:underline font-medium"
                  >
                    {gcloudUrl}
                  </a>
                ) : (
                  <span className="text-[11px] block break-all text-slate-500 opacity-60">
                    {gcloudUrl}
                  </span>
                )}
              </div>
            )}
            
            {websiteUrl && (
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Public Website URL
                </div>
                <div className="space-y-1.5 bg-slate-900/40 p-2 rounded border border-slate-900">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Local</span>
                    {gcloudExists ? (
                      <a 
                        href={localWebsiteUrl || websiteUrl.replace('https://www.hems-workshop.org', 'http://localhost:3000')} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[11px] block break-all text-purple-400 hover:underline font-semibold"
                      >
                        {localWebsiteUrl || websiteUrl.replace('https://www.hems-workshop.org', 'http://localhost:3000')}
                      </a>
                    ) : (
                      <span className="text-[11px] block break-all text-slate-500 opacity-60 line-through">
                        {localWebsiteUrl || websiteUrl.replace('https://www.hems-workshop.org', 'http://localhost:3000')}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-0.5 border-t border-slate-900/60 pt-1.5">
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Dev</span>
                    {gcloudExists ? (
                      <a 
                        href={devWebsiteUrl || websiteUrl.replace('https://www.hems-workshop.org', 'https://hems-workshop.web.app')} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[11px] block break-all text-indigo-400 hover:underline font-semibold"
                      >
                        {devWebsiteUrl || websiteUrl.replace('https://www.hems-workshop.org', 'https://hems-workshop.web.app')}
                      </a>
                    ) : (
                      <span className="text-[11px] block break-all text-slate-500 opacity-60 line-through">
                        {devWebsiteUrl || websiteUrl.replace('https://www.hems-workshop.org', 'https://hems-workshop.web.app')}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-0.5 border-t border-slate-900/60 pt-1.5">
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Release</span>
                    {gcloudExists ? (
                      <a 
                        href={websiteUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[11px] block break-all text-emerald-400 hover:underline font-semibold"
                      >
                        {websiteUrl}
                      </a>
                    ) : (
                      <span className="text-[11px] block break-all text-slate-500 opacity-60 line-through">
                        {websiteUrl}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
