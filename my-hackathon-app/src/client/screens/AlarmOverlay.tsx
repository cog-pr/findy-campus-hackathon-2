import { useEffect, useState } from 'react'
import type { Alarm } from '../../agents/group-agent'

type VoiceResult = { ok: boolean; heard: string; score: number }

type Props = {
  alarm: Alarm
  onConfirm: () => void | Promise<void>
  onVoiceConfirm: (audio: number[]) => Promise<VoiceResult>
}

const RECORD_MS = 4000

function beep() {
  try {
    const ctx = new AudioContext()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.type = 'square'
    oscillator.frequency.value = 880
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    oscillator.start()
    oscillator.stop(ctx.currentTime + 0.6)
    oscillator.onended = () => ctx.close()
  } catch {
    // ブラウザの自動再生制限で鳴らせない場合は無視する
  }
}

function vibrate() {
  try {
    navigator.vibrate?.([200, 100, 200, 100, 400])
  } catch {
    // 非対応端末は無視
  }
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

export function AlarmOverlay({ alarm, onConfirm, onVoiceConfirm }: Props) {
  const [phase, setPhase] = useState<'idle' | 'recording' | 'judging'>('idle')
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    beep()
    vibrate()
    const id = window.setInterval(vibrate, 2000)
    return () => window.clearInterval(id)
  }, [])

  async function handleVoice() {
    setFeedback(null)
    try {
      setPhase('recording')
      const audio = await recordAudio(RECORD_MS)
      setPhase('judging')
      const result = await onVoiceConfirm(audio)
      if (!result.ok) {
        setFeedback(
          result.heard
            ? `「${result.heard}」と聞こえました。もう一度はっきり読んでください`
            : '聞き取れませんでした。もう一度読んでください'
        )
      }
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : String(e))
    } finally {
      setPhase('idle')
    }
  }

  const busy = phase !== 'idle'

  return (
    <div className="alarm-overlay" role="alertdialog" aria-modal="true" aria-label="アラーム発火">
      <p className="alarm-overlay-kicker">ALARM</p>
      <p className="alarm-overlay-title">起きる時間です！</p>
      {alarm.message && <p className="alarm-overlay-message">{alarm.message}</p>}

      {alarm.wakePhrase && (
        <div className="voice-check">
          <p className="voice-check-label">声に出して読むと起床が認められます</p>
          <p className="voice-check-phrase">{alarm.wakePhrase}</p>
          <button className="wake-button" onClick={handleVoice} disabled={busy}>
            {phase === 'recording' ? '録音中…' : phase === 'judging' ? '判定中…' : '🎤 読み上げる'}
          </button>
          {feedback && <p className="voice-check-feedback">{feedback}</p>}
        </div>
      )}

      <p className="alarm-overlay-hint">音が出なくてもこの赤い画面＝発火中</p>
      <button className="wake-button secondary" onClick={() => void onConfirm()} disabled={busy}>
        起きた！（ボタンで確認）
      </button>
    </div>
  )
}
