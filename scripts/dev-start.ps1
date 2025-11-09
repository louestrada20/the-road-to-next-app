#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Start development environment with all services

.DESCRIPTION
    Comprehensive development startup script that:
    - Runs pre-flight checks (type, lint)
    - Starts Docker PostgreSQL
    - Starts Next.js dev server
    - Starts Prisma Studio
    - Optionally starts Stripe CLI for webhook testing

.PARAMETER Mode
    Development mode: 'full' (with Stripe), 'lite' (without Stripe), or 'basic' (Next.js only)

.PARAMETER SkipChecks
    Skip pre-flight type and lint checks

.EXAMPLE
    .\scripts\dev-start.ps1 -Mode full
    Start full development environment with Stripe CLI

.EXAMPLE
    .\scripts\dev-start.ps1 -Mode lite
    Start lightweight environment without Stripe

.EXAMPLE
    .\scripts\dev-start.ps1 -Mode basic -SkipChecks
    Start basic Next.js dev server only, skip checks
#>

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('full', 'lite', 'basic')]
    [string]$Mode = 'lite',
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipChecks
)

# Color helpers
function Write-Success { param($Message) Write-Host $Message -ForegroundColor Green }
function Write-Info { param($Message) Write-Host $Message -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host $Message -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host $Message -ForegroundColor Red }

# Header
Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Blue
Write-Host "   Road to Next - Development Environment Setup" -ForegroundColor Blue
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Blue
Write-Host ""

# Pre-flight checks
if (-not $SkipChecks) {
    Write-Info "Running pre-flight checks..."
    Write-Host ""
    
    # Type check
    Write-Host "  Checking TypeScript..." -NoNewline
    try {
        $null = npm run type 2>&1
        Write-Success " ✓"
    } catch {
        Write-Error " ✗ Failed"
        Write-Warning "  Fix TypeScript errors before continuing"
        exit 1
    }
    
    # Lint check
    Write-Host "  Checking ESLint..." -NoNewline
    try {
        $null = npm run lint 2>&1
        Write-Success " ✓"
    } catch {
        Write-Error " ✗ Failed"
        Write-Warning "  Fix lint errors before continuing"
        exit 1
    }
    
    Write-Success "`n✅ Pre-flight checks passed!`n"
} else {
    Write-Warning "⚠️  Skipping pre-flight checks (use with caution)`n"
}

# Start Docker PostgreSQL
Write-Info "Starting Docker PostgreSQL..."
try {
    $output = docker-compose ps --format json 2>&1 | ConvertFrom-Json
    $postgres = $output | Where-Object { $_.Name -eq "road-to-next-postgres" }
    
    if ($postgres -and $postgres.State -eq "running") {
        Write-Success "✓ PostgreSQL already running`n"
    } else {
        Write-Host "  Starting container..."
        docker-compose up -d 2>&1 | Out-Null
        Start-Sleep -Seconds 3
        Write-Success "✓ PostgreSQL started`n"
    }
} catch {
    Write-Error "✗ Failed to start PostgreSQL"
    Write-Warning "  Make sure Docker Desktop is running"
    exit 1
}

# Display mode
Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Blue
switch ($Mode) {
    'full' { Write-Host "   MODE: FULL (Next.js + Prisma Studio + Stripe CLI)" -ForegroundColor Magenta }
    'lite' { Write-Host "   MODE: LITE (Next.js + Prisma Studio)" -ForegroundColor Yellow }
    'basic' { Write-Host "   MODE: BASIC (Next.js only)" -ForegroundColor Green }
}
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Blue
Write-Host ""

# Instructions
Write-Info "🚀 Starting services...`n"

if ($Mode -eq 'full') {
    Write-Host "Services starting:"
    Write-Host "  1. Next.js Dev Server  → http://localhost:3000" -ForegroundColor Green
    Write-Host "  2. Prisma Studio       → http://localhost:5555" -ForegroundColor Yellow
    Write-Host "  3. Stripe CLI          → Forwarding webhooks" -ForegroundColor Magenta
    Write-Host "  4. PostgreSQL          → localhost:5432" -ForegroundColor Blue
    Write-Host ""
    Write-Warning "⚠️  Keep this window open! Press Ctrl+C to stop all services.`n"
    
    # Start all services with concurrently
    npm run dev:full
} elseif ($Mode -eq 'lite') {
    Write-Host "Services starting:"
    Write-Host "  1. Next.js Dev Server  → http://localhost:3000" -ForegroundColor Green
    Write-Host "  2. Prisma Studio       → http://localhost:5555" -ForegroundColor Yellow
    Write-Host "  3. PostgreSQL          → localhost:5432" -ForegroundColor Blue
    Write-Host ""
    Write-Warning "⚠️  Keep this window open! Press Ctrl+C to stop all services.`n"
    
    # Start lite services
    npm run dev:lite
} else {
    Write-Host "Service starting:"
    Write-Host "  1. Next.js Dev Server  → http://localhost:3000" -ForegroundColor Green
    Write-Host ""
    Write-Info "💡 Tip: Use 'npm run dev:lite' for Prisma Studio`n"
    Write-Info "💡 Tip: Use 'npm run dev:full' for full Stripe testing`n"
    
    # Start basic dev server
    npm run dev
}

