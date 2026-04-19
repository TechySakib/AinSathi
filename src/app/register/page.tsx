'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/Logo'
import Watermark from '@/components/Watermark'
import baseStyles from '../page.module.css'
import regStyles from './page.module.css'

const styles = { ...baseStyles, ...regStyles }

const LegalScene3D = dynamic(() => import('@/components/LegalScene3D'), { ssr: false })

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName]   = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [showPass, setShowPass]   = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess('')

    if (!fullName.trim()) { setError('Please enter your full name.'); return }
    if (!email)           { setError('Please enter your email address.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }

    setLoading(true)
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })
    setLoading(false)

    if (authError) {
      setError(authError.message)
    } else {
      setSuccess('Account created! Redirecting to your legal workspace…')
      setTimeout(() => { router.push('/chat'); router.refresh() }, 1500)
    }
  }

  function getStrength(pw: string) {
    let s = 0
    if (pw.length >= 8) s++
    if (/[A-Z]/.test(pw)) s++
    if (/[0-9]/.test(pw)) s++
    if (/[^A-Za-z0-9]/.test(pw)) s++
    return s
  }
  const strength = getStrength(password)
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength]
  const strengthColor = ['', '#FF6B6B', '#FFB347', '#4ECDC4', '#C9A84C'][strength]

  return (
    <main className={styles.root}>
      <LegalScene3D />
      <div className={styles.overlay} />
      <Watermark />

      <div className={styles.content}>
        <div className={`${styles.badge} animate-fade-up`}>
          <span className={styles.badgeDot} />
          Join AinSathi — আইনসাথী
        </div>

        <div className={`${styles.logoWrap} animate-fade-up animate-delay-1`}>
          <Logo size={48} showText />
        </div>

        <div className={`${styles.card} glass animate-fade-up animate-delay-2`} style={{ maxWidth: '460px', width: '100%' }}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <line x1="20" y1="8" x2="20" y2="14"/>
                <line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
            </div>
            <div>
              <h1 className={styles.cardTitle}>Create Account</h1>
              <p className={styles.cardSub}>Free access to AI legal guidance</p>
            </div>
          </div>

          <form id="register-form" onSubmit={handleRegister} className={styles.form} noValidate>
            {/* Full Name */}
            <div className={styles.field}>
              <label htmlFor="reg-name" className={styles.label}>Full Name</label>
              <div className={styles.inputWrap}>
                <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                <input
                  id="reg-name"
                  type="text"
                  className={`input ${styles.input}`}
                  placeholder="Your full name"
                  value={fullName}
                  onChange={e => { setFullName(e.target.value); setError('') }}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className={styles.field}>
              <label htmlFor="reg-email" className={styles.label}>Email Address</label>
              <div className={styles.inputWrap}>
                <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input
                  id="reg-email"
                  type="email"
                  className={`input ${styles.input}`}
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className={styles.field}>
              <label htmlFor="reg-password" className={styles.label}>Password</label>
              <div className={styles.inputWrap}>
                <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  id="reg-password"
                  type={showPass ? 'text' : 'password'}
                  className={`input ${styles.input}`}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  autoComplete="new-password"
                  required
                />
                <button type="button" id="reg-toggle-pass" className={styles.eyeBtn}
                  onClick={() => setShowPass(p => !p)} aria-label="Toggle password visibility">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showPass
                      ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                    }
                  </svg>
                </button>
              </div>
              {/* Strength meter */}
              {password && (
                <div className={styles.strengthWrap}>
                  <div className={styles.strengthBar}>
                    {[1,2,3,4].map(i => (
                      <div key={i} className={styles.strengthSegment}
                        style={{ background: i <= strength ? strengthColor : 'rgba(255,255,255,0.08)' }} />
                    ))}
                  </div>
                  <span className={styles.strengthLabel} style={{ color: strengthColor }}>{strengthLabel}</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className={styles.field}>
              <label htmlFor="reg-confirm" className={styles.label}>Confirm Password</label>
              <div className={styles.inputWrap}>
                <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <input
                  id="reg-confirm"
                  type={showPass ? 'text' : 'password'}
                  className={`input ${styles.input} ${confirm && confirm !== password ? 'error' : ''}`}
                  placeholder="Re-enter password"
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); setError('') }}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            {error && (
              <div id="reg-error" className={styles.errorBox} role="alert">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {success && (
              <div id="reg-success" className={styles.successBox} role="status">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {success}
              </div>
            )}

            <button id="reg-submit" type="submit"
              className={`btn btn-primary ${styles.submitBtn}`} disabled={loading}>
              {loading ? (
                <><span className={styles.spinner} />Creating account…</>
              ) : (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>Create My Account</>
              )}
            </button>
          </form>

          <div className={styles.divider}><span>Already have an account?</span></div>

          <Link id="go-to-login" href="/" className={`btn btn-secondary ${styles.registerBtn}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            Back to Sign In
          </Link>
        </div>
      </div>
    </main>
  )
}
