Set WshShell = CreateObject("WScript.Shell")
' Check if port 3000 is already running
Set objExec = WshShell.Exec("cmd /c netstat -ano | findstr :3000 | findstr LISTENING")
strOutput = objExec.StdOut.ReadAll()

If InStr(strOutput, "LISTENING") = 0 Then
    ' Start Next.js production server silently in background with no black window
    WshShell.Run "cmd /c cd /d E:\ID2950 && npx next start -p 3000", 0, False
End If

Set WshShell = Nothing
