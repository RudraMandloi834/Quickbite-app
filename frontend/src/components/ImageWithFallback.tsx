import React, { useState } from 'react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackNode: React.ReactNode;
}

export function ImageWithFallback({ src, alt, fallbackNode, className, ...props }: ImageWithFallbackProps) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return <>{fallbackNode}</>;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      {...props}
    />
  );
}
