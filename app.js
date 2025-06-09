// SAARTHI Desktop Application
class SaarthiApp {
  constructor() {
    this.people = []
    this.currentTab = "directory"
    this.currentPage = 1
    this.itemsPerPage = 12
    this.searchTerm = ""
    this.sortField = "name"
    this.sortOrder = "asc"
    this.editingPerson = null

    this.init()
  }

  init() {
    this.loadData()
    this.setupEventListeners()
    this.setupMenuListeners()
    this.renderCurrentTab()
    this.updateCounts()
  }

  // Data Management
  loadData() {
    const saved = localStorage.getItem("saarthi-data")
    if (saved) {
      this.people = JSON.parse(saved)
    } else {
      // Generate sample data for demo
      this.generateSampleData()
    }
  }

  saveData() {
    localStorage.setItem("saarthi-data", JSON.stringify(this.people))
    this.updateStatus("Data saved successfully")
  }

  generateSampleData() {
    const states = ["Maharashtra", "Karnataka", "Tamil Nadu", "Gujarat", "Rajasthan"]
    const names = ["Raj Kumar", "Priya Sharma", "Amit Singh", "Sunita Patel", "Vikram Reddy"]

    for (let i = 1; i <= 10; i++) {
      this.people.push({
        id: Date.now() + i,
        no: i,
        name: `${names[i % names.length]} ${i}`,
        state: states[i % states.length],
        salary: Math.floor(Math.random() * 80000) + 20000,
        vehicleLoan: Math.random() > 0.6 ? Math.floor(Math.random() * 500000) : 0,
        vehicleEMI: Math.random() > 0.6 ? Math.floor(Math.random() * 15000) : 0,
        homeLoan: Math.random() > 0.7 ? Math.floor(Math.random() * 3000000) : 0,
        homeEMI: Math.random() > 0.7 ? Math.floor(Math.random() * 30000) : 0,
        personalLoan: Math.random() > 0.5 ? Math.floor(Math.random() * 200000) : 0,
        personalLoanEMI: Math.random() > 0.5 ? Math.floor(Math.random() * 8000) : 0,
        educationLoan: Math.random() > 0.8 ? Math.floor(Math.random() * 300000) : 0,
        educationLoanEMI: Math.random() > 0.8 ? Math.floor(Math.random() * 5000) : 0,
        goldLoan: Math.random() > 0.9 ? Math.floor(Math.random() * 50000) : 0,
        goldLoanEMI: Math.random() > 0.9 ? Math.floor(Math.random() * 2000) : 0,
        otherLoans: Math.random() > 0.8 ? Math.floor(Math.random() * 100000) : 0,
        otherEMIsOnline: Math.floor(Math.random() * 3000),
        investmentStockMarket: Math.floor(Math.random() * 50000),
        investmentMutualFund: Math.floor(Math.random() * 30000),
        investmentFixedDeposits: Math.floor(Math.random() * 200000),
        saving: Math.floor(Math.random() * 20000) + 5000,
        cibilScoreImage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
    this.saveData()
  }

  // Event Listeners
  setupEventListeners() {
    // Tab navigation
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.switchTab(e.target.dataset.tab)
      })
    })

    // Search
    document.getElementById("searchInput").addEventListener("input", (e) => {
      this.searchTerm = e.target.value
      this.currentPage = 1
      this.renderCurrentTab()
    })

    // Modal controls
    document.getElementById("addPersonBtn").addEventListener("click", () => {
      this.openPersonModal()
    })

    document.getElementById("closeModal").addEventListener("click", () => {
      this.closePersonModal()
    })

    document.getElementById("cancelBtn").addEventListener("click", () => {
      this.closePersonModal()
    })

    // Form submission
    document.getElementById("personForm").addEventListener("submit", (e) => {
      e.preventDefault()
      this.savePerson()
    })

    // File upload
    document.getElementById("cibilScoreImage").addEventListener("change", (e) => {
      this.handleImageUpload(e)
    })

    // Export/Import buttons
    document.getElementById("exportBtn").addEventListener("click", () => {
      this.exportData()
    })

    document.getElementById("importBtn").addEventListener("click", () => {
      this.importData()
    })

