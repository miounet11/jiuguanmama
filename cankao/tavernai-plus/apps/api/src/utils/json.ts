// Utility functions for handling JSON fields in SQLite

export function parseJsonField<T>(value: any): T | null {
  if (!value) return null
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  }
  return value as T
}

export function stringifyJsonField(value: any): string {
  if (typeof value === 'string') return value
  return JSON.stringify(value || null)
}

export function parseJsonArray(value: any): string[] {
  const parsed = parseJsonField<string[]>(value)
  return Array.isArray(parsed) ? parsed : []
}

export function hasJsonArrayItem(jsonField: string, item: string): boolean {
  const array = parseJsonArray(jsonField)
  return array.includes(item)
}

export function hasJsonArraySomeItems(jsonField: string, items: string[]): boolean {
  const array = parseJsonArray(jsonField)
  return items.some(item => array.includes(item))
}