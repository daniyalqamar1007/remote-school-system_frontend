import axios from 'axios'

const getTemplateFileName = (contentDisposition: string | undefined, fallbackFileName: string) => {
  if (!contentDisposition) {
    return fallbackFileName
  }

  const utf8Match = contentDisposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1].trim())
  }

  const standardMatch = contentDisposition.match(/filename\s*=\s*"?([^";]+)"?/i)
  if (standardMatch?.[1]) {
    return standardMatch[1].trim()
  }

  return fallbackFileName
}

export async function downloadTemplate(endpoint: string, fallbackFileName: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SRS_SERVER
  if (!baseUrl) {
    throw new Error('Server URL is not configured')
  }

  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('authToken')

  const response = await axios.get(`${baseUrl}/${endpoint}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    responseType: 'blob',
  })

  const fileName = getTemplateFileName(response.headers?.['content-disposition'], fallbackFileName)
  const blob = new Blob([response.data])
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
