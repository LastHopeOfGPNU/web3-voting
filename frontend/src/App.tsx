import { useEffect, useMemo, useState } from 'react'
import './App.css'
import LiquidEther from './components/LiquidEther'
import WalletConnectButton from './components/WalletConnectButton'
import Home from './pages/Home'
import Create from './pages/Create'
import ProposalDetail from './pages/ProposalDetail'

function useRoute() {
  const [route, setRoute] = useState<string>(location.hash.replace('#', '') || '/')
  useEffect(() => {
    const onHash = () => setRoute(location.hash.replace('#', '') || '/')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return route
}

function App() {
  const route = useRoute()
  const content = useMemo(() => {
    if (route.startsWith('/proposal/')) return <ProposalDetail />
    if (route === '/create') return <Create />
    return <Home />
  }, [route])

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <LiquidEther
        colors={[ '#5227FF', '#FF9FFC', '#B19EEF' ]}
        mouseForce={20}
        cursorSize={100}
        isViscous={false}
        viscous={30}
        iterationsViscous={32}
        iterationsPoisson={32}
        resolution={0.5}
        isBounce={false}
        autoDemo={true}
        autoSpeed={0.5}
        autoIntensity={2.2}
        takeoverDuration={0.25}
        autoResumeDelay={3000}
        autoRampDuration={0.6}
      />

      <div style={{ position: 'absolute', top: 16, left: 16, right: 16, zIndex: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
        <nav style={{ display: 'flex', gap: 8 }}>
          <a href="#/" style={{ padding: '8px 12px', background: '#ffffffaa', borderRadius: 12, backdropFilter: 'blur(8px)' }}>Home</a>
          <a href="#/create" style={{ padding: '8px 12px', background: '#ffffffaa', borderRadius: 12, backdropFilter: 'blur(8px)' }}>Create</a>
        </nav>
        <div style={{ marginLeft: 'auto' }}>
          <WalletConnectButton />
        </div>
      </div>

      <div style={{ position: 'absolute', inset: 0, padding: 24, zIndex: 5 }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>{content}</div>
      </div>
    </div>
  )
}

export default App
