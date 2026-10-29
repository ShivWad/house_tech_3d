import { useState } from 'react'
import { setUI } from '../state/store'
import { Wordmark } from './Overlay'
import { PanelControls } from './PanelControls'
import { ProjectDialog } from './ProjectDialog'

// Shown when WebGL is unavailable or the 3D scene fails: a drawn room
// elevation whose four lit features respond to the same panel controls.
export function Fallback() {
  const [on, setOn] = useState([false, false, false, false])
  const toggle = (i) => setOn((s) => s.map((v, j) => (j === i ? !v : v)))
  const cls = ['wall', 'spot', 'niche', 'path'].filter((_, i) => on[i]).map((id) => `on-${id}`).join(' ')

  return (
    <div className="fallback">
      <header className="site-header">
        <Wordmark />
      </header>
      <main className="fallback__main">
        <section className="fallback__text">
          <h1>A touch changes everything.</h1>
          <p>Small details. Extraordinary spaces.</p>
          <p className="fallback__note">
            The 3D walkthrough needs WebGL, which isn&rsquo;t available here. This simplified view shows the same
            four lights.
          </p>
          <PanelControls on={on} onToggle={toggle} />
          <button type="button" className="btn btn--solid" onClick={() => setUI({ dialog: true })}>
            Discuss your project
          </button>
        </section>
        <figure className={`elevation ${cls}`} aria-label="Illustrated room elevation reflecting the light states">
          <div className="elevation__wall">
            <span className="elevation__sconce" />
            <span className="elevation__wash" />
            <span className="elevation__art" />
            <span className="elevation__spot" />
            <span className="elevation__niche">
              <i />
              <i />
            </span>
            <span className="elevation__credenza" />
          </div>
          <div className="elevation__floor">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="elevation__path" />
            ))}
          </div>
        </figure>
      </main>
      <ProjectDialog />
    </div>
  )
}
