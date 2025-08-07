    #!/bin/bash

# HXPanel Theme Installer
# Usage: curl https://raw.githubusercontent.com/HXNodes/HXThemeInstaller/main/install.sh | sh

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root (use sudo)"
   exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    apt-get install -y nodejs
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Installing npm..."
    apt-get install -y npm
fi

# Download and run the JavaScript installer
echo "Starting installation process..."
curl -sL https://raw.githubusercontent.com/HXNodes/HXThemeInstaller/main/install.js | node 
