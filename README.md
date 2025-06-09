# SAARTHI Desktop Application

**Soldiers Advisory & Resource Team For Handling Investments**

A complete offline desktop application for managing financial profiles, loans, investments, and CIBIL documents.

## Features

✅ **Complete Offline Operation** - Works without internet connection
✅ **Financial Profile Management** - Add, edit, and manage user profiles
✅ **Loan Tracking** - Track multiple loan types and EMIs
✅ **Investment Portfolio** - Monitor stock market, mutual funds, and FDs
✅ **CIBIL Document Management** - Upload and view CIBIL score documents
✅ **Risk Assessment** - Automatic high-risk profile detection
✅ **Data Export/Import** - Backup and restore functionality
✅ **Search & Filter** - Advanced search and filtering options
✅ **Native Desktop Experience** - Runs as a standalone application

## Installation

### Windows
1. Download the project files
2. Double-click `install.bat`
3. Wait for installation to complete
4. Find the installer in the `dist` folder

### Mac/Linux
1. Download the project files
2. Open terminal in the project folder
3. Run: `chmod +x install.sh && ./install.sh`
4. Find the application in the `dist` folder

### Manual Installation
1. Install Node.js from https://nodejs.org
2. Open terminal/command prompt in project folder
3. Run: `npm install`
4. Run: `npm run build` (or `npm run build-win` for Windows)
5. Find the installer in the `dist` folder

## Usage

### Adding Profiles
- Click "Add Person" button or use Ctrl+N
- Fill in basic information (Name and State are required)
- Add loan details, investment information, and CIBIL documents
- Click "Save Person"

### Managing Data
- **Search**: Use the search bar to find profiles by name, state, or number
- **Filter**: Use tab-specific filters to narrow down results
- **Edit**: Click the edit icon on any profile card
- **Export**: Use File > Export Data or the Export button
- **Import**: Use File > Import Data or the Import button

### Keyboard Shortcuts
- `Ctrl+N` - New Profile
- `Ctrl+E` - Export Data
- `Ctrl+I` - Import Data
- `Ctrl+1-4` - Switch between tabs
- `Ctrl+R` - Reload application

## Data Storage

All data is stored locally on your computer using:
- **Primary Storage**: Browser's localStorage
- **Backup Storage**: JSON export files
- **Images**: Base64 encoded within the application

## System Requirements

- **Operating System**: Windows 7+, macOS 10.10+, or Linux
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 500MB free space
- **Node.js**: Version 14 or higher (for building)

## Building from Source

\`\`\`bash
# Clone or download the project
cd saarthi-desktop

# Install dependencies
npm install

# Build for your platform
npm run build          # Current platform
npm run build-win      # Windows
npm run build-mac      # macOS
npm run build-linux    # Linux

# Run in development mode
npm start
\`\`\`

## File Structure

\`\`\`
saarthi-desktop/
├── main.js              # Electron main process
├── index.html           # Application UI
├── styles.css           # Styling
├── app.js              # Application logic
├── package.json        # Dependencies and build config
├── assets/             # Icons and images
├── dist/               # Built applications
└── README.md           # This file
\`\`\`

## Troubleshooting

### Application won't start
- Ensure Node.js is installed
- Try running `npm install` again
- Check if antivirus is blocking the application

### Data not saving
- Check if you have write permissions in the application folder
- Try running as administrator (Windows) or with sudo (Mac/Linux)

### Import/Export issues
- Ensure JSON files are valid
- Check file permissions
- Try exporting to a different location

## Support

For issues and support:
1. Check the troubleshooting section above
2. Ensure you're using the latest version
3. Check system requirements

## License

This application is provided as-is for educational and personal use.
