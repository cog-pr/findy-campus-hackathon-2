import { useState, type FormEvent } from 'react'
import { unlockAlarmAudio } from '../lib/alarmAudio'
import { generateInviteCode, getDisplayName, setDisplayName as saveDisplayName } from '../lib/session'

type Props = {
  onCreate: (inviteCode: string, groupName: string, displayName: string) => void
  onJoin: (inviteCode: string, displayName: string) => void
}

export function EntryScreen({ onCreate, onJoin }: Props) {
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [displayName, setDisplayNameState] = useState(getDisplayName())
  const [groupName, setGroupName] = useState('')
  const [code, setCode] = useState('')

  function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!displayName.trim() || !groupName.trim()) return
    void unlockAlarmAudio()
    saveDisplayName(displayName.trim())
    onCreate(generateInviteCode(), groupName.trim(), displayName.trim())
  }

  function handleJoin(e: FormEvent) {
    e.preventDefault()
    if (!displayName.trim() || code.length !== 6) return
    void unlockAlarmAudio()
    saveDisplayName(displayName.trim())
    onJoin(code, displayName.trim())
  }

  return (
    <div className="phone-shell">
      <div className="screen entry-screen">
        <div className="entry-bg" aria-hidden="true">
          <img src="/assets/bg-decor-clear.png" alt="" className="entry-bg-img" />
        </div>

        {/* Title slide lockup: logo + WakeMate → orange rule → 共有アラーム */}
        <header className="brand-hero">
          <div className="brand-lockup">
            <img
              className="brand-logo"
              src="/assets/logo-wakemate-clear.png"
              alt=""
              width={56}
              height={56}
            />
            <h1 className="brand-name">WakeMate</h1>
          </div>
          <div className="brand-rule" aria-hidden="true" />
          <p className="brand-kicker">共有アラーム</p>
          <p className="tagline">
            アラームを、「自分の設定」から
            <br />
            <span className="accent">誰かとの約束</span>へ。
          </p>
          <img
            className="entry-hero"
            src="/assets/hero-onboarding.png"
            alt="起こす人と起きる人"
            width={640}
            height={360}
          />
        </header>

        <div className="entry-card">
          <div className="tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'create'}
              className={mode === 'create' ? 'active' : ''}
              onClick={() => setMode('create')}
            >
              グループ作成
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'join'}
              className={mode === 'join' ? 'active' : ''}
              onClick={() => setMode('join')}
            >
              コードで参加
            </button>
          </div>

          {mode === 'create' ? (
            <form onSubmit={handleCreate}>
              <label>
                ニックネーム
                <input
                  value={displayName}
                  onChange={(e) => setDisplayNameState(e.target.value)}
                  required
                  maxLength={20}
                  placeholder="例: はるか"
                  autoComplete="nickname"
                  enterKeyHint="next"
                />
              </label>
              <label>
                グループ名
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                  maxLength={30}
                  placeholder="例: 朝の見守り"
                  enterKeyHint="done"
                />
              </label>
              <button type="submit" className="primary">
                作成して招待へ
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin}>
              <label>
                ニックネーム
                <input
                  value={displayName}
                  onChange={(e) => setDisplayNameState(e.target.value)}
                  required
                  maxLength={20}
                  placeholder="例: たくや"
                  autoComplete="nickname"
                  enterKeyHint="next"
                />
              </label>
              <label>
                招待コード（6桁）
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  inputMode="numeric"
                  pattern="\d{6}"
                  placeholder="123456"
                  autoComplete="one-time-code"
                  enterKeyHint="done"
                />
              </label>
              <button type="submit" className="primary">
                参加する
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
