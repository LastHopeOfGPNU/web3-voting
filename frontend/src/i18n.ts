import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

const saved = localStorage.getItem('lang') || ''
const browser = (navigator.language || 'en').toLowerCase()
const defaultLang = (saved || (browser.startsWith('zh') ? 'zh' : 'en')) as 'zh' | 'en'

export const resources = {
  en: {
    translation: {
      nav: { home: 'Home', create: 'Create' },
      buttons: { voteFor: 'Vote For', voteAgainst: 'Vote Against' },
      home: {
        loadingProposals: 'Loading proposals from chain...',
        loadFailed: 'Failed to load proposals; check network or console.',
        noProposals: 'No proposals yet.',
        view: 'View'
      },
      proposalCard: { forLabel: 'For', againstLabel: 'Against', viewButton: 'View' },
      proposalDetail: {
        notFound: 'Proposal not found.',
        loading: 'Loading proposal...',
        loadFailed: 'Load failed; check network or console.',
        idTitle: 'Proposal #{{id}}',
        readingVoteState: 'Reading vote state...',
        alreadyVotedNote: 'You have voted; buttons disabled.',
        closedNote: 'Voting has closed.',
        submitting: 'Submitting vote; please confirm in wallet...',
        txHash: 'Tx Hash: {{hash}}',
        waitingConfirm: 'Transaction submitted; waiting for confirmation...',
        confirmFailed: 'Confirmation failed; please retry later.',
        confirmSuccess: 'Confirmed! Vote counts refreshed.',
        submitFailed: 'Submit failed; check wallet or network.'
      },
      messages: {
        invalidProposalId: 'Invalid proposal ID.',
        connectWallet: 'Please connect your wallet to vote.',
        votingClosed: 'Voting has closed.',
        alreadyVoted: 'You have already voted on this proposal.',
        proposalNotExist: 'Proposal does not exist or has been removed.',
        txSubmitted: 'Transaction submitted:\n{{hash}}'
      }
    }
  },
  zh: {
    translation: {
      nav: { home: '首页', create: '创建' },
      buttons: { voteFor: '投赞成票', voteAgainst: '投反对票' },
      home: {
        loadingProposals: '正在加载链上提案...',
        loadFailed: '加载提案失败，请检查网络或控制台。',
        noProposals: '暂无提案。',
        view: '查看'
      },
      proposalCard: { forLabel: '赞成', againstLabel: '反对', viewButton: '查看' },
      proposalDetail: {
        notFound: '未找到该提案。',
        loading: '正在加载提案...',
        loadFailed: '加载失败，请检查网络或控制台。',
        idTitle: '提案 #{{id}}',
        readingVoteState: '正在读取投票状态...',
        alreadyVotedNote: '你已投票，按钮已禁用。',
        closedNote: '投票已截止。',
        submitting: '正在提交投票，请在钱包中确认...',
        txHash: '交易哈希：{{hash}}',
        waitingConfirm: '交易已提交，正在等待区块确认...',
        confirmFailed: '交易确认失败，请稍后重试。',
        confirmSuccess: '交易已确认！票数已刷新。',
        submitFailed: '提交失败，请检查钱包或网络。'
      },
      messages: {
        invalidProposalId: '无效的提案 ID。',
        connectWallet: '请先连接钱包再进行投票。',
        votingClosed: '投票已截止。',
        alreadyVoted: '你已对该提案投过票，不能重复投票。',
        proposalNotExist: '提案不存在或已被移除。',
        txSubmitted: '交易已提交：\n{{hash}}'
      }
    }
  }
} as const

i18next
  .use(initReactI18next)
  .init({
    resources,
    lng: defaultLang,
    fallbackLng: 'en',
    interpolation: { escapeValue: false }
  })

export function changeLanguage(lang: 'en' | 'zh') {
  i18next.changeLanguage(lang)
  localStorage.setItem('lang', lang)
}

export default i18next