param (
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$SearchDirectory,
    [Parameter(Mandatory = $true, Position = 1)]
    [string]$WwiseDirectory,
    [Parameter(Mandatory = $false, Position = 2)]
    [string]$AudioOutput = ".\audio",
    [switch]$Convert = $false,
    [string]$CSV = ""
)

if (-not $SearchDirectory) {
    Write-Host "Usage: $($MyInvocation.MyCommand.Name) [-SearchDirectory] <path> [-WwiseDirectory] <path> [-AudioOutput] <path> [-Convert] [-CSV <path>]"
    exit 1
}

$uassetFiles = Get-ChildItem -Path $SearchDirectory -Recurse -Filter *.uasset

$regex = [regex] "Media/.+?\.wem"

$results = @()

foreach ($file in $uassetFiles) {
    try {
        $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
        $text = [System.Text.Encoding]::ASCII.GetString($bytes)

        $match = $regex.Matches($text)


        if ($match.Success) {
            $i = 0
            foreach ($result in $match.Groups) {
                $i += 1
                $wemFilename = $result.Value
                $results += [PSCustomObject]@{
                    UassetName = $file.Name
                    WemFilename = $wemFilename
                    ExtractAs = $file.BaseName + "_{0:D2}.wav" -f $i
                }
            }
        }
    }
    catch {
        Write-Warning "Failed to read $($file.FullName): $_"
    }
}

if ($Convert) {
    $vgmstreamPath = Join-Path -Path (Split-Path -Parent $MyInvocation.MyCommand.Path) -ChildPath "vendor/vgmstream-win64/vgmstream-cli.exe"

    if (-not (Test-Path $vgmstreamPath)) {
        Write-Host "vgmstream executable not found at $vgmstreamPath"
        exit 1
    }

    Write-Host "Converting .wem files to .wav using $vgmstreamPath"
    foreach ($result in $results) {
        $wemFilePath = Join-Path -Path $WwiseDirectory -ChildPath $result.WemFilename
        if (Test-Path $wemFilePath) {
            $outputWavPath = Join-Path -Path $AudioOutput -ChildPath $result.ExtractAs
            if (-not (Test-Path $AudioOutput)) {
                New-Item -ItemType Directory -Path $AudioOutput | Out-Null
            }
            & $vgmstreamPath -i $wemFilePath -o $outputWavPath
            Write-Host "Converted: $($result.WemFilename) to $outputWavPath"
        } else {
            Write-Warning "WEM file not found: $wemFilePath"
        }
    }
} else {
    $results | Format-Table -AutoSize
}

if ($CSV) {
    $results | Export-Csv -Path $CSV -NoTypeInformation
    Write-Host "Results exported to $CSV"
}
