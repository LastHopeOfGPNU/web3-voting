type Props = {
  label: string
  onClick: () => void
  variant?: 'for' | 'against'
  disabled?: boolean
}

export default function VoteButton({ label, onClick, variant = 'for', disabled = false }: Props) {
  const bg = variant === 'for' ? '#4CAF50' : '#F44336'
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '10px 14px',
        borderRadius: 12,
        background: bg,
        color: '#fff',
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
    >
      {label}
    </button>
  )
}