import React, { useState, useEffect } from 'react';
import { ImageIcon } from 'lucide-react';
import { imageCacheService } from '@core/services/image-cache.service';

interface CachedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt?: string;
  className?: string;
  fallbackIconClassName?: string;
  imgClassName?: string;
}

export function CachedImage({ src, alt, className, imgClassName, fallbackIconClassName, ...props }: CachedImageProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;

    const loadImg = async () => {
      setLoading(true);
      setError(false);
      
      try {
        const url = await imageCacheService.getCachedImage(src);
        if (isMounted) {
          setImgSrc(url);
          setLoading(false);
          if (url.startsWith('blob:')) {
            objectUrl = url;
          }
        }
      } catch (err) {
        console.error('Error loading cached image', err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    if (src) {
      loadImg();
    } else {
      setLoading(false);
      setError(true);
    }

    return () => {
      isMounted = false;
      if (objectUrl) {
        imageCacheService.revokeUrl(objectUrl);
      }
    };
  }, [src]);

  if (error || (!loading && !imgSrc)) {
    return (
      <div className={`flex items-center justify-center bg-surface-alt ${className}`}>
        <ImageIcon className={fallbackIconClassName || "w-6 h-6 text-text-muted/30"} />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-surface-alt animate-pulse z-0" />
      )}
      {imgSrc && (
        <img
          src={imgSrc}
          alt={alt || 'Image'}
          className={`${imgClassName || 'w-full h-full object-cover'} relative z-10 transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
          loading="lazy"
          {...props}
        />
      )}
    </div>
  );
}
