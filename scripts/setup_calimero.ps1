# Setup script for Calimero on Windows
Write-Host "🚀 Setting up Calimero for Privacy-Preserving Voting System..." -ForegroundColor Green

# Check if Rust is installed (required for building from source)
if (!(Get-Command rustc -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Rust (required for Calimero)..." -ForegroundColor Yellow
    Invoke-WebRequest https://win.rustup.rs/x86_64 -OutFile rustup-init.exe
    .\rustup-init.exe -y
    Remove-Item rustup-init.exe
}

# Update Rust
Write-Host "Updating Rust..." -ForegroundColor Yellow
rustup update

# Clone Calimero repository
Write-Host "Cloning Calimero repository..." -ForegroundColor Yellow
$calimeroPath = "calimero-core"
if (!(Test-Path $calimeroPath)) {
    git clone https://github.com/calimero-network/core.git $calimeroPath
}

# Build Calimero
Write-Host "Building Calimero from source..." -ForegroundColor Yellow
Set-Location $calimeroPath
cargo build -p merod --release

# Initialize Calimero node
Write-Host "Initializing Calimero node..." -ForegroundColor Yellow
$nodeName = $env:CALIMERO_NODE_NAME
$serverPort = $env:CALIMERO_SERVER_PORT
$swarmPort = $env:CALIMERO_SWARM_PORT
$protocol = $env:CALIMERO_PROTOCOL

if (!$nodeName) { $nodeName = "node1" }
if (!$serverPort) { $serverPort = "2428" }
if (!$swarmPort) { $swarmPort = "2528" }
if (!$protocol) { $protocol = "starknet" }

cargo run -p merod -- --node-name $nodeName init --server-port $serverPort --swarm-port $swarmPort --protocol $protocol

Write-Host "
✅ Calimero setup completed!

To start your Calimero node:
1. Navigate to the calimero-core directory:
   cd $calimeroPath

2. Run the node:
   cargo run -p merod -- --node-name $nodeName run

Your node will be available at:
- HTTP: http://localhost:$serverPort
- P2P: localhost:$swarmPort

For more information, visit: https://docs.calimero.network/
" -ForegroundColor Green
