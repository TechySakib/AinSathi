'use client'

// Prevent static prerendering — this page requires auth at request time
export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  createConversation,
  getConversations,
  getMessages,
  saveMessage,
  updateConversationTitle,
  deleteConversation,
  type Conversation,
  type Message,
  type Citation,
} from '@/lib/chatHistory'
import { useIncognito } from '@/hooks/useIncognito'
import Logo from '@/components/Logo'
import Watermark from '@/components/Watermark'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import styles from './page.module.css'

// ─── Typing indicator ────────────────────────────────────
function TypingIndicator() {
  return (
    <div className={styles.typingWrap} aria-label="AI is thinking">
      <div className={styles.aiBubbleAvatar}>
        <svg width="14" height="14" viewBox="0 0 60 60" fill="none">
          <line x1="30" y1="10" x2="30" y2="48" stroke="#C9A84C" strokeWidth="3" />
          <line x1="12" y1="19" x2="48" y2="19" stroke="#C9A84C" strokeWidth="2.5" />
          <ellipse cx="17" cy="30" rx="8" ry="2.5" fill="#C9A84C" />
          <ellipse cx="43" cy="30" rx="8" ry="2.5" fill="#C9A84C" />
          <circle cx="30" cy="10" r="3" fill="#C9A84C" />
        </svg>
      </div>
      <div className={styles.typingBubble}>
        <span className={styles.dot} style={{ animationDelay: '0ms' }} />
        <span className={styles.dot} style={{ animationDelay: '160ms' }} />
        <span className={styles.dot} style={{ animationDelay: '320ms' }} />
      </div>
    </div>
  )
}

