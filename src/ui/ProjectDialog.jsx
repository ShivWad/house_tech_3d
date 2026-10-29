import { useEffect, useRef, useState } from 'react'
import { setUI, useUI } from '../state/store'

// Placeholder enquiry form. Not connected to anything: submitting says so
// plainly instead of pretending to send.
export function ProjectDialog() {
  const { dialog } = useUI()
  const ref = useRef()
  const [attempted, setAttempted] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (dialog && !el.open) {
      setAttempted(false)
      el.showModal()
    } else if (!dialog && el.open) el.close()
  }, [dialog])

  return (
    <dialog ref={ref} className="project-dialog" aria-labelledby="project-title" onClose={() => setUI({ dialog: false })}>
      <form
        method="dialog"
        onSubmit={(e) => {
          if (e.nativeEvent.submitter?.value === 'send') {
            e.preventDefault()
            setAttempted(true)
          }
        }}
      >
        <p className="eyebrow">Prototype</p>
        <h2 id="project-title">Discuss your project</h2>
        <p className="dialog-note">
          Enquiries aren&rsquo;t connected in this prototype. Contact details and a form endpoint will be
          supplied by the client.
        </p>
        <label>
          <span>Name</span>
          <input name="name" autoComplete="name" />
        </label>
        <label>
          <span>Email</span>
          <input name="email" type="email" autoComplete="email" />
        </label>
        <label>
          <span>About the project</span>
          <textarea name="project" rows={3} />
        </label>
        <p className="dialog-status" role="status">
          {attempted ? 'Nothing was sent — this form is a placeholder and has no connection yet.' : ''}
        </p>
        <div className="dialog-actions">
          <button type="submit" value="close" className="btn btn--ghost">
            Close
          </button>
          <button type="submit" value="send" className="btn btn--solid">
            Send enquiry
          </button>
        </div>
      </form>
    </dialog>
  )
}
