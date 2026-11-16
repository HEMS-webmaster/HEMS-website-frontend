<#
.SYNOPSIS
    Checks, pauses, restores, or Pub/Sub-tests the HEMS GCS proceedings archive circuit breaker.

.DESCRIPTION
    Usage (after `gcloud auth login webmaster@hems-workshop.org`):
      Check whether Google Scholar public access is active or paused:
        powershell -ExecutionPolicy Bypass -File infrastructure\manage-archive-circuit-breaker.ps1 -Action status

      Restore Google Scholar public PDF access after reviewing a billing spike:
        powershell -ExecutionPolicy Bypass -File infrastructure\manage-archive-circuit-breaker.ps1 -Action restore-public

      Manually pause public PDF access immediately:
        powershell -ExecutionPolicy Bypass -File infrastructure\manage-archive-circuit-breaker.ps1 -Action pause-public

      Send a safe $0.01 test heartbeat through billing-budget-alerts Pub/Sub:
        powershell -ExecutionPolicy Bypass -File infrastructure\manage-archive-circuit-breaker.ps1 -Action test-pubsub
#>

[CmdletBinding()]
param(
    [ValidateSet("status", "restore-public", "pause-public", "test-pubsub")]
    [string]$Action = "status",
    [string]$ProjectId = "hems-workshop",
    [string]$ArchiveBucket = "gs://hems-workshop-archives",
    [string]$Topic = "projects/hems-workshop/topics/billing-budget-alerts"
)

$ErrorActionPreference = "Stop"

$null = (& gcloud auth print-access-token 2>$null)
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Active gcloud OAuth session is expired or not signed in. Run 'gcloud auth login webmaster@hems-workshop.org' first."
    exit 1
}

switch ($Action) {
    "status" {
        Write-Host "=== GCS Archive Circuit Breaker Status ($ArchiveBucket) ===" -ForegroundColor Cyan
        $policyJson = & gcloud storage buckets get-iam-policy $ArchiveBucket --project=$ProjectId --format=json
        $policy = $policyJson | ConvertFrom-Json
        $publicMembers = @()
        foreach ($binding in ($policy.bindings | Where-Object { $_ -ne $null })) {
            foreach ($member in ($binding.members | Where-Object { $_ -eq "allUsers" -or $_ -eq "allAuthenticatedUsers" })) {
                $publicMembers += "$($binding.role) -> $member"
            }
        }
        if ($publicMembers.Count -gt 0) {
            Write-Host "STATUS: ACTIVE (Google Scholar & public PDF links enabled)" -ForegroundColor Green
            $publicMembers | ForEach-Object { Write-Host "  Binding: $_" -ForegroundColor Gray }
        } else {
            Write-Host "STATUS: PAUSED (Circuit breaker engaged or public access removed)" -ForegroundColor Yellow
            Write-Host "Run with -Action restore-public to re-enable Google Scholar access." -ForegroundColor Gray
        }
    }

    "restore-public" {
        Write-Host "Restoring public read access (allUsers -> roles/storage.objectViewer) on $ArchiveBucket..." -ForegroundColor Yellow
        & gcloud storage buckets add-iam-policy-binding $ArchiveBucket `
            --project=$ProjectId `
            --member="allUsers" `
            --role="roles/storage.objectViewer"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Public Google Scholar PDF access RESTORED on $ArchiveBucket." -ForegroundColor Green
            Write-Host "Reminder: Also clear or raise your monthly billing budget alert (or set HEMS_ARCHIVE_CUTOFF_USD higher) if actual spend is still >= `$7.50 for the current month." -ForegroundColor Gray
        }
    }

    "pause-public" {
        Write-Host "Pausing unauthenticated public access on $ArchiveBucket..." -ForegroundColor Yellow
        & gcloud storage buckets remove-iam-policy-binding $ArchiveBucket `
            --project=$ProjectId `
            --member="allUsers" `
            --role="roles/storage.objectViewer"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Public access PAUSED on $ArchiveBucket. Main website & registration remain online." -ForegroundColor Green
        }
    }

    "test-pubsub" {
        Write-Host "Publishing safe `$0.01 test heartbeat to $Topic..." -ForegroundColor Yellow
        $intervalStart = (Get-Date).ToUniversalTime().ToString("yyyy-MM-01T08:00:00Z")
        $payload = '{\"budgetDisplayName\":\"HEMS Test Heartbeat\",\"costAmount\":0.01,\"budgetAmount\":5.0,\"currencyCode\":\"USD\",\"costIntervalStart\":\"' + $intervalStart + '\"}'
        & gcloud pubsub topics publish $Topic --project=$ProjectId --message=$payload
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Published safe heartbeat. Verify execution in Firebase Logs or Firestore system_alerts/budget_circuit_breaker." -ForegroundColor Green
        }
    }
}
