function Test-PortOpen([string]$ip, [int]$port) {
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $connect = $tcp.BeginConnect($ip, $port, $null, $null)
        $wait = $connect.AsyncWaitHandle.WaitOne(300, $false)
        if ($wait -and $tcp.Connected) {
            $tcp.EndConnect($connect)
            $tcp.Close()
            return $true
        }
        $tcp.Close()
        return $false
    } catch {
        return $false
    }
}

# 1. Check if server is running on port 3000
$isOpen = Test-PortOpen "127.0.0.1" 3000

if (-not $isOpen) {
    # Start Next.js production server silently
    Start-Process -FilePath "C:\Program Files\nodejs\node.exe" -ArgumentList @("E:\ID2950\node_modules\next\dist\bin\next", "start", "-p", "3000") -WorkingDirectory "E:\ID2950" -WindowStyle Hidden
    
    # Wait until port 3000 is listening (max 10 seconds)
    for ($i = 0; $i -lt 25; $i++) {
        Start-Sleep -Milliseconds 400
        if (Test-PortOpen "127.0.0.1" 3000) {
            break
        }
    }
}

# 2. Open Chrome as a standalone Desktop App window
Start-Process -FilePath "C:\Program Files\Google\Chrome\Application\chrome.exe" -ArgumentList '--app="http://localhost:3000"'

