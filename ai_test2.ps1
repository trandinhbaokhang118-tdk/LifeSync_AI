$ErrorActionPreference = 'Continue'
$login = '{"email":"user@demo.com","password":"user123"}'
$r = Invoke-WebRequest -Uri "http://localhost:3000/auth/login" -Method Post -Body $login -ContentType "application/json" -TimeoutSec 30 -UseBasicParsing
$token = ($r.Content | ConvertFrom-Json).data.accessToken
$H = @{ Authorization = "Bearer $token" }
$out = @()

# 1) Image status
try {
    $s = Invoke-WebRequest -Uri "http://localhost:3000/ai-chat/image/status" -Headers $H -TimeoutSec 30 -UseBasicParsing
    $out += "IMAGE STATUS: " + $s.Content
} catch { $out += "IMAGE STATUS ERR: $($_.Exception.Message)" }

# 2) Generate image (Gemini)
try {
    $b = (@{ prompt = "a cute robot mascot, flat vector, blue" } | ConvertTo-Json)
    $g = Invoke-WebRequest -Uri "http://localhost:3000/ai-chat/image" -Method Post -Body $b -ContentType "application/json" -Headers $H -TimeoutSec 90 -UseBasicParsing
    $j = $g.Content | ConvertFrom-Json
    $len = ($j.data.dataUrl | Measure-Object -Character).Characters
    $out += "IMAGE GEN OK: mime=$($j.data.mimeType) dataUrlChars=$len"
} catch {
    $msg = $_.Exception.Message
    if ($_.Exception.Response) { $sr = New-Object IO.StreamReader($_.Exception.Response.GetResponseStream()); $msg += " | " + $sr.ReadToEnd() }
    $out += "IMAGE GEN ERR: $msg"
}

$out | Out-File -FilePath "C:\Users\DELL\LifeSync AI\ai_test2_out.txt" -Encoding utf8
Write-Output "DONE"
