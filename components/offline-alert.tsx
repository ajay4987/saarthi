"use client"

import { useState, useEffect } from "react"
import { WifiOff } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function OfflineAlert() {
  const [isOnline, setIsOnline] = useState(true)
  const [showAlert, setShowAlert] = useState(false)

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine)

    // Only show the alert if we're offline
    if (!navigator.onLine) {
      setShowAlert(true)
    }

    // Add event listeners
    const handleOnline = () => {
      setIsOnline(true)
      // Hide the alert after a short delay to confirm we're really online
      setTimeout(() => setShowAlert(false), 2000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowAlert(true)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Check connection with a ping
    const checkRealConnection = async () => {
      try {
        // Try to fetch a tiny resource to verify actual connection
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        await fetch("/favicon.ico", {
          method: "HEAD",
          cache: "no-store",
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
        setIsOnline(true)
        setShowAlert(false)
      } catch (e) {
        // If fetch fails, we might be offline
        if (!navigator.onLine) {
          setIsOnline(false)
          setShowAlert(true)
        }
      }
    }

    // Check real connection status on mount
    checkRealConnection()

    // Clean up
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Add a manual close option
  const dismissAlert = () => {
    setShowAlert(false)
  }

  if (!showAlert) {
    return null
  }

  return (
    <Alert variant="destructive" className="mb-4 relative">
      <WifiOff className="h-4 w-4" />
      <AlertTitle>Offline Mode</AlertTitle>
      <AlertDescription>
        You are currently {isOnline ? "experiencing connection issues" : "offline"}. Your data is saved locally and will
        sync when you reconnect.
      </AlertDescription>
      <button
        onClick={dismissAlert}
        className="absolute top-2 right-2 text-sm font-medium hover:underline"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </Alert>
  )
}
