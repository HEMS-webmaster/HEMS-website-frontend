<#
.SYNOPSIS
    Pre-authorizes hems-workshop.org in Firebase Auth, pre-registers custom domains in Firebase Hosting,
    and optionally stages the Google Cloud DNS public zone without disturbing live GoDaddy DNS.

.DESCRIPTION
    Run interactively from the repository root when webmaster@hems-workshop.org needs OAuth re-authentication:
      powershell -ExecutionPolicy Bypass -File infrastructure\preauth-domain.ps1
    Use -DryRun to preview every API endpoint and DNS record without making cloud changes.
    Use -SkipCloudDns to only configure Firebase Auth + Firebase Hosting custom domains.
#>

[CmdletBinding()]
param(
    [string]$ProjectId = "hems-workshop",
    [string]$SiteId = "hems-workshop",
    [string]$Account = "webmaster@hems-workshop.org",
    [string]$ZoneName = "hems-workshop-org",
    [string]$RootDomain = "hems-workshop.org",
    [string]$PrimaryHost = "www.hems-workshop.org",
    [switch]$DryRun,
    [switch]$SkipCloudDns
)

$ErrorActionPreference = "Stop"

function Write-Section([string]$Title) {
    Write-Host ""
    Write-Host "=== $Title ===" -ForegroundColor Cyan
}

function Get-ValidAccessToken {
    param([string]$TargetAccount, [string]$TargetProject)

    # Prefer active firebase-tools OAuth session (automatically refreshed on CLI invocation)
    $firebaseCfgPath = Join-Path $HOME ".config\configstore\firebase-tools.json"
    if (Get-Command firebase -ErrorAction SilentlyContinue) {
        try {
            & firebase hosting:sites:list --project $TargetProject 2>$null | Out-Null
        } catch {
            # Ignore CLI check error and inspect cached/fallback tokens below
        }
    }

    if (Test-Path $firebaseCfgPath) {
        try {
            $cfg = Get-Content -Raw $firebaseCfgPath | ConvertFrom-Json
            if ($cfg.tokens -and -not [string]::IsNullOrWhiteSpace($cfg.tokens.access_token)) {
                $sessionEmail = if ($cfg.user -and $cfg.user.email) { $cfg.user.email } else { $TargetAccount }
                Write-Host "Using authenticated firebase-tools OAuth session ($sessionEmail)." -ForegroundColor Cyan
                return $cfg.tokens.access_token.Trim()
            }
        } catch {
            Write-Host "Could not parse firebase-tools OAuth config; falling back to gcloud..." -ForegroundColor Yellow
        }
    }

    & gcloud config set account $TargetAccount 2>$null | Out-Null
    & gcloud config set project $TargetProject 2>$null | Out-Null

    $token = (& gcloud auth print-access-token --account=$TargetAccount 2>$null)
    if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($token)) {
        return $token.Trim()
    }

    Write-Host "Cached OAuth token expired for $TargetAccount. Opening browser sign-in..." -ForegroundColor Yellow
    & gcloud auth login $TargetAccount
    if ($LASTEXITCODE -ne 0) {
        throw "gcloud auth login failed for $TargetAccount."
    }

    $token = (& gcloud auth print-access-token --account=$TargetAccount)
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($token)) {
        throw "Unable to obtain a valid OAuth access token after gcloud auth login."
    }
    return $token.Trim()
}

function Invoke-GoogleJsonApi {
    param(
        [string]$Method,
        [string]$Uri,
        [string]$AccessToken,
        [string]$ProjectHeader,
        [object]$Body = $null
    )

    $headers = @{
        "Authorization"       = "Bearer $AccessToken"
        "x-goog-user-project" = $ProjectHeader
        "Accept"              = "application/json"
    }

    if ($null -ne $Body) {
        $json = $Body | ConvertTo-Json -Depth 10
        return Invoke-RestMethod -Method $Method -Uri $Uri -Headers $headers -ContentType "application/json" -Body $json
    }
    return Invoke-RestMethod -Method $Method -Uri $Uri -Headers $headers
}

