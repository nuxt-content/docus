import { useState } from '#imports'

export const useReleases = () => {
  const last = useState('docus-last-release')

  return {
    last,
  }
}
