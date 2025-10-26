import React, { useState } from 'react';

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  fallbackSrc?: string;
};

export const ImageWithFallback: React.FC<Props> = ({
  src,
  alt,
  className = '',
  fallbackSrc = '/cute-placeholder.svg',
  ...rest
}) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const finalSrc = failed ? fallbackSrc : (src as string | undefined);

  return (
    <div className={`relative ${className}`.trim()}>
      {/* Skeleton */}
      {!loaded && !failed && (
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-rose-50 to-fuchsia-50 animate-pulse" />
      )}
      {/* Image */}
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <img
        src={finalSrc}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setFailed(true);
          setLoaded(true);
        }}
        className={`w-full h-full object-cover ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        {...rest}
      />
    </div>
  );
};
