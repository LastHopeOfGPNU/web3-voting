import { useTranslation } from 'react-i18next'
import { changeLanguage } from '../i18n'

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = i18n.language.startsWith('zh') ? 'zh' : 'en'
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        onClick={() => changeLanguage('zh')}
        style={{ padding: '6px 10px', borderRadius: 10, background: current === 'zh' ? '#ffffffdd' : '#ffffffaa' }}
      >中文</button>
      <button
        onClick={() => changeLanguage('en')}
        style={{ padding: '6px 10px', borderRadius: 10, background: current === 'en' ? '#ffffffdd' : '#ffffffaa' }}
      >English</button>
    </div>
  )
}