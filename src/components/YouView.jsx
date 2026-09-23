import YouPage from './YouPage.jsx'
import PersonalSettings from './PersonalSettings.jsx'
import CommunitySettings from './CommunitySettings.jsx'

export default function YouView({ personalSettings, communitySettings, focusInterests, ...props }) {
  useEffect(() => {
    if (focusInterests) document.getElementById('interests')?.scrollIntoView({ block: 'start' })
  }, [focusInterests])
  return (
    <YouPage {...props}>
      <PersonalSettings {...personalSettings} />
      <CommunitySettings {...communitySettings} />
    </YouPage>
  )
}
import { useEffect } from 'react'
