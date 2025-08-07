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
    apt-get update
    apt-get install -y nodejs --fix-broken --force-yes
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Installing npm..."
    apt-get update
    apt-get install -y npm --fix-broken --force-yes
fi

# Force install npm if it's broken
if command -v node &> /dev/null && ! command -v npm &> /dev/null; then
    echo "npm is broken, reinstalling..."
    apt-get remove -y npm
    apt-get install -y npm --fix-broken --force-yes
fi

# Download and run the JavaScript installer
echo "Starting installation process..."
curl -sL https://raw.githubusercontent.com/HXNodes/HXThemeInstaller/main/install.js | node 
