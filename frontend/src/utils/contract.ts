// 读取前端配置中的合约地址
// 根据网络切换时可扩展（当前仅使用 sepolia）
import config from '../../config/contract.json'

export function getVotingAddress(network: 'sepolia' | 'localhost' = 'sepolia') {
  const net = (config as any)[network]
  return net?.Voting ?? ''
}