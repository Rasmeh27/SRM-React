import { useState } from "react";

export default function ImageWithFallback({
  src,
  alt,
  className,
  fallback = "/images/placeholder-gradient.svg",
}: {
  src: string;
  alt?: string;
  className?: string;
  fallback?: string;
}) {
  const [err, setErr] = useState(false);
  return (
    <img
      src={err ? fallback : src}
      alt={alt}
      className={className}
      onError={() => setErr(true)}
      loading="lazy"
    />
  );
}
