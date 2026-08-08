/**
 * Mobile-safe alarm audio: unlock AudioContext on user gesture,
 * then play a looping siren until stopAlarmSound() (user confirm).
 *
 * iOS/Safari notes:
 * - AudioContext must be resumed inside a user gesture (then stays unlocked).
 * - Background tabs suspend AudioContext and throttle timers; we resume + kick on visibility.
 * - Silent buffer unlock helps some iOS versions finish unlocking.
 */

type WebkitWindow = Window & {
  webkitAudioContext?: typeof AudioContext
}

/** Burst length ~0.97s; schedule slightly under that so bursts overlap (no silent gap). */
const BURST_PERIOD_MS = 850
/** If no burst played for this long while keepPlaying, watchdog forces a restart. */
const STALL_MS = 1400
const WATCHDOG_MS = 500
const RETRY_MS = 300

let sharedCtx: AudioContext | null = null
let burstTimer: number | null = null
let vibrateTimer: number | null = null
let watchdogTimer: number | null = null
let playGeneration = 0
let visibilityBound = false
let keepPlaying = false
let lastBurstAt = 0

function AudioContextCtor(): typeof AudioContext | null {
  const w = window as WebkitWindow
  return window.AudioContext ?? w.webkitAudioContext ?? null
}

function getCtx(): AudioContext | null {
  const Ctor = AudioContextCtor()
  if (!Ctor) return null
  if (!sharedCtx || sharedCtx.state === 'closed') {
    sharedCtx = new Ctor()
  }
  return sharedCtx
}

/** Play a 1-sample silent buffer — required on some iOS versions to fully unlock. */
function playSilentUnlock(ctx: AudioContext) {
  try {
    const buffer = ctx.createBuffer(1, 1, ctx.sampleRate)
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    source.start(0)
  } catch {
    // ignore unlock probe failures
  }
}

export async function unlockAlarmAudio(): Promise<boolean> {
  try {
    const ctx = getCtx()
    if (!ctx) return false
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }
    playSilentUnlock(ctx)
    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => undefined)
    }
    return ctx.state === 'running'
  } catch {
    return false
  }
}

function playBurst(ctx: AudioContext) {
  const now = ctx.currentTime
  lastBurstAt = Date.now()
  // Aggressive alternating square/saw tones (siren-like), ~0.97s
  const notes: Array<{ freq: number; at: number; dur: number; gain: number }> = [
    { freq: 880, at: 0, dur: 0.16, gain: 0.9 },
    { freq: 1175, at: 0.18, dur: 0.16, gain: 0.95 },
    { freq: 880, at: 0.4, dur: 0.16, gain: 0.9 },
    { freq: 1397, at: 0.58, dur: 0.22, gain: 1 },
    { freq: 740, at: 0.85, dur: 0.12, gain: 0.85 }
  ]

  for (const note of notes) {
    const start = now + note.at
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()

    osc.type = 'square'
    osc.frequency.value = note.freq
    osc2.type = 'sawtooth'
    osc2.frequency.value = note.freq * 1.01

    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(note.gain, start + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + note.dur)

    gain2.gain.setValueAtTime(0.0001, start)
    gain2.gain.exponentialRampToValueAtTime(note.gain * 0.45, start + 0.015)
    gain2.gain.exponentialRampToValueAtTime(0.0001, start + note.dur)

    osc.connect(gain)
    osc2.connect(gain2)
    gain.connect(ctx.destination)
    gain2.connect(ctx.destination)
    osc.start(start)
    osc2.start(start)
    osc.stop(start + note.dur + 0.02)
    osc2.stop(start + note.dur + 0.02)
  }
}

function clearBurstTimer() {
  if (burstTimer !== null) {
    window.clearTimeout(burstTimer)
    burstTimer = null
  }
}

function clearVibrateTimer() {
  if (vibrateTimer !== null) {
    window.clearInterval(vibrateTimer)
    vibrateTimer = null
  }
}

function clearWatchdog() {
  if (watchdogTimer !== null) {
    window.clearInterval(watchdogTimer)
    watchdogTimer = null
  }
}

export function isAlarmSoundPlaying(): boolean {
  return keepPlaying
}

async function ensureRunning(ctx: AudioContext): Promise<boolean> {
  if (ctx.state === 'suspended') {
    await ctx.resume().catch(() => undefined)
  }
  if (ctx.state !== 'running') {
    playSilentUnlock(ctx)
    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => undefined)
    }
  }
  return ctx.state === 'running'
}

/** Schedule the next burst forever until stopAlarmSound bumps generation. */
function scheduleNextBurst(ctx: AudioContext, gen: number, delayMs: number) {
  clearBurstTimer()
  burstTimer = window.setTimeout(() => {
    burstTimer = null
    void (async () => {
      if (gen !== playGeneration || !keepPlaying) return
      try {
        const ok = await ensureRunning(ctx)
        if (gen !== playGeneration || !keepPlaying) return
        if (ok) {
          playBurst(ctx)
        }
      } catch {
        // ignore per-tick failures; keep trying
      }
      if (gen === playGeneration && keepPlaying) {
        scheduleNextBurst(ctx, gen, BURST_PERIOD_MS)
      }
    })()
  }, delayMs)
}

/**
 * Watchdog: survive stalled timeouts / suspended contexts.
 * If keepPlaying but no recent burst, force resume + play + reschedule.
 */
