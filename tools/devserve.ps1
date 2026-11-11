# Dev-only server: like tools/serve.ps1, plus PUT /__write/<relative path> to save a file under Root\starboard-site\js.
param([string]$Root, [int]$Port = 8766)
$Root = [IO.Path]::GetFullPath($Root)
$writeRoot = Join-Path $Root 'starboard-site\js'
$types = @{ '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.css' = 'text/css; charset=utf-8'; '.svg' = 'image/svg+xml'; '.png' = 'image/png'; '.webmanifest' = 'application/manifest+json'; '.json' = 'application/json' }
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add("http://localhost:$Port/")
$l.Start()
Write-Output "dev server on $Port"
while ($l.IsListening) {
  $c = $l.GetContext()
  try {
    $p = [uri]::UnescapeDataString($c.Request.Url.AbsolutePath).TrimStart('/')
    if ($c.Request.HttpMethod -eq 'PUT' -and $p.StartsWith('__write/')) {
      $f = [IO.Path]::GetFullPath((Join-Path $writeRoot $p.Substring(8)))
      if ($f.StartsWith($writeRoot) -and $f.EndsWith('.js')) {
        $ms = New-Object IO.MemoryStream
        $c.Request.InputStream.CopyTo($ms)
        [IO.File]::WriteAllBytes($f, $ms.ToArray())
        $c.Response.StatusCode = 204
      } else { $c.Response.StatusCode = 403 }
    } else {
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
    }
  } catch { $c.Response.StatusCode = 500 }
  $c.Response.Close()
}
