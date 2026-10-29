import { LIGHTS } from '../config/journey'

// Accessible HTML replica of the 2 × 2 panel. Used as the manual control in
// explore mode and in the no-WebGL fallback.
export function PanelControls({ on, onToggle, disabled = false, label = 'Lighting panel' }) {
  return (
    <div className="panel-controls" role="group" aria-label={label}>
      {LIGHTS.map((l, i) => (
        <button
          key={l.id}
          type="button"
          className="panel-key"
          aria-pressed={on[i]}
          aria-keyshortcuts={l.key}
          disabled={disabled}
          onClick={() => onToggle(i)}
        >
          <span className="panel-key__label">{l.label}</span>
          <span className="panel-key__state" aria-hidden="true">
            <i /> {on[i] ? 'On' : 'Off'}
          </span>
        </button>
      ))}
    </div>
  )
}
