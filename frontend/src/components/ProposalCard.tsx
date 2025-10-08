import React from 'react'
import { useTranslation } from 'react-i18next'

type Props = {
  id: number
  title: string
  description: string
  forVotes: bigint
  againstVotes: bigint
  onView?: (id: number) => void
}

export default function ProposalCard({ id, title, description, forVotes, againstVotes, onView }: Props) {
  const { t } = useTranslation()
  const total = Number(forVotes + againstVotes)
  const forPct = total === 0 ? 0 : Number(forVotes) / total

  return (
    <div style={{ background: '#ffffffdd', borderRadius: 16, padding: 16, backdropFilter: 'blur(8px)' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={() => onView?.(id)} style={{ padding: '8px 12px', borderRadius: 12 }}>{t('proposalCard.viewButton')}</button>
        </div>
      </div>
      <p style={{ marginTop: 8 }}>{description}</p>
      <div style={{ marginTop: 12 }}>
        <div style={{ height: 10, borderRadius: 8, background: '#eee', overflow: 'hidden' }}>
          <div style={{ width: `${forPct * 100}%`, height: '100%', background: '#7C4DFF' }} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 6, fontSize: 12 }}>
          <span>{t('proposalCard.forLabel')}: {String(forVotes)}</span>
          <span>{t('proposalCard.againstLabel')}: {String(againstVotes)}</span>
        </div>
      </div>
    </div>
  )
}