import { useMemo, useState, useEffect } from 'react'
import ResultBar from '../components/ResultBar'
import VoteButton from '../components/VoteButton'
import { useProposal, useVotingContract } from '../hooks/useVoting'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { decodeErrorResult } from 'viem'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()
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
      alert(t('messages.invalidProposalId'))
      return
    }
    if (!isConnected) {
      alert(t('messages.connectWallet'))
      return
    }
    const deadlineSec = data ? Number(data.deadline) : 0
    const isClosed = data ? Math.floor(Date.now() / 1000) > deadlineSec : false
    const hasVoted = Boolean(hasVotedQuery.data)
    if (isClosed) {
      alert(t('messages.votingClosed'))
      return
    }
    if (hasVoted) {
      alert(t('messages.alreadyVoted'))
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
      alert(t('messages.txSubmitted', { hash }))
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
        ? t('messages.alreadyVoted')
        : decodedName === 'VotingClosed'
          ? t('messages.votingClosed')
          : decodedName === 'ProposalNotExist'
            ? t('messages.proposalNotExist')
            : ''
      const msg = mapped || e?.shortMessage || e?.message || t('proposalDetail.submitFailed')
      alert(msg)
    }
  }

  const notFound = useMemo(() => id == null || (!isLoading && !data), [id, isLoading, data])

  if (notFound) return <div style={{ color: '#fff' }}>{t('proposalDetail.notFound')}</div>

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {isLoading && <div style={{ color: '#fff' }}>{t('proposalDetail.loading')}</div>}
      {isError && <div style={{ color: '#ff8888' }}>{t('proposalDetail.loadFailed')}</div>}
      {data && (
        <>
          <h2 style={{ color: '#fff', margin: 0 }}>{t('proposalDetail.idTitle', { id: data.id })}</h2>
          <p style={{ color: '#fff' }}>{data.description}</p>
          <ResultBar forVotes={data.forVotes} againstVotes={data.againstVotes} />
          {(() => {
            const deadlineSec = Number(data.deadline)
            const isClosed = Math.floor(Date.now() / 1000) > deadlineSec
            const hasVoted = Boolean(hasVotedQuery.data)
            return (
              <div style={{ display: 'flex', gap: 8 }}>
                <VoteButton label={t('buttons.voteFor')} onClick={() => onVote(true)} variant='for' disabled={isPending || isClosed || hasVoted} />
                <VoteButton label={t('buttons.voteAgainst')} onClick={() => onVote(false)} variant='against' disabled={isPending || isClosed || hasVoted} />
              </div>
            )
          })()}
          {hasVotedQuery.status === 'pending' && (
            <div style={{ color: '#fff' }}>{t('proposalDetail.readingVoteState')}</div>
          )}
          {Boolean(hasVotedQuery.data) && (
            <div style={{ color: '#fff' }}>{t('proposalDetail.alreadyVotedNote')}</div>
          )}
          {Math.floor(Date.now() / 1000) > Number(data.deadline) && (
            <div style={{ color: '#ff8888' }}>{t('proposalDetail.closedNote')}</div>
          )}
          {(isPending) && (
            <div style={{ color: '#fff' }}>{t('proposalDetail.submitting')}</div>
          )}
          {txHash && (
            <div style={{ color: '#fff' }}>{t('proposalDetail.txHash', { hash: txHash })}</div>
          )}
          {txHash && wait.isLoading && (
            <div style={{ color: '#fff' }}>{t('proposalDetail.waitingConfirm')}</div>
          )}
          {txHash && wait.isError && (
            <div style={{ color: '#ff8888' }}>{t('proposalDetail.confirmFailed')}</div>
          )}
          {txHash && wait.isSuccess && (
            <div style={{ color: '#9cff9c' }}>{t('proposalDetail.confirmSuccess')}</div>
          )}
          {error && (
            <div style={{ color: '#ff8888' }}>{t('proposalDetail.submitFailed')}</div>
          )}
        </>
      )}
    </div>
  )
}