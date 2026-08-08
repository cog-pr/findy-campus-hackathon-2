import { useState, type FormEvent } from 'react'
import { jstLocalToIso } from '../lib/jst'

type Props = {
  members: [string, { displayName: string }][]
  myDeviceId: string
  onCancel: () => void
  onSubmit: (targetDeviceId: string, fireAtIso: string, message: string) => Promise<void>
}

export function AlarmForm({ members, myDeviceId, onCancel, onSubmit }: Props) {
  const [targetDeviceId, setTargetDeviceId] = useState(members[0]?.[0] ?? '')
  const [datetimeLocal, setDatetimeLocal] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!targetDeviceId || !datetimeLocal) {
      setError('対象と日時を入力してください')
      return
    }
    const fireAtIso = jstLocalToIso(datetimeLocal)
    if (new Date(fireAtIso).getTime() <= Date.now()) {
      setError('未来の日時を選んでください')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit(targetDeviceId, fireAtIso, message.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="alarm-form">
      <label>
        対象
        <select value={targetDeviceId} onChange={(e) => setTargetDeviceId(e.target.value)}>
          {members.map(([id, m]) => (
            <option key={id} value={id}>
              {m.displayName}
              {id === myDeviceId ? '（自分）' : ''}
            </option>
          ))}
        </select>
      </label>
      <label>
        日時（JST）
        <input
          type="datetime-local"
          value={datetimeLocal}
          onChange={(e) => setDatetimeLocal(e.target.value)}
          required
        />
      </label>
      <label>
        メッセージ（任意）
        <input value={message} onChange={(e) => setMessage(e.target.value)} maxLength={100} />
      </label>
      {error && <p className="error">{error}</p>}
      <div className="alarm-form-actions">
        <button type="submit" className="primary" disabled={submitting}>
          作成
        </button>
        <button type="button" onClick={onCancel} disabled={submitting}>
          キャンセル
        </button>
      </div>
    </form>
  )
}
