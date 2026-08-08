import { useEffect, useRef, useState } from 'react'
import type { Alarm } from '../../agents/group-agent'
import {
  startAlarmSound,
  startAlarmVibration,
  stopAlarmSound,
  stopAlarmVibration,
  unlockAlarmAudio
} from '../lib/alarmAudio'

type VoiceResult = { ok: boolean; heard: string; score: number }

type Props = {
  alarm: Alarm
  fromName?: string
  onConfirm: () => void | Promise<void>
  onVoiceConfirm: (audio: number[]) => Promise<VoiceResult>
}

const RECORD_MS = 4000

function formatFireTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    hour: 'numeric',
    minute: '2-digit'
  })
}

async function recordAudio(ms: number): Promise<number[]> {
  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  } catch {
    throw new Error('マイクを使用できません。ボタンで確認してください')
  }
  try {
    const chunks: BlobPart[] = []
    const recorder = new MediaRecorder(stream)
    const done = new Promise<void>((resolve, reject) => {
      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = () => resolve()
      recorder.onerror = () => reject(new Error('録音に失敗しました'))
    })
    recorder.start()
    await new Promise((r) => setTimeout(r, ms))
    if (recorder.state !== 'inactive') recorder.stop()
    await done
    const buffer = await new Blob(chunks).arrayBuffer()
    return Array.from(new Uint8Array(buffer))
  } finally {
    stream.getTracks().forEach((t) => t.stop())
  }
}

export function AlarmOverlay({ alarm, fromName, onConfirm, onVoiceConfirm }: Props) {
  const confirmingRef = useRef(false)
  const onConfirmRef = useRef(onConfirm)
  const confirmRef = useRef<() => Promise<void>>(async () => undefined)
  onConfirmRef.current = onConfirm
  const [phase, setPhase] = useState<'idle' | 'recording' | 'judging'>('idle')
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    confirmingRef.current = false

    const confirm = async () => {
      if (confirmingRef.current) return
      confirmingRef.current = true
      stopAlarmSound()
      stopAlarmVibration()
      try {
        await onConfirmRef.current()
      } catch {
        confirmingRef.current = false
        void startAlarmSound()
        startAlarmVibration()
      }
    }
    confirmRef.current = confirm

    void unlockAlarmAudio().then(() => startAlarmSound())
    startAlarmVibration()

    return () => {
      stopAlarmSound()
      stopAlarmVibration()
    }
  }, [])

  async function handleVoice() {
    setFeedback(null)
    try {
      setPhase('recording')
      stopAlarmSound()
      const audio = await recordAudio(RECORD_MS)
      setPhase('judging')
      const result = await onVoiceConfirm(audio)
      if (!result.ok) {
        setFeedback(
          result.heard
            ? `「${result.heard}」と聞こえました。もう一度はっきり読んでください`
            : '聞き取れませんでした。もう一度読んでください'
        )
        void startAlarmSound()
      }
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : String(e))
      void startAlarmSound()
    } finally {
      setPhase('idle')
    }
  }

  const busy = phase !== 'idle'
  const fireTime = formatFireTime(alarm.fireAt)

  return (
    <div className="alarm-overlay" role="alertdialog" aria-modal="true" aria-label="アラーム発火">
      <p className="alarm-overlay-kicker">ALARM</p>
      {fromName && <p className="alarm-overlay-from">{fromName}さんからのアラーム</p>}
      <p className="alarm-overlay-clock">{fireTime}</p>
      <p className="alarm-overlay-title">起きる時間です！</p>
      {alarm.message && <p className="alarm-overlay-message">{alarm.message}</p>}

      {alarm.wakePhrase && (
        <div className="voice-check">
          <p className="voice-check-label">声に出して読むと起床が認められます</p>
          <p className="voice-check-phrase">{alarm.wakePhrase}</p>
          <button className="wake-button" type="button" onClick={() => void handleVoice()} disabled={busy}>
            {phase === 'recording' ? '録音中…' : phase === 'judging' ? '判定中…' : '🎤 読み上げる'}
          </button>
          {feedback && <p className="voice-check-feedback">{feedback}</p>}
        </div>
      )}

      <p className="alarm-overlay-hint">音が出なくてもこの赤い画面＝発火中</p>

      <button
        className="wake-button secondary"
        type="button"
        onClick={() => void confirmRef.current()}
        disabled={busy}
      >
        <span className="wm-icon wm-icon-sun wake-button-icon" aria-hidden="true" />
        起きた！（ボタンで確認）
      </button>
    </div>
  )
}
