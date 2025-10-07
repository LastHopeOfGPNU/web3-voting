import ProposalCard from '../components/ProposalCard'
import { useProposalsList } from '../hooks/useVoting'

export default function Home() {
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
      {isLoading && <div style={{ color: '#fff' }}>正在加载链上提案...</div>}
      {isError && <div style={{ color: '#ff8888' }}>加载提案失败，请检查网络或控制台。</div>}
      {!isLoading && proposals.length === 0 && <div style={{ color: '#fff' }}>暂无提案。</div>}
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