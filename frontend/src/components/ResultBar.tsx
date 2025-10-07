type Props = {
  forVotes: bigint
  againstVotes: bigint
}

export default function ResultBar({ forVotes, againstVotes }: Props) {
  const total = Number(forVotes + againstVotes)
  const forPct = total === 0 ? 0 : Number(forVotes) / total
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ height: 12, borderRadius: 8, background: '#eee', overflow: 'hidden' }}>
        <div style={{ width: `${forPct * 100}%`, height: '100%', background: '#4CAF50' }} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 6, fontSize: 12 }}>
        <span>赞成: {String(forVotes)}</span>
        <span>反对: {String(againstVotes)}</span>
      </div>
    </div>
  )
}