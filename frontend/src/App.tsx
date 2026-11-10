import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { create } from 'zustand'
import './App.css'
import { SaveExport } from '../wailsjs/go/main/App'

type GlyphStyle = { color: string; fontSize: number }
type EditorState = {
  text: string
  glyphs: GlyphStyle[]
  color: string
  fontSize: number
  background: string
  selectedExportSize: number
  setText: (text: string) => void
  setColor: (color: string) => void
  setFontSize: (size: number) => void
  setBackground: (color: string) => void
  setSelectedExportSize: (size: number) => void
  applyStyle: (start: number, end: number) => void
}

const defaultStyle = (): GlyphStyle => ({ color: '#f8fafc', fontSize: 72 })
const sampleSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M12 2v4"/><path d="M16 2v4"/><rect width="16" height="18" x="4" y="4" rx="2"/><path d="M8 10h6"/><path d="M8 14h8"/><path d="M8 18h5"/></svg>'

function toHexColor(value: string | null) {
  if (!value || value === 'none' || value === 'currentColor' || value === 'transparent') return null
  const color = value.trim()
  if (/^#[0-9a-f]{6}$/i.test(color)) return color
  if (/^#[0-9a-f]{3}$/i.test(color)) return `#${color.slice(1).split('').map((part) => part + part).join('')}`
  const rgb = color.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i)
  if (rgb) return `#${rgb.slice(1).map((part) => Number(part).toString(16).padStart(2, '0')).join('')}`
  return null
}

function colorFromSvg(text: string) {
  if (!isSvg(text)) return null
  try {
    const svg = new DOMParser().parseFromString(text, 'image/svg+xml').documentElement
    const elements = [svg, ...Array.from(svg.querySelectorAll('*'))]
    for (const element of elements) {
      const color = toHexColor(element.getAttribute('stroke')) ?? toHexColor(element.getAttribute('fill'))
      if (color) return color
    }
  } catch {
    return null
  }
  return null
}

const useEditor = create<EditorState>((set) => ({
  text: sampleSvg,
  glyphs: Array.from({ length: 22 }, defaultStyle),
  color: '#f8fafc',
  fontSize: 72,
  background: '#111827',
  selectedExportSize: 512,
  setText: (text) => set((state) => ({
    text,
    color: colorFromSvg(text) ?? (text.trim() ? state.color : '#f8fafc'),
    glyphs: Array.from({ length: text.length }, (_, index) => state.glyphs[index] ?? defaultStyle()),
  })),
  setColor: (color) => set({ color }),
  setFontSize: (fontSize) => set({ fontSize }),
  setBackground: (background) => set({ background }),
  setSelectedExportSize: (selectedExportSize) => set({ selectedExportSize }),
  applyStyle: (start, end) => set((state) => ({
    glyphs: state.glyphs.map((glyph, index) => index >= start && index < end
      ? { color: state.color, fontSize: state.fontSize }
      : glyph),
  })),
}))

const exportSizes = [16, 32, 48, 64, 128, 256, 512]

function drawText(canvas: HTMLCanvasElement, size: number, text: string, glyphs: GlyphStyle[], background: string) {
  const context = canvas.getContext('2d')
  if (!context) return
  canvas.width = size
  canvas.height = size
  context.clearRect(0, 0, size, size)
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  const maxWidth = size * 0.86
  const average = Math.max(1, text.length)
  const baseSize = Math.min(size * 0.62, maxWidth / Math.max(average * 0.52, 1))
  const chunks = text.split('\n')
  const lineHeight = Math.max(12, baseSize * 1.18)
  const firstY = size / 2 - ((chunks.length - 1) * lineHeight) / 2
  let globalIndex = 0
  chunks.forEach((line, lineIndex) => {
    const measured = line.length * baseSize * 0.52
    let x = size / 2 - measured / 2
    for (const character of line) {
      const style = glyphs[globalIndex] ?? defaultStyle()
      const fontSize = Math.min(style.fontSize * (size / 512), baseSize * 1.25)
      context.font = `700 ${Math.max(8, fontSize)}px Nunito, sans-serif`
      context.fillStyle = style.color
      context.textAlign = 'left'
      context.fillText(character, x, firstY + lineIndex * lineHeight)
      x += context.measureText(character).width
      globalIndex += 1
    }
    globalIndex += 1
  })
}

function isSvg(text: string) {
  return text.trimStart().toLowerCase().startsWith('<svg')
}

async function drawVisual(canvas: HTMLCanvasElement, size: number, text: string, glyphs: GlyphStyle[], background: string) {
  if (!isSvg(text)) {
    drawText(canvas, size, text, glyphs, background)
    return
  }

  const context = canvas.getContext('2d')
  if (!context) return
  canvas.width = size
  canvas.height = size
  context.clearRect(0, 0, size, size)

  const svg = new Blob([text], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svg)
  try {
    const image = new Image()
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('SVG inválido'))
      image.src = url
    })
    const scale = Math.min(size / image.width, size / image.height)
    const width = image.width * scale
    const height = image.height * scale
    context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height)
  } finally {
    URL.revokeObjectURL(url)
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function exportFilename(size: number, format: string) {
  return `svg_editor_${size}px.${format}`
}

function CopyIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
}

function TrashIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 11v6M14 11v6M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
}

function canvasBlob(canvas: HTMLCanvasElement, type = 'image/png'): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('No se pudo generar la imagen')), type))
}

async function createIco(text: string, glyphs: GlyphStyle[], background: string, selectedSize: number) {
  const sizes = [selectedSize]
  const images = await Promise.all(sizes.map(async (size) => {
    const canvas = document.createElement('canvas')
    await drawVisual(canvas, size, text, glyphs, background)
    return new Uint8Array(await (await canvasBlob(canvas)).arrayBuffer())
  }))
  const headerSize = 6 + images.length * 16
  const offsets: number[] = []
  let offset = headerSize
  images.forEach((image) => { offsets.push(offset); offset += image.length })
  const output = new Uint8Array(offset)
  const view = new DataView(output.buffer)
  view.setUint16(0, 0, true)
  view.setUint16(2, 1, true)
  view.setUint16(4, images.length, true)
  images.forEach((image, index) => {
    const entry = 6 + index * 16
    const size = sizes[index]
    output[entry] = size >= 256 ? 0 : size
    output[entry + 1] = size >= 256 ? 0 : size
    output[entry + 2] = 0
    output[entry + 3] = 0
    view.setUint16(entry + 4, 1, true)
    view.setUint16(entry + 6, 32, true)
    view.setUint32(entry + 8, image.length, true)
    view.setUint32(entry + 12, offsets[index], true)
    output.set(image, offsets[index])
  })
  return new Blob([output], { type: 'image/x-icon' })
}

