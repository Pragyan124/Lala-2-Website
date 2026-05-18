# IT Inventory System - Bulk Bill Upload Script (PowerShell Compatible)
# Usage: .\bulk_update_bills.ps1 -DirectoryPath ".\bills" -Token "YOUR_TOKEN"

param (
    [Parameter(Mandatory=$true)]
    [string]$DirectoryPath,

    [Parameter(Mandatory=$true)]
    [string]$Token,

    [string]$ApiUrl = "http://localhost:3001/api/assets/tag"
)

# Convert relative path to absolute path
if (Test-Path $DirectoryPath) {
    $ResolvedPath = (Resolve-Path $DirectoryPath).Path
} else {
    Write-Host "Error: Path $DirectoryPath not found." -ForegroundColor Red
    exit
}

# Check if it's a file or directory
$files = @()
if (Test-Path $ResolvedPath -PathType Leaf) {
    $files += Get-Item $ResolvedPath
} else {
    $files = Get-ChildItem -Path $ResolvedPath -File | Where-Object { $_.Extension -match "pdf|jpg|jpeg|png" }
}

if ($files.Count -eq 0) {
    Write-Host "No valid bill files (.pdf, .jpg, .png) found at $ResolvedPath" -ForegroundColor Yellow
    exit
}

Write-Host "Starting upload process..." -ForegroundColor Cyan
Write-Host "--------------------------------------------------"

$total = 0
$success = 0
$failed = 0

foreach ($file in $files) {
    $tag = $file.BaseName
    Write-Host "Uploading $($file.Name) for asset tag [$tag]... " -NoNewline
    
    # Use curl.exe - show error but stay silent otherwise
    # Added -w "%{http_code}" to get the status code
    $cmdArgs = @(
        "-X", "POST",
        "-H", "Authorization: Bearer $Token",
        "-F", "bill=@$($file.FullName)",
        "-s",
        "$ApiUrl/$tag/bill"
    )
    
    try {
        $responseJson = & curl.exe @cmdArgs
        
        # Check if response contains success:true
        if ($responseJson -match '"success":true') {
            Write-Host "SUCCESS" -ForegroundColor Green
            $success++
        } else {
            Write-Host "FAILED" -ForegroundColor Red
            # Try to extract the error message from JSON if possible
            if ($responseJson -match '"error":"([^"]+)"') {
                Write-Host "   Reason: $($Matches[1])"
            } else {
                Write-Host "   Reason: $responseJson (Asset tag likely doesn't exist)"
            }
            $failed++
        }
    } catch {
        Write-Host "FAILED" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)"
        $failed++
    }
    $total++
}

Write-Host "--------------------------------------------------"
Write-Host "Batch process complete!" -ForegroundColor Cyan
Write-Host "Total files processed: $total"
Write-Host "Successful uploads: $success"
Write-Host "Failed uploads: $failed"
