param(
  [switch]$NoBrowser
)

<#
  Servidor local para pré-visualização do jogo VONDER.
  Salve qualquer arquivo em VONDER e o navegador será recarregado automaticamente.
#>

$ErrorActionPreference = 'Stop'
$siteRoot = $PSScriptRoot
$port = 5173
$baseUrl = "http://localhost:$port/"

if (-not (Test-Path -LiteralPath $siteRoot -PathType Container)) {
  throw "A pasta do jogo não foi encontrada: $siteRoot"
}

function Get-SiteVersion {
  $latest = Get-ChildItem -LiteralPath $siteRoot -Recurse -File |
    Sort-Object LastWriteTimeUtc -Descending |
    Select-Object -First 1
  if ($null -eq $latest) { return '0' }
  return [string]$latest.LastWriteTimeUtc.Ticks
}

$mimeTypes = @{
  '.css' = 'text/css; charset=utf-8'; '.html' = 'text/html; charset=utf-8';
  '.js' = 'text/javascript; charset=utf-8'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg';
  '.png' = 'image/png'; '.svg' = 'image/svg+xml'; '.ico' = 'image/x-icon';
  '.webp' = 'image/webp'; '.woff2' = 'font/woff2'
}
$liveReload = @'
<script>
(() => {
  let version = '';
  setInterval(async () => {
    try {
      const next = await fetch('/__live_reload', { cache: 'no-store' }).then(r => r.text());
      if (version && next !== version) location.reload();
      version = next;
    } catch (_) {}
  }, 700);
})();
</script>
'@

function Send-Response {
  param($Stream, [int]$StatusCode, [string]$ContentType, [byte[]]$Body)
  $statusText = if ($StatusCode -eq 200) { 'OK' } else { 'Not Found' }
  $header = "HTTP/1.1 $StatusCode $statusText`r`nContent-Type: $ContentType`r`nContent-Length: $($Body.Length)`r`nConnection: close`r`nCache-Control: no-store`r`n`r`n"
  $headerBytes = [Text.Encoding]::ASCII.GetBytes($header)
  $Stream.Write($headerBytes, 0, $headerBytes.Length)
  if ($Body.Length -gt 0) { $Stream.Write($Body, 0, $Body.Length) }
}

$listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $port)
$listener.Start()
if (-not $NoBrowser) { Start-Process $baseUrl }
Write-Host ''
Write-Host 'Pré-visualização ao vivo iniciada:' -ForegroundColor Green
Write-Host "  $baseUrl" -ForegroundColor Cyan
Write-Host 'Salve alterações em VONDER para atualizar o navegador. Pressione Ctrl+C para encerrar.'
Write-Host ''

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    $stream = $client.GetStream()
    $reader = [IO.StreamReader]::new($stream, [Text.Encoding]::ASCII, $false, 1024, $true)
    $requestLine = $reader.ReadLine()
    while ($reader.ReadLine() -ne '') { }
    if ([string]::IsNullOrWhiteSpace($requestLine)) { $client.Close(); continue }
    $requestTarget = ($requestLine -split ' ')[1]
    $requestPath = [Uri]::UnescapeDataString(($requestTarget -split '\?')[0])

    if ($requestPath -eq '/__live_reload') {
      $bytes = [Text.Encoding]::UTF8.GetBytes((Get-SiteVersion))
      Send-Response -Stream $stream -StatusCode 200 -ContentType 'text/plain; charset=utf-8' -Body $bytes
      $client.Close()
      continue
    }

    $relativePath = $requestPath.TrimStart('/').Replace('/', [IO.Path]::DirectorySeparatorChar)
    $filePath = Join-Path $siteRoot $relativePath
    if ((Test-Path -LiteralPath $filePath -PathType Container) -or $requestPath.EndsWith('/')) {
      $filePath = Join-Path $filePath 'index.html'
    }

    $resolvedRoot = [IO.Path]::GetFullPath($siteRoot)
    $resolvedFile = [IO.Path]::GetFullPath($filePath)
    if (-not $resolvedFile.StartsWith($resolvedRoot, [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $resolvedFile -PathType Leaf)) {
      Send-Response -Stream $stream -StatusCode 404 -ContentType 'text/plain; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes('Arquivo não encontrado'))
      $client.Close()
      continue
    }

    $extension = [IO.Path]::GetExtension($resolvedFile).ToLowerInvariant()
    $contentType = if ($mimeTypes.ContainsKey($extension)) { $mimeTypes[$extension] } else { 'application/octet-stream' }
    if ($extension -eq '.html') {
      $html = [IO.File]::ReadAllText($resolvedFile)
      $html = $html -replace '(?i)</body>', "$liveReload</body>"
      $bytes = [Text.Encoding]::UTF8.GetBytes($html)
    } else {
      $bytes = [IO.File]::ReadAllBytes($resolvedFile)
    }
    Send-Response -Stream $stream -StatusCode 200 -ContentType $contentType -Body $bytes
    $client.Close()
  }
} finally {
  $listener.Stop()
}
