// datetime-local の入力値（例: "2026-08-08T18:30"）を JST 固定で解釈して ISO 文字列に変換する
export function jstLocalToIso(datetimeLocalValue: string): string {
  return new Date(`${datetimeLocalValue}:00+09:00`).toISOString()
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