    // Close modal on outside click
    document.getElementById("personModal").addEventListener("click", (e) => {
      if (e.target.id === "personModal") {
        this.closePersonModal()
      }
    })
  }

  setupMenuListeners() {
    // Listen for menu events from main process
    if (typeof require !== "undefined") {
      const { ipcRenderer } = require("electron")

      ipcRenderer.on("menu-new-profile", () => {
        this.openPersonModal()
      })

      ipcRenderer.on("menu-switch-tab", (event, tab) => {
        this.switchTab(tab)
      })

      ipcRenderer.on("menu-export-data", () => {
        this.exportData()
      })

      ipcRenderer.on("menu-import-data", (event, data) => {
        this.importFromFile(data.fileContent)
      })
    }
  }

  // Tab Management
  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.remove("active")
    })
    document.querySelector(`[data-tab="${tabName}"]`).classList.add("active")

    // Update tab content
    document.querySelectorAll(".tab-content").forEach((content) => {
      content.classList.remove("active")
    })
    document.getElementById(tabName).classList.add("active")

    this.currentTab = tabName
    this.currentPage = 1
    this.renderCurrentTab()
  }

  renderCurrentTab() {
    switch (this.currentTab) {
      case "directory":
        this.renderDirectory()
        break
      case "loans":
        this.renderLoans()
        break
      case "investments":
        this.renderInvestments()
        break
      case "cibil":
        this.renderCibil()
        break
    }
  }

  // Directory Rendering
  renderDirectory() {
    const filteredPeople = this.getFilteredPeople()
    const paginatedPeople = this.getPaginatedData(filteredPeople)
    const grid = document.getElementById("peopleGrid")
    const emptyState = document.getElementById("emptyState")

    if (paginatedPeople.length === 0) {
      grid.style.display = "none"
      emptyState.style.display = "block"
      return
    }

    grid.style.display = "grid"
    emptyState.style.display = "none"

    grid.innerHTML = paginatedPeople
      .map((person) => {
        const riskFactors = this.calculateRiskFactors(person)
        const isHighRisk = riskFactors.hasMoreThan3Loans || riskFactors.spendingMoreThanSalary

        return `
                <div class="person-card ${isHighRisk ? "high-risk" : ""}">
                    <div class="person-header">
                        <div class="person-info">
                            <div class="person-avatar ${isHighRisk ? "high-risk" : ""}">
                                <i class="fas fa-user"></i>
                            </div>
                            <div class="person-details">
                                <h3>${person.name}</h3>
                                <p>#${person.no} • ${person.state}</p>
                            </div>
                        </div>
                        <div class="person-actions">
                            <button class="icon-btn" onclick="app.editPerson(${person.id})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            ${isHighRisk ? '<i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i>' : ""}
                        </div>
                    </div>

                    ${
                      isHighRisk
                        ? `
                        <div class="risk-alert">
                            <i class="fas fa-exclamation-triangle"></i>
                            <span>
                                ${riskFactors.hasMoreThan3Loans ? "Has more than 3 loans. " : ""}
                                ${riskFactors.spendingMoreThanSalary ? "EMIs exceed salary." : ""}
                            </span>
                        </div>
                    `
                        : ""
                    }

                    <div class="person-stats">
                        <div class="stat-item">
                            <div class="label">Salary</div>
                            <div class="value">₹${person.salary.toLocaleString()}</div>
                        </div>
                        <div class="stat-item">
                            <div class="label">Total EMIs</div>
                            <div class="value">₹${riskFactors.totalEMIs.toLocaleString()}</div>
                        </div>
                        <div class="stat-item">
                            <div class="label">Active Loans</div>
                            <div class="value">${riskFactors.totalLoans}</div>
                        </div>
                        <div class="stat-item">
                            <div class="label">Savings</div>
                            <div class="value">₹${person.saving.toLocaleString()}</div>
                        </div>
                    </div>

                    <div class="person-badges">
                        ${person.vehicleLoan > 0 ? '<span class="badge badge-secondary">Vehicle</span>' : ""}
                        ${person.homeLoan > 0 ? '<span class="badge badge-secondary">Home</span>' : ""}
                        ${person.personalLoan > 0 ? '<span class="badge badge-secondary">Personal</span>' : ""}
                        ${person.educationLoan > 0 ? '<span class="badge badge-secondary">Education</span>' : ""}
                        ${person.goldLoan > 0 ? '<span class="badge badge-secondary">Gold</span>' : ""}
                        ${riskFactors.totalInvestment > 0 ? '<span class="badge badge-success"><i class="fas fa-chart-line"></i> Investments</span>' : ""}
                        ${person.cibilScoreImage ? '<span class="badge badge-secondary"><i class="fas fa-credit-card"></i> CIBIL</span>' : ""}
                    </div>
                </div>
            `
      })
      .join("")

    this.renderPagination(filteredPeople.length)
  }

  // Loans Rendering
  renderLoans() {
    const loanData = this.people.filter((person) => {
      const riskFactors = this.calculateRiskFactors(person)
      return riskFactors.totalLoans > 0
    })

    const filteredData = this.getFilteredData(loanData)
    const paginatedData = this.getPaginatedData(filteredData)
    const tbody = document.querySelector("#loansTable tbody")

    tbody.innerHTML = paginatedData
      .map((person) => {
        const riskFactors = this.calculateRiskFactors(person)
        const isHighRisk = riskFactors.hasMoreThan3Loans || riskFactors.spendingMoreThanSalary

        return `
                <tr class="${isHighRisk ? "high-risk" : ""}">
                    <td><strong>${person.name}</strong></td>
                    <td>${person.state}</td>
                    <td>₹${person.salary.toLocaleString()}</td>
                    <td>${riskFactors.totalLoans}</td>
                    <td>₹${riskFactors.totalEMIs.toLocaleString()}</td>
                    <td>
                        <div class="person-badges">
                            ${person.vehicleLoan > 0 ? '<span class="badge badge-secondary">Vehicle</span>' : ""}
                            ${person.homeLoan > 0 ? '<span class="badge badge-secondary">Home</span>' : ""}
                            ${person.personalLoan > 0 ? '<span class="badge badge-secondary">Personal</span>' : ""}
                            ${person.educationLoan > 0 ? '<span class="badge badge-secondary">Education</span>' : ""}
                            ${person.goldLoan > 0 ? '<span class="badge badge-secondary">Gold</span>' : ""}
                        </div>
                    </td>
                    <td>
                        ${isHighRisk ? '<span class="badge badge-danger"><i class="fas fa-exclamation-triangle"></i> High Risk</span>' : ""}
                    </td>
                    <td>
                        <button class="icon-btn" onclick="app.editPerson(${person.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>
            `
      })
      .join("")

    this.renderPagination(filteredData.length)
  }

  // Investments Rendering
  renderInvestments() {
    const investmentData = this.people.filter((person) => {
      const totalInvestments =
        person.investmentStockMarket + person.investmentMutualFund + person.investmentFixedDeposits
      return totalInvestments > 0
    })

    const filteredData = this.getFilteredData(investmentData)
    const paginatedData = this.getPaginatedData(filteredData)
    const tbody = document.querySelector("#investmentsTable tbody")

    tbody.innerHTML = paginatedData
      .map((person) => {
        const totalInvestments =
          person.investmentStockMarket + person.investmentMutualFund + person.investmentFixedDeposits

        return `
                <tr>
                    <td><strong>${person.name}</strong></td>
                    <td>${person.state}</td>
                    <td>₹${person.salary.toLocaleString()}</td>
                    <td class="text-green-600"><strong>₹${totalInvestments.toLocaleString()}</strong></td>
                    <td>${person.investmentStockMarket > 0 ? `₹${person.investmentStockMarket.toLocaleString()}` : "-"}</td>
                    <td>${person.investmentMutualFund > 0 ? `₹${person.investmentMutualFund.toLocaleString()}` : "-"}</td>
                    <td>${person.investmentFixedDeposits > 0 ? `₹${person.investmentFixedDeposits.toLocaleString()}` : "-"}</td>
                    <td>${person.investmentGoldEMI > 0 ? `₹${person.investmentGoldEMI.toLocaleString()}` : "-"}</td>
                    <td>
                        <button class="icon-btn" onclick="app.editPerson(${person.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>
            `
      })
      .join("")

    this.renderPagination(filteredData.length)
  }

  // CIBIL Rendering
  renderCibil() {
    const cibilData = this.people.filter((person) => person.cibilScoreImage)
    const filteredData = this.getFilteredData(cibilData)
    const paginatedData = this.getPaginatedData(filteredData)
    const grid = document.getElementById("cibilGrid")

    grid.innerHTML = paginatedData
      .map(
        (person) => `
            <div class="cibil-card">
                <div class="person-header">
                    <div class="person-info">
                        <div class="person-avatar">
                            <i class="fas fa-credit-card"></i>
                        </div>
                        <div class="person-details">
                            <h3>${person.name}</h3>
                            <p>#${person.no} • ${person.state}</p>
                        </div>
                    </div>
                    <button class="icon-btn" onclick="app.editPerson(${person.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>

                <div class="person-stats">
                    <div class="stat-item">
                        <div class="label">Salary</div>
                        <div class="value">₹${person.salary.toLocaleString()}</div>
                    </div>
                    <div class="stat-item">
                        <div class="label">Upload Date</div>
                        <div class="value">${new Date(person.updatedAt).toLocaleDateString()}</div>
                    </div>
                </div>

                ${
                  person.cibilScoreImage
                    ? `
                    <img src="${person.cibilScoreImage}" alt="CIBIL Score for ${person.name}" 
                         class="cibil-image" onclick="app.viewImage('${person.cibilScoreImage}', '${person.name}')">
                    <p style="text-align: center; font-size: 0.75rem; color: #64748b; margin-top: 0.5rem;">
                        Click to view full size
                    </p>
                `
                    : ""
                }

                <div class="person-badges">
                    <span class="badge badge-secondary">
                        <i class="fas fa-upload"></i> Document Available
                    </span>
                </div>
            </div>
        `,
      )
      .join("")

    this.renderPagination(filteredData.length)
  }

  // Utility Functions
  calculateRiskFactors(person) {
    const loans = [
      person.vehicleLoan,
      person.homeLoan,
      person.personalLoan,
      person.educationLoan,
      person.goldLoan,
      person.otherLoans,
    ].filter((loan) => loan > 0)

    const totalEMIs =
      person.vehicleEMI +
      person.homeEMI +
      person.personalLoanEMI +
      person.educationLoanEMI +
      person.goldLoanEMI +
      person.otherEMIsOnline

    const totalInvestment = person.investmentStockMarket + person.investmentMutualFund + person.investmentFixedDeposits

    return {
      hasMoreThan3Loans: loans.length > 3,
      spendingMoreThanSalary: totalEMIs > person.salary,
      totalLoans: loans.length,
      totalEMIs,
      totalInvestment,
    }
  }

  getFilteredPeople() {
    return this.people.filter(
      (person) =>
        person.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        person.state.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        person.no.toString().includes(this.searchTerm),
    )
  }

  getFilteredData(data) {
    return data.filter(
      (person) =>
        person.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        person.state.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        person.no.toString().includes(this.searchTerm),
    )
  }

  getPaginatedData(data) {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage
    return data.slice(startIndex, startIndex + this.itemsPerPage)
  }

  renderPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / this.itemsPerPage)
    const pagination = document.getElementById("pagination")

    if (totalPages <= 1) {
      pagination.innerHTML = ""
      return
    }

    let paginationHTML = `
            <button ${this.currentPage === 1 ? "disabled" : ""} onclick="app.goToPage(${this.currentPage - 1})">
                <i class="fas fa-chevron-left"></i> Previous
            </button>
        `

    for (let i = 1; i <= Math.min(5, totalPages); i++) {
      paginationHTML += `
                <button class="${this.currentPage === i ? "active" : ""}" onclick="app.goToPage(${i})">
                    ${i}
                </button>
            `
    }

    if (totalPages > 5) {
      paginationHTML += "<span>...</span>"
    }

    paginationHTML += `
            <button ${this.currentPage === totalPages ? "disabled" : ""} onclick="app.goToPage(${this.currentPage + 1})">
                Next <i class="fas fa-chevron-right"></i>
            </button>
        `

    pagination.innerHTML = paginationHTML
  }

  goToPage(page) {
    this.currentPage = page
    this.renderCurrentTab()
  }

  // Modal Management
  openPersonModal(person = null) {
    this.editingPerson = person
    const modal = document.getElementById("personModal")
    const title = document.getElementById("modalTitle")
    const saveBtn = document.getElementById("saveBtn")

    if (person) {
      title.textContent = "Edit Financial Profile"
      saveBtn.textContent = "Update Person"
      this.populateForm(person)
    } else {
      title.textContent = "Add New Financial Profile"
      saveBtn.textContent = "Save Person"
      this.resetForm()
    }

    modal.classList.add("active")
  }

  closePersonModal() {
    document.getElementById("personModal").classList.remove("active")
    this.editingPerson = null
    this.resetForm()
  }

  populateForm(person) {
    const fields = [
      "personNo",
      "personName",
      "personState",
      "personSalary",
      "vehicleLoan",
      "vehicleEMI",
      "homeLoan",
      "homeEMI",
      "personalLoan",
      "personalLoanEMI",
      "educationLoan",
      "educationLoanEMI",
      "goldLoan",
      "goldLoanEMI",
      "otherLoans",
      "otherEMIsOnline",
      "investmentStockMarket",
      "investmentMutualFund",
      "investmentFixedDeposits",
      "saving",
    ]

    const mapping = {
      personNo: "no",
      personName: "name",
      personState: "state",
      personSalary: "salary",
    }

    fields.forEach((field) => {
      const element = document.getElementById(field)
      const dataField = mapping[field] || field
      if (element && person[dataField] !== undefined) {
        element.value = person[dataField]
      }
    })

    if (person.cibilScoreImage) {
      document.getElementById("imagePreview").innerHTML =
        `<img src="${person.cibilScoreImage}" alt="CIBIL Score" style="max-width: 200px; max-height: 200px; border-radius: 6px;">`
    }
  }

  resetForm() {
    document.getElementById("personForm").reset()
    document.getElementById("imagePreview").innerHTML = ""
    document.getElementById("personNo").value = this.people.length + 1
  }

  savePerson() {
    const formData = this.getFormData()

    if (!formData.name || !formData.state) {
      alert("Please fill in required fields (Name and State)")
      return
    }

    if (this.editingPerson) {
      // Update existing person
      const index = this.people.findIndex((p) => p.id === this.editingPerson.id)
      if (index !== -1) {
        this.people[index] = {
          ...this.editingPerson,
          ...formData,
          updatedAt: new Date(),
        }
      }
    } else {
      // Add new person
      const newPerson = {
        id: Date.now(),
        ...formData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      this.people.push(newPerson)
    }

    this.saveData()
    this.closePersonModal()
    this.renderCurrentTab()
    this.updateCounts()
    this.updateStatus(this.editingPerson ? "Profile updated successfully" : "Profile added successfully")
  }

  getFormData() {
    return {
      no: Number.parseInt(document.getElementById("personNo").value) || 0,
      name: document.getElementById("personName").value.trim(),
      state: document.getElementById("personState").value.trim(),
      salary: Number.parseFloat(document.getElementById("personSalary").value) || 0,
      vehicleLoan: Number.parseFloat(document.getElementById("vehicleLoan").value) || 0,
      vehicleEMI: Number.parseFloat(document.getElementById("vehicleEMI").value) || 0,
      homeLoan: Number.parseFloat(document.getElementById("homeLoan").value) || 0,
      homeEMI: Number.parseFloat(document.getElementById("homeEMI").value) || 0,
      personalLoan: Number.parseFloat(document.getElementById("personalLoan").value) || 0,
      personalLoanEMI: Number.parseFloat(document.getElementById("personalLoanEMI").value) || 0,
      educationLoan: Number.parseFloat(document.getElementById("educationLoan").value) || 0,
      educationLoanEMI: Number.parseFloat(document.getElementById("educationLoanEMI").value) || 0,
      goldLoan: Number.parseFloat(document.getElementById("goldLoan").value) || 0,
      goldLoanEMI: Number.parseFloat(document.getElementById("goldLoanEMI").value) || 0,
      otherLoans: Number.parseFloat(document.getElementById("otherLoans").value) || 0,
      otherEMIsOnline: Number.parseFloat(document.getElementById("otherEMIsOnline").value) || 0,
      investmentStockMarket: Number.parseFloat(document.getElementById("investmentStockMarket").value) || 0,
      investmentMutualFund: Number.parseFloat(document.getElementById("investmentMutualFund").value) || 0,
      investmentFixedDeposits: Number.parseFloat(document.getElementById("investmentFixedDeposits").value) || 0,
      saving: Number.parseFloat(document.getElementById("saving").value) || 0,
      cibilScoreImage: this.currentImageData || null,
    }
  }

  editPerson(id) {
    const person = this.people.find((p) => p.id === id)
    if (person) {
      this.openPersonModal(person)
    }
  }

  deletePerson(id) {
    if (confirm("Are you sure you want to delete this profile?")) {
      this.people = this.people.filter((p) => p.id !== id)
      this.saveData()
      this.renderCurrentTab()
      this.updateCounts()
      this.updateStatus("Profile deleted successfully")
    }
  }

  // Image Handling
  handleImageUpload(event) {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        this.currentImageData = e.target.result
        document.getElementById("imagePreview").innerHTML =
          `<img src="${this.currentImageData}" alt="CIBIL Score Preview" style="max-width: 200px; max-height: 200px; border-radius: 6px; border: 1px solid #e2e8f0;">`
      }
      reader.readAsDataURL(file)
    }
  }

  viewImage(imageSrc, personName) {
    const newWindow = window.open("", "_blank")
    newWindow.document.write(`
            <html>
                <head>
                    <title>CIBIL Score - ${personName}</title>
                    <style>
                        body { 
                            margin: 0; 
                            display: flex; 
                            justify-content: center; 
                            align-items: center; 
                            min-height: 100vh; 
                            background: #f0f0f0; 
                            font-family: Arial, sans-serif;
                        }
                        img { 
                            max-width: 90%; 
                            max-height: 90%; 
                            object-fit: contain; 
                            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                        }
                        .header {
                            position: fixed;
                            top: 0;
                            left: 0;
                            right: 0;
                            background: rgba(0,0,0,0.8);
                            color: white;
                            padding: 1rem;
                            text-align: center;
                            z-index: 1000;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h3>CIBIL Score Document - ${personName}</h3>
                        <p>Press ESC or close this window to return</p>
                    </div>
                    <img src="${imageSrc}" alt="CIBIL Score Document" />
                    <script>
                        document.addEventListener('keydown', function(e) {
                            if (e.key === 'Escape') {
                                window.close();
                            }
                        });
                    </script>
                </body>
            </html>
        `)
  }

  // Data Import/Export
  exportData() {
    const exportData = {
      version: "1.0.0",
      exportDate: new Date().toISOString(),
      totalRecords: this.people.length,
      data: this.people,
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const blob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = `saarthi_backup_${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    this.updateStatus("Data exported successfully")
  }

  importData() {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          this.importFromFile(e.target.result)
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  importFromFile(fileContent) {
    try {
      const importData = JSON.parse(fileContent)

      if (importData.data && Array.isArray(importData.data)) {
        if (confirm(`This will replace all current data with ${importData.data.length} imported records. Continue?`)) {
          this.people = importData.data
          this.saveData()
          this.renderCurrentTab()
          this.updateCounts()
          this.updateStatus(`Successfully imported ${importData.data.length} profiles`)
        }
      } else {
        throw new Error("Invalid file format")
      }
    } catch (error) {
      alert("Error importing data: " + error.message)
      this.updateStatus("Import failed")
    }
  }

  // UI Updates
  updateCounts() {
    const loanCount = this.people.filter((person) => {
      const riskFactors = this.calculateRiskFactors(person)
      return riskFactors.totalLoans > 0
    }).length

    const investmentCount = this.people.filter((person) => {
      const totalInvestments =
        person.investmentStockMarket + person.investmentMutualFund + person.investmentFixedDeposits
      return totalInvestments > 0
    }).length

    const cibilCount = this.people.filter((person) => person.cibilScoreImage).length

    document.getElementById("userCount").textContent = this.people.length
    document.getElementById("directoryCount").textContent = this.people.length
    document.getElementById("loansCount").textContent = loanCount
    document.getElementById("investmentsCount").textContent = investmentCount
    document.getElementById("cibilCount").textContent = cibilCount
  }

  updateStatus(message) {
    document.getElementById("statusText").textContent = message
    setTimeout(() => {
      document.getElementById("statusText").textContent = "Ready"
    }, 3000)
  }
}

// Initialize the application
const app = new SaarthiApp()

// Make app globally available for onclick handlers
window.app = app
