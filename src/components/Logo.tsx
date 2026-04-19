import styles from './Logo.module.css'

interface LogoProps {
  size?: number
  showText?: boolean
  variant?: 'full' | 'icon'
}

export default function Logo({ size = 40, showText = true, variant = 'full' }: LogoProps) {
  return (
    <div className={styles.logoWrapper} style={{ gap: size * 0.28 + 'px' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 60 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.logoIcon}
        aria-label="AinSathi Logo"
      >
        <defs>
          <linearGradient id="goldGrad" x1="0" y1="0" x2="60" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E8C46A" />
            <stop offset="100%" stopColor="#B8860B" />
          </linearGradient>
          <linearGradient id="blueGrad" x1="0" y1="0" x2="60" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1A4A8A" />
            <stop offset="100%" stopColor="#0D2B5E" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background circle */}
        <circle cx="30" cy="30" r="28" fill="url(#blueGrad)" opacity="0.15" />
        <circle cx="30" cy="30" r="28" fill="none" stroke="url(#goldGrad)" strokeWidth="1.2" opacity="0.5" />

        {/* Pole */}
        <line x1="30" y1="10" x2="30" y2="48" stroke="url(#goldGrad)" strokeWidth="2.2" strokeLinecap="round" />

        {/* Base */}
        <ellipse cx="30" cy="48" rx="9" ry="2.5" fill="url(#goldGrad)" />

        {/* Cross bar */}
        <line x1="12" y1="19" x2="48" y2="19" stroke="url(#goldGrad)" strokeWidth="2" strokeLinecap="round" />

        {/* Left pan chains */}
        <line x1="15" y1="19" x2="13" y2="30" stroke="url(#goldGrad)" strokeWidth="1.2" opacity="0.8" />
        <line x1="19" y1="19" x2="21" y2="30" stroke="url(#goldGrad)" strokeWidth="1.2" opacity="0.8" />
        {/* Left pan */}
        <ellipse cx="17" cy="30" rx="7" ry="2" fill="url(#goldGrad)" filter="url(#glow)" />

        {/* Right pan chains */}
        <line x1="41" y1="19" x2="39" y2="30" stroke="url(#goldGrad)" strokeWidth="1.2" opacity="0.8" />
        <line x1="45" y1="19" x2="47" y2="30" stroke="url(#goldGrad)" strokeWidth="1.2" opacity="0.8" />
        {/* Right pan */}
        <ellipse cx="43" cy="30" rx="7" ry="2" fill="url(#goldGrad)" filter="url(#glow)" />

        {/* Top finial star/glow */}
        <circle cx="30" cy="10" r="2.5" fill="url(#goldGrad)" filter="url(#glow)" />
      </svg>

      {showText && variant === 'full' && (
        <div className={styles.logoText}>
          <span className={styles.logoEn}>AinSathi</span>
          <span className={styles.logoBn}>আইনসাথী</span>
        </div>
      )}
    </div>
  )
}
