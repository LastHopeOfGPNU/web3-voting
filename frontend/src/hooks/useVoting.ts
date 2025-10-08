import { useMemo } from 'react'
import { useReadContract } from 'wagmi'
import { Voting__factory } from '../../../types/ethers-contracts/factories/Voting__factory'
import { getVotingAddress } from '../utils/contract'

export type ProposalListItem = {
  id: number
  title: string
  description: string
  forVotes: bigint
  againstVotes: bigint
  creator: string
  deadline: bigint
}

export function useVotingContract() {
  const address = getVotingAddress('sepolia') as `0x${string}`
  const abi = Voting__factory.abi as any
  return { address, abi }
}

export function useProposalCount() {
  const { address, abi } = useVotingContract()
  return useReadContract({ address, abi, functionName: 'proposalCount' })
}

export function useProposalsRange(start: number, count: number) {
  const { address, abi } = useVotingContract()
  const enabled = count > 0
  return useReadContract({
    address,
    abi,
    functionName: 'getProposalsRange',
    // 当 count 为 0 时不调用，以避免合约因无效范围而 revert
    args: enabled ? [BigInt(start), BigInt(count)] : undefined,
    // wagmi 支持通过 query.enabled 跳过请求
    query: { enabled }
  })
}

export function useProposalsList(maxCount = 20) {
  const countQuery = useProposalCount()

  const start = useMemo(() => {
    const c = Number(countQuery.data || 0n)
    if (c <= 0) return 0
    const n = Math.min(c, maxCount)
    return Math.max(0, c - n)
  }, [countQuery.data, maxCount])

  const rangeQuery = useProposalsRange(start, Math.min(Number(countQuery.data || 0n), maxCount))

  const proposals = useMemo<ProposalListItem[]>(() => {
    const len = (rangeQuery.data as any)?.[0]?.length || 0
    if (!rangeQuery.data || len === 0) return []
    const [descriptions, votesFor, votesAgainst, creators, deadlines] = (rangeQuery.data as any) as [
      string[],
      bigint[],
      bigint[],
      string[],
      bigint[]
    ]
    return (descriptions as string[]).map((desc: string, i: number) => ({
      id: start + i,
      title: desc.slice(0, 48) || `Proposal #${start + i}`,
      description: desc,
      forVotes: votesFor[i],
      againstVotes: votesAgainst[i],
      creator: creators[i],
      deadline: deadlines[i],
    }))
  }, [rangeQuery.data, start])

  return { countQuery, rangeQuery, proposals, start }
}

export function useProposal(id: number | null) {
  const { address, abi } = useVotingContract()
  const enabled = typeof id === 'number'
  const q = useReadContract({ address, abi, functionName: 'getProposal', args: enabled ? [BigInt(id!)] : undefined })
  const data = useMemo(() => {
    if (!q.data || typeof id !== 'number') return null as null | {
      id: number
      description: string
      forVotes: bigint
      againstVotes: bigint
      creator: string
      deadline: bigint
    }
    const [description, voteCountFor, voteCountAgainst, _exists, creator, deadline] = (q.data as any) as [
      string,
      bigint,
      bigint,
      boolean,
      string,
      bigint
    ]
    return { id: id!, description, forVotes: voteCountFor, againstVotes: voteCountAgainst, creator, deadline }
  }, [q.data, id])
  return { query: q, data }
}