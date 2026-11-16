<#
.SYNOPSIS
    Manages unlisted Firebase Hosting Preview Channels for HEMS Board Reviews without touching live hems-workshop.org.

.DESCRIPTION
    Because .github/workflows/firebase-hosting-merge.yml auto-deploys every push to `origin/main` live,
    use this script to stage updates cleanly on an unlisted preview URL (e.g., https://hems-workshop--board-review-<hash>.web.app),
    atomically promote the approved build to live, or roll back in seconds.

    Examples:
      Deploy preview channel using local branch code:
        powershell -ExecutionPolicy Bypass -File infrastructure\manage-board-preview.ps1 -Action deploy

      Deploy preview freezing local upcoming_workshop.json (without live Google Sheet override):
        powershell -ExecutionPolicy Bypass -File infrastructure\manage-board-preview.ps1 -Action deploy -UseLocalWorkshopJson

      Atomically promote approved preview build to live (saves pre-promote-backup first):
        powershell -ExecutionPolicy Bypass -File infrastructure\manage-board-preview.ps1 -Action promote

      Roll back live site to pre-promote-backup:
        powershell -ExecutionPolicy Bypass -File infrastructure\manage-board-preview.ps1 -Action rollback

      List active preview channels or delete after review:
        powershell -ExecutionPolicy Bypass -File infrastructure\manage-board-preview.ps1 -Action list
        powershell -ExecutionPolicy Bypass -File infrastructure\manage-board-preview.ps1 -Action delete
#>

[CmdletBinding()]
param(
    [ValidateSet("deploy", "promote", "rollback", "list", "delete")]
    [string]$Action = "deploy",
    [string]$Channel = "board-review",
    [string]$Expires = "14d",
    [string]$ProjectId = "hems-workshop",
    [switch]$SkipBuild,
    [switch]$UseLocalWorkshopJson,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $RepoRoot

function Assert-CleanChannelName([string]$name) {
    if ($name -notmatch '^[a-z0-9][a-z0-9-]{1,40}$') {
        throw "Invalid preview channel name '$name'. Use lowercase letters, numbers, and hyphens only."
    }
    if ($name -eq "live") {
        throw "Channel cannot be named 'live' directly. Use -Action promote to update live safely."
    }
}

try {
    Assert-CleanChannelName $Channel

    switch ($Action) {
        "deploy" {
            Write-Host "=== HEMS Board Review Preview Deploy ($Channel, expires $Expires) ===" -ForegroundColor Cyan

            $gitBranch = (& git rev-parse --abbrev-ref HEAD 2>$null)
            if ($gitBranch -and $gitBranch.Trim() -eq "main") {
                Write-Warning "You are on branch 'main'. Keep unapproved changes local only -- 'git push origin main' auto-deploys to live hems-workshop.org!"
            } else {
                Write-Host "Git branch: $($gitBranch.Trim()) (isolated from main auto-deploy)" -ForegroundColor Green
            }

            if ($DryRun) {
                if (-not $SkipBuild) {
                    if ($UseLocalWorkshopJson) {
                        Write-Host "  [DryRun] Would set NEXT_PUBLIC_DISABLE_LIVE_SHEET_SYNC=true and run: npm --prefix src/frontend run build" -ForegroundColor Gray
                    } else {
                        Write-Host "  [DryRun] Would run: npm --prefix src/frontend run build" -ForegroundColor Gray
                    }
                }
                Write-Host "  [DryRun] Would run: npx firebase hosting:channel:deploy $Channel --project $ProjectId --expires $Expires" -ForegroundColor Gray
                return
            }

            if (-not $SkipBuild) {
                $prevDisableSync = $env:NEXT_PUBLIC_DISABLE_LIVE_SHEET_SYNC
                try {
                    if ($UseLocalWorkshopJson) {
                        $env:NEXT_PUBLIC_DISABLE_LIVE_SHEET_SYNC = "true"
                        Write-Host "Static Workshop Snapshot Mode ENABLED (NEXT_PUBLIC_DISABLE_LIVE_SHEET_SYNC=true) for upcoming_workshop.json staging." -ForegroundColor Yellow
                    }
                    Write-Host "`n1. Building static export (src/frontend/out)..." -ForegroundColor Yellow
                    & npm --prefix src/frontend run build
                    if ($LASTEXITCODE -ne 0) {
                        throw "Frontend static production build failed."
                    }
                } finally {
                    if ($null -eq $prevDisableSync) {
                        Remove-Item Env:NEXT_PUBLIC_DISABLE_LIVE_SHEET_SYNC -ErrorAction SilentlyContinue
                    } else {
                        $env:NEXT_PUBLIC_DISABLE_LIVE_SHEET_SYNC = $prevDisableSync
                    }
                }
            }

            Write-Host "`n2. Publishing unlisted Firebase Hosting Preview Channel '$Channel'..." -ForegroundColor Yellow
            & npx firebase hosting:channel:deploy $Channel --project $ProjectId --expires $Expires
            if ($LASTEXITCODE -ne 0) {
                throw "Preview channel deploy failed. If authentication expired, run 'npx firebase login --reauth' first."
            }

            Write-Host "`n=== Board Review Link Ready ===" -ForegroundColor Green
            Write-Host "  Live site impact : ZERO (hems-workshop.org unchanged)" -ForegroundColor Gray
            Write-Host "  Analytics impact : ZERO (GA4 & telemetry auto-disabled on *--*.web.app preview URLs)" -ForegroundColor Gray
            Write-Host "  Google Sheet tip : Append ?sheet=static to any preview URL to test committed upcoming_workshop.json instead of live Sheet CSV" -ForegroundColor Gray
            Write-Host "  When approved    : powershell -ExecutionPolicy Bypass -File infrastructure\manage-board-preview.ps1 -Action promote -Channel $Channel" -ForegroundColor Gray
            Write-Host "  When finished    : powershell -ExecutionPolicy Bypass -File infrastructure\manage-board-preview.ps1 -Action delete -Channel $Channel" -ForegroundColor Gray
        }

        "promote" {
            Write-Host "=== Atomically Promoting Preview '$Channel' -> Live ($ProjectId) ===" -ForegroundColor Cyan
            if ($DryRun) {
                Write-Host "  [DryRun] Step 1 backup  : npx firebase hosting:clone ${ProjectId}:live ${ProjectId}:pre-promote-backup" -ForegroundColor Gray
                Write-Host "  [DryRun] Step 2 promote : npx firebase hosting:clone ${ProjectId}:$Channel ${ProjectId}:live" -ForegroundColor Gray
                return
            }

            Write-Host "1. Creating pre-promote safety snapshot ('pre-promote-backup')..." -ForegroundColor Yellow
            & npx firebase hosting:clone "${ProjectId}:live" "${ProjectId}:pre-promote-backup"
            if ($LASTEXITCODE -ne 0) {
                throw "Failed to snapshot current live site to pre-promote-backup. Aborting promotion."
            }

            Write-Host "2. Cloning approved '$Channel' artifact directly to live..." -ForegroundColor Yellow
            & npx firebase hosting:clone "${ProjectId}:$Channel" "${ProjectId}:live"
            if ($LASTEXITCODE -ne 0) {
                throw "Failed to promote channel '$Channel' to live."
            }

            Write-Host "`nPromotion complete! hems-workshop.org now serves the Board-approved build." -ForegroundColor Green
            Write-Host "Reminder: Commit/merge your reviewed branch into 'main' so GitHub Actions stays in sync, and run '-Action delete -Channel $Channel' to clean up." -ForegroundColor Gray
            Write-Host "Emergency rollback: powershell -ExecutionPolicy Bypass -File infrastructure\manage-board-preview.ps1 -Action rollback" -ForegroundColor Gray
        }

        "rollback" {
            Write-Host "=== Rolling Back Live Site from 'pre-promote-backup' ===" -ForegroundColor Yellow
            if ($DryRun) {
                Write-Host "  [DryRun] Would run: npx firebase hosting:clone ${ProjectId}:pre-promote-backup ${ProjectId}:live" -ForegroundColor Gray
                return
            }
            & npx firebase hosting:clone "${ProjectId}:pre-promote-backup" "${ProjectId}:live"
            if ($LASTEXITCODE -ne 0) {
                throw "Rollback failed. Verify 'pre-promote-backup' exists with '-Action list'."
            }
            Write-Host "Live site rolled back to pre-promote-backup." -ForegroundColor Green
        }

        "list" {
            Write-Host "=== Active Firebase Hosting Preview Channels ($ProjectId) ===" -ForegroundColor Cyan
            if ($DryRun) {
                Write-Host "  [DryRun] Would run: npx firebase hosting:channel:list --project $ProjectId" -ForegroundColor Gray
                return
            }
            & npx firebase hosting:channel:list --project $ProjectId
        }

        "delete" {
            Write-Host "=== Deleting Preview Channel '$Channel' ($ProjectId) ===" -ForegroundColor Yellow
            if ($DryRun) {
                Write-Host "  [DryRun] Would run: npx firebase hosting:channel:delete $Channel --project $ProjectId --force" -ForegroundColor Gray
                return
            }
            & npx firebase hosting:channel:delete $Channel --project $ProjectId --force
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Preview channel '$Channel' deleted." -ForegroundColor Green
            }
        }
    }
} finally {
    Pop-Location
}
