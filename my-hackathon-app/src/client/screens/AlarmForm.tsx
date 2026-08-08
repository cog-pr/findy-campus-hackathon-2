import { useMemo, useRef, useState, type FormEvent } from 'react'
import { unlockAlarmAudio } from '../lib/alarmAudio'
import { jstDatetimeLocalAfterMinutes, jstLocalToIso } from '../lib/jst'

type Props = {
  members: [string, { displayName: string }][]
  myDeviceId: string
  onCancel: () => void
  onSubmit: (targetDeviceId: string, fireAtIso: string, message: string) => Promise<void>
}

function initialOf(name: string): string {
  const t = name.trim()
  return t ? t.slice(0, 1) : '?'
}

function parseLocalParts(datetimeLocal: string): { time: string; dateLabel: string } | null {
  if (!datetimeLocal || !datetimeLocal.includes('T')) return null
  const [datePart, timePart] = datetimeLocal.split('T')
  if (!datePart || !timePart) return null
  const [y, m, d] = datePart.split('-').map(Number)
  if (!y || !m || !d) return null
  const weekday = new Date(y, m - 1, d).toLocaleDateString('ja-JP', { weekday: 'short' })
  return {
    time: timePart.slice(0, 5),
    dateLabel: `${m}月${d}日（${weekday}）`
  }
}

export function AlarmForm({ members, myDeviceId, onCancel, onSubmit }: Props) {
  const others = useMemo(() => members.filter(([id]) => id !== myDeviceId), [members, myDeviceId])
  const defaultTarget = others[0]?.[0] ?? members[0]?.[0] ?? ''

  const [targetDeviceId, setTargetDeviceId] = useState(defaultTarget)
  const [datetimeLocal, setDatetimeLocal] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const datetimeRef = useRef<HTMLInputElement>(null)

  function openDatetimePicker() {
    const el = datetimeRef.current
    if (!el) return
    try {
      el.showPicker?.()
    } catch {
      el.focus()
      el.click()
    }
  }

  const selectedName =
    others.find(([id]) => id === targetDeviceId)?.[1]?.displayName ??
    members.find(([id]) => id === targetDeviceId)?.[1]?.displayName ??
    ''
  const parts = parseLocalParts(datetimeLocal)

  function applyQuickMinutes(minutes: number) {
    void unlockAlarmAudio()
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
    void unlockAlarmAudio()
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
      <header className="alarm-form-head">
        <h3 className="alarm-form-title">アラームをセット</h3>
        <p className="alarm-form-lead">誰に・いつ鳴らすかを設定します</p>
      </header>

      {/* Slide 03: 対象にする人 row */}
      <div className="form-card-row">
        <span className="form-card-label">対象にする人</span>
        <div className="form-card-body form-card-target">
          <span className="member-avatar" aria-hidden="true">
            {initialOf(selectedName || '?')}
          </span>
          <select
            className="form-card-select"
            value={targetDeviceId}
            onChange={(e) => setTargetDeviceId(e.target.value)}
            disabled={others.length === 0}
            aria-label="対象にする人"
          >
            {others.length === 0 && <option value="">（相手の参加待ち）</option>}
            {others.map(([id, m]) => (
              <option key={id} value={id}>
                {m.displayName}
              </option>
            ))}
          </select>
          <span className="form-card-chevron" aria-hidden="true" />
        </div>
      </div>

      {/* Slide 03: large time display */}
      <div className="form-card-row form-card-time">
        <span className="form-card-label">時間</span>
        <button
          type="button"
          className="form-card-body form-card-time-body"
          onClick={openDatetimePicker}
        >
          <span className="wm-icon wm-icon-clock" aria-hidden="true" />
          <span className="form-time-display">{parts?.time ?? '--:--'}</span>
        </button>
        <input
          ref={datetimeRef}
          className="form-datetime-input"
          type="datetime-local"
          value={datetimeLocal}
          onChange={(e) => setDatetimeLocal(e.target.value)}
          required
          aria-label="日時（JST）"
        />
      </div>

      <div className="form-card-row">
        <span className="form-card-label">日付</span>
        <button
          type="button"
          className="form-card-body form-card-date-body"
          onClick={openDatetimePicker}
        >
          <span className="wm-icon wm-icon-calendar" aria-hidden="true" />
          <span className="form-date-display">{parts?.dateLabel ?? '日時を選ぶ'}</span>
          <span className="form-card-chevron" aria-hidden="true" />
        </button>
      </div>

      <div className="quick-time-row">
        <span className="quick-time-label">デモ用</span>
        <button type="button" disabled={submitting} onClick={() => applyQuickMinutes(1)}>
          1分後
        </button>
        <button type="button" disabled={submitting} onClick={() => applyQuickMinutes(3)}>
          3分後
        </button>
      </div>

      <label className="form-message-label">
        メッセージ（任意）
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={100}
          placeholder="例: 今日は大事な面接だよ"
        />
      </label>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="alarm-form-actions">
        <button type="submit" className="primary set-cta" disabled={submitting || others.length === 0}>
          セットする
        </button>
        <button type="button" className="ghost" onClick={onCancel} disabled={submitting}>
          キャンセル
        </button>
      </div>
    </form>
  )
}
