import { useCallback } from 'react'

export function useNotification() {
  const notify = useCallback((message, type = 'success') => {
    const notif = document.getElementById('notif')
    const notifMsg = document.getElementById('notif-msg')

    if (notif && notifMsg) {
      notifMsg.textContent = message
      notif.className = `fixed bottom-6 right-6 z-40 rounded-lg font-medium transition-all animate-slide-up pointer-events-none ${
        type === 'error'
          ? 'bg-red text-white'
          : type === 'warning'
          ? 'bg-amber text-white'
          : 'bg-navy text-white'
      }`

      notif.classList.add('show')
      setTimeout(() => notif.classList.remove('show'), 3000)
    }
  }, [])

  return { notify }
}
