import { useMemo, useState, useEffect } from 'react'
import ResultBar from '../components/ResultBar'
import VoteButton from '../components/VoteButton'
import { useProposal, useVotingContract } from '../hooks/useVoting'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { decodeErrorResult } from 'viem'

function useProposalId(): number | null {
  const [id, setId] = useState<number | null>(() => {
    const m = location.hash.match(/\/proposal\/(\d+)/)
    return m ? Number(m[1]) : null
  })
  useEffect(() => {
    const onHash = () => {
      const m = location.hash.match(/\/proposal\/(\d+)/)
      setId(m ? Number(m[1]) : null)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return id
}

export default function ProposalDetail() {
  const id = useProposalId()
  const { data, query } = useProposal(id)
  const isLoading = query.status === 'pending'
  const isError = query.status === 'error'

  const { address, abi } = useVotingContract()
  const { isConnected, address: accountAddress } = useAccount()
  const { writeContractAsync, isPending, error } = useWriteContract()
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined)
  const wait = useWaitForTransactionReceipt({ hash: txHash })

  const hasVotedQuery = useReadContract({
    address,
    abi,
    functionName: 'hasVoted',
    args: id != null && accountAddress ? [BigInt(id), accountAddress] : undefined,
    query: { enabled: id != null && !!accountAddress }
  })

  useEffect(() => {
    if (txHash && wait.isSuccess) {
      if (query && typeof (query as any).refetch === 'function') {
        (query as any).refetch()
      }
    }
  }, [txHash, wait.isSuccess])

  const onVote = async (support: boolean) => {
    if (id == null) {
      alert('无效的提案 ID。')
      return
    }
    if (!isConnected) {
      alert('请先连接钱包再进行投票。')
      return
    }
    const deadlineSec = data ? Number(data.deadline) : 0
    const isClosed = data ? Math.floor(Date.now() / 1000) > deadlineSec : false
    const hasVoted = Boolean(hasVotedQuery.data)
    if (isClosed) {
      alert('投票已截止。')
      return
    }
    if (hasVoted) {
      alert('你已对该提案投过票，不能重复投票。')
      return
    }
    try {
      const hash = await writeContractAsync({
        address,
        abi,
        functionName: 'vote',
        args: [BigInt(id), support]
      })
      setTxHash(hash as `0x${string}`)
      alert(`交易已提交：\n${hash}`)
    } catch (e: any) {
      let decodedName = ''
      const dataHex = e?.data ?? e?.cause?.data ?? e?.cause?.error?.data
      if (dataHex) {
        try {
          const decoded = decodeErrorResult({ abi, data: dataHex }) as any
          decodedName = decoded?.errorName || ''
        } catch {}
      }
      const mapped = decodedName === 'AlreadyVoted'
        ? '你已对该提案投过票，不能重复投票。'
        : decodedName === 'VotingClosed'
          ? '投票已截止，无法继续投票。'
          : decodedName === 'ProposalNotExist'
            ? '提案不存在或已被移除。'
            : ''
      const msg = mapped || e?.shortMessage || e?.message || '提交投票失败'
      alert(`投票失败：\n${msg}`)
    }
  }

  const notFound = useMemo(() => id == null || (!isLoading && !data), [id, isLoading, data])

  if (notFound) return <div style={{ color: '#fff' }}>Proposal not found.</div>

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {isLoading && <div style={{ color: '#fff' }}>正在加载提案...</div>}
      {isError && <div style={{ color: '#ff8888' }}>加载失败，请检查网络或控制台。</div>}
      {data && (
        <>
          <h2 style={{ color: '#fff', margin: 0 }}>{`Proposal #${data.id}`}</h2>
          <p style={{ color: '#fff' }}>{data.description}</p>
          <ResultBar forVotes={data.forVotes} againstVotes={data.againstVotes} />
          {(() => {
            const deadlineSec = Number(data.deadline)
            const isClosed = Math.floor(Date.now() / 1000) > deadlineSec
            const hasVoted = Boolean(hasVotedQuery.data)
            return (
              <div style={{ display: 'flex', gap: 8 }}>
                <VoteButton label="Vote For" onClick={() => onVote(true)} variant='for' disabled={isPending || isClosed || hasVoted} />
                <VoteButton label="Vote Against" onClick={() => onVote(false)} variant='against' disabled={isPending || isClosed || hasVoted} />
              </div>
            )
          })()}
          {hasVotedQuery.status === 'pending' && (
            <div style={{ color: '#fff' }}>正在读取投票状态...</div>
          )}
          {Boolean(hasVotedQuery.data) && (
            <div style={{ color: '#fff' }}>你已投票。</div>
          )}
          {Math.floor(Date.now() / 1000) > Number(data.deadline) && (
            <div style={{ color: '#ff8888' }}>投票已截止。</div>
          )}
          {(isPending) && (
            <div style={{ color: '#fff' }}>正在提交投票，请在钱包中确认...</div>
          )}
          {txHash && (
            <div style={{ color: '#fff' }}>交易哈希：{txHash}</div>
          )}
          {txHash && wait.isLoading && (
            <div style={{ color: '#fff' }}>交易已提交，正在等待区块确认...</div>
          )}
          {txHash && wait.isError && (
            <div style={{ color: '#ff8888' }}>交易确认失败，请稍后重试。</div>
          )}
          {txHash && wait.isSuccess && (
            <div style={{ color: '#9cff9c' }}>交易已确认！票数已刷新。</div>
          )}
          {error && (
            <div style={{ color: '#ff8888' }}>提交失败，请检查钱包或网络。</div>
          )}
        </>
      )}
    </div>
  )
}