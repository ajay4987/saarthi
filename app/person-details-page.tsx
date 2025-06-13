"use client"

import React from "react"
import { useState, useMemo, useCallback, useEffect } from "react"
import {
  Search,
  Plus,
  User,
  Upload,
  AlertTriangle,
  TrendingUp,
  CreditCard,
  Edit,
  Users,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { RegisterServiceWorker } from "./register-sw"
import { InstallPWA } from "../components/install-pwa"
// import { AppIcon } from "./app/icon"
import { AppStatus } from "../components/app-status"
import { db, type Person } from "../lib/database"

interface LoanData extends Person {
  totalLoans: number
  totalEMIs: number
  hasMoreThan3Loans: boolean
  spendingMoreThanSalary: boolean
}

interface InvestmentData extends Person {
  totalInvestments: number
  hasInvestments: boolean
}

interface CibilData extends Person {
  hasCibilScore: boolean
  uploadDate?: string
}

type SortField = "name" | "totalLoans" | "totalEMIs" | "salary" | "vehicleLoan" | "homeLoan" | "personalLoan"
type SortOrder = "asc" | "desc"

const ITEMS_PER_PAGE = 12

export default function PersonDetailsPage() {
  const [people, setPeople] = useState<Person[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPerson, setEditingPerson] = useState<Person | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [activeTab, setActiveTab] = useState("directory")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [loanFilter, setLoanFilter] = useState<string>("all")
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [csvData, setCsvData] = useState("")
  const [investmentFilter, setInvestmentFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)

  const { toast } = useToast()

  const [formData, setFormData] = useState<Omit<Person, "id" | "createdAt" | "updatedAt" | "syncStatus">>({
    no: people.length + 1,
    name: "",
    state: "",
    salary: 0,
    vehicleLoan: 0,
    vehicleEMI: 0,
    homeLoan: 0,
    homeEMI: 0,
    personalLoan: 0,
    personalLoanEMI: 0,
    landLoan: 0,
    landLoanEMI: 0,
    educationLoan: 0,
    educationLoanEMI: 0,
    chitti: 0,
    chittiEMI: 0,
    goldLoan: 0,
    goldLoanEMI: 0,
    agifLoan: 0,
    agifLoanEMI: 0,
    otherEMIsOnline: 0,
    otherEMIsOffline: 0,
    otherLoans: 0,
    investmentStockMarket: 0,
    investmentMutualFund: 0,
    investmentFixedDeposits: 0,
    investmentGoldEMI: 0,
    saving: 0,
  })

  // Initialize database and load data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await db.init()
        const allPeople = await db.getAllPeople()
        setPeople(allPeople)
        setIsLoading(false)

        toast({
          title: "App Ready",
          description: `Loaded ${allPeople.length} profiles from offline storage`,
        })
      } catch (error) {
        console.error("Failed to initialize database:", error)
        setIsLoading(false)
        toast({
          title: "Error",
          description: "Failed to initialize offline storage",
          variant: "destructive",
        })
      }
    }

    initializeApp()
  }, [toast])

  // Calculate risk factors with memoization for performance
  const calculateRiskFactors = useCallback((person: Person) => {
    const loans = [
      person.vehicleLoan,
      person.homeLoan,
      person.personalLoan,
      person.landLoan,
      person.educationLoan,
      person.chitti,
      person.goldLoan,
      person.agifLoan,
      person.otherLoans,
    ].filter((loan) => loan > 0)

    const totalEMIs =
      person.vehicleEMI +
      person.homeEMI +
      person.personalLoanEMI +
      person.landLoanEMI +
      person.educationLoanEMI +
      person.chittiEMI +
      person.goldLoanEMI +
      person.agifLoanEMI +
      person.otherEMIsOnline +
      person.otherEMIsOffline

    return {
      hasMoreThan3Loans: loans.length > 3,
      spendingMoreThanSalary: totalEMIs > person.salary,
      totalLoans: loans.length,
      totalEMIs,
      totalInvestment:
        person.investmentStockMarket +
        person.investmentMutualFund +
        person.investmentFixedDeposits +
        person.investmentGoldEMI,
    }
  }, [])

  // Memoized loan data with risk factors
  const loanData = useMemo((): LoanData[] => {
    return people
      .map((person) => {
        const riskFactors = calculateRiskFactors(person)
        return {
          ...person,
          ...riskFactors,
        }
      })
      .filter((person) => person.totalLoans > 0)
  }, [people, calculateRiskFactors])

  // Memoized investment data
  const investmentData = useMemo((): InvestmentData[] => {
    return people
      .map((person) => {
        const totalInvestments =
          person.investmentStockMarket +
          person.investmentMutualFund +
          person.investmentFixedDeposits +
          person.investmentGoldEMI

        return {
          ...person,
          totalInvestments,
          hasInvestments: totalInvestments > 0,
        }
      })
      .filter((person) => person.hasInvestments)
  }, [people])

  // Memoized CIBIL data
  const cibilData = useMemo((): CibilData[] => {
    return people
      .map((person) => ({
        ...person,
        hasCibilScore: !!person.cibilScoreImage,
        uploadDate: person.cibilScoreImage ? person.createdAt.toLocaleDateString() : undefined,
      }))
      .filter((person) => person.hasCibilScore)
  }, [people])

  // Filtered and sorted data (same logic as before but using the new data structure)
  const filteredAndSortedLoanData = useMemo(() => {
    let filtered = loanData

    if (loanFilter !== "all") {
      filtered = filtered.filter((person) => {
        switch (loanFilter) {
          case "vehicle":
            return person.vehicleLoan > 0
          case "home":
            return person.homeLoan > 0
          case "personal":
            return person.personalLoan > 0
          case "education":
            return person.educationLoan > 0
          case "gold":
            return person.goldLoan > 0
          case "high-risk":
            return person.hasMoreThan3Loans || person.spendingMoreThanSalary
          default:
            return true
        }
      })
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (person) =>
          person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          person.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
          person.no.toString().includes(searchTerm),
      )
    }

    filtered.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      if (sortField === "totalLoans") {
        aValue = a.totalLoans
        bValue = b.totalLoans
      } else if (sortField === "totalEMIs") {
        aValue = a.totalEMIs
        bValue = b.totalEMIs
      }

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase()
        bValue = (bValue as string).toLowerCase()
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [loanData, loanFilter, searchTerm, sortField, sortOrder])

  // Similar filtering for investments and CIBIL data...
  const filteredAndSortedInvestmentData = useMemo(() => {
    let filtered = investmentData

    if (investmentFilter !== "all") {
      filtered = filtered.filter((person) => {
        switch (investmentFilter) {
          case "stocks":
            return person.investmentStockMarket > 0
          case "mutual-funds":
            return person.investmentMutualFund > 0
          case "fixed-deposits":
            return person.investmentFixedDeposits > 0
          case "gold":
            return person.investmentGoldEMI > 0
          case "high-value":
            return person.totalInvestments > 100000
          default:
            return true
        }
      })
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (person) =>
          person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          person.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
          person.no.toString().includes(searchTerm),
      )
    }

    return filtered
  }, [investmentData, investmentFilter, searchTerm])

  const filteredCibilData = useMemo(() => {
    let filtered = cibilData

    if (searchTerm) {
      filtered = filtered.filter(
        (person) =>
          person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          person.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
          person.no.toString().includes(searchTerm),
      )
    }

    return filtered
  }, [cibilData, searchTerm])

  const filteredPeople = useMemo(() => {
    return people.filter(
      (person) =>
        person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.no.toString().includes(searchTerm),
    )
  }, [people, searchTerm])

  // Pagination logic (same as before)
  const paginatedPeople = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredPeople.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredPeople, currentPage])

  const paginatedLoanData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredAndSortedLoanData.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredAndSortedLoanData, currentPage])

  const paginatedInvestmentData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredAndSortedInvestmentData.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredAndSortedInvestmentData, currentPage])

  const paginatedCibilData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredCibilData.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredCibilData, currentPage])

  const totalPages = useMemo(() => {
    let dataLength = 0
    switch (activeTab) {
      case "directory":
        dataLength = filteredPeople.length
        break
      case "loans":
        dataLength = filteredAndSortedLoanData.length
        break
      case "investments":
        dataLength = filteredAndSortedInvestmentData.length
        break
      case "cibil":
        dataLength = filteredCibilData.length
        break
      default:
        dataLength = filteredPeople.length
    }
    return Math.ceil(dataLength / ITEMS_PER_PAGE)
  }, [
    filteredPeople.length,
    filteredAndSortedLoanData.length,
    filteredAndSortedInvestmentData.length,
    filteredCibilData.length,
    activeTab,
  ])

  // Enhanced form handlers using IndexedDB
  const handleInputChange = (
    field: keyof Omit<Person, "id" | "createdAt" | "updatedAt" | "syncStatus">,
    value: string | number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setFormData((prev) => ({
          ...prev,
          cibilScoreImage: e.target?.result as string,
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    if (formData.name && formData.state) {
      try {
        const newPerson = await db.addPerson(formData)
        setPeople((prev) => [...prev, newPerson])
        resetForm()
        setIsDialogOpen(false)

        toast({
          title: "Success",
          description: "Profile saved successfully",
        })
      } catch (error) {
        console.error("Failed to save person:", error)
        toast({
          title: "Error",
          description: "Failed to save profile",
          variant: "destructive",
        })
      }
    }
  }

  const resetForm = () => {
    setFormData({
      no: people.length + 2,
      name: "",
      state: "",
      salary: 0,
      vehicleLoan: 0,
      vehicleEMI: 0,
      homeLoan: 0,
      homeEMI: 0,
      personalLoan: 0,
      personalLoanEMI: 0,
      landLoan: 0,
      landLoanEMI: 0,
      educationLoan: 0,
      educationLoanEMI: 0,
      chitti: 0,
      chittiEMI: 0,
      goldLoan: 0,
      goldLoanEMI: 0,
      agifLoan: 0,
      agifLoanEMI: 0,
      otherEMIsOnline: 0,
      otherEMIsOffline: 0,
      otherLoans: 0,
      investmentStockMarket: 0,
      investmentMutualFund: 0,
      investmentFixedDeposits: 0,
      investmentGoldEMI: 0,
      saving: 0,
    })
    setEditingPerson(null)
    setIsEditMode(false)
  }

  const handleEdit = (person: Person) => {
    setEditingPerson(person)
    setFormData({
      no: person.no,
      name: person.name,
      state: person.state,
      salary: person.salary,
      vehicleLoan: person.vehicleLoan,
      vehicleEMI: person.vehicleEMI,
      homeLoan: person.homeLoan,
      homeEMI: person.homeEMI,
      personalLoan: person.personalLoan,
      personalLoanEMI: person.personalLoanEMI,
      landLoan: person.landLoan,
      landLoanEMI: person.landLoanEMI,
      educationLoan: person.educationLoanEMI,
      chitti: person.chitti,
      chittiEMI: person.chittiEMI,
      goldLoan: person.goldLoan,
      goldLoanEMI: person.goldLoanEMI,
      agifLoan: person.agifLoan,
      agifLoanEMI: person.agifLoanEMI,
      otherEMIsOnline: person.otherEMIsOnline,
      otherEMIsOffline: person.otherEMIsOffline,
      otherLoans: person.otherLoans,
      investmentStockMarket: person.investmentStockMarket,
      investmentMutualFund: person.investmentMutualFund,
      investmentFixedDeposits: person.investmentFixedDeposits,
      investmentGoldEMI: person.investmentGoldEMI,
      saving: person.saving,
      cibilScoreImage: person.cibilScoreImage,
    })
    setIsEditMode(true)
    setIsDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (formData.name && formData.state && editingPerson) {
      try {
        const updatedPerson = await db.updatePerson(editingPerson.id, formData)
        setPeople((prev) => prev.map((person) => (person.id === editingPerson.id ? updatedPerson : person)))
        resetForm()
        setEditingPerson(null)
        setIsEditMode(false)
        setIsDialogOpen(false)

        toast({
          title: "Success",
          description: "Profile updated successfully",
        })
      } catch (error) {
        console.error("Failed to update person:", error)
        toast({
          title: "Error",
          description: "Failed to update profile",
          variant: "destructive",
        })
      }
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
    setCurrentPage(1)
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setCurrentPage(1)
    setSearchTerm("")
  }

  // Enhanced export/import functions
  const exportToJSON = async () => {
    try {
      const exportData = await db.exportData()
      const blob = new Blob([exportData], { type: "application/json" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `saarthi_backup_${new Date().toISOString().split("T")[0]}.json`
      a.click()
      window.URL.revokeObjectURL(url)

      toast({
        title: "Export Complete",
        description: "Data exported successfully",
      })
    } catch (error) {
      console.error("Export failed:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export data",
        variant: "destructive",
      })
    }
  }

  const importFromJSON = async (file: File) => {
    try {
      const text = await file.text()
      await db.importData(text)
      const allPeople = await db.getAllPeople()
      setPeople(allPeople)

      toast({
        title: "Import Complete",
        description: `Imported ${allPeople.length} profiles successfully`,
      })
    } catch (error) {
      console.error("Import failed:", error)
      toast({
        title: "Import Failed",
        description: "Failed to import data. Please check the file format.",
        variant: "destructive",
      })
    }
  }

  const exportToCSV = () => {
    const headers = [
      "No",
      "Name",
      "State",
      "Salary",
      "Vehicle Loan",
      "Vehicle EMI",
      "Home Loan",
      "Home EMI",
      "Personal Loan",
      "Personal Loan EMI",
      "Land Loan",
      "Land Loan EMI",
      "Education Loan",
      "Education Loan EMI",
      "Chitti",
      "Chitti EMI",
      "Gold Loan",
      "Gold Loan EMI",
      "AGIF Loan",
      "AGIF Loan EMI",
      "Other EMIs Online",
      "Other EMIs Offline",
      "Other Loans",
      "Investment Stock Market",
      "Investment Mutual Fund",
      "Investment Fixed Deposits",
      "Investment Gold EMI",
      "Saving",
    ]

    const csvContent = [
      headers.join(","),
      ...people.map((person) =>
        [
          person.no,
          person.name,
          person.state,
          person.salary,
          person.vehicleLoan,
          person.vehicleEMI,
          person.homeLoan,
          person.homeEMI,
          person.personalLoan,
          person.personalLoanEMI,
          person.landLoan,
          person.landLoanEMI,
          person.educationLoan,
          person.educationLoanEMI,
          person.chitti,
          person.chittiEMI,
          person.goldLoan,
          person.goldLoanEMI,
          person.agifLoan,
          person.agifLoanEMI,
          person.otherEMIsOnline,
          person.otherEMIsOffline,
          person.otherLoans,
          person.investmentStockMarket,
          person.investmentMutualFund,
          person.investmentFixedDeposits,
          person.investmentGoldEMI,
          person.saving,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `financial_profiles_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const clearAllData = async () => {
    if (window.confirm("Are you sure you want to delete all profiles? This action cannot be undone.")) {
      try {
        await db.clearAllPeople()
        setPeople([])
        toast({
          title: "Data Cleared",
          description: "All profiles have been deleted",
        })
      } catch (error) {
        console.error("Failed to clear data:", error)
        toast({
          title: "Error",
          description: "Failed to clear data",
          variant: "destructive",
        })
      }
    }
  }

  // PersonCard component (same as before but with enhanced styling)
  const PersonCard = React.memo(({ person }: { person: Person }) => {
    const riskFactors = calculateRiskFactors(person)
    const isHighRisk = riskFactors.hasMoreThan3Loans || riskFactors.spendingMoreThanSalary

    return (
      <Card className={`hover:shadow-lg transition-shadow ${isHighRisk ? "border-red-500 bg-red-50" : ""}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${isHighRisk ? "bg-red-100" : "bg-primary/10"}`}
              >
                <User className={`w-6 h-6 ${isHighRisk ? "text-red-600" : "text-primary"}`} />
              </div>
              <div>
                <CardTitle className="text-lg">{person.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  #{person.no} • {person.state}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => handleEdit(person)} className="h-8 w-8 p-0">
                <Edit className="w-4 h-4" />
              </Button>
              {isHighRisk && <AlertTriangle className="w-5 h-5 text-red-500" />}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isHighRisk && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {riskFactors.hasMoreThan3Loans && "Has more than 3 loans. "}
                {riskFactors.spendingMoreThanSalary && "EMIs exceed salary."}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Salary</p>
              <p className="font-medium">₹{person.salary.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total EMIs</p>
              <p className="font-medium">₹{riskFactors.totalEMIs.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Active Loans</p>
              <p className="font-medium">{riskFactors.totalLoans}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Savings</p>
              <p className="font-medium">₹{person.saving.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {person.vehicleLoan > 0 && <Badge variant="secondary">Vehicle</Badge>}
            {person.homeLoan > 0 && <Badge variant="secondary">Home</Badge>}
            {person.personalLoan > 0 && <Badge variant="secondary">Personal</Badge>}
            {person.educationLoan > 0 && <Badge variant="secondary">Education</Badge>}
            {person.goldLoan > 0 && <Badge variant="secondary">Gold</Badge>}
            {riskFactors.totalInvestment > 0 && (
              <Badge variant="outline" className="text-green-600">
                <TrendingUp className="w-3 h-3 mr-1" />
                Investments
              </Badge>
            )}
          </div>

          {person.cibilScoreImage && (
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">CIBIL Score Available</span>
            </div>
          )}
        </CardContent>
      </Card>
    )
  })

  PersonCard.displayName = "PersonCard"

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading SAARTHI...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Service Worker Registration */}
      <RegisterServiceWorker />

      {/* App Status Component */}
      <AppStatus onExportData={exportToJSON} onImportData={importFromJSON} totalRecords={people.length} />

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <AppIcon className="w-8 h-8" />
            <div>
              <h1 className="text-3xl font-bold">SAARTHI</h1>
              <p className="text-muted-foreground">Soldiers Advisory & Resource Team For Handling Investments</p>
              <p className="text-sm text-muted-foreground">({people.length} total users • Offline Ready)</p>
            </div>
          </div>

          {/* Install PWA Banner */}
          <InstallPWA />

          <div className="flex flex-wrap gap-2">
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open)
                if (!open) {
                  resetForm()
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    resetForm()
                    setIsEditMode(false)
                    setEditingPerson(null)
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Person
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>{isEditMode ? "Edit Financial Profile" : "Add New Financial Profile"}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-4">
                  <div className="space-y-4 py-4">
                    {/* Form content - same as before */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="no">No *</Label>
                        <Input
                          id="no"
                          type="number"
                          value={formData.no}
                          onChange={(e) => handleInputChange("no", Number.parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          placeholder="Enter full name"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="state">State *</Label>
                        <Input
                          id="state"
                          placeholder="Enter state"
                          value={formData.state}
                          onChange={(e) => handleInputChange("state", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="salary">Salary</Label>
                        <Input
                          id="salary"
                          type="number"
                          placeholder="Monthly salary"
                          value={formData.salary || ""}
                          onChange={(e) => handleInputChange("salary", Number.parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    {/* Rest of the form fields - same as before */}
                    {/* ... (keeping the form content the same for brevity) ... */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Loan Information</h3>

                      {/* Vehicle Loan */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="vehicleLoan">Vehicle Loan</Label>
                          <Input
                            id="vehicleLoan"
                            type="number"
                            value={formData.vehicleLoan || ""}
                            onChange={(e) => handleInputChange("vehicleLoan", Number.parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="vehicleEMI">Vehicle EMI</Label>
                          <Input
                            id="vehicleEMI"
                            type="number"
                            value={formData.vehicleEMI || ""}
                            onChange={(e) => handleInputChange("vehicleEMI", Number.parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>

                      {/* Home Loan */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="homeLoan">Home Loan</Label>
                          <Input
                            id="homeLoan"
                            type="number"
                            value={formData.homeLoan || ""}
                            onChange={(e) => handleInputChange("homeLoan", Number.parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="homeEMI">Home EMI</Label>
                          <Input
                            id="homeEMI"
                            type="number"
                            value={formData.homeEMI || ""}
                            onChange={(e) => handleInputChange("homeEMI", Number.parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>

                      {/* Personal Loan */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="personalLoan">Personal Loan</Label>
                          <Input
                            id="personalLoan"
                            type="number"
                            value={formData.personalLoan || ""}
                            onChange={(e) => handleInputChange("personalLoan", Number.parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="personalLoanEMI">Personal Loan EMI</Label>
                          <Input
                            id="personalLoanEMI"
                            type="number"
                            value={formData.personalLoanEMI || ""}
                            onChange={(e) =>
                              handleInputChange("personalLoanEMI", Number.parseFloat(e.target.value) || 0)
                            }
                          />
                        </div>
                      </div>

                      {/* Land Loan */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="landLoan">Land Loan</Label>
                          <Input
                            id="landLoan"
                            type="number"
                            value={formData.landLoan || ""}
                            onChange={(e) => handleInputChange("landLoan", Number.parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="landLoanEMI">Land Loan EMI</Label>
                          <Input
                            id="landLoanEMI"
                            type="number"
                            value={formData.landLoanEMI || ""}
                            onChange={(e) => handleInputChange("landLoanEMI", Number.parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>

                      {/* Education Loan */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="educationLoan">Education Loan</Label>
                          <Input
                            id="educationLoan"
                            type="number"
                            value={formData.educationLoan || ""}
                            onChange={(e) => handleInputChange("educationLoan", Number.parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="educationLoanEMI">Education Loan EMI</Label>
                          <Input
                            id="educationLoanEMI"
                            type="number"
                            value={formData.educationLoanEMI || ""}
                            onChange={(e) =>
                              handleInputChange("educationLoanEMI", Number.parseFloat(e.target.value) || 0)
                            }
                          />
                        </div>
                      </div>

                      {/* Chitti */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="chitti">Chitti</Label>
                          <Input
                            id="chitti"
                            type="number"
                            value={formData.chitti || ""}
                            onChange={(e) => handleInputChange("chitti", Number.parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="chittiEMI">Chitti EMI</Label>
                          <Input
                            id="chittiEMI"
                            type="number"
                            value={formData.chittiEMI || ""}
                            onChange={(e) => handleInputChange("chittiEMI", Number.parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>

                      {/* Gold Loan */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="goldLoan">Gold Loan</Label>
                          <Input
                            id="goldLoan"
                            type="number"
                            value={formData.goldLoan || ""}
                            onChange={(e) => handleInputChange("goldLoan", Number.parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="goldLoanEMI">Gold Loan EMI</Label>
                          <Input
                            id="goldLoanEMI"
                            type="number"
                            value={formData.goldLoanEMI || ""}
                            onChange={(e) => handleInputChange("goldLoanEMI", Number.parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>

                      {/* AGIF Loan */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="agifLoan">AGIF Loan</Label>
                          <Input
                            id="agifLoan"
                            type="number"
                            value={formData.agifLoan || ""}
                            onChange={(e) => handleInputChange("agifLoan", Number.parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="agifLoanEMI">AGIF Loan EMI</Label>
                          <Input
                            id="agifLoanEMI"
                            type="number"
                            value={formData.agifLoanEMI || ""}
                            onChange={(e) => handleInputChange("agifLoanEMI", Number.parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>

                      {/* Other EMIs */}
                      <div className="space-y-2">
                        <Label>Other EMIs</Label>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="otherEMIsOnline">Online</Label>
                            <Input
                              id="otherEMIsOnline"
                              type="number"
                              value={formData.otherEMIsOnline || ""}
                              onChange={(e) =>
                                handleInputChange("otherEMIsOnline", Number.parseFloat(e.target.value) || 0)
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="otherEMIsOffline">Offline</Label>
                            <Input
                              id="otherEMIsOffline"
                              type="number"
                              value={formData.otherEMIsOffline || ""}
                              onChange={(e) =>
                                handleInputChange("otherEMIsOffline", Number.parseFloat(e.target.value) || 0)
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="otherLoans">Other Loans</Label>
                        <Input
                          id="otherLoans"
                          type="number"
                          value={formData.otherLoans || ""}
                          onChange={(e) => handleInputChange("otherLoans", Number.parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    {/* Investment Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Investment</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="investmentStockMarket">Stock Market</Label>
                          <Input
                            id="investmentStockMarket"
                            type="number"
                            value={formData.investmentStockMarket || ""}
                            onChange={(e) =>
                              handleInputChange("investmentStockMarket", Number.parseFloat(e.target.value) || 0)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="investmentMutualFund">Mutual Fund</Label>
                          <Input
                            id="investmentMutualFund"
                            type="number"
                            value={formData.investmentMutualFund || ""}
                            onChange={(e) =>
                              handleInputChange("investmentMutualFund", Number.parseFloat(e.target.value) || 0)
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="investmentFixedDeposits">Fixed Deposits</Label>
                          <Input
                            id="investmentFixedDeposits"
                            type="number"
                            value={formData.investmentFixedDeposits || ""}
                            onChange={(e) =>
                              handleInputChange("investmentFixedDeposits", Number.parseFloat(e.target.value) || 0)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="investmentGoldEMI">Gold EMI</Label>
                          <Input
                            id="investmentGoldEMI"
                            type="number"
                            value={formData.investmentGoldEMI || ""}
                            onChange={(e) =>
                              handleInputChange("investmentGoldEMI", Number.parseFloat(e.target.value) || 0)
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="saving">Saving</Label>
                      <Input
                        id="saving"
                        type="number"
                        value={formData.saving || ""}
                        onChange={(e) => handleInputChange("saving", Number.parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    {/* CIBIL Score Image Upload */}
                    <div className="space-y-2">
                      <Label htmlFor="cibilScore">Upload CIBIL Score</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="cibilScore"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                        />
                        <Upload className="w-4 h-4" />
                      </div>
                      {formData.cibilScoreImage && (
                        <div className="mt-2">
                          <img
                            src={formData.cibilScoreImage || "/placeholder.svg"}
                            alt="CIBIL Score"
                            className="w-32 h-32 object-cover rounded border"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={isEditMode ? handleUpdate : handleSave}
                        disabled={!formData.name || !formData.state}
                      >
                        {isEditMode ? "Update Person" : "Save Person"}
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>

            {/* <Button variant="outline" onClick={exportToCSV} disabled={people.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button> */}

            <Button variant="outline" onClick={clearAllData} disabled={people.length === 0}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs and content - same structure as before */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="directory" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Directory ({people.length})
          </TabsTrigger>
          <TabsTrigger value="loans" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Loans ({loanData.length})
          </TabsTrigger>
          <TabsTrigger value="investments" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Investments ({investmentData.length})
          </TabsTrigger>
          <TabsTrigger value="cibil" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            CIBIL Docs ({cibilData.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="space-y-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by name, state, or number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* People Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {paginatedPeople.length > 0 ? (
              paginatedPeople.map((person) => <PersonCard key={person.id} person={person} />)
            ) : (
              <div className="col-span-full text-center py-12">
                <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  {searchTerm ? "No profiles found" : "No profiles added yet"}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "Try adjusting your search terms" : 'Click the "Add Person" button to get started'}
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Other tab contents would follow the same pattern */}
        <TabsContent value="loans" className="space-y-6">
          {/* Loans content - same as before */}
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search loan holders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={loanFilter} onValueChange={setLoanFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by loan type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Loans</SelectItem>
                <SelectItem value="vehicle">Vehicle Loans</SelectItem>
                <SelectItem value="home">Home Loans</SelectItem>
                <SelectItem value="personal">Personal Loans</SelectItem>
                <SelectItem value="education">Education Loans</SelectItem>
                <SelectItem value="gold">Gold Loans</SelectItem>
                <SelectItem value="high-risk">High Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Loans Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("name")} className="h-auto p-0 font-semibold">
                      Name
                      <ArrowUpDown className={`ml-2 h-4 w-4 ${sortField === "name" ? "text-primary" : ""}`} />
                      {sortField === "name" && <span className="ml-1 text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>}
                    </Button>
                  </TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("salary")} className="h-auto p-0 font-semibold">
                      Salary
                      <ArrowUpDown className={`ml-2 h-4 w-4 ${sortField === "salary" ? "text-primary" : ""}`} />
                      {sortField === "salary" && (
                        <span className="ml-1 text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("totalLoans")}
                      className="h-auto p-0 font-semibold"
                    >
                      Total Loans
                      <ArrowUpDown className={`ml-2 h-4 w-4 ${sortField === "totalLoans" ? "text-primary" : ""}`} />
                      {sortField === "totalLoans" && (
                        <span className="ml-1 text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("totalEMIs")}
                      className="h-auto p-0 font-semibold"
                    >
                      Total EMIs
                      <ArrowUpDown className={`ml-2 h-4 w-4 ${sortField === "totalEMIs" ? "text-primary" : ""}`} />
                      {sortField === "totalEMIs" && (
                        <span className="ml-1 text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>Loan Types</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLoanData.map((person) => (
                  <TableRow
                    key={person.id}
                    className={person.hasMoreThan3Loans || person.spendingMoreThanSalary ? "bg-red-50" : ""}
                  >
                    <TableCell className="font-medium">{person.name}</TableCell>
                    <TableCell>{person.state}</TableCell>
                    <TableCell>₹{person.salary.toLocaleString()}</TableCell>
                    <TableCell>{person.totalLoans}</TableCell>
                    <TableCell>₹{person.totalEMIs.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {person.vehicleLoan > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            Vehicle
                          </Badge>
                        )}
                        {person.homeLoan > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            Home
                          </Badge>
                        )}
                        {person.personalLoan > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            Personal
                          </Badge>
                        )}
                        {person.educationLoan > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            Education
                          </Badge>
                        )}
                        {person.goldLoan > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            Gold
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {(person.hasMoreThan3Loans || person.spendingMoreThanSalary) && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          High Risk
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(person)} className="h-8 w-8 p-0">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {paginatedLoanData.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No loan data found</h3>
              <p className="text-muted-foreground">
                {searchTerm || loanFilter !== "all" ? "Try adjusting your filters" : "No users have loans yet"}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="investments" className="space-y-6">
          {/* Investments content - same as before */}
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search investors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={investmentFilter} onValueChange={setInvestmentFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by investment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Investments</SelectItem>
                <SelectItem value="stocks">Stock Market</SelectItem>
                <SelectItem value="mutual-funds">Mutual Funds</SelectItem>
                <SelectItem value="fixed-deposits">Fixed Deposits</SelectItem>
                <SelectItem value="gold">Gold EMI</SelectItem>
                <SelectItem value="high-value">High Value ({">"}₹1L)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Investments Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("name")} className="h-auto p-0 font-semibold">
                      Name <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("salary")} className="h-auto p-0 font-semibold">
                      Salary <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("totalInvestments")}
                      className="h-auto p-0 font-semibold"
                    >
                      Total Investments <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Stock Market</TableHead>
                  <TableHead>Mutual Funds</TableHead>
                  <TableHead>Fixed Deposits</TableHead>
                  <TableHead>Gold EMI</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInvestmentData.map((person) => (
                  <TableRow key={person.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{person.name}</TableCell>
                    <TableCell>{person.state}</TableCell>
                    <TableCell>₹{person.salary.toLocaleString()}</TableCell>
                    <TableCell className="font-semibold text-green-600">
                      ₹{person.totalInvestments.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {person.investmentStockMarket > 0 ? `₹${person.investmentStockMarket.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell>
                      {person.investmentMutualFund > 0 ? `₹${person.investmentMutualFund.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell>
                      {person.investmentFixedDeposits > 0 ? `₹${person.investmentFixedDeposits.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell>
                      {person.investmentGoldEMI > 0 ? `₹${person.investmentGoldEMI.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(person)} className="h-8 w-8 p-0">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {paginatedInvestmentData.length === 0 && (
            <div className="text-center py-12">
              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No investment data found</h3>
              <p className="text-muted-foreground">
                {searchTerm || investmentFilter !== "all"
                  ? "Try adjusting your filters"
                  : "No users have investments yet"}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="cibil" className="space-y-6">
          {/* CIBIL content - same as before */}
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search CIBIL documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* CIBIL Documents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedCibilData.length > 0 ? (
              paginatedCibilData.map((person) => (
                <Card key={person.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <CreditCard className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{person.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            #{person.no} • {person.state}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(person)} className="h-8 w-8 p-0">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Salary</p>
                        <p className="font-medium">₹{person.salary.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Upload Date</p>
                        <p className="font-medium">{person.uploadDate || "N/A"}</p>
                      </div>
                    </div>

                    {person.cibilScoreImage && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">CIBIL Score Document</Label>
                        <div className="border rounded-lg p-2 bg-gray-50">
                          <img
                            src={person.cibilScoreImage || "/placeholder.svg"}
                            alt={`CIBIL Score for ${person.name}`}
                            className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => {
                              // Open image in new tab for full view
                              const newWindow = window.open()
                              if (newWindow) {
                                newWindow.document.write(`
                          <html>
                            <head><title>CIBIL Score - ${person.name}</title></head>
                            <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f0f0f0;">
                              <img src="${person.cibilScoreImage}" style="max-width:100%;max-height:100%;object-fit:contain;" alt="CIBIL Score" />
                            </body>
                          </html>
                        `)
                              }
                            }}
                          />
                          <p className="text-xs text-muted-foreground mt-1 text-center">Click to view full size</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <Badge variant="outline" className="text-blue-600">
                        <Upload className="w-3 h-3 mr-1" />
                        Document Available
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No CIBIL documents found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "Try adjusting your search terms" : "No users have uploaded CIBIL score documents yet"}
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Pagination - same as before */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredPeople.length)} of {filteredPeople.length} results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                )
              })}
              {totalPages > 5 && <span className="text-muted-foreground">...</span>}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
