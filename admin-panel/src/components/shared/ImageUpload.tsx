'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export default function ImageUpload({
  images,
  onChange,
  maxImages = 5,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files?.length) return;
      setUploading(true);
      try {
        const formData = new FormData();
        for (const file of Array.from(files)) {
          formData.append('images', file);
        }
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.urls) {
          onChange([...images, ...data.urls].slice(0, maxImages));
        }
      } catch (err) {
        console.error('Upload failed', err);
      } finally {
        setUploading(false);
      }
    },
    [images, onChange, maxImages]
  );

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {images.map((url, i) => (
          <div key={i} className="relative h-24 w-24 overflow-hidden rounded-md border">
            <Image
              src={url}
              alt={`Image ${i + 1}`}
              fill
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute right-1 top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {images.length < maxImages && (
          <label
            className={cn(
              'flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed text-muted-foreground hover:border-primary hover:text-primary',
              uploading && 'opacity-50'
            )}
          >
            <Upload className="mb-1 h-5 w-5" />
            <span className="text-xs">Upload</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        )}
      </div>
    </div>
  );
}
