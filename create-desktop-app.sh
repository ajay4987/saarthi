#!/bin/bash

echo "Creating SAARTHI Desktop Application..."
echo

echo "Step 1: Creating launcher script..."

# Create a launcher script
cat > saarthi-desktop.sh << 'EOF'
#!/bin/bash

echo "Starting SAARTHI Desktop Application..."

# Get the directory where this script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Try different browsers in order of preference
if command -v google-chrome &> /dev/null; then
    google-chrome --app="file://$DIR/desktop-app.html" --window-size=1400,900
elif command -v chromium-browser &> /dev/null; then
    chromium-browser --app="file://$DIR/desktop-app.html" --window-size=1400,900
elif command -v firefox &> /dev/null; then
    firefox --new-window "file://$DIR/desktop-app.html"
elif command -v safari &> /dev/null; then
    open -a Safari "file://$DIR/desktop-app.html"
else
    echo "No supported browser found. Please install Chrome, Chromium, Firefox, or Safari."
    echo "You can also manually open 'desktop-app.html' in any web browser."
fi
EOF

# Make the script executable
chmod +x saarthi-desktop.sh

echo
echo "Desktop application created successfully!"
echo
echo "To run SAARTHI:"
echo "1. Run: ./saarthi-desktop.sh"
echo "2. Or open 'desktop-app.html' directly in your browser"
echo
echo "The application will run in app mode and works completely offline!"
echo "All your data is saved locally in your browser's storage."
echo
