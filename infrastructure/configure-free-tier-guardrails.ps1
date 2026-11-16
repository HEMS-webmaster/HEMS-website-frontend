<#
.SYNOPSIS
    Configures Google Cloud Always-Free guardrails for HEMS: Artifact Registry 2-version
    cleanup on Cloud Functions containers (`gcf-artifacts`) and GCS bucket location/usage audit.

.DESCRIPTION
    Run as webmaster@hems-workshop.org after signing into gcloud (`gcloud auth login`):
      powershell -ExecutionPolicy Bypass -File infrastructure\configure-free-tier-guardrails.ps1
    Pass -DryRun to preview actions without modifying Artifact Registry policies.
#>

[CmdletBinding()]
param(
    [string]$ProjectId = "hems-workshop",
    [string]$Region = "us-central1",
    [string]$ArchiveBucket = "gs://hems-workshop-archives",
    [int]$KeepCount = 2,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

Write-Host "=== HEMS Cloud Always-Free Guardrails ($ProjectId) ===" -ForegroundColor Cyan

# Verify gcloud OAuth token first without attempting interactive login loops
$null = (& gcloud auth print-access-token 2>$null)
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Active gcloud OAuth session is expired or not signed in. Run 'gcloud auth login webmaster@hems-workshop.org' first."
    exit 1
}

# 1. Configure 2-version cleanup policy on Artifact Registry gcf-artifacts (< 500 MB free tier)
$policyFile = [System.IO.Path]::GetTempFileName()
try {
    $policyJson = @"
[
  {
    "name": "keep-latest-cloud-function-images",
    "action": { "type": "Keep" },
    "mostRecentVersions": {
      "keepCount": $KeepCount
    }
  },
  {
    "name": "delete-old-cloud-function-images",
    "action": { "type": "Delete" },
    "condition": {
      "olderThan": "7d"
    }
  }
]
"@
    Set-Content -Path $policyFile -Value $policyJson -Encoding UTF8

    Write-Host "`n1. Artifact Registry cleanup policy ($Region / gcf-artifacts, keepCount=$KeepCount):" -ForegroundColor Yellow
    if ($DryRun) {
        Write-Host "  [DryRun] Would run: gcloud artifacts repositories set-cleanup-policies gcf-artifacts --project=$ProjectId --location=$Region --policy=$policyFile --no-dry-run" -ForegroundColor Gray
    } else {
        & gcloud artifacts repositories list --project=$ProjectId --location=$Region 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            & gcloud artifacts repositories set-cleanup-policies gcf-artifacts `
                --project=$ProjectId `
                --location=$Region `
                --policy=$policyFile `
                --no-dry-run
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  Applied Artifact Registry cleanup policy successfully." -ForegroundColor Green
            }
        } else {
            Write-Host "  Artifact Registry repo gcf-artifacts not provisioned yet (no Cloud Functions v2 container images present)." -ForegroundColor Gray
        }
    }
} finally {
    if (Test-Path $policyFile) {
        Remove-Item $policyFile -Force
    }
}

# 2. Inspect GCS Proceedings Archive Bucket region, storage class, and size
Write-Host "`n2. Google Cloud Storage bucket check ($ArchiveBucket):" -ForegroundColor Yellow
if ($DryRun) {
    Write-Host "  [DryRun] Would inspect $ArchiveBucket location, storage class, and total size." -ForegroundColor Gray
} else {
    & gcloud storage buckets describe $ArchiveBucket --project=$ProjectId --format="table(name,location,storageClass)"
    & gcloud storage du -s -r $ArchiveBucket --readable-sizes
}

# 3. Grant bucket-scoped storage.admin IAM so budgetCircuitBreaker can revoke allUsers at >= $7.50
Write-Host "`n3. Bucket-scoped IAM for budgetCircuitBreaker ($ArchiveBucket):" -ForegroundColor Yellow
$projectNumber = (& gcloud projects describe $ProjectId --format="value(projectNumber)" 2>$null)
if (-not [string]::IsNullOrWhiteSpace($projectNumber)) {
    $projectNumber = $projectNumber.Trim()
    $serviceAccounts = @(
        "serviceAccount:${projectNumber}-compute@developer.gserviceaccount.com",
        "serviceAccount:${ProjectId}@appspot.gserviceaccount.com"
    )
    foreach ($sa in $serviceAccounts) {
        if ($DryRun) {
            Write-Host "  [DryRun] Would run: gcloud storage buckets add-iam-policy-binding $ArchiveBucket --member=$sa --role=roles/storage.admin" -ForegroundColor Gray
        } else {
            & gcloud storage buckets add-iam-policy-binding $ArchiveBucket --member=$sa --role="roles/storage.admin" --quiet 2>$null | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  Granted roles/storage.admin on $ArchiveBucket to $sa" -ForegroundColor Green
            } else {
                Write-Host "  Skipped unavailable service account: $sa" -ForegroundColor Gray
            }
        }
    }
} else {
    Write-Warning "  Could not resolve numeric project number for $ProjectId."
}

Write-Host "`nFree-tier guardrail audit complete." -ForegroundColor Cyan
