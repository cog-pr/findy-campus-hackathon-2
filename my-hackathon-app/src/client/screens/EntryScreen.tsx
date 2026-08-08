import { useState, type FormEvent } from 'react'
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
    saveDisplayName(displayName.trim())
    onCreate(generateInviteCode(), groupName.trim(), displayName.trim())
  }

  function handleJoin(e: FormEvent) {
    e.preventDefault()
    if (!displayName.trim() || code.length !== 6) return
    saveDisplayName(displayName.trim())
    onJoin(code, displayName.trim())
  }

  return (
    <div className="screen entry-screen">
      <h1>WakeMate</h1>
      <p className="tagline">自分のアラームは自分に甘くなる。大事な朝は、信頼できる人が起こす。</p>

      <div className="tabs">
        <button type="button" className={mode === 'create' ? 'active' : ''} onClick={() => setMode('create')}>
          グループ作成
        </button>
        <button type="button" className={mode === 'join' ? 'active' : ''} onClick={() => setMode('join')}>
          コードで参加
        </button>
      </div>

      {mode === 'create' ? (
        <form onSubmit={handleCreate}>
          <label>
            ニックネーム
            <input value={displayName} onChange={(e) => setDisplayNameState(e.target.value)} required maxLength={20} />
          </label>
          <label>
            グループ名
            <input value={groupName} onChange={(e) => setGroupName(e.target.value)} required maxLength={30} />
          </label>
          <button type="submit" className="primary">作成</button>
        </form>
      ) : (
        <form onSubmit={handleJoin}>
          <label>
            ニックネーム
            <input value={displayName} onChange={(e) => setDisplayNameState(e.target.value)} required maxLength={20} />
          </label>
          <label>
            招待コード（6桁）
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              inputMode="numeric"
              pattern="\d{6}"
            />
          </label>
          <button type="submit" className="primary">参加</button>
        </form>
      )}
    </div>
  )
}
