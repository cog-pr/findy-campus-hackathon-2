import { Agent, callable } from 'agents'

export type AlarmStatus = 'scheduled' | 'fired' | 'confirmed' | 'timed_out' | 'cancelled'

export type Member = {
  displayName: string
  joinedAt: string
}

export type Alarm = {
  id: string
  creatorDeviceId: string
  targetDeviceId: string
  fireAt: string
  message: string
  status: AlarmStatus
  confirmedAt?: string
  createdAt: string
  /** 発火時に決まる音声確認フレーズ。対象者がこれを読み上げる */
  wakePhrase?: string
  /** 音声で確認できた場合 true。ボタン確認と区別してデモで見せる */
  confirmedByVoice?: boolean
}

export type GroupState = {
  initialized: boolean
  inviteCode: string
  name: string
  createdAt: string
  members: Record<string, Member>
  alarms: Record<string, Alarm>
}

const TIMEOUT_SECONDS = 5 * 60
/** フロントの AlarmForm maxLength と揃える */
const MAX_MESSAGE_LENGTH = 100

/** 寝ぼけたままでは言い切りにくい、口が回る必要のある確認フレーズ */
const WAKE_PHRASES = [
  'おはようございます、今日も一日がんばります',
  '赤巻紙 青巻紙 黄巻紙',
  'すもももももももものうち',
  '東京特許許可局に行ってきます',
  'なまむぎ なまごめ なまたまご',
  '今日はとてもいい天気ですね',
  'バスガス爆発、バスガス爆発',
  'この芝生に入らないでください'
]

/** 文字起こし結果とフレーズを比べるための正規化（記号・空白・カナ差を吸収） */
function normalizeForCompare(text: string): string {
  return text
    .replace(/[\s\p{P}\p{S}]/gu, '')
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .toLowerCase()
}

/** 2文字ごとの重なり具合で類似度を測る（音声認識の揺れを許容するため完全一致にしない） */
function similarity(a: string, b: string): number {
  if (!a || !b) return 0
  if (a === b) return 1
  const bigrams = (s: string) =>
    s.length < 2 ? [s] : Array.from({ length: s.length - 1 }, (_, i) => s.slice(i, i + 2))
  const aGrams = bigrams(a)
  const bGrams = new Set(bigrams(b))
  const hit = aGrams.filter((g) => bGrams.has(g)).length
  return hit / Math.max(aGrams.length, bGrams.size)
}

function requireNonEmpty(value: string, label: string): string {
  const trimmed = value?.trim?.() ?? ''
  if (!trimmed) {
    throw new Error(`${label}が空です`)
  }
  return trimmed
}

function parseFutureFireAt(fireAt: string): Date {
  const raw = requireNonEmpty(fireAt, '発火日時')
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) {
    throw new Error('発火日時の形式が正しくありません')
  }
  if (date.getTime() <= Date.now()) {
    throw new Error('発火日時は現在より未来を指定してください')
  }
  return date
}

function normalizeMessage(message: string | undefined | null): string {
  const text = (message ?? '').trim()
  if (text.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`メッセージは${MAX_MESSAGE_LENGTH}文字以内にしてください`)
  }
  return text
}

export class GroupAgent extends Agent<CloudflareBindings, GroupState> {
  initialState: GroupState = {
    initialized: false,
    inviteCode: '',
    name: '',
    createdAt: '',
    members: {},
    alarms: {}
  }

  @callable()
  initGroup(name: string, creatorDeviceId: string, displayName: string) {
    if (this.state.initialized) {
      throw new Error('このグループは既に作成されています')
    }
    const now = new Date().toISOString()
    this.setState({
      ...this.state,
      initialized: true,
      inviteCode: this.name,
      name,
      createdAt: now,
      members: {
        [creatorDeviceId]: { displayName, joinedAt: now }
      }
    })
  }

  @callable()
  join(deviceId: string, displayName: string) {
    if (!this.state.initialized) {
      throw new Error('グループが見つかりません')
    }
    this.setState({
      ...this.state,
      members: {
        ...this.state.members,
        [deviceId]: { displayName, joinedAt: new Date().toISOString() }
      }
    })
  }

  @callable()
  async createAlarm(creatorDeviceId: string, targetDeviceId: string, fireAt: string, message: string) {
    if (!this.state.initialized) {
      throw new Error('グループが見つかりません')
    }

    const creatorId = requireNonEmpty(creatorDeviceId, '作成者')
    const targetId = requireNonEmpty(targetDeviceId, '対象者')

    if (!this.state.members[creatorId]) {
      throw new Error('作成者がこのグループのメンバーではありません')
    }
    if (!this.state.members[targetId]) {
      throw new Error('対象のメンバーが見つかりません')
    }

    const fireAtDate = parseFutureFireAt(fireAt)
    const normalizedMessage = normalizeMessage(message)

    const id = crypto.randomUUID()
    const alarm: Alarm = {
      id,
      creatorDeviceId: creatorId,
      targetDeviceId: targetId,
      fireAt: fireAtDate.toISOString(),
      message: normalizedMessage,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    }
    this.setState({
      ...this.state,
      alarms: { ...this.state.alarms, [id]: alarm }
    })
    await this.schedule(fireAtDate, 'fireAlarm', { alarmId: id })
    return id
  }

