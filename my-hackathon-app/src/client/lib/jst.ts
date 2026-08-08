// datetime-local の入力値（例: "2026-08-08T18:30"）を JST 固定で解釈して ISO 文字列に変換する
export function jstLocalToIso(datetimeLocalValue: string): string {
  return new Date(`${datetimeLocalValue}:00+09:00`).toISOString()
}

/** 今から N 分後を datetime-local 用文字列（Asia/Tokyo）で返す */
export function jstDatetimeLocalAfterMinutes(minutes: number): string {
  const when = new Date(Date.now() + minutes * 60_000)
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
      .formatToParts(when)
      .filter((p) => p.type !== 'literal')
      .map((p) => [p.type, p.value])
  ) as Record<string, string>
  // hour12:false でも一部環境で "24" になることがあるので正規化
  const hour = parts.hour === '24' ? '00' : parts.hour
  return `${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}`
}

export function formatJst(isoString: string): string {
  return new Date(isoString).toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
