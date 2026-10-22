import React, { useState } from 'react';
import Image from 'next/image';

interface ImageWithFallbackProps {
  src?: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  fallbackNode?: React.ReactNode;
}

export function ImageWithFallback({ 
  src, 
  alt, 
  className = '', 
  priority = false,
  fill = true,
  width,
  height,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  fallbackNode 
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (!src || error) {
    return <div className={`relative ${className}`}>{fallbackNode || <div className="w-full h-full bg-stone-200 flex items-center justify-center text-stone-400 text-sm">No Image</div>}</div>;
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-stone-200 animate-pulse z-0" />
      )}
      <Image
        src={src as string}
        alt={alt}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        sizes={fill ? sizes : undefined}
        priority={priority}
        className={`object-cover z-10 transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
        onError={() => setError(true)}
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}
