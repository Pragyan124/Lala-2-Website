# IT Inventory System - Apply Single Bill to ALL Records
# Usage: .\apply_to_all.ps1 -FilePath "C:\path\to\bill.pdf" -Token "YOUR_TOKEN"

param (
    [Parameter(Mandatory=$true)]
    [string]$FilePath,

    [Parameter(Mandatory=$true)]
    [string]$Token,

    [string]$ApiUrl = "http://localhost:3001/api/assets/bulk-apply-bill"
)

if (-not (Test-Path $FilePath)) {
    Write-Host "Error: File $FilePath not found." -ForegroundColor Red
    exit
}

$AbsPath = (Resolve-Path $FilePath).Path
Write-Host "Applying $AbsPath to ALL records in the database..." -ForegroundColor Cyan

$cmdArgs = @(
    "-X", "POST",
    "-H", "Authorization: Bearer $Token",
    "-F", "bill=@$AbsPath",
    "-s",
    "$ApiUrl"
)

try {
    $responseJson = & curl.exe @cmdArgs
    
    if ($responseJson -match '"success":true') {
        Write-Host "SUCCESS!" -ForegroundColor Green
        Write-Host $responseJson -ForegroundColor Gray
    } else {
        Write-Host "FAILED" -ForegroundColor Red
        Write-Host "Reason: $responseJson"
    }
} catch {
    Write-Host "FAILED" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)"
}
