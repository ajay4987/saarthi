"use client"

import { useState, useEffect } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the default behavior
      e.preventDefault()
      // Store the event for later use
      setDeferredPrompt(e)
      // Show the install button
      setShowInstallBanner(true)
    }

    window.addEventListener("beforeinstallprompt", handler as EventListener)

    return () => {
      window.removeEventListener("beforeinstallprompt", handler as EventListener)
    }
  }, [])

  const handleInstallClick = () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the install prompt")
      } else {
        console.log("User dismissed the install prompt")
      }
      // Clear the deferred prompt variable
      setDeferredPrompt(null)
      setShowInstallBanner(false)
    })
  }

  if (!showInstallBanner) return null

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle>Install SAARTHI</CardTitle>
        <CardDescription>Install this app on your device for offline access</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleInstallClick} className="w-full">
          <Download className="mr-2 h-4 w-4" /> Install App
        </Button>
      </CardContent>
    </Card>
  )
}
