const getApiBaseUrl = () => {
  const raw = process.env.NEXT_PUBLIC_SRS_SERVER
  if (!raw || raw === 'undefined' || raw === 'null') {
    return 'http://localhost:3014'
  }
  return raw
}

export const downloadTemplate = async (endpoint: string, filename: string) => {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  const token =
    localStorage.getItem('authToken') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('token')

  const response = await fetch(`${getApiBaseUrl()}/${normalizedEndpoint}`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!response.ok) {
    let message = `Failed to download template (${response.status})`
    try {
      const data = await response.json()
      if (data?.message) {
        message = data.message
      }
    } catch {
      // Ignore JSON parsing errors and keep generic message.
    }
    throw new Error(message)
  }

  const blob = await response.blob()
  const blobUrl = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = blobUrl
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.URL.revokeObjectURL(blobUrl)
}