import { useEffect } from 'react'
import type { Alarm } from '../../agents/group-agent'

type Props = {
  alarm: Alarm
  onConfirm: () => void
}

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

export function AlarmOverlay({ alarm, onConfirm }: Props) {
  useEffect(() => {
    beep()
  }, [])

  return (
    <div className="alarm-overlay">
      <p className="alarm-overlay-title">起きる時間です！</p>
      {alarm.message && <p className="alarm-overlay-message">{alarm.message}</p>}
      <button className="wake-button" onClick={onConfirm}>
        起きた！
      </button>
    </div>
  )
}
