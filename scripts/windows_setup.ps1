# Windows Setup Script for Privacy-Preserving Voting System

Write-Host "🚀 Setting up development environment for Privacy-Preserving Voting System..." -ForegroundColor Green

# Check if Rust is installed
if (!(Get-Command rustc -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Rust..." -ForegroundColor Yellow
    Invoke-WebRequest https://win.rustup.rs/x86_64 -OutFile rustup-init.exe
    .\rustup-init.exe -y
    Remove-Item rustup-init.exe
}

# Install Starkli
Write-Host "Installing Starkli..." -ForegroundColor Yellow
cargo install --locked --git https://github.com/xJonathanLEI/starkli

# Verify Starkli installation
starkli --version

# Create Starkli wallet directories
Write-Host "Setting up Starkli wallet directories..." -ForegroundColor Yellow
$walletPath = "$env:USERPROFILE\.starkli-wallets\deployer"
New-Item -ItemType Directory -Force -Path $walletPath

# Install Scarb
Write-Host "Please install Scarb manually from: https://docs.swmansion.com/scarb/download.html" -ForegroundColor Yellow
Write-Host "After installing Scarb, press Enter to continue..."
Read-Host

# Verify Scarb installation
scarb --version

# Setup environment variables
Write-Host "Setting up environment variables..." -ForegroundColor Yellow
$envFile = ".env"
if (!(Test-Path $envFile)) {
    Copy-Item ".env.example" $envFile
    Write-Host "Created .env file. Please fill in your configuration values." -ForegroundColor Yellow
}

# Install Node.js dependencies
Write-Host "Installing Node.js dependencies..." -ForegroundColor Yellow
npm install

Write-Host "
✅ Setup completed! Next steps:

1. Set up your Starknet account:
   starkli account fetch <YOUR_WALLET_ADDRESS> --output ~/.starkli-wallets/deployer/account.json

2. Create your keystore:
   starkli signer keystore from-key ~/.starkli-wallets/deployer/keystore.json

3. Set environment variables in .env:
   STARKNET_ACCOUNT=~/.starkli-wallets/deployer/account.json
   STARKNET_KEYSTORE=~/.starkli-wallets/deployer/keystore.json

4. Build the project:
   scarb build

5. Start development:
   npm run dev
" -ForegroundColor Green
