/**
 * Lightweight markdown renderer for AinSathi chat bubbles.
 * Handles: bold, italic, inline code, code blocks, ordered/unordered lists,
 * blockquotes, and line breaks — with no external dependencies.
 */

import React from 'react'
import styles from './MarkdownRenderer.module.css'

interface Props {
  content: string
}

// ─── Inline parser ────────────────────────────────────────
// Converts **bold**, *italic*, `code`, and plain text into React nodes.
function parseInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  // Pattern: **bold** | *italic* | `code`
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/g
  let last = 0
  let match: RegExpExecArray | null

  while ((match = re.exec(text)) !== null) {
    // text before match
    if (match.index > last) {
      nodes.push(text.slice(last, match.index))
    }
    if (match[0].startsWith('**')) {
      nodes.push(<strong key={match.index}>{match[2]}</strong>)
    } else if (match[0].startsWith('*')) {
      nodes.push(<em key={match.index}>{match[3]}</em>)
    } else {
      nodes.push(<code key={match.index} className={styles.inlineCode}>{match[4]}</code>)
    }
    last = match.index + match[0].length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

// ─── Block parser ─────────────────────────────────────────
function parseBlocks(raw: string): React.ReactNode[] {
  const elements: React.ReactNode[] = []
  const lines = raw.split('\n')
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    // ── Fenced code block ─────────────────────────────────
    if (line.trimStart().startsWith('```')) {
      const lang = line.trim().slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      elements.push(
        <div key={key++} className={styles.codeBlock}>
          {lang && <span className={styles.codeLang}>{lang}</span>}
          <pre><code>{codeLines.join('\n')}</code></pre>
        </div>
      )
      i++ // consume closing ```
      continue
    }

    // ── Blockquote ────────────────────────────────────────
    if (line.startsWith('> ')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2))
        i++
      }
      elements.push(
        <blockquote key={key++} className={styles.blockquote}>
          {quoteLines.map((ql, qi) => (
            <p key={qi}>{parseInline(ql)}</p>
          ))}
        </blockquote>
      )
      continue
    }

    // ── Unordered list ────────────────────────────────────
    if (/^[-*•] /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*•] /.test(lines[i])) {
        items.push(lines[i].replace(/^[-*•] /, ''))
        i++
      }
      elements.push(
        <ul key={key++} className={styles.list}>
          {items.map((it, ii) => (
            <li key={ii}>{parseInline(it)}</li>
          ))}
        </ul>
      )
      continue
    }

    // ── Ordered list ──────────────────────────────────────
    if (/^\d+\. /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ''))
        i++
      }
      elements.push(
        <ol key={key++} className={styles.list}>
          {items.map((it, ii) => (
            <li key={ii}>{parseInline(it)}</li>
          ))}
        </ol>
      )
      continue
    }

    // ── Heading (## or ###) ───────────────────────────────
    if (line.startsWith('### ')) {
      elements.push(<h3 key={key++} className={styles.h3}>{parseInline(line.slice(4))}</h3>)
      i++; continue
    }
    if (line.startsWith('## ')) {
      elements.push(<h2 key={key++} className={styles.h2}>{parseInline(line.slice(3))}</h2>)
      i++; continue
    }

    // ── Horizontal rule ───────────────────────────────────
    if (/^---+$/.test(line.trim())) {
      elements.push(<hr key={key++} className={styles.hr} />)
      i++; continue
    }

    // ── Empty line (spacing) ──────────────────────────────
    if (line.trim() === '') {
      i++; continue
    }

    // ── Paragraph ─────────────────────────────────────────
    elements.push(
      <p key={key++} className={styles.para}>{parseInline(line)}</p>
    )
    i++
  }

  return elements
}

// ─── Component ────────────────────────────────────────────
export default function MarkdownRenderer({ content }: Props) {
  return (
    <div className={styles.root}>
      {parseBlocks(content)}
    </div>
  )
}
