import { useState } from 'react'
import { EntryScreen } from './screens/EntryScreen'
import { GroupRoomScreen, type PendingAction } from './screens/GroupRoomScreen'
import {
  clearCurrentInviteCode,
  getCurrentInviteCode,
  getDisplayName,
  getOrCreateDeviceId,
  setCurrentInviteCode
} from './lib/session'

function App() {
  const deviceId = getOrCreateDeviceId()
  const [inviteCode, setInviteCode] = useState<string | null>(getCurrentInviteCode())
  const [displayName, setDisplayName] = useState(getDisplayName())
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)

  if (!inviteCode) {
    return (
      <EntryScreen
        onCreate={(code, groupName, name) => {
          setDisplayName(name)
          setPendingAction({ type: 'create', groupName })
          setInviteCode(code)
        }}
        onJoin={(code, name) => {
          setDisplayName(name)
          setPendingAction({ type: 'join' })
          setInviteCode(code)
        }}
      />
    )
  }

  return (
    <GroupRoomScreen
      inviteCode={inviteCode}
      deviceId={deviceId}
      displayName={displayName}
      pendingAction={pendingAction}
      onJoined={() => {
        setCurrentInviteCode(inviteCode)
        setPendingAction(null)
      }}
      onLeave={() => {
        clearCurrentInviteCode()
        setPendingAction(null)
        setInviteCode(null)
      }}
    />
  )
}

export default App
