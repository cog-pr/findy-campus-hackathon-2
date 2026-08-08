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
  /** 招待コード衝突時。true なら新しいコードで再マウントされる */
  onCollisionRetry?: () => boolean
}

const STATUS_LABEL: Record<Alarm['status'], string> = {
  scheduled: '予約中',
  fired: '待機中',
  confirmed: '起床済み',
  timed_out: '未確認',
  cancelled: '取消'
}

function isInviteCollisionError(message: string): boolean {
  return /既に作成|already\s*(exists|created)|already\s*initialized/i.test(message)
}

export function GroupRoomScreen({
  inviteCode,
  deviceId,
  displayName,
  pendingAction,
  onJoined,
  onLeave,
  onCollisionRetry
}: Props) {
  const [state, setState] = useState<GroupState>()
  const [fatalError, setFatalError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
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
        const message = e instanceof Error ? e.message : String(e)
        if (
          pendingAction.type === 'create' &&
          isInviteCollisionError(message) &&
          onCollisionRetry?.()
        ) {
          return
        }
        if (pendingAction.type === 'create' && isInviteCollisionError(message)) {
          setFatalError('招待コードの空きが見つかりませんでした。もう一度作成してください。')
          return
        }
        setFatalError(message)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    })()
  }, [])

  if (fatalError) {
    return (
      <div className="screen">
        <p className="error">{fatalError}</p>
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
  const waitingForWake = Object.values(state.alarms).filter(
    (a) => a.creatorDeviceId === deviceId && a.targetDeviceId !== deviceId && a.status === 'fired'
  )
  const timedOutMine = Object.values(state.alarms).filter(
    (a) => a.creatorDeviceId === deviceId && a.status === 'timed_out'
  )
  const members = Object.entries(state.members)
  const alarms = Object.values(state.alarms).sort((a, b) => a.fireAt.localeCompare(b.fireAt))

  return (
    <div className="screen">
      {myFiredAlarm && (
        <AlarmOverlay
          alarm={myFiredAlarm}
          onConfirm={async () => {
            try {
              setActionError(null)
              await agent.stub.confirmAlarm(deviceId, myFiredAlarm.id)
            } catch (e) {
              setActionError(e instanceof Error ? e.message : String(e))
            }
          }}
        />
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

      {waitingForWake.map((a) => {
        const targetName = state.members[a.targetDeviceId]?.displayName ?? '相手'
        return (
          <div key={a.id} className="status-banner waiting" role="status">
            <strong>{targetName}さんの起床待ち</strong>
            <span>警報を届けました。確認されるまで待機中です。</span>
            {a.message && <span className="status-banner-message">「{a.message}」</span>}
          </div>
        )
      })}

      {timedOutMine.map((a) => {
        const targetName = state.members[a.targetDeviceId]?.displayName ?? '相手'
        return (
          <div key={a.id} className="status-banner timed-out" role="alert">
            <strong>{targetName}さんが未確認のままです</strong>
            <span>制限時間内に「起きた！」が届きませんでした。</span>
            {a.message && <span className="status-banner-message">「{a.message}」</span>}
          </div>
        )
      })}

      {actionError && (
        <p className="error action-error" role="alert">
          {actionError}
        </p>
      )}

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
            setActionError(null)
            await agent.stub.createAlarm(deviceId, targetDeviceId, fireAtIso, message)
            setShowForm(false)
          }}
        />
      )}
      <ul className="alarm-list">
        {alarms.length === 0 && <li className="muted">まだアラームはありません</li>}
        {alarms.map((a) => {
          const creatorName = state.members[a.creatorDeviceId]?.displayName ?? '?'
          const targetName = state.members[a.targetDeviceId]?.displayName ?? '?'
          return (
            <li key={a.id} className={`alarm-item status-${a.status}`}>
              <span className="alarm-time">{formatJst(a.fireAt)}</span>
              <span className="alarm-who">
                {creatorName} → {targetName}
              </span>
              {a.message && <span className="alarm-message">「{a.message}」</span>}
              <span className="alarm-status">{STATUS_LABEL[a.status]}</span>
              {a.status === 'scheduled' &&
                (a.creatorDeviceId === deviceId || a.targetDeviceId === deviceId) && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setActionError(null)
                        await agent.stub.cancelAlarm(deviceId, a.id)
                      } catch (e) {
                        setActionError(e instanceof Error ? e.message : String(e))
                      }
                    }}
                  >
                    取消
                  </button>
                )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
