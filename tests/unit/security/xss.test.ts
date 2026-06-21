import { describe, it, expect } from 'vitest'

// Mirror of escapeHtml from ai/page.tsx
function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
}

function renderMarkdown(text: string): string {
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}

describe('escapeHtml (XSS prevention)', () => {
  it('escapes < and > to prevent tag injection', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;')
  })

  it('escapes & to prevent entity injection', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b')
  })

  it('escapes double quotes', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;')
  })

  it('escapes single quotes', () => {
    expect(escapeHtml("it's fine")).toBe("it&#x27;s fine")
  })

  it('leaves normal text unchanged', () => {
    expect(escapeHtml('Hello World 123')).toBe('Hello World 123')
  })

  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('')
  })
})

describe('renderMarkdown (XSS prevention + markdown)', () => {
  it('renders **bold** as <strong> tag', () => {
    expect(renderMarkdown('**hello**')).toBe('<strong>hello</strong>')
  })

  it('escapes HTML before applying markdown — prevents XSS via bold syntax', () => {
    const malicious = '**<script>alert(1)</script>**'
    const result = renderMarkdown(malicious)
    expect(result).not.toContain('<script>')
    expect(result).toContain('&lt;script&gt;')
    expect(result).toContain('<strong>')
  })

  it('does not execute injected HTML from AI response', () => {
    const aiResponse = '<img src=x onerror="alert(1)"> calories today'
    const result = renderMarkdown(aiResponse)
    expect(result).not.toContain('<img')
    expect(result).toContain('&lt;img')
  })

  it('correctly renders mixed content safely', () => {
    const text = '**BMR**: 2000 קל׳ & active <today>'
    const result = renderMarkdown(text)
    expect(result).toBe('<strong>BMR</strong>: 2000 קל׳ &amp; active &lt;today&gt;')
  })

  it('handles text with no markdown unchanged (except escaping)', () => {
    expect(renderMarkdown('plain text')).toBe('plain text')
  })
})
