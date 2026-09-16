import React, { useRef, useState } from 'react';
import { ImagePlus, Link2, Loader2, Trash2, Upload } from 'lucide-react';
import {
  CompressedImage,
  MAX_EDGE_PX,
  compressImageFile,
  dataUrlBytes,
  formatBytes,
} from '../../lib/imageUpload';
import { Field, inputClass } from './ui';

interface ImageFieldProps {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  /** Square preview for logos and product shots; wide for banners. */
  aspect?: 'square' | 'wide';
  className?: string;
}

/**
 * Pick a photo from the device, or paste a URL.
 *
 * `accept="image/*"` with no `capture` attribute is what makes a phone offer the
 * photo library alongside the camera, which is what the shop actually needs —
 * product shots are usually already in the gallery.
 *
 * Chosen files are resized and re-encoded before they are handed back (see
 * lib/imageUpload), because with no file server the result has to fit in
 * localStorage next to the orders.
 */
export const ImageField: React.FC<ImageFieldProps> = ({
  label,
  hint,
  value,
  onChange,
  aspect = 'square',
  className = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [lastUpload, setLastUpload] = useState<CompressedImage | null>(null);

  const accept = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const result = await compressImageFile(file);
      setLastUpload(result);
      onChange(result.dataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not use that image.');
    } finally {
      setBusy(false);
    }
  };

  const isUploaded = value.startsWith('data:');
  const shownBytes = isUploaded ? (lastUpload?.bytes ?? dataUrlBytes(value)) : 0;

  return (
    <Field label={label} hint={hint} className={className}>
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          {/* Preview */}
          <div
            className={`shrink-0 overflow-hidden rounded-lg border border-[#E8DFD8] bg-[#F5EFE6] ${
              aspect === 'wide' ? 'h-16 w-28' : 'h-16 w-16'
            }`}
          >
            {value ? (
              <img src={value} alt={`${label} preview`} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[#A69286]">
                <ImagePlus className="h-5 w-5" />
              </div>
            )}
          </div>

          {/* Drop zone / picker */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void accept(e.dataTransfer.files?.[0]);
            }}
            className={`flex min-h-16 flex-1 flex-col items-center justify-center gap-1 rounded-lg border border-dashed px-3 py-2 text-[11px] transition-colors ${
              dragging
                ? 'border-[#241510] bg-[#F5EFE6] text-[#241510]'
                : 'border-[#E8DFD8] bg-white text-[#8C766B] hover:border-[#8C766B] hover:text-[#241510]'
            }`}
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing…</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span className="font-medium">Choose from gallery</span>
                <span className="text-[10px]">or drag a photo here</span>
              </>
            )}
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            void accept(e.target.files?.[0]);
            // Allow re-picking the same file.
            e.target.value = '';
          }}
        />

        {/* URL fallback, still the better option when the image is hosted */}
        <div className="relative">
          <Link2 className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#A69286]" />
          <input
            value={isUploaded ? '' : value}
            onChange={(e) => {
              setLastUpload(null);
              onChange(e.target.value);
            }}
            placeholder={isUploaded ? 'Uploaded photo in use — paste a URL to replace it' : 'https://… or /logo.png'}
            className={`${inputClass} pl-8`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#8C766B]">
          {isUploaded && (
            <>
              <span className="font-medium text-emerald-700">Uploaded · {formatBytes(shownBytes)}</span>
              <span>resized to fit {MAX_EDGE_PX}px</span>
            </>
          )}
          {value && (
            <button
              type="button"
              onClick={() => {
                setLastUpload(null);
                setError(null);
                onChange('');
              }}
              className="inline-flex items-center gap-1 text-[#8C766B] hover:text-rose-600"
            >
              <Trash2 className="h-3 w-3" /> Remove
            </button>
          )}
        </div>

        {error && <p className="text-[11px] text-rose-600">{error}</p>}
      </div>
    </Field>
  );
};