  @callable()
  confirmAlarm(deviceId: string, alarmId: string) {
    const alarm = this.state.alarms[alarmId]
    if (!alarm) {
      throw new Error('アラームが見つかりません')
    }
    if (alarm.targetDeviceId !== deviceId) {
      throw new Error('このアラームの対象者ではありません')
    }

    switch (alarm.status) {
      case 'fired':
        break
      case 'confirmed':
        throw new Error('このアラームは既に確認済みです')
      case 'timed_out':
        throw new Error('このアラームは時間切れのため確認できません')
      case 'scheduled':
        throw new Error('まだアラームが発火していません')
      case 'cancelled':
        throw new Error('このアラームは取り消されています')
      default:
        throw new Error('このアラームは確認できない状態です')
    }

    this.setState({
      ...this.state,
      alarms: {
        ...this.state.alarms,
        [alarmId]: { ...alarm, status: 'confirmed', confirmedAt: new Date().toISOString() }
      }
    })
  }

  /**
   * 音声で起床を証明する。録音を Workers AI (Whisper) で文字起こしし、
   * 発火時に提示したフレーズと十分に一致していれば confirmed にする。
   * 判定はサーバー側で行い、クライアントの自己申告は信用しない。
   */
  @callable()
  async confirmAlarmByVoice(deviceId: string, alarmId: string, audio: number[]) {
    const alarm = this.state.alarms[alarmId]
    if (!alarm) {
      throw new Error('アラームが見つかりません')
    }
    if (alarm.targetDeviceId !== deviceId) {
      throw new Error('このアラームの対象者ではありません')
    }
    if (alarm.status !== 'fired') {
      throw new Error('発火中のアラームだけ音声で確認できます')
    }
    if (!alarm.wakePhrase) {
      throw new Error('確認フレーズが設定されていません')
    }
    if (!audio?.length) {
      throw new Error('音声が録音できていません')
    }

    const result = (await this.env.AI.run('@cf/openai/whisper', {
      audio
    })) as { text?: string }
    const heard = result?.text ?? ''
    const score = similarity(normalizeForCompare(heard), normalizeForCompare(alarm.wakePhrase))

    // 音声認識の揺れを見込んで完全一致は求めない
    if (score < 0.6) {
      return { ok: false as const, heard, score }
    }

    this.setState({
      ...this.state,
      alarms: {
        ...this.state.alarms,
        [alarmId]: {
          ...alarm,
          status: 'confirmed',
          confirmedAt: new Date().toISOString(),
          confirmedByVoice: true
        }
      }
    })
    return { ok: true as const, heard, score }
  }

  @callable()
  cancelAlarm(deviceId: string, alarmId: string) {
    const actorId = requireNonEmpty(deviceId, '操作者')
    const alarm = this.state.alarms[alarmId]
    if (!alarm) {
      throw new Error('アラームが見つかりません')
    }
    if (!this.state.members[actorId]) {
      throw new Error('このグループのメンバーではありません')
    }
    if (alarm.creatorDeviceId !== actorId && alarm.targetDeviceId !== actorId) {
      throw new Error('このアラームを取り消す権限がありません')
    }
    if (alarm.status !== 'scheduled') {
      throw new Error('予約中のアラームだけ取り消せます')
    }

    this.setState({
      ...this.state,
      alarms: {
        ...this.state.alarms,
        [alarmId]: { ...alarm, status: 'cancelled' }
      }
    })
  }

  // schedule() から呼ばれる内部ハンドラ。クライアントからは呼ばない
  async fireAlarm(payload: { alarmId: string }) {
    const alarm = this.state.alarms[payload.alarmId]
    // scheduled 以外（cancelled / confirmed 等）からは発火しない
    if (!alarm || alarm.status !== 'scheduled') {
      return
    }
    const wakePhrase = WAKE_PHRASES[Math.floor(Math.random() * WAKE_PHRASES.length)]
    this.setState({
      ...this.state,
      alarms: {
        ...this.state.alarms,
        [payload.alarmId]: { ...alarm, status: 'fired', wakePhrase }
      }
    })
    await this.schedule(TIMEOUT_SECONDS, 'timeoutAlarm', { alarmId: payload.alarmId })
  }

  // schedule() から呼ばれる内部ハンドラ。クライアントからは呼ばない
  timeoutAlarm(payload: { alarmId: string }) {
    const alarm = this.state.alarms[payload.alarmId]
    // fired 以外（confirmed 済み等）は上書きしない
    if (!alarm || alarm.status !== 'fired') {
      return
    }
    this.setState({
      ...this.state,
      alarms: {
        ...this.state.alarms,
        [payload.alarmId]: { ...alarm, status: 'timed_out' }
      }
    })
  }
}
