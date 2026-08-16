// ============================================================
// 应验簿 · 本地记录（localStorage）
// 不落服务器、不记身份，仅存于本机浏览器，
// 供日后翻看「当初所占，应验与否」——占而记之，学而省之。
// ============================================================

import { ref, readonly } from 'vue'

export interface EvidenceRecord {
  id: string
  method: string
  question: string
  gua: string
  conclusion: string
  createdAt: string
  /** 应验备注（用户自写） */
  note?: string
}

const KEY = 'laiyigua-evidence'

function load(): EvidenceRecord[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function save(list: EvidenceRecord[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* 存满或隐私模式则静默 */
  }
}

const records = ref<EvidenceRecord[]>(load())

function add(rec: Omit<EvidenceRecord, 'id' | 'createdAt'>): void {
  records.value.unshift({
    ...rec,
    id: `${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    createdAt: new Date().toISOString().slice(0, 10)
  })
  save(records.value)
}

function updateNote(id: string, note: string): void {
  const r = records.value.find((x) => x.id === id)
  if (r) {
    r.note = note
    save(records.value)
  }
}

function remove(id: string): void {
  records.value = records.value.filter((x) => x.id !== id)
  save(records.value)
}

export function useEvidence() {
  return {
    records: readonly(records),
    add,
    updateNote,
    remove
  }
}