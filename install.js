const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

// Configuration
const LICENSE_SERVER_URL = 'http://in3.hxnodes.xyz:25575/api/client';
const API_KEY = 'sgdfgrg47rhg45b83e48hdh8';
const PRODUCT = 'HXTheme';
const INSTALL_DIR = '/var/www/pterodactyl';

// Get license key from environment variable
const LICENSE_KEY = process.env.LICENSE_KEY;

// Get HWID (using hostname as identifier)
const os = require('os');
const HWID = os.hostname();

async function validateLicense() {
    console.log("――――――――――――――――――――――――――――――――――――");
    console.log('\x1b[36m%s\x1b[0m', 'Validating license key...');
    console.log("――――――――――――――――――――――――――――――――――――");

    if (!LICENSE_KEY) {
        console.log('\x1b[31m%s\x1b[0m', 'License key not provided!');
        console.log('\x1b[31m%s\x1b[0m', 'Please run the installation script again and provide a valid license key.');
        process.exit(1);
    }

    try {
        const response = await axios.post(
            LICENSE_SERVER_URL,
            {
                licensekey: LICENSE_KEY,
                product: PRODUCT,
                hwid: HWID
            },
            { 
                headers: { Authorization: API_KEY },
                timeout: 10000
            }
        );

        if (!response.data.status_code || !response.data.status_id) {
            console.log("――――――――――――――――――――――――――――――――――――");
            console.log('\x1b[31m%s\x1b[0m', 'Your license key is invalid!');
            console.log('\x1b[31m%s\x1b[0m', 'Create a ticket in our discord server to get one.');
            console.log("――――――――――――――――――――――――――――――――――――");
            process.exit(1);
        }

        if (response.data.status_overview !== "success") {
            console.log("――――――――――――――――――――――――――――――――――――");
            console.log('\x1b[31m%s\x1b[0m', 'Your license key is invalid or expired!');
            console.log('\x1b[31m%s\x1b[0m', 'Create a ticket in our discord server to get one.');
            console.log("――――――――――――――――――――――――――――――――――――");
            process.exit(1);
        } else {
            console.log("――――――――――――――――――――――――――――――――――――");
            console.log('\x1b[32m%s\x1b[0m', 'Your license key is valid!');
            console.log('\x1b[36m%s\x1b[0m', "Discord ID: " + response.data.discord_id);
            console.log("――――――――――――――――――――――――――――――――――――");
        }
    } catch (error) {
        console.log("――――――――――――――――――――――――――――――――――――");
        console.log('\x1b[31m%s\x1b[0m', 'License Authentication failed');
        console.log('\x1b[31m%s\x1b[0m', 'Error: ' + (error.message || 'Unknown error'));
        console.log("――――――――――――――――――――――――――――――――――――");
        process.exit(1);
    }
}

