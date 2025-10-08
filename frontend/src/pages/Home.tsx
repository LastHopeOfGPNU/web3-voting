import ProposalCard from '../components/ProposalCard'
import { useProposalsList } from '../hooks/useVoting'
import { useTranslation } from 'react-i18next'

export default function Home() {
  const { t } = useTranslation()
  const { proposals, countQuery, rangeQuery } = useProposalsList(20)
  const proposalCount = Number(countQuery.data || 0n)
  const rangeEnabled = proposalCount > 0
  const isLoading = countQuery.status === 'pending' || (rangeEnabled && rangeQuery.status === 'pending')
  const isError = countQuery.status === 'error' || (rangeEnabled && rangeQuery.status === 'error')

  const onView = (id: number) => {
    location.hash = `#/proposal/${id}`
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {isLoading && <div style={{ color: '#fff' }}>{t('home.loadingProposals')}</div>}
      {isError && <div style={{ color: '#ff8888' }}>{t('home.loadFailed')}</div>}
      {!isLoading && proposals.length === 0 && <div style={{ color: '#fff' }}>{t('home.noProposals')}</div>}
      {proposals.map(p => (
        <ProposalCard
          key={p.id}
          id={p.id}
          title={p.title}
          description={p.description}
          forVotes={Number(p.forVotes)}
          againstVotes={Number(p.againstVotes)}
          onView={onView}
        />
      ))}
    </div>
  )
}