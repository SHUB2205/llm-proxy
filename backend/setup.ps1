# Setup Script for LLM Observability Platform
# Run this ONCE to set up everything

Write-Host "🚀 LLM Observability Platform - Setup" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

# Step 1: Check Python
Write-Host "Step 1: Checking Python installation..." -ForegroundColor Cyan
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Python not found! Please install Python 3.8+" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Create virtual environment
Write-Host "Step 2: Creating virtual environment..." -ForegroundColor Cyan
if (Test-Path "venv-windows") {
    Write-Host "⚠️  Virtual environment already exists" -ForegroundColor Yellow
    $response = Read-Host "Do you want to recreate it? (y/n)"
    if ($response -eq "y") {
        Remove-Item -Recurse -Force venv-windows
        python -m venv venv-windows
        Write-Host "✅ Virtual environment recreated" -ForegroundColor Green
    } else {
        Write-Host "✅ Using existing virtual environment" -ForegroundColor Green
    }
} else {
    python -m venv venv-windows
    Write-Host "✅ Virtual environment created" -ForegroundColor Green
}

Write-Host ""

# Step 3: Activate virtual environment
Write-Host "Step 3: Activating virtual environment..." -ForegroundColor Cyan
.\venv-windows\Scripts\Activate.ps1
Write-Host "✅ Virtual environment activated" -ForegroundColor Green

Write-Host ""

# Step 4: Install dependencies
Write-Host "Step 4: Installing dependencies..." -ForegroundColor Cyan
pip install -r requirements.txt
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 5: Check .env file
Write-Host "Step 5: Checking .env configuration..." -ForegroundColor Cyan
if (Test-Path ".env") {
    Write-Host "✅ .env file found" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env file not found. Creating template..." -ForegroundColor Yellow
    
    # Generate encryption key
    $encryptionKey = python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    
    $envContent = @"
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key

# Encryption Key (generated)
ENCRYPTION_KEY=$encryptionKey

# Optional: OpenAI API Key (for testing)
OPENAI_API_KEY=sk-your-openai-key
"@
    
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✅ .env template created" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Edit .env file and add your Supabase credentials!" -ForegroundColor Yellow
    Write-Host "   1. Go to https://supabase.com" -ForegroundColor Yellow
    Write-Host "   2. Create a project" -ForegroundColor Yellow
    Write-Host "   3. Copy URL and anon key" -ForegroundColor Yellow
    Write-Host "   4. Update .env file" -ForegroundColor Yellow
}

Write-Host ""

# Step 6: Database setup reminder
Write-Host "Step 6: Database setup..." -ForegroundColor Cyan
Write-Host "⚠️  Don't forget to run the SQL schemas in Supabase!" -ForegroundColor Yellow
Write-Host "   1. Go to Supabase SQL Editor" -ForegroundColor Yellow
Write-Host "   2. Run schema.sql" -ForegroundColor Yellow
Write-Host "   3. Run schema_enterprise.sql" -ForegroundColor Yellow

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env file with your Supabase credentials" -ForegroundColor White
Write-Host "2. Run SQL schemas in Supabase" -ForegroundColor White
Write-Host "3. Run: .\run.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "- Quick Start: ..\QUICK_START.md" -ForegroundColor White
Write-Host "- Reliability Guide: ..\RELIABILITY_GUIDE.md" -ForegroundColor White
Write-Host "- API Docs: http://localhost:8000/docs (after starting)" -ForegroundColor White
Write-Host ""
