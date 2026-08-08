const DEVICE_ID_KEY = 'wakemate:deviceId'
const DISPLAY_NAME_KEY = 'wakemate:displayName'
const INVITE_CODE_KEY = 'wakemate:inviteCode'

export function getOrCreateDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, id)
  }
  return id
}

export function getDisplayName(): string {
  return localStorage.getItem(DISPLAY_NAME_KEY) ?? ''
}

export function setDisplayName(name: string) {
  localStorage.setItem(DISPLAY_NAME_KEY, name)
}

export function getCurrentInviteCode(): string | null {
  return localStorage.getItem(INVITE_CODE_KEY)
}

export function setCurrentInviteCode(code: string) {
  localStorage.setItem(INVITE_CODE_KEY, code)
}

export function clearCurrentInviteCode() {
  localStorage.removeItem(INVITE_CODE_KEY)
}

export function generateInviteCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
