/**
 * Voice dismiss for alarm overlay via Web Speech API (webkitSpeechRecognition).
 * Graceful no-op when unsupported.
 */

type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
}

type SpeechRecognitionResultEventLike = {
  resultIndex: number
  results: ArrayLike<{
    isFinal: boolean
    [index: number]: { transcript: string }
  }>
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionCtor
  webkitSpeechRecognition?: SpeechRecognitionCtor
}

const WAKE_PHRASES = [
  '起きた',
  '起きたよ',
  '起きました',
  '起きたー',
  '起きたあ',
  'おきる',
  'おきた',
  'おきよ',
  "i'm awake",
  'im awake',
  'i am awake',
  'awake',
  'okay',
  'ok',
  'wake up',
  'woke'
]

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  const w = window as SpeechWindow
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function isWakeVoiceSupported(): boolean {
  return getSpeechRecognitionCtor() !== null
}

function normalizeTranscript(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[！!。．.、,，?\s\u3000]/g, '')
}

function matchesWakePhrase(transcript: string): boolean {
  const normalized = normalizeTranscript(transcript)
  if (!normalized) return false
  return WAKE_PHRASES.some((phrase) => normalized.includes(normalizeTranscript(phrase)))
}

export type WakeVoiceStatus = 'listening' | 'denied' | 'unavailable'

export type WakeVoiceHandle = {
  supported: boolean
  start: () => void
  stop: () => void
}

type WakeVoiceOptions = {
  onWake: () => void
  onStatus?: (status: WakeVoiceStatus) => void
}

/**
 * Listen for wake-confirm phrases while the alarm overlay is up.
 * Calls onWake once; restarts recognition after silence/errors until stop().
 */
export function createWakeVoiceListener(options: WakeVoiceOptions): WakeVoiceHandle {
  const { onWake, onStatus } = options
  const Ctor = getSpeechRecognitionCtor()
  if (!Ctor) {
    onStatus?.('unavailable')
    return { supported: false, start: () => undefined, stop: () => undefined }
  }

  let recognition: SpeechRecognitionLike | null = null
  let active = false
  let fired = false
  let restartTimer: number | null = null

  const clearRestart = () => {
    if (restartTimer !== null) {
      window.clearTimeout(restartTimer)
      restartTimer = null
    }
  }

  const stop = () => {
    active = false
    clearRestart()
    if (!recognition) return
    recognition.onresult = null
    recognition.onerror = null
    recognition.onend = null
    try {
      recognition.abort()
    } catch {
      try {
        recognition.stop()
      } catch {
        // ignore
      }
    }
    recognition = null
  }

  const scheduleRestart = () => {
    clearRestart()
    if (!active || fired) return
    restartTimer = window.setTimeout(() => {
      restartTimer = null
      begin()
    }, 280)
  }

  const begin = () => {
    if (!active || fired) return
    clearRestart()
    if (recognition) {
      try {
        recognition.abort()
      } catch {
        // ignore
      }
      recognition = null
    }

    const rec = new Ctor()
    recognition = rec
    rec.lang = 'ja-JP'
    rec.continuous = true
    rec.interimResults = true
    rec.maxAlternatives = 3

    rec.onresult = (event) => {
      if (!active || fired) return
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const altCount = Math.min(3, (result as unknown as { length?: number }).length ?? 1)
        for (let a = 0; a < altCount; a++) {
          const transcript = result[a]?.transcript ?? ''
          if (matchesWakePhrase(transcript)) {
            fired = true
            stop()
            onWake()
            return
          }
        }
      }
    }

    rec.onerror = (event) => {
      // not-allowed / service-not-allowed: do not hammer retries
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        active = false
        onStatus?.('denied')
        return
      }
      // no-speech / aborted / network → try again while still active
      if (active && !fired) {
        scheduleRestart()
      }
    }

    rec.onend = () => {
      if (active && !fired) {
        scheduleRestart()
      }
    }

    try {
      rec.start()
      onStatus?.('listening')
    } catch {
      scheduleRestart()
    }
  }

  return {
    supported: true,
    start: () => {
      if (active) return
      active = true
      fired = false
      begin()
    },
    stop
  }
}
