"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Video, Plus, Trash2, Loader2 } from "lucide-react"
import { toast } from "react-toastify"
import { getToken } from "@/lib/token"

interface DemoVideo {
  _id: string
  titleKey: string
  descKey: string
  imageUrl: string
  videoUrl?: string
  duration: string
  icon: string
  sortOrder: number
}

const ICON_OPTIONS = [
  { value: "Users", label: "Users" },
  { value: "Video", label: "Video" },
  { value: "BarChart3", label: "Bar Chart" },
  { value: "Shield", label: "Shield" },
  { value: "Layout", label: "Layout" },
]

export default function DemoVideosPage() {
  const [videos, setVideos] = useState<DemoVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    titleKey: "",
    descKey: "",
    imageUrl: "",
    videoUrl: "",
    duration: "0:00",
    icon: "Users",
  })
  const [uploadingThumb, setUploadingThumb] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)

  const getApiBase = () => {
    const base = process.env.NEXT_PUBLIC_SRS_SERVER || ""
    if (base) return base.replace(/\/$/, "")
    if (typeof window !== "undefined") return "http://localhost:3014"
    return ""
  }

  const fetchVideos = async () => {
    setLoading(true)
    try {
      const base = getApiBase()
      if (!base) {
        toast.error("API URL not configured. Set NEXT_PUBLIC_SRS_SERVER in .env")
        setLoading(false)
        return
      }
      const res = await fetch(`${base}/global/demo-videos`)
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.message || "Failed to load demo videos")
        return
      }
      if (json.success && Array.isArray(json.data)) {
        setVideos(json.data)
      }
    } catch (e) {
      toast.error(
        "Failed to load demo videos. Ensure the backend is running on port 3014."
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVideos()
  }, [])

  const uploadFile = async (file: File, endpoint: "upload-thumbnail" | "upload-video") => {
    const token = getToken()
    const base = getApiBase()
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch(`${base}/global/demo-videos/${endpoint}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json?.message || "Upload failed")
    return json.url as string
  }

  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingThumb(true)
    try {
      const url = await uploadFile(file, "upload-thumbnail")
      setForm((f) => ({ ...f, imageUrl: url }))
      toast.success("Thumbnail uploaded")
    } catch {
      toast.error("Thumbnail upload failed")
    } finally {
      setUploadingThumb(false)
      e.target.value = ""
    }
  }

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingVideo(true)
    try {
      const url = await uploadFile(file, "upload-video")
      setForm((f) => ({ ...f, videoUrl: url }))
      toast.success("Video uploaded")
    } catch {
      toast.error("Video upload failed")
    } finally {
      setUploadingVideo(false)
      e.target.value = ""
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.titleKey.trim() || !form.descKey.trim() || !form.imageUrl.trim()) {
      toast.error("Title key, description key, and thumbnail are required")
      return
    }
    setSubmitting(true)
    try {
      const token = getToken()
      const base = getApiBase()
      const res = await fetch(`${base}/global/demo-videos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.message || "Failed to add demo video")
        return
      }
      toast.success("Demo video added")
      setOpen(false)
      setForm({ titleKey: "", descKey: "", imageUrl: "", videoUrl: "", duration: "0:00", icon: "Users" })
      fetchVideos()
    } catch (e) {
      toast.error("Failed to add demo video")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const token = getToken()
      const base = getApiBase()
      const res = await fetch(`${base}/global/demo-videos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        toast.error("Failed to delete demo video")
        return
      }
      toast.success("Demo video deleted")
      fetchVideos()
    } catch (e) {
      toast.error("Failed to delete demo video")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-6 w-6" />
              Demo Videos
            </CardTitle>
            <CardDescription>
              Manage demo videos shown on the marketing website Demo page. Use i18n keys for title and description (e.g. demo.parentExperience, demo.parentExperienceDesc).
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Demo Video
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Demo Video</DialogTitle>
                <DialogDescription>
                  Add a new demo card. Title and description are i18n keys from the website locales (e.g. demo.parentExperience).
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="titleKey">Title key (e.g. demo.parentExperience)</Label>
                    <Input
                      id="titleKey"
                      value={form.titleKey}
                      onChange={(e) => setForm((f) => ({ ...f, titleKey: e.target.value }))}
                      placeholder="demo.parentExperience"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="descKey">Description key (e.g. demo.parentExperienceDesc)</Label>
                    <Input
                      id="descKey"
                      value={form.descKey}
                      onChange={(e) => setForm((f) => ({ ...f, descKey: e.target.value }))}
                      placeholder="demo.parentExperienceDesc"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Thumbnail image</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        disabled={uploadingThumb}
                        onChange={handleThumbnailChange}
                        className="max-w-[200px]"
                      />
                      {uploadingThumb && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>
                    {form.imageUrl && (
                      <p className="text-xs text-muted-foreground truncate max-w-full" title={form.imageUrl}>
                        Uploaded: {form.imageUrl.slice(0, 50)}...
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label>Video file (optional)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/ogg"
                        disabled={uploadingVideo}
                        onChange={handleVideoChange}
                        className="max-w-[200px]"
                      />
                      {uploadingVideo && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>
                    {form.videoUrl && (
                      <p className="text-xs text-muted-foreground truncate max-w-full" title={form.videoUrl}>
                        Uploaded: {form.videoUrl.slice(0, 50)}...
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="duration">Duration (e.g. 4:32)</Label>
                    <Input
                      id="duration"
                      value={form.duration}
                      onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                      placeholder="4:32"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Icon</Label>
                    <Select
                      value={form.icon}
                      onValueChange={(v) => setForm((f) => ({ ...f, icon: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ICON_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : videos.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No demo videos yet. Add one to show on the website Demo page.
            </p>
          ) : (
            <div className="space-y-3">
              {videos.map((v) => (
                <div
                  key={v._id}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card"
                >
                  <img
                    src={v.imageUrl}
                    alt={v.titleKey}
                    className="w-20 h-14 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{v.titleKey}</p>
                    <p className="text-sm text-muted-foreground truncate">{v.descKey}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {v.duration} · {v.icon}
                      {v.videoUrl ? " · Video" : ""}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    disabled={deletingId === v._id}
                    onClick={() => handleDelete(v._id)}
                  >
                    {deletingId === v._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
