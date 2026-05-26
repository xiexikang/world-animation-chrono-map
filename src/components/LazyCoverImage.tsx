import { useEffect, useState } from 'react'
import { useInView } from '@/hooks/useInView'
import { resolveCoverUrl } from '@/lib/coverUrl'

interface LazyCoverImageProps {
  src: string
  alt?: string
  className?: string
  onError?: () => void
}

export function LazyCoverImage({
  src,
  alt = '',
  className = '',
  onError,
}: LazyCoverImageProps) {
  const { ref, inView } = useInView('100px')
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setLoaded(false)
    setFailed(false)
  }, [src])

  const showImage = inView && !failed

  return (
    <div ref={ref} className={`relative h-full w-full ${className}`}>
      {showImage && (
        <img
          src={resolveCoverUrl(src)}
          alt={alt}
          crossOrigin="anonymous"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => {
            setFailed(true)
            onError?.()
          }}
          className={`h-full w-full object-cover transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  )
}
