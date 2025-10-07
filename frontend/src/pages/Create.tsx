import { useState, useEffect } from 'react'
import ProposalForm from '../components/ProposalForm'
import { useVotingContract } from '../hooks/useVoting'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'

export default function Create() {
  const { address, abi } = useVotingContract()
  const { isConnected } = useAccount()
  const { writeContractAsync, isPending, error } = useWriteContract()
  const [submitting, setSubmitting] = useState(false)
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined)

  const wait = useWaitForTransactionReceipt({ hash: txHash })

  useEffect(() => {
    if (txHash && wait.isSuccess) {
      // 略微延迟以展示成功文案
      const timer = setTimeout(() => {
        location.hash = '#/'
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [txHash, wait.isSuccess])

  const DEFAULT_DURATION_SECONDS = 24 * 60 * 60 // 1 day

  const onSubmit = async (payload: { title: string; description: string; durationSeconds?: number }) => {
    if (!isConnected) {
      alert('请先连接钱包再创建提案。')
      return
    }
    const desc = payload.title ? `${payload.title}\n${payload.description}` : payload.description
    try {
      setSubmitting(true)
      const hash = await writeContractAsync({
        address,
        abi,
        functionName: 'createProposal',
        args: [
          desc,
          BigInt(Math.max(1, Number(payload.durationSeconds ?? DEFAULT_DURATION_SECONDS)))
        ],
      })
      setTxHash(hash as `0x${string}`)
      alert(`交易已提交：\n${hash}`)
    } catch (e: any) {
      const msg = e?.shortMessage || e?.message || '提交交易失败'
      alert(`创建提案失败：\n${msg}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h2 style={{ color: '#fff' }}>Create Proposal</h2>
      <ProposalForm onSubmit={onSubmit} />
      {(isPending || submitting) && (
        <div style={{ color: '#fff', marginTop: 12 }}>正在提交交易，请在钱包中确认...</div>
      )}
      {txHash && (
        <div style={{ color: '#fff', marginTop: 8 }}>
          交易哈希：{txHash}
        </div>
      )}
      {txHash && wait.isLoading && (
        <div style={{ color: '#fff', marginTop: 8 }}>交易已提交，正在等待区块确认...</div>
      )}
      {txHash && wait.isError && (
        <div style={{ color: '#ff8888', marginTop: 8 }}>交易确认失败，请稍后重试。</div>
      )}
      {txHash && wait.isSuccess && (
        <div style={{ color: '#9cff9c', marginTop: 8 }}>交易已确认！正在返回首页...</div>
      )}
      {error && (
        <div style={{ color: '#ff8888', marginTop: 8 }}>提交失败，请检查钱包或网络。</div>
      )}
    </div>
  )
}