function startWatchdog(gen: number) {
  clearWatchdog()
  watchdogTimer = window.setInterval(() => {
    if (!keepPlaying || gen !== playGeneration) {
      clearWatchdog()
      return
    }
    void (async () => {
      if (!keepPlaying || gen !== playGeneration) return
      const stalled = Date.now() - lastBurstAt > STALL_MS
      if (!stalled && burstTimer !== null) return

      const ctx = getCtx()
      if (!ctx) return
      try {
        const ok = await ensureRunning(ctx)
        if (!keepPlaying || gen !== playGeneration) return
        if (ok) {
          playBurst(ctx)
        }
        if (!burstTimer && keepPlaying && gen === playGeneration) {
          scheduleNextBurst(ctx, gen, ok ? BURST_PERIOD_MS : RETRY_MS)
        }
      } catch {
        if (!burstTimer && keepPlaying && gen === playGeneration) {
          scheduleNextBurst(ctx, gen, RETRY_MS)
        }
      }
    })()
  }, WATCHDOG_MS)
}

export async function startAlarmSound(): Promise<void> {
  const gen = ++playGeneration
  keepPlaying = true
  lastBurstAt = 0
  clearBurstTimer()
  startWatchdog(gen)
  try {
    const ctx = getCtx()
    if (!ctx) {
      // No Web Audio — watchdog keeps trying if a ctx appears later (unlikely)
      return
    }
    const ok = await ensureRunning(ctx)
    // Confirmed / stopped while awaiting resume
    if (gen !== playGeneration || !keepPlaying) return
    if (!ok) {
      // Still schedule retries — unlock may succeed after another gesture / visibility
      scheduleNextBurst(ctx, gen, RETRY_MS)
      return
    }

    playBurst(ctx)
    scheduleNextBurst(ctx, gen, BURST_PERIOD_MS)
  } catch {
    // Autoplay / AudioContext restrictions — keep retrying via watchdog + schedule
    const ctx = getCtx()
    if (ctx && gen === playGeneration && keepPlaying) {
      scheduleNextBurst(ctx, gen, RETRY_MS)
    }
  }
}

/**
 * Resume + kick a burst without resetting generation when already playing.
 * Safe to call from overlay taps / visibility.
 */
export async function kickAlarmSound(): Promise<void> {
  if (!keepPlaying) {
    await startAlarmSound()
    return
  }
  try {
    const ctx = getCtx()
    if (!ctx) return
    const gen = playGeneration
    const ok = await ensureRunning(ctx)
    if (!keepPlaying || gen !== playGeneration) return
    if (ok) {
      playBurst(ctx)
    }
    if (!burstTimer) {
      scheduleNextBurst(ctx, gen, ok ? BURST_PERIOD_MS : RETRY_MS)
    }
  } catch {
    // ignore; watchdog will retry
  }
}

export function stopAlarmSound(): void {
  playGeneration++
  keepPlaying = false
  lastBurstAt = 0
  clearBurstTimer()
  clearWatchdog()
}

export function startAlarmVibration(): void {
  clearVibrateTimer()
  vibrateAlarmPulse()
  vibrateTimer = window.setInterval(() => {
    if (!keepPlaying) {
      clearVibrateTimer()
      return
    }
    vibrateAlarmPulse()
  }, 1600)
}

export function stopAlarmVibration(): void {
  clearVibrateTimer()
  stopVibration()
}

/** Install once: unlock on any user gesture + resume when tab becomes visible. */
export function installAlarmAudioUnlock(): () => void {
  const onGesture = () => {
    void (async () => {
      const ok = await unlockAlarmAudio()
      if (ok && keepPlaying) {
        await kickAlarmSound()
      }
    })()
  }
  const opts: AddEventListenerOptions = { capture: true, passive: true }
  window.addEventListener('pointerdown', onGesture, opts)
  window.addEventListener('touchstart', onGesture, opts)
  window.addEventListener('keydown', onGesture, opts)

  const resumeIfPlaying = (aggressive: boolean) => {
    if (document.visibilityState === 'hidden') return
    void (async () => {
      await unlockAlarmAudio()
      if (!keepPlaying) return
      // Background→foreground: timers/AudioContext often die — full restart
      if (aggressive) await startAlarmSound()
      else await kickAlarmSound()
    })()
  }
  const onVisibility = () => {
    if (document.visibilityState === 'visible') resumeIfPlaying(true)
  }
  const onPageShow = () => resumeIfPlaying(true)
  const onFocus = () => resumeIfPlaying(false)

  if (!visibilityBound) {
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pageshow', onPageShow)
    window.addEventListener('focus', onFocus)
    visibilityBound = true
  }

  return () => {
    window.removeEventListener('pointerdown', onGesture, opts)
    window.removeEventListener('touchstart', onGesture, opts)
    window.removeEventListener('keydown', onGesture, opts)
    document.removeEventListener('visibilitychange', onVisibility)
    window.removeEventListener('pageshow', onPageShow)
    window.removeEventListener('focus', onFocus)
    visibilityBound = false
  }
}

export function vibrateAlarmPulse(): void {
  try {
    navigator.vibrate?.([300, 80, 300, 80, 500, 120, 200, 80, 200])
  } catch {
    // iOS Safari has no vibrate API
  }
}

export function stopVibration(): void {
  try {
    navigator.vibrate?.(0)
  } catch {
    // ignore
  }
}
