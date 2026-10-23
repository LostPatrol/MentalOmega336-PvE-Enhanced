# Build a byte-preserving overlay ZIP with file hashes for an existing MO 3.3.6 install.
[CmdletBinding()]
param(
    [string]$Version = '2026.10.24-preview.1',
    [string]$OutputDirectory = ''
)

$ErrorActionPreference = 'Stop'
# Windows PowerShell can evaluate parameter defaults before resolving the script root.
if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
    $OutputDirectory = Join-Path $PSScriptRoot 'dist'
}
# These roots are the complete package contract; private workspaces are never enumerated.
$packageRoots = @(
    'artmo.ini', 'rulesmo.ini', 'Soundmo.INI', 'thememo.ini', 'uimd.ini',
    'ra2md.csf', 'digits.shp', 'pips.shp', 'game.fnt',
    'expandmo34.mix', 'expandmo35.mix', 'Phobos.dll',
    'INI/MentalOmegaMaps.ini', 'MapsMO/Demonic Modification',
    'docs/modified-wiki/html-refine', 'licenses',
    'README.md', 'THIRD_PARTY_NOTICES.md', 'docs/INSTALL.md', 'docs/LICENSING.md'
)

function Get-PackageFiles {
    # Resolve only the explicit overlay roots and retain their game-relative paths.
    foreach ($relativeRoot in $packageRoots) {
        $item = Get-Item -LiteralPath (Join-Path $PSScriptRoot $relativeRoot)
        if ($item.PSIsContainer) {
            Get-ChildItem -LiteralPath $item.FullName -Recurse -File
        } else {
            $item
        }
    }
}

function Add-PackageEntry {
    # Write a source file directly so legacy encodings and binary assets stay intact.
    param($Archive, [string]$EntryName, [string]$SourcePath)
    [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
        $Archive, $SourcePath, $EntryName, [System.IO.Compression.CompressionLevel]::Optimal
    )
}

if ($Version -notmatch '^[A-Za-z0-9][A-Za-z0-9._-]*$') {
    throw 'Version must contain only letters, digits, dots, underscores, or hyphens.'
}
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
[void][System.IO.Directory]::CreateDirectory($OutputDirectory)
# A distinct version or output directory preserves previously built packages.
$archiveName = "MentalOmega336-PvE-Enhanced-$Version-overlay.zip"
$archivePath = Join-Path $OutputDirectory $archiveName
if (Test-Path -LiteralPath $archivePath) {
    throw "Package already exists: $archivePath. Use another version or output directory."
}
$files = @(Get-PackageFiles | Sort-Object FullName)
$records = @(
    foreach ($file in $files) {
        [ordered]@{
            path = $file.FullName.Substring($PSScriptRoot.Length + 1).Replace('\', '/')
            size = $file.Length
            sha256 = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
        }
    }
)
$manifest = [ordered]@{
    project = 'MentalOmega336-PvE-Enhanced'
    version = $Version
    requiredBase = 'Mental Omega 3.3.6 with Simplified Chinese localization'
    status = 'preview; not validated in game; see docs/INSTALL.md for missing configuration'
    files = $records
}
# UTF-8 without BOM keeps manifests portable across Windows PowerShell and PowerShell 7.
$utf8 = New-Object System.Text.UTF8Encoding($false)
$manifestName = "$Version-PACKAGE-MANIFEST.json"
$manifestPath = Join-Path $OutputDirectory $manifestName
[System.IO.File]::WriteAllText($manifestPath, ($manifest | ConvertTo-Json -Depth 5), $utf8)
$archive = [System.IO.Compression.ZipFile]::Open($archivePath, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    for ($index = 0; $index -lt $files.Count; $index++) {
        Add-PackageEntry $archive $records[$index].path $files[$index].FullName
    }
    Add-PackageEntry $archive 'PACKAGE-MANIFEST.json' $manifestPath
} finally {
    $archive.Dispose()
}
$archiveHash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
[System.IO.File]::WriteAllText(
    (Join-Path $OutputDirectory 'SHA256SUMS.txt'), "$archiveHash  $archiveName`n", $utf8
)
Write-Output "Built $archivePath ($($files.Count) source files plus manifest)"
Write-Output "SHA256 $archiveHash"
