import { useEffect } from 'react'
import type { Alarm } from '../../agents/group-agent'

type Props = {
  alarm: Alarm
  onConfirm: () => void | Promise<void>
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

function vibrate() {
  try {
    navigator.vibrate?.([200, 100, 200, 100, 400])
  } catch {
    // 非対応端末は無視
  }
}

export function AlarmOverlay({ alarm, onConfirm }: Props) {
  useEffect(() => {
    beep()
    vibrate()
    const id = window.setInterval(() => {
      vibrate()
    }, 2000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="alarm-overlay" role="alertdialog" aria-modal="true" aria-label="アラーム発火">
      <p className="alarm-overlay-kicker">ALARM</p>
      <p className="alarm-overlay-title">起きる時間です！</p>
      {alarm.message && <p className="alarm-overlay-message">{alarm.message}</p>}
      <p className="alarm-overlay-hint">音が出なくてもこの赤い画面＝発火中</p>
      <button className="wake-button" onClick={() => void onConfirm()}>
        起きた！
      </button>
    </div>
  )
}
