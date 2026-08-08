import { useEffect, useRef, useState } from 'react'
import { useAgent } from 'agents/react'
import type { Alarm, GroupAgent, GroupState } from '../../agents/group-agent'
import { formatJst } from '../lib/jst'
import { AlarmForm } from './AlarmForm'
import { AlarmOverlay } from './AlarmOverlay'

export type PendingAction = { type: 'create'; groupName: string } | { type: 'join' } | null

type Props = {
  inviteCode: string
  deviceId: string
  displayName: string
  pendingAction: PendingAction
  onJoined: () => void
  onLeave: () => void
}

const STATUS_LABEL: Record<Alarm['status'], string> = {
  scheduled: '予約中',
  fired: '待機中',
  confirmed: '起床済み',
  timed_out: '未確認',
  cancelled: '取消'
}

export function GroupRoomScreen({ inviteCode, deviceId, displayName, pendingAction, onJoined, onLeave }: Props) {
  const [state, setState] = useState<GroupState>()
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const didRun = useRef(false)

  const agent = useAgent<GroupAgent, GroupState>({
    agent: 'GroupAgent',
    name: inviteCode,
    onStateUpdate: (s) => setState(s)
  })

  useEffect(() => {
    if (didRun.current) return
    didRun.current = true
    if (!pendingAction) return
    ;(async () => {
      try {
        if (pendingAction.type === 'create') {
          await agent.stub.initGroup(pendingAction.groupName, deviceId, displayName)
        } else {
          await agent.stub.join(deviceId, displayName)
        }
        onJoined()
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    })()
  }, [])

  if (error) {
    return (
      <div className="screen">
        <p className="error">{error}</p>
        <button onClick={onLeave}>戻る</button>
      </div>
    )
  }

  if (!state || !state.initialized) {
    return <div className="screen">読み込み中...</div>
  }

  const myFiredAlarm = Object.values(state.alarms).find(
    (a) => a.targetDeviceId === deviceId && a.status === 'fired'
  )
  const members = Object.entries(state.members)
  const alarms = Object.values(state.alarms).sort((a, b) => a.fireAt.localeCompare(b.fireAt))

  return (
    <div className="screen">
      {myFiredAlarm && (
        <AlarmOverlay alarm={myFiredAlarm} onConfirm={() => agent.stub.confirmAlarm(deviceId, myFiredAlarm.id)} />
      )}

      <div className="room-header">
        <h1>{state.name}</h1>
        <button type="button" onClick={onLeave}>
          グループを出る
        </button>
      </div>
      <p>
        招待コード: <strong>{state.inviteCode}</strong>
      </p>

      <h2>メンバー（{members.length}）</h2>
      <ul className="member-list">
        {members.map(([id, m]) => (
          <li key={id}>
            {m.displayName}
            {id === deviceId ? '（自分）' : ''}
          </li>
        ))}
      </ul>

      <h2>アラーム</h2>
      {!showForm && (
        <button type="button" className="primary" onClick={() => setShowForm(true)}>
          + アラームを作成
        </button>
      )}
      {showForm && (
        <AlarmForm
          members={members}
          myDeviceId={deviceId}
          onCancel={() => setShowForm(false)}
          onSubmit={async (targetDeviceId, fireAtIso, message) => {
            await agent.stub.createAlarm(deviceId, targetDeviceId, fireAtIso, message)
            setShowForm(false)
          }}
        />
      )}
      <ul className="alarm-list">
        {alarms.length === 0 && <li className="muted">まだアラームはありません</li>}
        {alarms.map((a) => (
          <li key={a.id} className={`alarm-item status-${a.status}`}>
            <span className="alarm-time">{formatJst(a.fireAt)}</span>
            <span className="alarm-target">→ {state.members[a.targetDeviceId]?.displayName ?? '?'}</span>
            {a.message && <span className="alarm-message">「{a.message}」</span>}
            <span className="alarm-status">{STATUS_LABEL[a.status]}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
