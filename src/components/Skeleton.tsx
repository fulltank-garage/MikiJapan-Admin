type SkeletonBlockProps = {
  className?: string
}

export function SkeletonBlock({ className = '' }: SkeletonBlockProps) {
  return (
    <span
      aria-hidden="true"
      className={`block skeleton-shimmer ${className}`}
    />
  )
}
