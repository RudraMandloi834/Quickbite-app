import React, { useState } from 'react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackNode: React.ReactNode;
  priority?: boolean;
}

export function ImageWithFallback({ src, alt, fallbackNode, className, priority = false, ...props }: ImageWithFallbackProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (!src || error) {
    return <>{fallbackNode}</>;
  }

  return (
    <>
      {loading && (
        <div className={`absolute inset-0 bg-stone-200 animate-pulse ${className || ''}`} />
      )}
      <img
        src={src}
        alt={alt}
        className={`${className || ''} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onError={() => setError(true)}
        onLoad={() => setLoading(false)}
        loading={priority ? "eager" : "lazy"}
        {...props}
      />
    </>
  );
}