// ─── Message bubble ───────────────────────────────────────
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(msg.content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className={`${styles.messageRow} ${isUser ? styles.userRow : styles.aiRow}`}>
      {!isUser && (
        <div className={styles.aiBubbleAvatar}>
          <svg width="14" height="14" viewBox="0 0 60 60" fill="none">
            <line x1="30" y1="10" x2="30" y2="48" stroke="#C9A84C" strokeWidth="3" />
            <line x1="12" y1="19" x2="48" y2="19" stroke="#C9A84C" strokeWidth="2.5" />
            <ellipse cx="17" cy="30" rx="8" ry="2.5" fill="#C9A84C" />
            <ellipse cx="43" cy="30" rx="8" ry="2.5" fill="#C9A84C" />
          </svg>
        </div>
      )}
      <div className={`${styles.bubble} ${isUser ? styles.userBubble : styles.aiBubble}`}>
        {isUser ? (
          // User messages: plain text with newline support
          msg.content.split('\n').map((line, i) => (
            <p key={i} className={styles.bubbleLine}>{line}</p>
          ))
        ) : (
          // AI messages: full markdown rendering
          <MarkdownRenderer content={msg.content} />
        )}
        {!isUser && msg.citations && msg.citations.length > 0 && (
          <div className={styles.sourcesBox}>
            <div className={styles.sourcesTitle}>Sources</div>
            {msg.citations.map((citation) => (
              <details key={citation.id} className={styles.sourceItem}>
                <summary className={styles.sourceSummary}>
                  [{citation.id}] {citation.act_title}
                  {citation.section ? ` — Section ${citation.section}` : ''}
                </summary>
                <div className={styles.sourceBody}>
                  <p><strong>Year:</strong> {citation.year || 'N/A'}</p>
                  <p><strong>Status:</strong> {citation.status || 'N/A'}</p>
                  <p className={styles.sourceText}>{citation.text}</p>
                </div>
              </details>
            ))}
          </div>
        )}

        <div className={styles.bubbleFooter}>
          <span className={styles.bubbleTime}>
            {new Date(msg.created_at).toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {!isUser && (
            <button
              id={`copy-msg-${msg.id}`}
              className={styles.copyBtn}
              onClick={handleCopy}
              title="Copy to clipboard"
              aria-label="Copy message"
            >
              {copied ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ECDC4" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Sidebar conversation item ─────────────────────────────
function ConvItem({
  conv, active, onClick, onDelete,
}: { conv: Conversation; active: boolean; onClick: () => void; onDelete: () => void }) {
  const [confirm, setConfirm] = useState(false)
  return (
    <div className={`${styles.convItem} ${active ? styles.convActive : ''}`} onClick={onClick}>
      <div className={styles.convIcon}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <span className={styles.convTitle}>{conv.title}</span>
      <button
        id={`delete-conv-${conv.id}`}
        className={styles.convDelete}
        onClick={e => {
          e.stopPropagation()
          if (confirm) { onDelete(); setConfirm(false) } else setConfirm(true)
        }}
        title={confirm ? 'Click again to confirm' : 'Delete conversation'}
        aria-label="Delete conversation"
      >
        {confirm
          ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
          : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
        }
      </button>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────
export default function ChatPage() {
  const router = useRouter()
  const supabase = createClient()
  const { isIncognito, toggleIncognito } = useIncognito()

  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState('User')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [initDone, setInitDone] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // ── Auth ──────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/'); return }
      setUserId(user.id)
      setUserName(user.user_metadata?.full_name?.split(' ')[0] ?? user.email?.split('@')[0] ?? 'User')
      setInitDone(true)
    })
  }, [])

  // ── Load conversations ────────────────────────────────
  useEffect(() => {
    if (!userId || isIncognito) return
    getConversations(userId).then(convs => {
      setConversations(convs)
      if (convs.length > 0 && !activeConvId) {
        setActiveConvId(convs[0].id)
      }
    })
  }, [userId, isIncognito])

  // ── Load messages when conversation changes ───────────
  useEffect(() => {
    if (!activeConvId || isIncognito) { setMessages([]); return }
    getMessages(activeConvId).then(setMessages)
  }, [activeConvId, isIncognito])

  // ── Scroll to bottom ─────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // ── New conversation ──────────────────────────────────
  const startNewConversation = useCallback(async () => {
    if (isIncognito) {
      setActiveConvId(null)
      setMessages([])
      return
    }
    if (!userId) return
    const conv = await createConversation(userId)
    if (!conv) return
    setConversations(prev => [conv, ...prev])
    setActiveConvId(conv.id)
    setMessages([])
  }, [userId, isIncognito])

  // ── Send message ──────────────────────────────────────
  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')

    // Ensure conversation exists (non-incognito)
    let convId = activeConvId
    if (!isIncognito && !convId && userId) {
      const conv = await createConversation(userId)
      if (conv) {
        convId = conv.id
        setConversations(prev => [conv, ...prev])
        setActiveConvId(conv.id)
      }
    }

    // Optimistically add user message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      conversation_id: convId ?? 'incognito',
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    // Persist user message
    if (!isIncognito && convId) {
      await saveMessage(convId, 'user', text)
      // Auto-title from first message
      if (messages.length === 0) {
        const title = text.length > 50 ? text.slice(0, 50) + '…' : text
        await updateConversationTitle(convId, title)
        setConversations(prev => prev.map(c => c.id === convId ? { ...c, title } : c))
      }
    }

    // Call AI
    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      })
      const data = await res.json()
      const aiContent = data.response ?? data.error ?? 'An error occurred.'

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        conversation_id: convId ?? 'incognito',
        role: 'assistant',
        content: aiContent,
        citations: data.citations ?? [],
        created_at: new Date().toISOString(),
      }
      console.log('AI response data:', data)
      setMessages(prev => [...prev, aiMsg])

      if (!isIncognito && convId) {
        await saveMessage(convId, 'assistant', aiContent)
      }
    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        conversation_id: convId ?? 'incognito',
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        created_at: new Date().toISOString(),
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  async function handleDeleteConv(convId: string) {
    await deleteConversation(convId)
    setConversations(prev => prev.filter(c => c.id !== convId))
    if (activeConvId === convId) { setActiveConvId(null); setMessages([]) }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (!initDone) {
    return (
      <div className={styles.loadingScreen}>
        <Logo size={48} showText />
        <div className={styles.loadingBar}><div className={styles.loadingFill} /></div>
      </div>
    )
  }

  // ── Starter prompts ───────────────────────────────────
  const starterPrompts = [
    { icon: '⚖️', label: 'What is Section 302 of the Penal Code?' },
    { icon: '🏠', label: 'How do I file a land dispute case in Bangladesh?' },
    { icon: '👨‍👩‍👧', label: 'What are the divorce laws for Muslims in Bangladesh?' },
    { icon: '💼', label: 'What are workers\' rights under the Labour Act 2006?' },
  ]

  return (
    <div className={styles.shell}>
      <Watermark />

      {/* ── Sidebar ─────────────────────────────────── */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}
        aria-label="Conversation sidebar">
        {/* Sidebar header */}
        <div className={styles.sidebarHeader}>
          <Logo size={30} showText />
          <button id="new-chat-btn" className={`btn btn-primary ${styles.newChatBtn}`}
            onClick={startNewConversation} title="New conversation">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Chat
          </button>
        </div>

        {/* Incognito toggle */}
        <div className={`${styles.incognitoToggle} ${isIncognito ? styles.incognitoOn : ''}`}>
          <div className={styles.incognitoInfo}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
            <div>
              <span className={styles.incognitoLabel}>Incognito Mode</span>
              <span className={styles.incognitoSub}>
                {isIncognito ? 'Chat not saved' : 'Chat is saved'}
              </span>
            </div>
          </div>
          <button
            id="incognito-toggle"
            className={`${styles.toggleBtn} ${isIncognito ? styles.toggleOn : ''}`}
            onClick={toggleIncognito}
            role="switch"
            aria-checked={isIncognito}
            aria-label="Toggle incognito mode"
          >
            <span className={styles.toggleThumb} />
          </button>
        </div>

        {/* Conversation list */}
        <div className={styles.convList}>
          {!isIncognito && conversations.length === 0 && (
            <p className={styles.noConvs}>No conversations yet. Start a new chat!</p>
          )}
          {isIncognito && (
            <div className={styles.incognitoNote}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
              <p>History is disabled in incognito mode</p>
            </div>
          )}
          {!isIncognito && conversations.map(conv => (
            <ConvItem
              key={conv.id}
              conv={conv}
              active={conv.id === activeConvId}
              onClick={() => setActiveConvId(conv.id)}
              onDelete={() => handleDeleteConv(conv.id)}
            />
          ))}
        </div>

        {/* User footer */}
        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>{userName[0].toUpperCase()}</div>
            <span className={styles.userName}>{userName}</span>
          </div>
          <button id="logout-btn" className={`btn btn-ghost ${styles.logoutBtn}`}
            onClick={handleLogout} title="Sign out" aria-label="Sign out">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>

      {/* ── Main chat area ───────────────────────────── */}
      <div className={styles.main}>
        {/* Top bar */}
        <header className={styles.topBar}>
          <button id="sidebar-toggle" className={styles.sidebarToggle}
            onClick={() => setSidebarOpen(p => !p)} aria-label="Toggle sidebar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className={styles.topBarTitle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Bangladesh Legal Assistant
          </div>

          {isIncognito && (
            <div className={styles.incognitoBanner} role="status">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
              Incognito — not saving
            </div>
          )}
        </header>

        {/* Messages area */}
        <div className={styles.messagesArea} id="messages-area">
          {messages.length === 0 && !loading && (
            <div className={styles.welcome}>
              <div className={styles.welcomeIcon}>
                <svg width="36" height="36" viewBox="0 0 60 60" fill="none">
                  <line x1="30" y1="8" x2="30" y2="50" stroke="#C9A84C" strokeWidth="3.5" />
                  <line x1="10" y1="18" x2="50" y2="18" stroke="#C9A84C" strokeWidth="3" />
                  <line x1="12" y1="18" x2="15" y2="32" stroke="#C9A84C" strokeWidth="2.5" />
                  <ellipse cx="13.5" cy="32" rx="9" ry="3" fill="#C9A84C" />
                  <line x1="48" y1="18" x2="45" y2="32" stroke="#C9A84C" strokeWidth="2.5" />
                  <ellipse cx="46.5" cy="32" rx="9" ry="3" fill="#C9A84C" />
                  <circle cx="30" cy="8" r="3.5" fill="#C9A84C" />
                </svg>
              </div>
              <h2 className={styles.welcomeTitle}>
                স্বাগতম, {userName}!
              </h2>
              <p className={styles.welcomeSub}>
                Ask me anything about Bangladesh law — acts, rights, procedures, or legal definitions.
              </p>
              <div className={styles.starterGrid}>
                {starterPrompts.map((p, i) => (
                  <button
                    key={i}
                    id={`starter-${i}`}
                    className={styles.starterBtn}
                    onClick={() => { setInput(p.label); inputRef.current?.focus() }}
                  >
                    <span className={styles.starterEmoji}>{p.icon}</span>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className={styles.inputBar}>
          <div className={styles.inputWrap}>
            <textarea
              ref={inputRef}
              id="chat-input"
              className={styles.textarea}
              placeholder="Ask about Bangladesh law… (Shift+Enter for new line)"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              aria-label="Chat message input"
            />
            <button
              id="send-btn"
              className={`${styles.sendBtn} ${input.trim() && !loading ? styles.sendActive : ''}`}
              onClick={handleSend}
              disabled={!input.trim() || loading}
              aria-label="Send message"
            >
              {loading ? (
                <svg className={styles.sendSpinner} width="18" height="18" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="31.4" strokeDashoffset="10" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </div>
          <p className={styles.disclaimer}>
            AinSathi provides general legal information, not formal legal advice. Consult a licensed lawyer for your case.
          </p>
        </div>
      </div>
    </div>
  )
}
