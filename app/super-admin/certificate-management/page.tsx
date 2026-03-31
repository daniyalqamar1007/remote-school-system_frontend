'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Plus, 
  Trash2, 
  Settings, 
  Shield,
  ShieldCheck,
  ShieldAlert,
  Key,
  Lock,
  Unlock,
  RefreshCw,
  Download,
  Upload,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Eye,
  EyeOff,
  XCircle
} from 'lucide-react'

interface Certificate {
  id: string
  name: string
  domain: string
  type: 'ssl' | 'tls' | 'wildcard' | 'self-signed'
  status: 'active' | 'expiring' | 'expired' | 'revoked'
  issuer: string
  issuedDate: string
  expiryDate: string
  serialNumber: string
  fingerprint: string
  keySize: number
  algorithm: string
  san: string[] // Subject Alternative Names
  autoRenewal: boolean
  usageCount: number
  lastChecked: string
}

interface CertificateRequest {
  id: string
  domain: string
  type: 'ssl' | 'tls' | 'wildcard'
  status: 'pending' | 'approved' | 'rejected' | 'issued'
  requestedBy: string
  requestedAt: string
  approvedBy?: string
  approvedAt?: string
  reason?: string
  csrData?: string
}

interface TrustedCA {
  id: string
  name: string
  fingerprint: string
  validFrom: string
  validTo: string
  enabled: boolean
  description: string
}

