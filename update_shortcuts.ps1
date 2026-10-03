$ws = New-Object -ComObject WScript.Shell

# 1. Desktop shortcut for ID2950 Documenting
$desktopPaths = @(
    [System.IO.Path]::Combine($env:USERPROFILE, "Desktop"),
    [System.IO.Path]::Combine($env:USERPROFILE, "OneDrive\Desktop")
)

foreach ($dir in $desktopPaths) {
    if (Test-Path $dir) {
        $scPath = Join-Path $dir "ID2950_Documenting.lnk"
        $sc = $ws.CreateShortcut($scPath)
        $sc.TargetPath = "C:\Windows\System32\wscript.exe"
        $sc.Arguments = "`"E:\ID2950\ID2950_Silent_Launcher.vbs`""
        $sc.WorkingDirectory = "E:\ID2950"
        $sc.IconLocation = "C:\Program Files\Google\Chrome\Application\chrome.exe,0"
        $sc.Description = "Open ID2950 Documenting App"
        $sc.Save()
        Write-Output "Created/Updated: $scPath"
    }
}

# 2. Windows Startup folder shortcut (so port 3000 starts on laptop boot)
$startupFolder = [System.IO.Path]::Combine($env:APPDATA, "Microsoft\Windows\Start Menu\Programs\Startup")
if (Test-Path $startupFolder) {
    $startupScPath = Join-Path $startupFolder "ID2950_Background_Server.lnk"
    $sc = $ws.CreateShortcut($startupScPath)
    $sc.TargetPath = "C:\Windows\System32\wscript.exe"
    $sc.Arguments = "`"E:\ID2950\start_server_silent.vbs`""
    $sc.WorkingDirectory = "E:\ID2950"
    $sc.Save()
    Write-Output "Created/Updated: $startupScPath"
}

