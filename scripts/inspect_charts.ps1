Add-Type -AssemblyName System.IO.Compression.FileSystem
$files = Get-ChildItem -LiteralPath "D:\Insect-trend-db Project\ไฟล์ตัวอย่าง" -Filter "*แมลงสาบ*.xlsx"
foreach ($f in $files) {
    Write-Output "FILE: $($f.Name)"
    $zip = [System.IO.Compression.ZipFile]::OpenRead($f.FullName)
    foreach ($e in $zip.Entries) {
        if ($e.FullName -like "*chart*.xml" -and $e.FullName -notlike "*style*" -and $e.FullName -notlike "*colors*") {
            Write-Output "  Chart: $($e.FullName)"
            $stream = $e.Open()
            $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8)
            $text = $reader.ReadToEnd()
            [regex]::Matches($text, '<a:t>([^<]+)</a:t>') | ForEach-Object { Write-Output "    Text: $($_.Groups[1].Value)" }
            $reader.Close()
            $stream.Close()
        }
    }
    $zip.Dispose()
}
