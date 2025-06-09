"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Wifi, WifiOff, Database, Download, Upload, Settings, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface AppStatusProps {
  onExportData: () => void
  onImportData: (file: File) => void
  totalRecords: number
}

export function AppStatus({ onExportData, onImportData, totalRecords }: AppStatusProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [storageUsed, setStorageUsed] = useState(0)
  const [storageQuota, setStorageQuota] = useState(0)
  const [showDetails, setShowDetails] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Check storage usage
    if ("storage" in navigator && "estimate" in navigator.storage) {
      navigator.storage.estimate().then((estimate) => {
        setStorageUsed(estimate.usage || 0)
        setStorageQuota(estimate.quota || 0)
      })
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const storagePercentage = storageQuota > 0 ? (storageUsed / storageQuota) * 100 : 0

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onImportData(file)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Status indicator */}
      <div className="flex items-center gap-2 mb-2">
        <Badge variant={isOnline ? "default" : "destructive"} className="flex items-center gap-1">
          {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {isOnline ? "Online" : "Offline"}
        </Badge>

        <Button variant="outline" size="sm" onClick={() => setShowDetails(!showDetails)} className="h-6 px-2">
          <Settings className="w-3 h-3" />
        </Button>
      </div>

      {/* Detailed status panel */}
      {showDetails && (
        <Card className="w-80 mb-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">App Status</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowDetails(false)} className="h-6 w-6 p-0">
                <X className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Connection Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Connection</span>
                <Badge variant={isOnline ? "default" : "destructive"}>{isOnline ? "Online" : "Offline"}</Badge>
              </div>
              {!isOnline && (
                <p className="text-xs text-muted-foreground">
                  All features work offline. Data will sync when connection is restored.
                </p>
              )}
            </div>

            {/* Data Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Records</span>
                <span className="font-medium">{totalRecords}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Database className="w-3 h-3" />
                <span>Stored locally</span>
              </div>
            </div>

            {/* Storage Usage */}
            {storageQuota > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Storage</span>
                  <span className="text-xs">
                    {formatBytes(storageUsed)} / {formatBytes(storageQuota)}
                  </span>
                </div>
                <Progress value={storagePercentage} className="h-1" />
              </div>
            )}

            {/* Last Sync */}
            {lastSync && (
              <div className="flex items-center justify-between text-sm">
                <span>Last Sync</span>
                <span className="text-xs text-muted-foreground">{lastSync.toLocaleTimeString()}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={onExportData} className="flex-1">
                <Download className="w-3 h-3 mr-1" />
                Export
              </Button>

              <label className="flex-1">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <span>
                    <Upload className="w-3 h-3 mr-1" />
                    Import
                  </span>
                </Button>
                <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
              </label>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
