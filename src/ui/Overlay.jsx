import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { captionOpacity, fadeIn, fadeOut, journeyLevel, LIGHTS, TEXT } from '../config/journey'
import { anim, getUI, setUI, useUI } from '../state/store'
import { enterExplore, exitExplore, replay, toggleLight } from '../state/controller'
import { PanelControls } from './PanelControls'
import { ProjectDialog } from './ProjectDialog'

export function Wordmark() {
  return (
    <div className="wordmark" aria-label="Wordmark placeholder">
      <span className="wordmark__grid" aria-hidden="true">
        <i /> <i /> <i /> <i />
      </span>
      <span>Wordmark</span>
    </div>
  )
}

// Writes scroll-driven opacity straight to the DOM each tick; hidden layers
// are made inert so invisible buttons can't take focus.
function useTimelineStyles(refs) {
  useEffect(() => {
    const cache = new Map()
    const set = (el, opacity, extra) => {
      if (!el) return
      const o = Math.round(opacity * 1000) / 1000
      if (cache.get(el) === o && !extra) return
      cache.set(el, o)
      el.style.opacity = o
      el.style.visibility = o < 0.005 ? 'hidden' : 'visible'
      el.inert = o < 0.3
      extra?.(el, o)
    }
    const tick = () => {
      const { p, modeT, veil } = anim
      const j = 1 - modeT
      const r = refs.current
      set(r.intro, fadeOut(TEXT.intro.out, p) * j)
      set(r.doorbell, fadeIn(TEXT.doorbell.in, p) * fadeOut(TEXT.doorbell.out, p) * j)
      set(r.panelLine, fadeIn(TEXT.panel.in, p) * fadeOut(TEXT.panel.out, p) * j)
      LIGHTS.forEach((_, i) => set(r.captions[i], captionOpacity(i, p) * j))
      const outro = fadeIn(TEXT.outro.in, p)
      set(r.status, fadeIn(TEXT.status.in, p) * (1 - outro) * j, (el) => {
        LIGHTS.forEach((_, i) => el.children[i].classList.toggle('is-on', journeyLevel(i, p) > 0.5))
      })
      set(r.outro, outro * j)
      set(r.rail, j)
      if (r.railFill) r.railFill.style.transform = `scaleY(${p})`
      set(r.replay, getUI().mode === 'explore' ? 1 : fadeIn(TEXT.replay.in, p))
      if (r.veil) {
        r.veil.style.opacity = veil
        r.veil.style.visibility = veil > 0.001 ? 'visible' : 'hidden'
      }
    }
    gsap.ticker.add(tick)
    tick()
    return () => gsap.ticker.remove(tick)
  }, [refs])
}

function useExploreKeys(active) {
  useEffect(() => {
    if (!active) return
    const onKey = (e) => {
      if (getUI().dialog || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.target.closest?.('input, textarea')) return
      const i = LIGHTS.findIndex((l) => l.key === e.key)
      if (i >= 0) {
        e.preventDefault()
        toggleLight(i)
      } else if (e.key === 'Escape') {
        exitExplore()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active])
}

export function Overlay({ onPlayJourney }) {
  const ui = useUI()
  const refs = useRef({ captions: [] })
  useTimelineStyles(refs)
  useExploreKeys(ui.mode === 'explore')
  const exploring = ui.mode === 'explore'
  const openDialog = () => setUI({ dialog: true })

  return (
    <>
      <header className="site-header">
        <Wordmark />
        <nav className="site-header__actions" aria-label="Experience">
          {!ui.reducedMotion && (
            <button type="button" className="link-btn" ref={(el) => (refs.current.replay = el)} onClick={replay} disabled={ui.busy}>
              Replay
            </button>
          )}
          {exploring && !ui.reducedMotion ? (
            <button type="button" className="btn btn--ghost btn--sm" onClick={exitExplore} disabled={ui.busy}>
              Back to journey
            </button>
          ) : !exploring ? (
            <button type="button" className="btn btn--ghost btn--sm" onClick={enterExplore} disabled={ui.busy}>
              Try the switches
            </button>
          ) : null}
        </nav>
      </header>

      {!ui.reducedMotion && (
        <main className="journey-text" aria-hidden={exploring}>
          <section className="intro" ref={(el) => (refs.current.intro = el)}>
            <h1>
              A touch changes
              <br />
              everything.
            </h1>
            <p className="scroll-cue">
              <span className="scroll-cue__line" aria-hidden="true" />
              Scroll to enter
            </p>
          </section>

          <p className="caption" ref={(el) => (refs.current.doorbell = el)}>
            <span className="caption__index">00</span>
            <span className="caption__label">Video Doorbell</span>
          </p>

          <p className="panel-line" ref={(el) => (refs.current.panelLine = el)}>
            Four keys. One room.
          </p>

          {LIGHTS.map((l, i) => (
            <p key={l.id} className="caption" ref={(el) => (refs.current.captions[i] = el)}>
              <span className="caption__index">0{i + 1}</span>
              <span className="caption__label">{l.label}</span>
            </p>
          ))}

          <div className="status" aria-hidden="true" ref={(el) => (refs.current.status = el)}>
            {LIGHTS.map((l) => (
              <i key={l.id} />
            ))}
          </div>

          <section className="outro" ref={(el) => (refs.current.outro = el)}>
            <h2>
              Small details.
              <br />
              Extraordinary spaces.
            </h2>
            <div className="outro__actions">
              <button type="button" className="btn btn--solid" onClick={enterExplore} disabled={ui.busy}>
                Try the switches
              </button>
              <button type="button" className="btn btn--ghost" onClick={openDialog}>
                Discuss your project
              </button>
            </div>
          </section>

          <div className="rail" aria-hidden="true" ref={(el) => (refs.current.rail = el)}>
            <span ref={(el) => (refs.current.railFill = el)} />
          </div>
        </main>
      )}

      <aside className={`explore ${exploring ? 'is-active' : ''}`} aria-hidden={!exploring} inert={!exploring}>
        {ui.reducedMotion && (
          <div className="explore__intro">
            <h1>A touch changes everything.</h1>
            <p>Small details. Extraordinary spaces.</p>
          </div>
        )}
        <div className="explore__card">
          <p className="eyebrow" id="explore-title">
            Try the switches
          </p>
          <PanelControls on={ui.on} onToggle={toggleLight} label="Lighting panel — toggle each light" />
          <p className="explore__hint">
            Tap a key or the panel on the wall, or press <kbd>1</kbd>–<kbd>4</kbd>
            {!ui.reducedMotion && (
              <>
                . <kbd>Esc</kbd> returns to the journey
              </>
            )}
            .
          </p>
          <div className="explore__actions">
            <button type="button" className="link-btn" onClick={openDialog}>
              Discuss your project
            </button>
            {ui.reducedMotion && (
              <button type="button" className="link-btn" onClick={onPlayJourney}>
                Play the journey
              </button>
            )}
          </div>
        </div>
      </aside>

      <div className="veil" aria-hidden="true" ref={(el) => (refs.current.veil = el)} />
      <ProjectDialog />
    </>
  )
}
