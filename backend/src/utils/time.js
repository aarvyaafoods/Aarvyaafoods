export function addDays(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date
}

export function addHours(hours) {
  const date = new Date()
  date.setHours(date.getHours() + hours)
  return date
}
