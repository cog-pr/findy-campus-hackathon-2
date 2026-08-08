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
    if (!this.state.members[targetDeviceId]) {
      throw new Error('対象のメンバーが見つかりません')
    }
    const id = crypto.randomUUID()
    const alarm: Alarm = {
      id,
      creatorDeviceId,
      targetDeviceId,
      fireAt,
      message,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    }
    this.setState({
      ...this.state,
      alarms: { ...this.state.alarms, [id]: alarm }
    })
    await this.schedule(new Date(fireAt), 'fireAlarm', { alarmId: id })
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
    if (alarm.status !== 'fired') {
      return
    }
    this.setState({
      ...this.state,
      alarms: {
        ...this.state.alarms,
        [alarmId]: { ...alarm, status: 'confirmed', confirmedAt: new Date().toISOString() }
      }
    })
  }

  // schedule() から呼ばれる内部ハンドラ。クライアントからは呼ばない
  async fireAlarm(payload: { alarmId: string }) {
    const alarm = this.state.alarms[payload.alarmId]
    if (!alarm || alarm.status !== 'scheduled') {
      return
    }
    this.setState({
      ...this.state,
      alarms: {
        ...this.state.alarms,
        [payload.alarmId]: { ...alarm, status: 'fired' }
      }
    })
    await this.schedule(TIMEOUT_SECONDS, 'timeoutAlarm', { alarmId: payload.alarmId })
  }

  // schedule() から呼ばれる内部ハンドラ。クライアントからは呼ばない
  timeoutAlarm(payload: { alarmId: string }) {
    const alarm = this.state.alarms[payload.alarmId]
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
