import { useRef, useState } from 'react'
import { EntryScreen } from './screens/EntryScreen'
import { GroupRoomScreen, type PendingAction } from './screens/GroupRoomScreen'
import {
  clearCurrentInviteCode,
  generateInviteCode,
  getCurrentInviteCode,
  getDisplayName,
  getOrCreateDeviceId,
  setCurrentInviteCode
} from './lib/session'

const MAX_CREATE_COLLISION_RETRIES = 5

function App() {
  const deviceId = getOrCreateDeviceId()
  const [inviteCode, setInviteCode] = useState<string | null>(getCurrentInviteCode())
  const [displayName, setDisplayName] = useState(getDisplayName())
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const createAttemptsRef = useRef(0)

  if (!inviteCode) {
    return (
      <EntryScreen
        onCreate={(code, groupName, name) => {
          setDisplayName(name)
          createAttemptsRef.current = 1
          setPendingAction({ type: 'create', groupName })
          setInviteCode(code)
        }}
        onJoin={(code, name) => {
          setDisplayName(name)
          createAttemptsRef.current = 0
          setPendingAction({ type: 'join' })
          setInviteCode(code)
        }}
      />
    )
  }

  return (
    <GroupRoomScreen
      key={inviteCode}
      inviteCode={inviteCode}
      deviceId={deviceId}
      displayName={displayName}
      pendingAction={pendingAction}
      onJoined={() => {
        setCurrentInviteCode(inviteCode)
        setPendingAction(null)
        createAttemptsRef.current = 0
      }}
      onLeave={() => {
        clearCurrentInviteCode()
        setPendingAction(null)
        setInviteCode(null)
        createAttemptsRef.current = 0
      }}
      onCollisionRetry={() => {
        if (createAttemptsRef.current >= MAX_CREATE_COLLISION_RETRIES) {
          return false
        }
        createAttemptsRef.current += 1
        setInviteCode(generateInviteCode())
        return true
      }}
    />
  )
}

export default App
