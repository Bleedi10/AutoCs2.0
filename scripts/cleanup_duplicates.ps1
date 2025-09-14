param(
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Root to scan: current script directory's parent if run from repo; otherwise current location
$Root = (Get-Location).Path

# Create quarantine folder name
$timestamp = (Get-Date).ToString('yyyyMMdd_HHmmss')
$QuarantineRoot = Join-Path $Root (".duplicates_quarantine_" + $timestamp)

# Exclude some noisy directories
$DefaultExcludes = @(
    '.git', 'node_modules', 'dist', 'build', '.next', '.venv', 'venv', '__pycache__', '.vscode', '.vs'
)

function Test-ExcludedPath {
    param([string]$Path)
    foreach ($ex in $DefaultExcludes) {
        if ($Path -split '[\\/]' -contains $ex) { return $true }
    }
    return $false
}

function Get-CanonicalName {
    param([string]$FileName)
    # Returns the canonical file name (what we expect the original to be) and a reason label if it looks like a duplicate
    $name = [System.IO.Path]::GetFileNameWithoutExtension($FileName)
    $ext = [System.IO.Path]::GetExtension($FileName)
    $reason = $null

    # 1) Files like name-DESKTOP-XXXX.ext -> canonical = name.ext
    if ($name -match '^(?<base>.+?)-DESKTOP-[A-Z0-9]+$') {
        $canonical = $Matches['base'] + $ext
        return @($canonical, "suffix:DESKTOP-*")
    }

    # 2) name - Copy.ext or name - Copy (1).ext (English)
    if ($name -match '^(?<base>.+?) - Copy( \(\d+\))?$') {
        $canonical = $Matches['base'] + $ext
        return @($canonical, "suffix:- Copy")
    }

    # 3) name - Copia.ext or name - Copia (1).ext (Spanish)
    if ($name -match '^(?<base>.+?) - Copia( \(\d+\))?$') {
        $canonical = $Matches['base'] + $ext
        return @($canonical, "suffix:- Copia")
    }

    # 4) Copy of name.ext / Copia de name.ext
    if ($name -match '^(?i)Copy of (?<base>.+)$') {
        $canonical = $Matches['base'] + $ext
        return @($canonical, "prefix:Copy of")
    }
    if ($name -match '^(?i)Copia de (?<base>.+)$') {
        $canonical = $Matches['base'] + $ext
        return @($canonical, "prefix:Copia de")
    }

    # 5) name (1).ext
    if ($name -match '^(?<base>.+?) \(\d+\)$') {
        $canonical = $Matches['base'] + $ext
        return @($canonical, "suffix:(n)")
    }

    # 6) OneDrive conflict markers like name (conflicted copy...).ext, name (conflicto...).ext
    if ($name -match '(?i)^(?<base>.+?) \((?:.*conflict.*|.*conflicto.*)\)$') {
        $canonical = $Matches['base'] + $ext
        return @($canonical, "suffix:(conflict)")
    }

    # 7) Extensions like .new / .old / .bak appended
    if ($ext -match '(?i)\.(new|old|bak|backup)$') {
        $innerExt = [System.IO.Path]::GetExtension($name)
        if ($innerExt) {
            $base = $name.Substring(0, $name.Length - $innerExt.Length)
            $canonical = $base + $innerExt
        } else {
            # Fallback: trim the .new and keep as-is
            $canonical = $name + ''
        }
        return @($canonical, "ext:.new/.old/.bak")
    }

    return @($FileName, $null) # no change; canonical equals
}

Write-Host "Scanning for duplicates under: $Root" -ForegroundColor Cyan

$files = Get-ChildItem -Path $Root -File -Recurse -Force |
    Where-Object { -not (Test-ExcludedPath $_.FullName) }

$byDir = $files | Group-Object { $_.DirectoryName }

$suspects = @()

foreach ($group in $byDir) {
    $dir = $group.Name
    # Build a lookup of names in this directory (case-insensitive)
    $names = @{}
    foreach ($f in $group.Group) { $names[$f.Name.ToLowerInvariant()] = $f }

    foreach ($f in $group.Group) {
        $canon, $reason = Get-CanonicalName -FileName $f.Name
        if ($reason) {
            Write-Verbose ("Detected: '{0}' -> '{1}' ({2})" -f $f.Name, $canon, $reason)
            $canonLower = $canon.ToLowerInvariant()
            if ($names.ContainsKey($canonLower)) {
                # Canonical exists in same directory; mark this file as duplicate
                $canonicalPath = $names[$canonLower].FullName
                $suspects += [pscustomobject]@{
                    DuplicatePath = $f.FullName
                    CanonicalPath = $canonicalPath
                    Reason        = $reason
                }
            }
        }
    }
}

if ($DryRun) {
    Write-Host "Found $($suspects.Count) duplicate candidates (dry-run)." -ForegroundColor Yellow
    if ($suspects.Count -gt 0) {
        $suspects | Sort-Object DuplicatePath | Format-Table -AutoSize
    }
    return
}

if ($suspects.Count -eq 0) {
    Write-Host "No duplicates found to move." -ForegroundColor Green
    return
}

Write-Host "Moving $($suspects.Count) duplicates to: $QuarantineRoot" -ForegroundColor Yellow
New-Item -ItemType Directory -Path $QuarantineRoot -Force | Out-Null

$log = @()

foreach ($s in $suspects) {
    $rel = Resolve-Path -LiteralPath $s.DuplicatePath -Relative
    # If Resolve-Path -Relative is not under current, compute relative manually
    if ($rel -like '.\\*') { $rel = $rel.Substring(2) } else { $rel = (Split-Path -Path $s.DuplicatePath -NoQualifier).TrimStart('\\') }
    $target = Join-Path $QuarantineRoot $rel
    New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
    try {
        Move-Item -LiteralPath $s.DuplicatePath -Destination $target -Force
        $status = 'moved'
    } catch {
        $status = 'error: ' + $_.Exception.Message
    }
    $log += [pscustomobject]@{
        Duplicate = $s.DuplicatePath
        Canonical = $s.CanonicalPath
        Reason    = $s.Reason
        Status    = $status
    }
}

$logPath = Join-Path $QuarantineRoot 'cleanup_log.csv'
$log | Export-Csv -NoTypeInformation -Path $logPath -Encoding UTF8

"Duplicates moved: $($log | Where-Object { $_.Status -eq 'moved' } | Measure-Object | Select-Object -ExpandProperty Count)" | Out-File (Join-Path $QuarantineRoot 'SUMMARY.txt')
"Log: $logPath" | Add-Content (Join-Path $QuarantineRoot 'SUMMARY.txt')

Write-Host "Done. Log saved to: $logPath" -ForegroundColor Green
