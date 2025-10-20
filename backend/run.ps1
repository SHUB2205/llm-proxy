# Run Script for LLM Observability Platform
# This script starts the server with all features enabled

Write-Host "🚀 Starting LLM Observability Platform..." -ForegroundColor Green
Write-Host ""

# Check if virtual environment is activated
if ($env:VIRTUAL_ENV) {
    Write-Host "✅ Virtual environment is active" -ForegroundColor Green
} else {
    Write-Host "⚠️  Virtual environment not active. Activating..." -ForegroundColor Yellow
    if (Test-Path ".\venv-windows\Scripts\Activate.ps1") {
        .\venv-windows\Scripts\Activate.ps1
        Write-Host "✅ Virtual environment activated" -ForegroundColor Green
    } else {
        Write-Host "❌ Virtual environment not found. Please create one first:" -ForegroundColor Red
        Write-Host "   python -m venv venv-windows" -ForegroundColor Yellow
        Write-Host "   .\venv-windows\Scripts\Activate.ps1" -ForegroundColor Yellow
        Write-Host "   pip install -r requirements.txt" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""

# Check if .env file exists
if (Test-Path ".env") {
    Write-Host "✅ .env file found" -ForegroundColor Green
} else {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "   Please create .env file with:" -ForegroundColor Yellow
    Write-Host "   SUPABASE_URL=your-url" -ForegroundColor Yellow
    Write-Host "   SUPABASE_KEY=your-key" -ForegroundColor Yellow
    Write-Host "   ENCRYPTION_KEY=your-encryption-key" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🔧 Checking dependencies..." -ForegroundColor Cyan

# Check if main dependencies are installed
$dependencies = @("fastapi", "uvicorn", "supabase", "httpx", "cryptography")
$missing = @()

foreach ($dep in $dependencies) {
    $result = pip show $dep 2>$null
    if ($LASTEXITCODE -ne 0) {
        $missing += $dep
    }
}

if ($missing.Count -gt 0) {
    Write-Host "❌ Missing dependencies: $($missing -join ', ')" -ForegroundColor Red
    Write-Host "   Installing..." -ForegroundColor Yellow
    pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✅ All dependencies installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "🌐 Starting server on http://localhost:8000" -ForegroundColor Cyan
Write-Host "📚 API Documentation: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the server
python main.py
