import mikiJapanLogo from '../assets/miki-japan-logo.jpg'

type BrandLogoProps = {
  className?: string
  title?: string
}

export function BrandLogo({
  className = 'size-10',
  title = 'Miki Japan logo',
}: BrandLogoProps) {
  return (
    <img
      alt={title}
      className={`${className} rounded-full border border-[#ead8c7] bg-[#f7eadc] object-cover`}
      src={mikiJapanLogo}
    />
  )
}
