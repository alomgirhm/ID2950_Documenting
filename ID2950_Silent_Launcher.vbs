Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "E:\ID2950"
WshShell.Run "cmd /c ""E:\ID2950\launch_app.bat""", 0, False
Set WshShell = Nothing

