import { useMemo, useState, type FormEvent } from 'react'
import { jstDatetimeLocalAfterMinutes, jstLocalToIso } from '../lib/jst'

type Props = {
  members: [string, { displayName: string }][]
  myDeviceId: string
  onCancel: () => void
  onSubmit: (targetDeviceId: string, fireAtIso: string, message: string) => Promise<void>
}

export function AlarmForm({ members, myDeviceId, onCancel, onSubmit }: Props) {
  const others = useMemo(() => members.filter(([id]) => id !== myDeviceId), [members, myDeviceId])
  const defaultTarget = others[0]?.[0] ?? members[0]?.[0] ?? ''

  const [targetDeviceId, setTargetDeviceId] = useState(defaultTarget)
  const [datetimeLocal, setDatetimeLocal] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function applyQuickMinutes(minutes: number) {
    setDatetimeLocal(jstDatetimeLocalAfterMinutes(minutes))
    setError(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!targetDeviceId || !datetimeLocal) {
      setError('対象と日時を入力してください')
      return
    }
    if (others.length === 0) {
      setError('相手が参加してからアラームを作成してください')
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
        <select
          value={targetDeviceId}
          onChange={(e) => setTargetDeviceId(e.target.value)}
          disabled={others.length === 0}
        >
          {others.length === 0 && <option value="">（相手の参加待ち）</option>}
          {others.map(([id, m]) => (
            <option key={id} value={id}>
              {m.displayName}
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
      <div className="quick-time-row">
        <span className="quick-time-label">デモ用</span>
        <button type="button" disabled={submitting} onClick={() => applyQuickMinutes(1)}>
          1分後
        </button>
        <button type="button" disabled={submitting} onClick={() => applyQuickMinutes(3)}>
          3分後
        </button>
      </div>
      <label>
        メッセージ（任意）
        <input value={message} onChange={(e) => setMessage(e.target.value)} maxLength={100} />
      </label>
      {error && <p className="error">{error}</p>}
      <div className="alarm-form-actions">
        <button type="submit" className="primary" disabled={submitting || others.length === 0}>
          作成
        </button>
        <button type="button" onClick={onCancel} disabled={submitting}>
          キャンセル
        </button>
      </div>
    </form>
  )
}
