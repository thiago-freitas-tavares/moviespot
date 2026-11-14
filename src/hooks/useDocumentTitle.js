import { useEffect } from 'react'

/** WCAG 2.4.2 — cada página tem um título único e descritivo. */
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | MovieSpot` : 'MovieSpot'
  }, [title])
}
