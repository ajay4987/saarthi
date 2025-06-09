#!/bin/bash

echo "Installing SAARTHI Desktop Application..."
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js from https://nodejs.org"
    exit 1
fi

echo "Node.js found. Installing dependencies..."
npm install

echo
echo "Building application..."
npm run build

echo
echo "Installation complete!"
echo "You can find the application in the 'dist' folder."
echo