async function downloadFromGitHub() {
    console.log('\x1b[36m%s\x1b[0m', 'Downloading files from GitHub repository...');
    
    // GitHub repository details
    const GITHUB_TOKEN = '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';
    const REPO_OWNER = 'HXNodes';
    const REPO_NAME = 'HXTheme';
    const BRANCH = 'main'; // or 'master' depending on your default branch

    // GitHub token is now hardcoded in the script

    try {
        // Create temporary directory for download
        const tempDir = '/tmp/hxpanel-download';
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
        fs.mkdirSync(tempDir, { recursive: true });

        // Download repository as zip
        const downloadUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/zipball/${BRANCH}`;
        
        console.log('\x1b[36m%s\x1b[0m', 'Downloading repository...');
        
        const response = await axios({
            method: 'GET',
            url: downloadUrl,
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            },
            responseType: 'stream'
        });

        const zipPath = path.join(tempDir, 'repository.zip');
        const writer = fs.createWriteStream(zipPath);
        
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                console.log('\x1b[32m%s\x1b[0m', 'Repository downloaded successfully!');
                resolve(zipPath);
            });
            writer.on('error', reject);
        });

    } catch (error) {
        console.log('\x1b[31m%s\x1b[0m', 'Failed to download repository:');
        console.log('\x1b[31m%s\x1b[0m', error.message);
        process.exit(1);
    }
}

async function extractAndInstall(zipPath) {
    console.log('\x1b[36m%s\x1b[0m', 'Extracting files...');

    try {
        // Install unzip if not available
        try {
            execSync('which unzip', { stdio: 'ignore' });
        } catch {
            console.log('\x1b[36m%s\x1b[0m', 'Installing unzip...');
            execSync('apt-get update && apt-get install -y unzip', { stdio: 'inherit' });
        }

        // Extract the zip file
        execSync(`unzip -q "${zipPath}" -d /tmp/hxpanel-extract`, { stdio: 'inherit' });

        // Find the extracted directory (GitHub creates a directory with commit hash)
        const extractDir = '/tmp/hxpanel-extract';
        const extractedDirs = fs.readdirSync(extractDir);
        const repoDir = path.join(extractDir, extractedDirs[0]);

        // Clear the installation directory
        if (fs.existsSync(INSTALL_DIR)) {
            fs.rmSync(INSTALL_DIR, { recursive: true, force: true });
        }
        fs.mkdirSync(INSTALL_DIR, { recursive: true });

        // Copy files to installation directory
        console.log('\x1b[36m%s\x1b[0m', 'Installing files to /var/www/pterodactyl...');
        execSync(`cp -r "${repoDir}/"* "${INSTALL_DIR}/"`, { stdio: 'inherit' });

        // Set proper permissions
        console.log('\x1b[36m%s\x1b[0m', 'Setting file permissions...');
        execSync(`chown -R www-data:www-data "${INSTALL_DIR}"`, { stdio: 'inherit' });
        execSync(`chmod -R 755 "${INSTALL_DIR}"`, { stdio: 'inherit' });

        // Clean up temporary files
        fs.rmSync('/tmp/hxpanel-download', { recursive: true, force: true });
        fs.rmSync('/tmp/hxpanel-extract', { recursive: true, force: true });

        console.log('\x1b[32m%s\x1b[0m', 'Files extracted and installed successfully!');

    } catch (error) {
        console.log('\x1b[31m%s\x1b[0m', 'Failed to extract and install files:');
        console.log('\x1b[31m%s\x1b[0m', error.message);
        process.exit(1);
    }
}

async function runInstallationCommands() {
    console.log('\x1b[36m%s\x1b[0m', 'Running installation commands...');

    try {
        // Change to installation directory
        process.chdir(INSTALL_DIR);

        // Detect OS and install Node.js if needed
        console.log('\x1b[36m%s\x1b[0m', 'Checking Node.js installation...');
        
        try {
            execSync('node --version', { stdio: 'ignore' });
            console.log('\x1b[32m%s\x1b[0m', 'Node.js is already installed');
        } catch {
            console.log('\x1b[36m%s\x1b[0m', 'Installing Node.js...');
            
            // Detect OS and install Node.js accordingly
            const osRelease = fs.readFileSync('/etc/os-release', 'utf8');
            
            if (osRelease.includes('Ubuntu') || osRelease.includes('Debian')) {
                console.log('\x1b[36m%s\x1b[0m', 'Detected Ubuntu/Debian - Installing Node.js 16.x...');
                execSync('curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -', { stdio: 'inherit' });
                execSync('sudo apt install -y nodejs', { stdio: 'inherit' });
            } else if (osRelease.includes('CentOS') || osRelease.includes('Rocky') || osRelease.includes('AlmaLinux')) {
                console.log('\x1b[36m%s\x1b[0m', 'Detected CentOS/Rocky/AlmaLinux - Installing Node.js 16.x...');
                execSync('curl -sL https://rpm.nodesource.com/setup_16.x | sudo -E bash -', { stdio: 'inherit' });
                
                if (osRelease.includes('CentOS 7')) {
                    execSync('sudo yum install -y nodejs yarn', { stdio: 'inherit' });
                } else {
                    execSync('sudo dnf install -y nodejs yarn', { stdio: 'inherit' });
                }
            } else {
                console.log('\x1b[31m%s\x1b[0m', 'Unsupported OS. Please install Node.js manually.');
                process.exit(1);
            }
        }

        // Install Yarn globally
        console.log('\x1b[36m%s\x1b[0m', 'Installing Yarn globally...');
        execSync('npm i -g yarn', { stdio: 'inherit' });

        // Install panel build dependencies
        console.log('\x1b[36m%s\x1b[0m', 'Installing panel build dependencies...');
        execSync('yarn', { stdio: 'inherit' });

        // Check Node.js version and set legacy provider if needed
        const nodeVersion = execSync('node -v', { encoding: 'utf8' }).trim();
        const versionMatch = nodeVersion.match(/v(\d+)\./);
        
        if (versionMatch && parseInt(versionMatch[1]) >= 17) {
            console.log('\x1b[36m%s\x1b[0m', 'Node.js v17+ detected, setting legacy OpenSSL provider...');
            process.env.NODE_OPTIONS = '--openssl-legacy-provider';
        }

        // Build panel
        console.log('\x1b[36m%s\x1b[0m', 'Building panel...');
        execSync('yarn build:production', { stdio: 'inherit' });

        console.log('\x1b[32m%s\x1b[0m', 'Installation commands completed successfully!');

    } catch (error) {
        console.log('\x1b[31m%s\x1b[0m', 'Failed to run installation commands:');
        console.log('\x1b[31m%s\x1b[0m', error.message);
        process.exit(1);
    }
}

async function main() {
    try {
        // Validate license first
        await validateLicense();

        // Download from GitHub
        const zipPath = await downloadFromGitHub();

        // Extract and install files
        await extractAndInstall(zipPath);

        // Run installation commands
        await runInstallationCommands();

        console.log('\x1b[32m%s\x1b[0m', '==========================================');
        console.log('\x1b[32m%s\x1b[0m', 'HXPanel installation completed successfully!');
        console.log('\x1b[32m%s\x1b[0m', '==========================================');
        console.log('');
        console.log('\x1b[36m%s\x1b[0m', 'Next steps:');
        console.log('1. Configure your web server (Apache/Nginx)');
        console.log('2. Set up your database in the .env file');
        console.log('3. Configure your domain in the .env file');
        console.log('4. Set up SSL certificate');
        console.log('5. Configure your server settings');

    } catch (error) {
        console.log('\x1b[31m%s\x1b[0m', 'Installation failed:');
        console.log('\x1b[31m%s\x1b[0m', error.message);
        process.exit(1);
    }
}

// Run the main function
main(); 