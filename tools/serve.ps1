# Yerel gelistirme sunucusu: starboard-site klasorunu http://localhost:8765 adresinde sunar.
param([string]$Root = (Join-Path $PSScriptRoot '..\starboard-site'), [int]$Port = 8765)
$Root = [IO.Path]::GetFullPath($Root)
$types = @{
  '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.mjs' = 'text/javascript; charset=utf-8'
  '.css' = 'text/css; charset=utf-8'; '.svg' = 'image/svg+xml'; '.png' = 'image/png'
  '.webmanifest' = 'application/manifest+json'; '.json' = 'application/json'
}
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add("http://localhost:$Port/")
$l.Start()
Write-Output "listening on $Port, root $Root"
while ($l.IsListening) {
  $c = $l.GetContext()
  try {
    $p = [uri]::UnescapeDataString($c.Request.Url.AbsolutePath).TrimStart('/')
    if ($p -eq '' -or $p.EndsWith('/')) { $p += 'index.html' }
    $f = [IO.Path]::GetFullPath((Join-Path $Root $p))
    if ($f.StartsWith($Root) -and (Test-Path $f -PathType Leaf)) {
      $b = [IO.File]::ReadAllBytes($f)
      $t = $types[[IO.Path]::GetExtension($f).ToLower()]
      if ($t) { $c.Response.ContentType = $t }
      $c.Response.Headers.Add('Cache-Control', 'no-cache')
      $c.Response.ContentLength64 = $b.Length
      $c.Response.OutputStream.Write($b, 0, $b.Length)
    } else { $c.Response.StatusCode = 404 }
  } catch { $c.Response.StatusCode = 500 }
  $c.Response.Close()
}
