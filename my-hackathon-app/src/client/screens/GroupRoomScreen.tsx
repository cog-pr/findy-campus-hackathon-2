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

function initialOf(name: string): string {
  const t = name.trim()
  return t ? t.slice(0, 1) : '?'
}

/** Group creator = earliest joinedAt (initGroup sets first member) */
function findCreatorDeviceId(members: Record<string, { joinedAt: string }>): string | null {
  let bestId: string | null = null
  let bestAt = ''
  for (const [id, m] of Object.entries(members)) {
    if (!bestId || m.joinedAt < bestAt) {
      bestId = id
      bestAt = m.joinedAt
    }
  }
  return bestId
}

function formatConfirmedAt(iso?: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    hour: 'numeric',
    minute: '2-digit'
  })
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
  const [inviteCopied, setInviteCopied] = useState(false)
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

  async function handleInviteMembers() {
    const code = state?.inviteCode ?? inviteCode
    const text = `WakeMate招待コード: ${code}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'WakeMate', text })
        return
      }
    } catch {
      /* fall through to clipboard */
    }
    try {
      await navigator.clipboard.writeText(code)
      setInviteCopied(true)
      window.setTimeout(() => setInviteCopied(false), 2200)
    } catch {
      setActionError(`招待コードを共有できませんでした: ${code}`)
    }
  }

  if (fatalError) {
    return (
      <div className="phone-shell">
        <div className="screen fatal-screen">
          <p className="error">{fatalError}</p>
          <button type="button" className="primary" onClick={onLeave}>
            戻る
          </button>
        </div>
      </div>
    )
  }

  if (!state || !state.initialized) {
    return (
      <div className="phone-shell">
        <div className="screen loading-screen">
          <div className="loading-dot" aria-hidden="true" />
          <p className="muted">読み込み中...</p>
        </div>
      </div>
    )
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
  const confirmedMine = Object.values(state.alarms).filter(
    (a) =>
      a.creatorDeviceId === deviceId &&
      a.targetDeviceId !== deviceId &&
      a.status === 'confirmed'
  )
  const members = Object.entries(state.members).sort(
    (a, b) => a[1].joinedAt.localeCompare(b[1].joinedAt)
  )
  const creatorId = findCreatorDeviceId(state.members)
  const alarms = Object.values(state.alarms).sort((a, b) => a.fireAt.localeCompare(b.fireAt))

  return (
    <div className="phone-shell">
      <div className="screen room-screen">
        {myFiredAlarm && (
          <AlarmOverlay
            alarm={myFiredAlarm}
            fromName={state.members[myFiredAlarm.creatorDeviceId]?.displayName}
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

        {/* Slide 03 invite header */}
        <header className="room-appbar">
          <button type="button" className="room-back" onClick={onLeave} aria-label="出る">
            <span className="wm-icon wm-icon-back" aria-hidden="true" />
          </button>
          <h1 className="room-appbar-title">{state.name}</h1>
          <span className="room-appbar-spacer" aria-hidden="true" />
        </header>

        <section className="group-hero-card" aria-label="グループ情報">
          <span className="group-hero-icon-wrap" aria-hidden="true">
            <span className="wm-icon wm-icon-group" />
          </span>
          <div className="group-hero-text">
            <p className="group-hero-name">{state.name}</p>
            <p className="group-hero-meta">メンバー {members.length}人</p>
          </div>
        </section>

        <p className="invite-chip">
          招待コード <strong>{state.inviteCode}</strong>
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
              <span>制限時間内に「起きた！」が届きませんでした。すぐに連絡を。</span>
              {a.message && <span className="status-banner-message">「{a.message}」</span>}
            </div>
          )
        })}

        {/* Slide 03: soft green confirmed banner with check */}
        {confirmedMine.slice(0, 2).map((a) => {
          const targetName = state.members[a.targetDeviceId]?.displayName ?? '相手'
          const at = formatConfirmedAt(a.confirmedAt)
          return (
            <div key={a.id} className="status-banner confirmed" role="status">
              <div className="confirmed-banner-row">
                <span className="wm-icon wm-icon-check confirmed-check" aria-hidden="true" />
                <div>
                  <strong>確認済み</strong>
                  <span>
                    {targetName}さん
                    {at ? ` — ${at}に確認されました` : 'が起きました'}
                  </span>
                </div>
              </div>
              {a.message && <span className="status-banner-message">「{a.message}」</span>}
            </div>
          )
        })}

        {actionError && (
          <p className="error action-error" role="alert">
            {actionError}
          </p>
        )}

        <h2 className="section-label">メンバー</h2>
        <ul className="member-list">
          {members.map(([id, m]) => {
            const isCreator = id === creatorId
            const isMe = id === deviceId
            const nameLabel = isMe ? `${m.displayName}（あなた）` : m.displayName
            return (
              <li key={id}>
                <span className="member-name">
                  <span className={`member-avatar ${isCreator ? 'creator' : ''}`} aria-hidden="true">
                    {initialOf(m.displayName)}
                  </span>
                  {nameLabel}
                </span>
                {isCreator ? (
                  <span className="member-badge creator">作成者</span>
                ) : (
                  <span className="member-badge invited">招待済み</span>
                )}
              </li>
            )
          })}
        </ul>

        {/* Slide 03: full-width blue invite CTA */}
        <button type="button" className="primary invite-cta" onClick={() => void handleInviteMembers()}>
          <span className="wm-icon wm-icon-invite invite-cta-icon" aria-hidden="true" />
          {inviteCopied ? 'コードをコピーしました' : '＋ メンバーを招待'}
        </button>

        <h2 className="section-label">アラーム</h2>
        {!showForm && (
          <button type="button" className="primary alarm-create-btn" onClick={() => setShowForm(true)}>
            ＋ アラームをセット
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
          {alarms.length === 0 && (
            <li className="empty-alarms">
              <img
                className="empty-alarms-art"
                src="/assets/empty-alarm-clear.png"
                alt=""
                width={180}
                height={180}
              />
              <p className="empty-alarms-title">まだアラームはありません</p>
              <p className="empty-alarms-lead">信頼できる人の朝を、ここでセットしよう。</p>
            </li>
          )}
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
                      className="danger-outline"
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
    </div>
  )
}
