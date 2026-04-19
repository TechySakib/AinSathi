import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 — Page Not Found | AinSathi',
  description: 'The page you are looking for does not exist.',
}

export default function NotFound() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--color-bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'var(--font-sans)',
      textAlign: 'center',
    }}>
      {/* Decorative scale icon */}
      <div style={{
        width: 96,
        height: 96,
        borderRadius: '50%',
        background: 'rgba(201,168,76,0.07)',
        border: '1px solid rgba(201,168,76,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '2rem',
        boxShadow: '0 0 48px rgba(201,168,76,0.12)',
        animation: 'fadeUp 0.5s ease forwards',
      }}>
        <svg width="44" height="44" viewBox="0 0 60 60" fill="none">
          <line x1="30" y1="8" x2="30" y2="50" stroke="#C9A84C" strokeWidth="3.5"/>
          <line x1="10" y1="18" x2="50" y2="18" stroke="#C9A84C" strokeWidth="3"/>
          <line x1="12" y1="18" x2="15" y2="32" stroke="#C9A84C" strokeWidth="2.5"/>
          <ellipse cx="13.5" cy="32" rx="9" ry="3" fill="#C9A84C"/>
          <line x1="48" y1="18" x2="45" y2="32" stroke="#C9A84C" strokeWidth="2.5"/>
          <ellipse cx="46.5" cy="32" rx="9" ry="3" fill="rgba(201,168,76,0.35)"/>
          <circle cx="30" cy="8" r="3.5" fill="#C9A84C"/>
        </svg>
      </div>

      {/* 404 */}
      <p style={{
        fontSize: '5rem',
        fontWeight: 800,
        letterSpacing: '-4px',
        background: 'linear-gradient(135deg, #C9A84C 0%, #E8C46A 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        lineHeight: 1,
        marginBottom: '0.75rem',
        animation: 'fadeUp 0.5s ease 0.05s both',
      }}>
        404
      </p>

      <h1 style={{
        fontSize: '1.5rem',
        fontWeight: 700,
        color: 'var(--color-text)',
        marginBottom: '0.75rem',
        animation: 'fadeUp 0.5s ease 0.1s both',
      }}>
        Page Not Found
      </h1>

      <p style={{
        fontSize: '15px',
        color: 'var(--color-text-muted)',
        maxWidth: 420,
        lineHeight: 1.7,
        marginBottom: '2.5rem',
        animation: 'fadeUp 0.5s ease 0.15s both',
      }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
        Return to the legal workspace below.
      </p>

      <div style={{
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        justifyContent: 'center',
        animation: 'fadeUp 0.5s ease 0.2s both',
      }}>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, #C9A84C 0%, #E8C46A 100%)',
            color: '#0A1628',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '14px',
            textDecoration: 'none',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Back to Home
        </Link>

        <Link
          href="/chat"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: 'transparent',
            color: 'var(--color-text-muted)',
            border: '1px solid rgba(201,168,76,0.2)',
            borderRadius: '12px',
            fontWeight: 600,
            fontSize: '14px',
            textDecoration: 'none',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Open Chat
        </Link>
      </div>
    </main>
  )
}
