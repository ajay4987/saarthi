// Enhanced offline database using IndexedDB
export interface Person {
  id: string
  no: number
  name: string
  state: string
  salary: number
  vehicleLoan: number
  vehicleEMI: number
  homeLoan: number
  homeEMI: number
  personalLoan: number
  personalLoanEMI: number
  landLoan: number
  landLoanEMI: number
  educationLoan: number
  educationLoanEMI: number
  chitti: number
  chittiEMI: number
  goldLoan: number
  goldLoanEMI: number
  agifLoan: number
  agifLoanEMI: number
  otherEMIsOnline: number
  otherEMIsOffline: number
  otherLoans: number
  investmentStockMarket: number
  investmentMutualFund: number
  investmentFixedDeposits: number
  investmentGoldEMI: number
  saving: number
  cibilScoreImage?: string
  createdAt: Date
  updatedAt: Date
  syncStatus: "synced" | "pending" | "error"
}

export interface AppSettings {
  id: string
  theme: "light" | "dark" | "system"
  currency: string
  language: string
  autoBackup: boolean
  lastBackup?: Date
}

class OfflineDatabase {
  private db: IDBDatabase | null = null
  private readonly dbName = "SaarthiDB"
  private readonly version = 2

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => {
        console.error("Database failed to open")
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log("Database opened successfully")
        resolve()
      }

      request.onupgradeneeded = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result

        // Create people store
        if (!this.db.objectStoreNames.contains("people")) {
          const peopleStore = this.db.createObjectStore("people", { keyPath: "id" })
          peopleStore.createIndex("name", "name", { unique: false })
          peopleStore.createIndex("state", "state", { unique: false })
          peopleStore.createIndex("no", "no", { unique: true })
          peopleStore.createIndex("syncStatus", "syncStatus", { unique: false })
        }

        // Create settings store
        if (!this.db.objectStoreNames.contains("settings")) {
          this.db.createObjectStore("settings", { keyPath: "id" })
        }

        // Create backup store
        if (!this.db.objectStoreNames.contains("backups")) {
          const backupStore = this.db.createObjectStore("backups", { keyPath: "id" })
          backupStore.createIndex("timestamp", "timestamp", { unique: false })
        }
      }
    })
  }

  // People operations
  async addPerson(person: Omit<Person, "id" | "createdAt" | "updatedAt" | "syncStatus">): Promise<Person> {
    if (!this.db) throw new Error("Database not initialized")

    const newPerson: Person = {
      ...person,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: "pending",
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["people"], "readwrite")
      const store = transaction.objectStore("people")
      const request = store.add(newPerson)

      request.onsuccess = () => resolve(newPerson)
      request.onerror = () => reject(request.error)
    })
  }

  async updatePerson(id: string, updates: Partial<Person>): Promise<Person> {
    if (!this.db) throw new Error("Database not initialized")

    const person = await this.getPerson(id)
    if (!person) throw new Error("Person not found")

    const updatedPerson: Person = {
      ...person,
      ...updates,
      updatedAt: new Date(),
      syncStatus: "pending",
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["people"], "readwrite")
      const store = transaction.objectStore("people")
      const request = store.put(updatedPerson)

      request.onsuccess = () => resolve(updatedPerson)
      request.onerror = () => reject(request.error)
    })
  }

  async deletePerson(id: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["people"], "readwrite")
      const store = transaction.objectStore("people")
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getPerson(id: string): Promise<Person | null> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["people"], "readonly")
      const store = transaction.objectStore("people")
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async getAllPeople(): Promise<Person[]> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["people"], "readonly")
      const store = transaction.objectStore("people")
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async searchPeople(query: string): Promise<Person[]> {
    const allPeople = await this.getAllPeople()
    const lowercaseQuery = query.toLowerCase()

    return allPeople.filter(
      (person) =>
        person.name.toLowerCase().includes(lowercaseQuery) ||
        person.state.toLowerCase().includes(lowercaseQuery) ||
        person.no.toString().includes(query),
    )
  }

  // Backup operations
  async createBackup(): Promise<string> {
    const people = await this.getAllPeople()
    const settings = await this.getSettings()

    const backup = {
      id: Date.now().toString(),
      timestamp: new Date(),
      version: this.version,
      data: {
        people,
        settings,
      },
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["backups"], "readwrite")
      const store = transaction.objectStore("backups")
      const request = store.add(backup)

      request.onsuccess = () => resolve(backup.id)
      request.onerror = () => reject(request.error)
    })
  }

  async exportData(): Promise<string> {
    const people = await this.getAllPeople()
    const settings = await this.getSettings()

    const exportData = {
      version: this.version,
      exportDate: new Date().toISOString(),
      data: {
        people,
        settings,
      },
    }

    return JSON.stringify(exportData, null, 2)
  }

  async importData(jsonData: string): Promise<void> {
    try {
      const importData = JSON.parse(jsonData)

      if (importData.data?.people) {
        // Clear existing data
        await this.clearAllPeople()

        // Import people
        for (const person of importData.data.people) {
          await this.addPerson(person)
        }
      }

      if (importData.data?.settings) {
        await this.saveSettings(importData.data.settings)
      }
    } catch (error) {
      throw new Error("Invalid import data format")
    }
  }

  async clearAllPeople(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["people"], "readwrite")
      const store = transaction.objectStore("people")
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Settings operations
  async getSettings(): Promise<AppSettings> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["settings"], "readonly")
      const store = transaction.objectStore("settings")
      const request = store.get("app-settings")

      request.onsuccess = () => {
        const result = request.result || {
          id: "app-settings",
          theme: "system" as const,
          currency: "INR",
          language: "en",
          autoBackup: true,
        }
        resolve(result)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async saveSettings(settings: Partial<AppSettings>): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    const currentSettings = await this.getSettings()
    const updatedSettings = { ...currentSettings, ...settings }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["settings"], "readwrite")
      const store = transaction.objectStore("settings")
      const request = store.put(updatedSettings)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

export const db = new OfflineDatabase()
