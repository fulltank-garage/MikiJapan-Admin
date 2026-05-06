type BrandLogoProps = {
  className?: string
  title?: string
}

export function BrandLogo({
  className = 'size-10',
  title = 'Miki Japan logo',
}: BrandLogoProps) {
  return (
    <svg
      aria-label={title}
      className={className}
      fill="none"
      role="img"
      viewBox="0 0 128 128"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="64" cy="64" fill="#F7E8D6" r="63" />
      <circle cx="64" cy="64" r="62.5" stroke="#E7D3BE" />
      <g stroke="#9A7655" strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M32 54c9 0 16 7 16 16S41 86 32 86 16 79 16 70s7-16 16-16Z"
          strokeWidth="8"
        />
        <path d="M48 70V35" strokeWidth="8" />
        <path d="M48 54h22" strokeWidth="8" />
        <path d="M70 54v32" strokeWidth="8" />
        <path
          d="M70 54h12c11 0 20 7 20 16s-9 16-20 16H70"
          strokeWidth="8"
        />
        <path d="M38 22l13 8" strokeWidth="7" />
        <path d="M84 22l13 8" strokeWidth="7" />
      </g>
      <g stroke="#9A7655" strokeLinecap="round" strokeWidth="1.4">
        <path d="M105 78c4-6 11-6 13 0-4 3-9 3-13 0Z" />
        <path d="M105 78c-4-6-11-6-13 0 4 3 9 3 13 0Z" />
        <path d="M105 78c6 4 6 11 0 13-3-4-3-9 0-13Z" />
        <path d="M105 78c-6 4-6 11 0 13 3-4 3-9 0-13Z" />
      </g>
      <circle cx="105" cy="78" fill="#9A7655" r="1.8" />
      <text
        fill="#9A7655"
        fontFamily="Arial, sans-serif"
        fontSize="7"
        fontWeight="600"
        letterSpacing="1"
        x="45"
        y="94"
      >
        ミキ フロム ジャパン
      </text>
    </svg>
  )
}
