# Fix text colors for dark theme across all files

$files = @(
    "src/pages/Groups.tsx",
    "src/pages/Friends.tsx", 
    "src/pages/Analytics.tsx",
    "src/components/GroupExpenses.tsx",
    "src/components/ReceiptModal.tsx",
    "src/components/ExportModal.tsx"
)

$replacements = @{
    "text-gray-900" = "text-slate-100"
    "text-gray-800" = "text-slate-200"
    "text-gray-700" = "text-slate-300"
    "text-gray-600" = "text-slate-400"
    "text-gray-500" = "text-slate-500"
    "text-gray-400" = "text-slate-600"
    "bg-gray-50" = "bg-slate-800/50"
    "bg-gray-100" = "bg-slate-800/30"
    "bg-gray-200" = "bg-slate-700/50"
    "border-gray-100" = "border-slate-800/50"
    "border-gray-200" = "border-slate-700/50"
    "border-gray-300" = "border-slate-700/50"
    "hover:bg-gray-50" = "hover:bg-slate-800/30"
    "hover:bg-gray-100" = "hover:bg-slate-700/50"
    "hover:text-gray-900" = "hover:text-slate-100"
    "hover:text-gray-600" = "hover:text-slate-300"
    "bg-white" = "bg-slate-900/80"
    'className="bg-white rounded-lg' = 'className="bg-slate-900/90 backdrop-blur-xl rounded-lg'
}

foreach ($file in $files) {
    $filePath = Join-Path $PSScriptRoot $file
    if (Test-Path $filePath) {
        $content = Get-Content $filePath -Raw
        
        foreach ($old in $replacements.Keys) {
            $new = $replacements[$old]
            $content = $content -replace [regex]::Escape($old), $new
        }
        
        Set-Content $filePath $content -NoNewline
        Write-Host "Fixed: $file"
    }
}

Write-Host "`nAll files updated!"