function Get-HttpStatusCodeFromError {
    param($ErrRecord)
    try {
        if ($ErrRecord.Exception.Response -and $ErrRecord.Exception.Response.StatusCode) {
            return [int]$ErrRecord.Exception.Response.StatusCode
        }
    } catch {}
    return 0
}

function Get-ApiErrorBody {
    param($ErrRecord)
    try {
        if ($ErrRecord.ErrorDetails -and -not [string]::IsNullOrWhiteSpace($ErrRecord.ErrorDetails.Message)) {
            return $ErrRecord.ErrorDetails.Message
        }
        if ($ErrRecord.Exception.Response) {
            $stream = $ErrRecord.Exception.Response.GetResponseStream()
            if ($stream) {
                $reader = New-Object System.IO.StreamReader($stream)
                return $reader.ReadToEnd()
            }
        }
    } catch {}
    return [string]$ErrRecord
}

Write-Section "HEMS Domain Pre-Authorization ($PrimaryHost / $RootDomain)"
Write-Host "Project: $ProjectId | Hosting Site: $SiteId | Account: $Account | DryRun: $DryRun"

$defaultTxtVerification = "hosting-site=$SiteId"
$defaultAnycastIp = "199.36.158.100"

if ($DryRun) {
    Write-Section "Dry-Run Preview (Zero Cloud Mutations)"
    Write-Host "[1] Auth Token Check: firebase-tools OAuth (~/.config/configstore/firebase-tools.json) via firebase hosting:sites:list (fallback: gcloud auth)"
    Write-Host "[2] Firebase Auth (GET/PATCH https://identitytoolkit.googleapis.com/admin/v2/projects/$ProjectId/config?updateMask=authorizedDomains):"
    Write-Host "    Ensure authorizedDomains includes: $PrimaryHost, $RootDomain"
    Write-Host "[3] Firebase Hosting Custom Domains (https://firebasehosting.googleapis.com/v1beta1/projects/$ProjectId/sites/$SiteId/customDomains):"
    Write-Host "    Register primary host : $PrimaryHost (redirectTarget: none)"
    Write-Host "    Register apex redirect: $RootDomain (redirectTarget: $PrimaryHost)"
    if (-not $SkipCloudDns) {
        Write-Host "[4] Google Cloud DNS Stage (Zone: $ZoneName, DNS: $RootDomain., DNSSEC: off via atomic REST changes API):"
        Write-Host "    $RootDomain.                  A     300   $defaultAnycastIp"
        Write-Host "    $PrimaryHost.              CNAME 300   $SiteId.web.app."
        Write-Host "    $RootDomain.                  MX    3600  1 smtp.google.com."
        Write-Host "    $RootDomain.                  TXT   300   `"google-site-verification=FsDtU72CA50Yr3tK7g1ZbNYwSiGKqXng0LU3MIijH5Y`", `"$defaultTxtVerification`", `"v=spf1 include:_spf.google.com ~all`""
        Write-Host "    pm-bounces.mail.$RootDomain.  CNAME 3600  pm.mtasv.net."
        Write-Host "    _dmarc.$RootDomain.           TXT   3600  `"v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc-reports@$RootDomain; adkim=r; aspf=r;`""
        Write-Host "    Note: Live GoDaddy NS/DNS stays completely unchanged until you switch nameservers after Board sign-off."
    } else {
        Write-Host "[4] Google Cloud DNS skipped (-SkipCloudDns)."
    }
    Write-Host "`nDry-run completed cleanly." -ForegroundColor Green
    exit 0
}

# 1. Authenticate
Write-Section "1. Verifying Google / Firebase OAuth Credentials"
$accessToken = Get-ValidAccessToken -TargetAccount $Account -TargetProject $ProjectId
Write-Host "Authenticated successfully as $Account." -ForegroundColor Green

# 2. Firebase Auth Authorized Domains
Write-Section "2. Pre-Authorizing Domains in Firebase Authentication"
$authConfigUri = "https://identitytoolkit.googleapis.com/admin/v2/projects/$ProjectId/config"
$authConfig = Invoke-GoogleJsonApi -Method "GET" -Uri $authConfigUri -AccessToken $accessToken -ProjectHeader $ProjectId
$currentDomains = @()
if ($authConfig.authorizedDomains) {
    $currentDomains = @($authConfig.authorizedDomains)
}

$neededDomains = @($PrimaryHost, $RootDomain)
$missingDomains = @($neededDomains | Where-Object { $currentDomains -notcontains $_ })

if ($missingDomains.Count -gt 0) {
    $updatedDomains = @($currentDomains + $missingDomains | Select-Object -Unique)
    $patchUri = "$authConfigUri`?updateMask=authorizedDomains"
    $null = Invoke-GoogleJsonApi -Method "PATCH" -Uri $patchUri -AccessToken $accessToken -ProjectHeader $ProjectId -Body @{
        authorizedDomains = @($updatedDomains)
    }
    Write-Host "Added to Firebase Auth authorizedDomains: $($missingDomains -join ', ')" -ForegroundColor Green
} else {
    Write-Host "Firebase Auth already authorizes $PrimaryHost and $RootDomain." -ForegroundColor Green
}

# 3. Firebase Hosting Custom Domains
Write-Section "3. Pre-Registering Custom Domains in Firebase Hosting"
$hostingBase = "https://firebasehosting.googleapis.com/v1beta1/projects/$ProjectId/sites/$SiteId/customDomains"

function Register-HostingCustomDomain {
    param([string]$DomainName, [string]$RedirectTo = "")
    $itemUri = "$hostingBase/$DomainName"
    try {
        $existing = Invoke-GoogleJsonApi -Method "GET" -Uri $itemUri -AccessToken $accessToken -ProjectHeader $ProjectId
        Write-Host "  Found existing Firebase Hosting domain entry: $DomainName (certState: $($existing.cert.state), hostState: $($existing.hostState))" -ForegroundColor Gray
        return $existing
    } catch {
        $statusCode = Get-HttpStatusCodeFromError $_
        if ($statusCode -ne 404) {
            throw
        }
        $createUri = "$hostingBase`?customDomainId=$DomainName"
        $payload = @{}
        if (-not [string]::IsNullOrWhiteSpace($RedirectTo)) {
            $payload.redirectTarget = $RedirectTo
        }
        $null = Invoke-GoogleJsonApi -Method "POST" -Uri $createUri -AccessToken $accessToken -ProjectHeader $ProjectId -Body $payload
        $fetched = Invoke-GoogleJsonApi -Method "GET" -Uri $itemUri -AccessToken $accessToken -ProjectHeader $ProjectId
        Write-Host "  Pre-registered Firebase Hosting domain: $DomainName (certState: $($fetched.cert.state), hostState: $($fetched.hostState))" -ForegroundColor Green
        return $fetched
    }
}

$wwwDomainObj = Register-HostingCustomDomain -DomainName $PrimaryHost
$apexDomainObj = Register-HostingCustomDomain -DomainName $RootDomain -RedirectTo $PrimaryHost

$resolvedAnycastIp = $defaultAnycastIp
$resolvedTxtVerification = $defaultTxtVerification

foreach ($dom in @($wwwDomainObj, $apexDomainObj)) {
    if ($dom.requiredDnsUpdates -and $dom.requiredDnsUpdates.desired) {
        foreach ($set in @($dom.requiredDnsUpdates.desired)) {
            $recs = if ($set.records) { @($set.records) } else { @($set) }
            foreach ($rec in $recs) {
                $recHost = if ($rec.domainName) { $rec.domainName } else { $set.domainName }
                if ($rec.type -and $rec.rdata) {
                    Write-Host "  Required DNS Record -> $recHost [$($rec.type)] $($rec.rdata)" -ForegroundColor Gray
                }
                if ($rec.type -eq "A" -and $rec.rdata) {
                    $resolvedAnycastIp = $rec.rdata
                }
                if ($rec.type -eq "TXT" -and $rec.rdata -like "hosting-site=*") {
                    $resolvedTxtVerification = $rec.rdata
                }
            }
        }
    }
}

Write-Host "Detected Firebase Hosting DNS targets -> A IP: $resolvedAnycastIp | TXT: $resolvedTxtVerification" -ForegroundColor Cyan

if ($SkipCloudDns) {
    Write-Host "`nSkipped Google Cloud DNS staging (-SkipCloudDns)." -ForegroundColor Yellow
    exit 0
}

# 4. Stage Public Zone in Google Cloud DNS
Write-Section "4. Staging Public Zone '$ZoneName' in Google Cloud DNS (Zero Live Impact)"
$dnsServiceUri = "https://serviceusage.googleapis.com/v1/projects/$ProjectId/services/dns.googleapis.com"
$dnsSvc = Invoke-GoogleJsonApi -Method "GET" -Uri $dnsServiceUri -AccessToken $accessToken -ProjectHeader $ProjectId
if ($dnsSvc.state -ne "ENABLED") {
    Write-Host "Enabling Cloud DNS API (dns.googleapis.com) via Service Usage REST API..." -ForegroundColor Yellow
    $null = Invoke-GoogleJsonApi -Method "POST" -Uri "$dnsServiceUri`:enable" -AccessToken $accessToken -ProjectHeader $ProjectId -Body @{}
} else {
    Write-Host "Cloud DNS API (dns.googleapis.com) is ENABLED." -ForegroundColor Gray
}

try {
    $zoneUri = "https://dns.googleapis.com/dns/v1/projects/$ProjectId/managedZones/$ZoneName"
    $zoneObj = $null
    try {
        $zoneObj = Invoke-GoogleJsonApi -Method "GET" -Uri $zoneUri -AccessToken $accessToken -ProjectHeader $ProjectId
        Write-Host "Cloud DNS zone $ZoneName already exists." -ForegroundColor Gray
    } catch {
        $statusCode = Get-HttpStatusCodeFromError $_
        if ($statusCode -ne 404) {
            throw
        }
        Write-Host "Creating public Cloud DNS zone $ZoneName ($RootDomain.) with DNSSEC off..." -ForegroundColor Green
        $zoneCreateUri = "https://dns.googleapis.com/dns/v1/projects/$ProjectId/managedZones"
        $zoneObj = Invoke-GoogleJsonApi -Method "POST" -Uri $zoneCreateUri -AccessToken $accessToken -ProjectHeader $ProjectId -Body @{
            name         = $ZoneName
            dnsName      = "$RootDomain."
            description  = "HEMS Society Production DNS"
            visibility   = "public"
            dnssecConfig = @{ state = "off" }
        }
    }

    $rrsetsResp = Invoke-GoogleJsonApi -Method "GET" -Uri "$zoneUri/rrsets" -AccessToken $accessToken -ProjectHeader $ProjectId
    $existingRrsets = @()
    if ($rrsetsResp.rrsets) {
        $existingRrsets = @($rrsetsResp.rrsets)
    }

    $desiredRrsets = @(
        @{
            name    = "$RootDomain."
            type    = "A"
            ttl     = 300
            rrdatas = @($resolvedAnycastIp)
        },
        @{
            name    = "$PrimaryHost."
            type    = "CNAME"
            ttl     = 300
            rrdatas = @("$SiteId.web.app.")
        },
        @{
            name    = "$RootDomain."
            type    = "MX"
            ttl     = 3600
            rrdatas = @("1 smtp.google.com.")
        },
        @{
            name    = "$RootDomain."
            type    = "TXT"
            ttl     = 300
            rrdatas = @(
                '"google-site-verification=FsDtU72CA50Yr3tK7g1ZbNYwSiGKqXng0LU3MIijH5Y"',
                "`"$resolvedTxtVerification`"",
                '"v=spf1 include:_spf.google.com ~all"'
            )
        },
        @{
            name    = "pm-bounces.mail.$RootDomain."
            type    = "CNAME"
            ttl     = 3600
            rrdatas = @("pm.mtasv.net.")
        },
        @{
            name    = "_dmarc.$RootDomain."
            type    = "TXT"
            ttl     = 3600
            rrdatas = @("`"v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc-reports@$RootDomain; adkim=r; aspf=r;`"")
        }
    )

    $deletions = New-Object System.Collections.ArrayList
    $additions = New-Object System.Collections.ArrayList

    foreach ($want in $desiredRrsets) {
        $existing = $existingRrsets | Where-Object { $_.name -eq $want.name -and $_.type -eq $want.type } | Select-Object -First 1
        $wantSorted = (($want.rrdatas | Sort-Object) -join "`n")
        if ($existing) {
            $existSorted = ((@($existing.rrdatas) | Sort-Object) -join "`n")
            if ($existing.ttl -eq $want.ttl -and $existSorted -eq $wantSorted) {
                Write-Host "  Unchanged: $($want.type) $($want.name)" -ForegroundColor Gray
                continue
            }
            [void]$deletions.Add(@{
                name    = $existing.name
                type    = $existing.type
                ttl     = [int]$existing.ttl
                rrdatas = @($existing.rrdatas)
            })
            [void]$additions.Add($want)
            Write-Host "  Staged update: $($want.type) $($want.name)" -ForegroundColor Yellow
        } else {
            [void]$additions.Add($want)
            Write-Host "  Staged create: $($want.type) $($want.name)" -ForegroundColor Green
        }
    }

    if ($additions.Count -gt 0 -or $deletions.Count -gt 0) {
        $changePayload = @{
            kind      = "dns#change"
            additions = @($additions.ToArray())
            deletions = @($deletions.ToArray())
        }
        $null = Invoke-GoogleJsonApi -Method "POST" -Uri "$zoneUri/changes" -AccessToken $accessToken -ProjectHeader $ProjectId -Body $changePayload
        Write-Host "Applied atomic Google Cloud DNS zone change set." -ForegroundColor Green
    } else {
        Write-Host "All 6 target DNS record sets in $ZoneName are already up to date." -ForegroundColor Green
    }

    $nsList = @()
    if ($zoneObj.nameServers) {
        $nsList = @($zoneObj.nameServers)
    }

    Write-Section "Assigned Google Cloud DNS Nameservers (Ready When Board Approves Cutover)"
    foreach ($ns in $nsList) {
        Write-Host "  $ns" -ForegroundColor Green
    }

    if ($nsList.Count -gt 0) {
        $probeNs = $nsList[0].TrimEnd(".")
        Write-Host "`nVerifying pre-cutover Cloud DNS answers directly against $probeNs..." -ForegroundColor Cyan
        Resolve-DnsName $RootDomain -Type A -Server $probeNs | Format-Table Name, Type, IPAddress -AutoSize
        Resolve-DnsName $RootDomain -Type MX -Server $probeNs | Format-Table Name, Type, NameExchange, Preference -AutoSize
    }

    Write-Host "`nPre-authorization complete. GoDaddy live DNS was NOT modified." -ForegroundColor Green
} catch {
    $dnsErrCode = Get-HttpStatusCodeFromError $_
    $dnsErrBody = Get-ApiErrorBody $_
    if ($dnsErrCode -eq 403 -and $dnsErrBody -match "SERVICE_DISABLED|accessNotConfigured") {
        Write-Host "Cloud DNS API just enabled and propagating; re-run preauth-domain.ps1 in ~1 minute to finalize zone staging." -ForegroundColor Yellow
        exit 0
    }
    throw
}
