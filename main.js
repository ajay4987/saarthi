const { app, BrowserWindow, Menu, ipcMain, dialog } = require("electron")
const path = require("path")
const fs = require("fs")

// Keep a global reference of the window object
let mainWindow

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, "assets/icon.png"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
    titleBarStyle: "default",
    show: false,
  })

  // Load the app
  mainWindow.loadFile("index.html")

  // Show window when ready to prevent visual flash
  mainWindow.once("ready-to-show", () => {
    mainWindow.show()
  })

  // Handle window closed
  mainWindow.on("closed", () => {
    mainWindow = null
  })

  // Create application menu
  createMenu()
}

function createMenu() {
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "New Profile",
          accelerator: "CmdOrCtrl+N",
          click: () => {
            mainWindow.webContents.send("menu-new-profile")
          },
        },
        {
          label: "Import Data",
          accelerator: "CmdOrCtrl+I",
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ["openFile"],
              filters: [
                { name: "JSON Files", extensions: ["json"] },
                { name: "CSV Files", extensions: ["csv"] },
              ],
            })

            if (!result.canceled) {
              const filePath = result.filePaths[0]
              const fileContent = fs.readFileSync(filePath, "utf8")
              mainWindow.webContents.send("menu-import-data", { filePath, fileContent })
            }
          },
        },
        {
          label: "Export Data",
          accelerator: "CmdOrCtrl+E",
          click: () => {
            mainWindow.webContents.send("menu-export-data")
          },
        },
        { type: "separator" },
        {
          label: "Exit",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
          click: () => {
            app.quit()
          },
        },
      ],
    },
    {
      label: "View",
      submenu: [
        {
          label: "Directory",
          accelerator: "CmdOrCtrl+1",
          click: () => {
            mainWindow.webContents.send("menu-switch-tab", "directory")
          },
        },
        {
          label: "Loans",
          accelerator: "CmdOrCtrl+2",
          click: () => {
            mainWindow.webContents.send("menu-switch-tab", "loans")
          },
        },
        {
          label: "Investments",
          accelerator: "CmdOrCtrl+3",
          click: () => {
            mainWindow.webContents.send("menu-switch-tab", "investments")
          },
        },
        {
          label: "CIBIL Docs",
          accelerator: "CmdOrCtrl+4",
          click: () => {
            mainWindow.webContents.send("menu-switch-tab", "cibil")
          },
        },
        { type: "separator" },
        {
          label: "Reload",
          accelerator: "CmdOrCtrl+R",
          click: () => {
            mainWindow.reload()
          },
        },
        {
          label: "Toggle Developer Tools",
          accelerator: process.platform === "darwin" ? "Alt+Cmd+I" : "Ctrl+Shift+I",
          click: () => {
            mainWindow.webContents.toggleDevTools()
          },
        },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "About SAARTHI",
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "About SAARTHI",
              message: "SAARTHI v1.0.0",
              detail:
                "Soldiers Advisory & Resource Team For Handling Investments\n\nA complete offline financial profile management system.",
            })
          },
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// Handle file operations
ipcMain.handle("save-file", async (event, data) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: "JSON Files", extensions: ["json"] },
      { name: "CSV Files", extensions: ["csv"] },
    ],
  })

  if (!result.canceled) {
    fs.writeFileSync(result.filePath, data)
    return { success: true, filePath: result.filePath }
  }
  return { success: false }
})

// App event handlers
app.whenReady().then(createWindow)

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
