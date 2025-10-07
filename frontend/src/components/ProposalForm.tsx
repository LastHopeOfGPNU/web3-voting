import { useMemo, useState } from 'react'

type Props = {
  onSubmit: (payload: { title: string; description: string; durationSeconds: number }) => void
}

export default function ProposalForm({ onSubmit }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [durationValue, setDurationValue] = useState<number>(24)
  const [durationUnit, setDurationUnit] = useState<'hours' | 'days'>('hours')

  const durationSeconds = useMemo(() => {
    const v = Math.max(0, Number(durationValue) || 0)
    const mul = durationUnit === 'hours' ? 3600 : 86400
    return v * mul
  }, [durationValue, durationUnit])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({ title, description, durationSeconds })
      }}
      style={{ background: '#ffffffdd', borderRadius: 16, padding: 16, backdropFilter: 'blur(8px)' }}
    >
      <div style={{ display: 'grid', gap: 12 }}>
        <label>
          <div>Title</div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8 }} />
        </label>
        <label>
          <div>Description</div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, minHeight: 120 }} />
        </label>
        <label>
          <div style={{ textAlign: 'center', marginBottom: 6 }}>Voting Duration</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
            <input
              type="number"
              min={1}
              value={durationValue}
              onChange={(e) => setDurationValue(Number(e.target.value))}
              style={{ width: 120, padding: '6px 8px', borderRadius: 8 }}
            />
            <select
              value={durationUnit}
              onChange={(e) => setDurationUnit(e.target.value as any)}
              style={{ width: 110, padding: '6px 8px', borderRadius: 8 }}
            >
              <option value="hours">小时</option>
              <option value="days">天</option>
            </select>
          </div>
          <div style={{ fontSize: 12, color: '#555', marginTop: 4, textAlign: 'center' }}>约 {Math.round(durationSeconds / 3600)} 小时（{durationSeconds} 秒）</div>
        </label>
        <button type="submit" style={{ padding: '10px 14px', borderRadius: 12 }}>Create</button>
      </div>
    </form>
  )
}