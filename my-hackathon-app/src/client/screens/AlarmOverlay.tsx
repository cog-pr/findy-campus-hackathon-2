import { useEffect, useRef, useState } from 'react'
import type { Alarm } from '../../agents/group-agent'
import {
  startAlarmSound,
  startAlarmVibration,
  stopAlarmSound,
  stopAlarmVibration,
  unlockAlarmAudio
} from '../lib/alarmAudio'
import { createWakeVoiceListener, isWakeVoiceSupported } from '../lib/alarmVoice'

type Props = {
  alarm: Alarm
  fromName?: string
  onConfirm: () => void | Promise<void>
}

function formatFireTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    hour: 'numeric',
    minute: '2-digit'
  })
}

export function AlarmOverlay({ alarm, fromName, onConfirm }: Props) {
  const confirmingRef = useRef(false)
  const onConfirmRef = useRef(onConfirm)
  const confirmRef = useRef<() => Promise<void>>(async () => undefined)
  onConfirmRef.current = onConfirm
  const [voiceStatus, setVoiceStatus] = useState<'listening' | 'denied' | 'unavailable' | null>(
    isWakeVoiceSupported() ? null : 'unavailable'
  )

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

    const voice = createWakeVoiceListener({
      onWake: () => {
        void confirm()
      },
      onStatus: setVoiceStatus
    })

    if (voice.supported) {
      voice.start()
    }

    return () => {
      voice.stop()
      stopAlarmSound()
      stopAlarmVibration()
    }
  }, [])

  const voiceUi =
    voiceStatus === 'listening'
      ? {
          className: 'voice-pill listening',
          label: '音声認識中',
          hint: '「起きた」と話しかけても解除できます'
        }
      : voiceStatus === 'denied'
        ? {
            className: 'voice-pill denied',
            label: 'マイク拒否',
            hint: 'マイクが拒否されました。下のボタンで解除してください'
          }
        : voiceStatus === 'unavailable'
          ? {
              className: 'voice-pill unavailable',
              label: '音声非対応',
              hint: 'この端末では音声解除非対応。ボタンで解除してください'
            }
          : voiceStatus === null
            ? {
                className: 'voice-pill starting',
                label: 'マイク準備中',
                hint: '音声解除の準備中です…'
              }
            : null

  const fireTime = formatFireTime(alarm.fireAt)

  return (
    <div className="alarm-overlay" role="alertdialog" aria-modal="true" aria-label="アラーム発火">
      <p className="alarm-overlay-kicker">ALARM</p>
      {fromName && <p className="alarm-overlay-from">{fromName}さんからのアラーム</p>}
      <p className="alarm-overlay-clock">{fireTime}</p>
      <p className="alarm-overlay-title">起きる時間です！</p>
      {alarm.message && <p className="alarm-overlay-message">{alarm.message}</p>}
      <p className="alarm-overlay-hint">音が出なくてもこの赤い画面＝発火中</p>

      {voiceUi && (
        <div className="voice-status-block" aria-live="polite">
          <span className={voiceUi.className}>
            {voiceStatus === 'listening' && <span className="voice-dot" aria-hidden="true" />}
            {voiceUi.label}
          </span>
          <p className="alarm-overlay-voice-hint">{voiceUi.hint}</p>
        </div>
      )}

      <button className="wake-button" type="button" onClick={() => void confirmRef.current()}>
        <span className="wm-icon wm-icon-sun wake-button-icon" aria-hidden="true" />
        起きた！
      </button>
    </div>
  )
}
