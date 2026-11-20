$wc = New-Object System.Net.WebClient
$wc.DownloadString('http://localhost:3000/docs-json')