export default function CertificateManagementPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [certificateRequests, setCertificateRequests] = useState<CertificateRequest[]>([])
  const [trustedCAs, setTrustedCAs] = useState<TrustedCA[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('certificates')

  // Form states
  const [isCreatingCert, setIsCreatingCert] = useState(false)
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null)
  const [certName, setCertName] = useState('')
  const [certDomain, setCertDomain] = useState('')
  const [certType, setCertType] = useState<'ssl' | 'tls' | 'wildcard' | 'self-signed'>('ssl')
  const [certKeySize, setCertKeySize] = useState(2048)
  const [certSAN, setCertSAN] = useState<string[]>([])
  const [certAutoRenewal, setCertAutoRenewal] = useState(true)
  const [csrData, setCsrData] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [certificateData, setCertificateData] = useState('')

  useEffect(() => {
    fetchCertificates()
    fetchCertificateRequests()
    fetchTrustedCAs()
  }, [])

  const fetchCertificates = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/super-admin/certificates', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setCertificates(data)
      }
    } catch (error) {
      console.error('Error fetching certificates:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCertificateRequests = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/super-admin/certificate-requests', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setCertificateRequests(data)
      }
    } catch (error) {
      console.error('Error fetching certificate requests:', error)
    }
  }

  const fetchTrustedCAs = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/super-admin/trusted-cas', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setTrustedCAs(data)
      }
    } catch (error) {
      console.error('Error fetching trusted CAs:', error)
    }
  }

  const getCertificateStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <ShieldCheck className="h-5 w-5 text-green-500" />
      case 'expiring':
        return <ShieldAlert className="h-5 w-5 text-yellow-500" />
      case 'expired':
        return <ShieldAlert className="h-5 w-5 text-red-500" />
      case 'revoked':
        return <Shield className="h-5 w-5 text-gray-500" />
      default:
        return <Shield className="h-5 w-5 text-gray-500" />
    }
  }

  const getCertificateStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'expiring':
        return 'destructive'
      case 'expired':
        return 'destructive'
      case 'revoked':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  const getDaysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate)
    const now = new Date()
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleCreateCertificate = () => {
    setIsCreatingCert(true)
    setSelectedCert(null)
    setCertName('')
    setCertDomain('')
    setCertType('ssl')
    setCertKeySize(2048)
    setCertSAN([])
    setCertAutoRenewal(true)
    setCsrData('')
    setPrivateKey('')
    setCertificateData('')
  }

  const handleEditCertificate = (cert: Certificate) => {
    setSelectedCert(cert)
    setIsCreatingCert(false)
    setCertName(cert.name)
    setCertDomain(cert.domain)
    setCertType(cert.type)
    setCertKeySize(cert.keySize)
    setCertSAN(cert.san)
    setCertAutoRenewal(cert.autoRenewal)
  }

  const handleSaveCertificate = async () => {
    try {
      const token = localStorage.getItem('token')
      const certData = {
        name: certName,
        domain: certDomain,
        type: certType,
        keySize: certKeySize,
        san: certSAN,
        autoRenewal: certAutoRenewal,
        csrData,
        privateKey,
        certificateData
      }

      const url = selectedCert 
        ? `/api/super-admin/certificates/${selectedCert.id}`
        : '/api/super-admin/certificates'
      
      const method = selectedCert ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(certData),
      })

      if (response.ok) {
        fetchCertificates()
        setIsCreatingCert(false)
        setSelectedCert(null)
      }
    } catch (error) {
      console.error('Error saving certificate:', error)
    }
  }

  const handleRevokeCertificate = async (certId: string) => {
    if (!confirm('Are you sure you want to revoke this certificate? This action cannot be undone.')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/super-admin/certificates/${certId}/revoke`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (response.ok) {
        fetchCertificates()
      }
    } catch (error) {
      console.error('Error revoking certificate:', error)
    }
  }

  const handleRenewCertificate = async (certId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/super-admin/certificates/${certId}/renew`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (response.ok) {
        fetchCertificates()
      }
    } catch (error) {
      console.error('Error renewing certificate:', error)
    }
  }

  const handleDownloadCertificate = async (certId: string, format: 'pem' | 'der' | 'p12') => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/super-admin/certificates/${certId}/download?format=${format}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `certificate-${certId}.${format}`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error downloading certificate:', error)
    }
  }

  const handleGenerateCSR = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/super-admin/certificates/generate-csr', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain: certDomain,
          keySize: certKeySize,
          san: certSAN
        }),
      })
      if (response.ok) {
        const data = await response.json()
        setCsrData(data.csr)
        setPrivateKey(data.privateKey)
      }
    } catch (error) {
      console.error('Error generating CSR:', error)
    }
  }

  const handleApproveRequest = async (requestId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/super-admin/certificate-requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (response.ok) {
        fetchCertificateRequests()
      }
    } catch (error) {
      console.error('Error approving request:', error)
    }
  }

  const handleRejectRequest = async (requestId: string, reason: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/super-admin/certificate-requests/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      })
      if (response.ok) {
        fetchCertificateRequests()
      }
    } catch (error) {
      console.error('Error rejecting request:', error)
    }
  }

  const addSAN = () => {
    setCertSAN([...certSAN, ''])
  }

  const updateSAN = (index: number, value: string) => {
    const updated = [...certSAN]
    updated[index] = value
    setCertSAN(updated)
  }

  const removeSAN = (index: number) => {
    setCertSAN(certSAN.filter((_, i) => i !== index))
  }

  const activeCertificatesCount = certificates.filter(cert => cert.status === 'active').length
  const expiringCertificatesCount = certificates.filter(cert => cert.status === 'expiring').length
  const expiredCertificatesCount = certificates.filter(cert => cert.status === 'expired').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Certificate Management</h1>
          <p className="text-muted-foreground">
            Manage SSL/TLS certificates, certificate authorities, and security settings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={expiredCertificatesCount > 0 ? 'destructive' : 'secondary'}>
            {expiredCertificatesCount} Expired
          </Badge>
          <Badge variant={expiringCertificatesCount > 0 ? 'destructive' : 'secondary'}>
            {expiringCertificatesCount} Expiring
          </Badge>
          <Badge variant="default">
            {activeCertificatesCount} Active
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="trusted-cas">Trusted CAs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="certificates" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">SSL/TLS Certificates</h2>
            <Button onClick={handleCreateCertificate} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Certificate
            </Button>
          </div>

          {(isCreatingCert || selectedCert) && (
            <Card>
              <CardHeader>
                <CardTitle>{selectedCert ? 'Edit Certificate' : 'Add Certificate'}</CardTitle>
                <CardDescription>
                  Configure SSL/TLS certificate settings and generate CSR
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="certName">Certificate Name</Label>
                    <Input
                      id="certName"
                      value={certName}
                      onChange={(e) => setCertName(e.target.value)}
                      placeholder="Enter certificate name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="certType">Certificate Type</Label>
                    <Select value={certType} onValueChange={(value: any) => setCertType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ssl">SSL Certificate</SelectItem>
                        <SelectItem value="tls">TLS Certificate</SelectItem>
                        <SelectItem value="wildcard">Wildcard Certificate</SelectItem>
                        <SelectItem value="self-signed">Self-Signed Certificate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="certDomain">Domain Name</Label>
                    <Input
                      id="certDomain"
                      value={certDomain}
                      onChange={(e) => setCertDomain(e.target.value)}
                      placeholder="example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="certKeySize">Key Size</Label>
                    <Select value={certKeySize.toString()} onValueChange={(value) => setCertKeySize(Number(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2048">2048 bits</SelectItem>
                        <SelectItem value="3072">3072 bits</SelectItem>
                        <SelectItem value="4096">4096 bits</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Subject Alternative Names (SAN)</Label>
                    <Button onClick={addSAN} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add SAN
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {certSAN.map((san, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={san}
                          onChange={(e) => updateSAN(index, e.target.value)}
                          placeholder="subdomain.example.com"
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeSAN(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="certAutoRenewal"
                    checked={certAutoRenewal}
                    onCheckedChange={(checked) => setCertAutoRenewal(checked as boolean)}
                  />
                  <Label htmlFor="certAutoRenewal">Enable automatic renewal</Label>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold">Certificate Signing Request (CSR)</h3>
                    <Button onClick={handleGenerateCSR} variant="outline" size="sm">
                      <Key className="h-4 w-4 mr-2" />
                      Generate CSR
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="csrData">CSR Data</Label>
                    <Textarea
                      id="csrData"
                      value={csrData}
                      onChange={(e) => setCsrData(e.target.value)}
                      placeholder="-----BEGIN CERTIFICATE REQUEST-----"
                      rows={8}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="certificateData">Certificate Data</Label>
                    <Textarea
                      id="certificateData"
                      value={certificateData}
                      onChange={(e) => setCertificateData(e.target.value)}
                      placeholder="-----BEGIN CERTIFICATE-----"
                      rows={8}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <Button onClick={handleSaveCertificate}>
                    Save Certificate
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsCreatingCert(false)
                      setSelectedCert(null)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {certificates.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ShieldCheck className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Certificates</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Get started by adding your first SSL/TLS certificate
                  </p>
                  <Button onClick={handleCreateCertificate} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Certificate
                  </Button>
                </CardContent>
              </Card>
            ) : (
              certificates.map((cert) => (
                <Card key={cert.id} className={`border-l-4 ${
                  cert.status === 'active' ? 'border-l-green-500' :
                  cert.status === 'expiring' ? 'border-l-yellow-500' :
                  cert.status === 'expired' ? 'border-l-red-500' :
                  'border-l-gray-500'
                }`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {getCertificateStatusIcon(cert.status)}
                        {cert.name}
                        <Badge variant={getCertificateStatusColor(cert.status) as any}>
                          {cert.status}
                        </Badge>
                        <Badge variant="outline">{cert.type.toUpperCase()}</Badge>
                      </CardTitle>
                      <CardDescription>{cert.domain}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditCertificate(cert)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownloadCertificate(cert.id, 'pem')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {cert.status === 'active' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRenewCertificate(cert.id)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRevokeCertificate(cert.id)}
                          >
                            <Lock className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="font-medium">Issuer</p>
                          <p className="text-muted-foreground">{cert.issuer}</p>
                        </div>
                        <div>
                          <p className="font-medium">Issued Date</p>
                          <p className="text-muted-foreground">{new Date(cert.issuedDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="font-medium">Expiry Date</p>
                          <p className="text-muted-foreground">{new Date(cert.expiryDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="font-medium">Days Until Expiry</p>
                          <p className={`font-medium ${
                            getDaysUntilExpiry(cert.expiryDate) < 30 ? 'text-red-600' :
                            getDaysUntilExpiry(cert.expiryDate) < 90 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {getDaysUntilExpiry(cert.expiryDate)} days
                          </p>
                        </div>
                      </div>

                      {cert.san.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-1">Subject Alternative Names:</p>
                          <div className="flex flex-wrap gap-1">
                            {cert.san.map((domain, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {domain}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                        <span>Algorithm: {cert.algorithm}</span>
                        <span>Key Size: {cert.keySize} bits</span>
                        <span>Serial: {cert.serialNumber}</span>
                        <span>Usage: {cert.usageCount} times</span>
                        {cert.autoRenewal && <span className="text-green-600">Auto-renewal enabled</span>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Certificate Requests</h2>
            <Badge variant="outline">
              {certificateRequests.filter(req => req.status === 'pending').length} Pending
            </Badge>
          </div>

          <div className="grid gap-4">
            {certificateRequests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Certificate Requests</h3>
                  <p className="text-muted-foreground text-center">
                    Certificate requests will appear here when users submit them
                  </p>
                </CardContent>
              </Card>
            ) : (
              certificateRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {request.domain}
                        <Badge variant={
                          request.status === 'pending' ? 'default' :
                          request.status === 'approved' ? 'default' :
                          request.status === 'issued' ? 'default' : 'destructive'
                        }>
                          {request.status}
                        </Badge>
                        <Badge variant="outline">{request.type.toUpperCase()}</Badge>
                      </CardTitle>
                      <CardDescription>
                        Requested by {request.requestedBy} on {new Date(request.requestedAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    {request.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleApproveRequest(request.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRejectRequest(request.id, 'Rejected by administrator')}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {request.approvedBy && (
                        <p className="text-sm text-muted-foreground">
                          Approved by {request.approvedBy} on {new Date(request.approvedAt!).toLocaleDateString()}
                        </p>
                      )}
                      {request.reason && (
                        <p className="text-sm text-muted-foreground">
                          Reason: {request.reason}
                        </p>
                      )}
                      {request.csrData && (
                        <div className="mt-2">
                          <Label className="text-sm font-medium">CSR Data:</Label>
                          <Textarea 
                            value={request.csrData} 
                            readOnly 
                            rows={4} 
                            className="mt-1 text-xs font-mono"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="trusted-cas" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Trusted Certificate Authorities</h2>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add CA
            </Button>
          </div>

          <div className="grid gap-4">
            {trustedCAs.map((ca) => (
              <Card key={ca.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-green-500" />
                      {ca.name}
                      <Badge variant={ca.enabled ? 'default' : 'secondary'}>
                        {ca.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{ca.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="font-medium">Valid From</p>
                        <p className="text-muted-foreground">{new Date(ca.validFrom).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="font-medium">Valid To</p>
                        <p className="text-muted-foreground">{new Date(ca.validTo).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="font-medium">Fingerprint</p>
                        <p className="text-muted-foreground font-mono text-xs">{ca.fingerprint}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Certificate Settings</CardTitle>
              <CardDescription>
                Configure global certificate management settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Auto-renewal</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically renew certificates before expiry
                    </p>
                  </div>
                  <Checkbox defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Certificate Validation</Label>
                    <p className="text-sm text-muted-foreground">
                      Validate certificate chains and trust
                    </p>
                  </div>
                  <Checkbox defaultChecked />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Renewal Threshold (days)</Label>
                  <Input type="number" defaultValue="30" className="w-32" />
                  <p className="text-sm text-muted-foreground">
                    Renew certificates when they expire within this many days
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Default Key Size</Label>
                  <Select defaultValue="2048">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2048">2048 bits</SelectItem>
                      <SelectItem value="3072">3072 bits</SelectItem>
                      <SelectItem value="4096">4096 bits</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>OCSP Responder URL</Label>
                  <Input placeholder="http://ocsp.example.com" />
                </div>

                <Button>Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
