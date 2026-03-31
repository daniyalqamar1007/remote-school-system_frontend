"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function UnderDevelopmentPopup() {
  const router = useRouter()

  const handleGoBack = () => {
    router.back()
  }

  return (
    <Dialog open={true}>
      <DialogContent 
        className="sm:max-w-[500px] [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="h-6 w-6 text-yellow-600" />
            <DialogTitle className="text-xl">Under Development</DialogTitle>
          </div>
          <DialogDescription className="text-base pt-2">
            This page is currently under development. We are working hard to bring you this feature soon.
            <br /><br />
            You can navigate to other pages using the sidebar.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end mt-4">
          <Button onClick={handleGoBack} variant="default">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

