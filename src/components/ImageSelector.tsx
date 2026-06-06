import React, { useState, useRef } from "react";
import { Upload, Link as LinkIcon, X, Image as ImageIcon } from "lucide-react";

interface ImageSelectorProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  placeholder?: string;
}

export default function ImageSelector({
  value,
  onChange,
  label = "Upload Photograph",
  placeholder = "https://example.com/image.jpg"
}: ImageSelectorProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file only.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === "string") {
        onChange(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2 bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800">
      {label && (
        <label className="text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider block">
          {label}
        </label>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* DRAG & DROP / CLICK FILE SELECT CONTAINER */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileInput}
          className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition min-h-[100px] ${
            dragActive
              ? "border-[#FF6B00] bg-[#FF6B00]/5"
              : "border-slate-800 hover:border-slate-700 hover:bg-slate-900/30"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />
          <Upload className={`w-5 h-5 mb-1.5 ${value.startsWith("data:") ? "text-green-400" : "text-slate-400"}`} />
          <p className="text-[10px] font-bold text-slate-350">
            {value.startsWith("data:") ? "✓ File loaded from local disk" : "Drag-Drop file or click to choose"}
          </p>
          <span className="text-[9px] text-slate-500 font-medium">PNG, JPG, SVG are accepted</span>
        </div>

        {/* EXTERNAL URL INPUT & PREVIEW */}
        <div className="flex flex-col justify-between gap-2.5">
          <div className="space-y-1">
            <span className="text-[9.5px] font-semibold text-slate-400 flex items-center gap-1">
              <LinkIcon className="w-3 h-3" /> Or enter Image URL (Optional)
            </span>
            <input
              type="text"
              value={value.startsWith("data:") ? "" : value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full text-xs p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:border-[#FF6B00] font-mono"
            />
          </div>

          {/* ACTIVE PREVIEW */}
          {value ? (
            <div className="flex items-center gap-2.5 bg-slate-900/50 p-2 rounded-xl border border-slate-850">
              <img
                src={value}
                alt="preview"
                className="w-10 h-10 object-cover rounded-lg border border-slate-700 bg-slate-950"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&auto=format&fit=crop&q=60";
                }}
              />
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-black text-[#FF6B00] block uppercase tracking-wide">
                  Image Source Loaded
                </span>
                <p className="text-[9px] text-slate-500 truncate font-mono">
                  {value.startsWith("data:") ? "local Base64 data bundle" : value}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onChange("")}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-[#FF6B00] transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-500 py-1.5 px-3 bg-slate-900/20 rounded-xl border border-dashed border-slate-850">
              <ImageIcon className="w-4 h-4" />
              <span className="text-[9px] font-semibold">No active image preview</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