function SvgEditorCanvas({ text, color, onChange }: { text: string; color: string; onChange: (value: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgHostRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<SVGElement | null>(null)
  const [box, setBox] = useState({ left: 0, top: 0, width: 0, height: 0 })
  const selectedRef = useRef<SVGElement | null>(null)

  const updateBox = (element: SVGElement | null) => {
    if (!element || !containerRef.current) return setBox({ left: 0, top: 0, width: 0, height: 0 })
    const item = element.getBoundingClientRect()
    const parent = containerRef.current.getBoundingClientRect()
    setBox({ left: item.left - parent.left, top: item.top - parent.top, width: item.width, height: item.height })
  }

  useEffect(() => {
    if (!containerRef.current || !svgHostRef.current) return
    svgHostRef.current.innerHTML = text
    const svg = svgHostRef.current.querySelector('svg')
    if (!svg) return
    svg.setAttribute('width', '100%')
    svg.setAttribute('height', '100%')
    svg.style.display = 'block'
    svg.style.overflow = 'visible'
    selectedRef.current = null
    setSelected(null)
    setBox({ left: 0, top: 0, width: 0, height: 0 })
  }, [text])

  useEffect(() => {
    if (!svgHostRef.current) return
    const svg = svgHostRef.current.querySelector('svg')
    if (!svg) return
    const active = selectedRef.current && svg.contains(selectedRef.current) ? selectedRef.current : svg
    const hasStroke = active.hasAttribute('stroke') || Boolean(active.ownerSVGElement?.getAttribute('stroke'))
    if (hasStroke || active.getAttribute('fill') === 'none') active.setAttribute('stroke', color)
    else active.setAttribute('fill', color)
    onChange(new XMLSerializer().serializeToString(svg))
    // The selected element is intentionally not a dependency: selecting another
    // element must not recolor it with the current color.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color])

  const selectElement = (event: PointerEvent<HTMLDivElement>) => {
    const target = event.target as Element
    const element = target.closest('path, circle, rect, ellipse, line, polygon, polyline, g, text') as SVGElement | null
    if (!element) { selectedRef.current = null; setSelected(null); return }
    event.stopPropagation()
    selectedRef.current = element
    setSelected(element)
    updateBox(element)
  }

  return <div ref={containerRef} className="svg-editor-canvas" onPointerDown={selectElement}>
    <div ref={svgHostRef} className="svg-host" />
    {selected && <div className="selection-box" style={{ left: box.left, top: box.top, width: box.width, height: box.height }} />}
  </div>
}

function PreviewCanvas({ size }: { size: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const { text, glyphs, background } = useEditor()
  useEffect(() => {
    let cancelled = false
    if (ref.current) drawVisual(ref.current, size, text, glyphs, background).catch(() => { if (!cancelled && ref.current) drawText(ref.current, size, text, glyphs, background) })
    return () => { cancelled = true }
  }, [size, text, glyphs, background])
  return <canvas ref={ref} className="preview-canvas" aria-label={`Vista previa de ${size} por ${size}`} />
}

function App() {
  const { text, glyphs, color, background, selectedExportSize, setText, setColor, setBackground, setSelectedExportSize } = useEditor()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; size: number } | null>(null)
  const [copied, setCopied] = useState(false)

  const copySource = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      const helper = document.createElement('textarea')
      helper.value = text
      helper.style.position = 'fixed'
      helper.style.opacity = '0'
      document.body.appendChild(helper)
      helper.select()
      document.execCommand('copy')
      helper.remove()
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    }
  }

  useEffect(() => {
    let cancelled = false
    if (canvasRef.current) drawVisual(canvasRef.current, 512, text, glyphs, background).catch(() => { if (!cancelled && canvasRef.current) drawText(canvasRef.current, 512, text, glyphs, background) })
    return () => { cancelled = true }
  }, [text, glyphs, background])

  const exportPng = async () => {
    const canvas = document.createElement('canvas')
    await drawVisual(canvas, selectedExportSize, text, glyphs, background)
    downloadBlob(await canvasBlob(canvas), exportFilename(selectedExportSize, 'png'))
  }

  const saveFormat = async (format: string, selectedSize?: number) => {
    const size = selectedSize ?? contextMenu?.size ?? selectedExportSize
    if (!size) return
    setContextMenu(null)
    if (format === 'svg') {
      await SaveExport('svg', text, exportFilename(size, 'svg'))
      return
    }
    if (format === 'ico') {
      const ico = await createIco(text, glyphs, background, size)
      const bytes = new Uint8Array(await ico.arrayBuffer())
      let binary = ''
      bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
      await SaveExport('ico', btoa(binary), exportFilename(size, 'ico'))
      return
    }
    const canvas = document.createElement('canvas')
    await drawVisual(canvas, size, text, glyphs, background)
    const encoded = canvas.toDataURL('image/png').split(',')[1]
    await SaveExport('png', encoded, exportFilename(size, 'png'))
  }

  return (
    <main className="shell">
      <section className="workspace">
        <div className="source-editor">
          <textarea className="source-input" value={text} onChange={(event) => setText(event.target.value)} placeholder="Pegá tu SVG aquí..." />
          <div className="source-actions">
            <button type="button" className="source-action" onClick={() => setText('')} title="Borrar contenido" aria-label="Borrar contenido"><TrashIcon /></button>
            <button type="button" className="source-action" onClick={copySource} title={copied ? 'Contenido copiado' : 'Copiar contenido'} aria-label="Copiar contenido"><CopyIcon /></button>
          </div>
        </div>
        <section className="canvas-panel">
          <div className="canvas-stage"><div className="canvas-grid"><div className="color-badge"><input type="color" value={color} onChange={(event) => setColor(event.target.value)} />{color}</div>{isSvg(text) ? <SvgEditorCanvas text={text} color={color} onChange={setText} /> : <canvas ref={canvasRef} className="main-canvas" />}</div></div>
          <div className="preview-actions"><div className="size-grid">{exportSizes.map((size) => <div className={`size-card ${size === selectedExportSize ? 'selected' : ''}`} key={size} role="button" tabIndex={0} aria-pressed={size === selectedExportSize} aria-label={`Seleccionar resolución ${size} por ${size} píxeles`} onClick={() => { setSelectedExportSize(size); setContextMenu(null) }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedExportSize(size); setContextMenu(null) } }} onContextMenu={(event) => { event.preventDefault(); setSelectedExportSize(size); setContextMenu({ x: event.clientX, y: event.clientY, size }) }}><PreviewCanvas size={size} /><span>{size}px</span></div>)}</div><div className="save-actions"><button onClick={() => saveFormat('png')}>Guardar PNG</button><button onClick={() => saveFormat('ico')}>Guardar ICO</button></div></div>
        </section>

      </section>
      {contextMenu && <div className="context-menu" style={{ left: contextMenu.x, top: contextMenu.y }} onMouseLeave={() => setContextMenu(null)}><strong>{contextMenu.size} × {contextMenu.size}px</strong><button onClick={() => saveFormat('png')}>Guardar PNG</button><button onClick={() => saveFormat('svg')}>Guardar SVG</button><button onClick={() => saveFormat('ico')}>Guardar ICO</button></div>}
    </main>
  )
}

export default App
