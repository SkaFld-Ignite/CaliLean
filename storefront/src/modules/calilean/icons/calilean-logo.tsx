type CaliLeanLogoProps = {
  className?: string
  color?: string
  tracking?: "nav" | "display" | "packaging"
}

const CaliLeanLogo = ({
  className = "",
  color = "currentColor",
  tracking = "nav",
}: CaliLeanLogoProps) => {
  const trackingVar = `var(--brand-wordmark-tracking-${tracking})`

  return (
    <svg
      viewBox="0 0 600 120"
      role="img"
      aria-label="calilean"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <text
        x="0"
        y="92"
        fontFamily="var(--font-display), Fraunces, 'GT Sectra Display', 'Domaine Display', 'Times New Roman', serif"
        fontSize="104"
        fontWeight={400}
        style={{ letterSpacing: trackingVar }}
        fill={color}
      >
        calilean
      </text>
    </svg>
  )
}

export default CaliLeanLogo
