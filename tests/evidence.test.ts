import { describe, it, expect, beforeAll } from 'vitest'
import type { EvidenceRecord } from '../src/composables/useEvidence'

class FakeStorage {
  private m = new Map<string, string>()
  getItem(k: string): string | null {
    return this.m.has(k) ? this.m.get(k)! : null
  }
  setItem(k: string, v: string): void {
    this.m.set(k, v)
  }
  removeItem(k: string): void {
    this.m.delete(k)
  }
  clear(): void {
    this.m.clear()
  }
}

let lib: typeof import('../src/composables/useEvidence')

describe('应验簿（localStorage）', () => {
  beforeAll(async () => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: new FakeStorage(),
      configurable: true
    })
    lib = await import('../src/composables/useEvidence')
  })

  it('增删记录持久化', () => {
    const { records, add, remove } = lib.useEvidence()
    const before = records.value.length
    add({ method: 'liuyao', question: '测试问', gua: '乾', conclusion: '旺相' })
    expect(records.value.length).toBe(before + 1)
    const rec = records.value[0] as EvidenceRecord
    expect(rec.question).toBe('测试问')
    remove(rec.id)
    expect(records.value.length).toBe(before)
  })

  it('应验备注可更新', () => {
    const { records, add, updateNote } = lib.useEvidence()
    const before = records.value.length
    add({ method: 'meihua', question: '一念', gua: '革', conclusion: '用生体' })
    const rec = records.value[0] as EvidenceRecord
    updateNote(rec.id, '果然应验')
    expect(records.value.find((r) => r.id === rec.id)?.note).toBe('果然应验')
    // 清理以保持测试独立
    const { remove } = lib.useEvidence()
    remove(rec.id)
    expect(records.value.length).toBe(before)
  })
})