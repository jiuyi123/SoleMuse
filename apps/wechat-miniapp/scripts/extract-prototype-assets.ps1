param(
    [string]$WorkspaceRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
)

$sourceRoot = Join-Path $WorkspaceRoot 'docs\miniappDesign\DesignPic'
$outputRoot = Join-Path $WorkspaceRoot 'apps\wechat-miniapp\miniprogram\assets\images\demo'
$artworkOutput = Join-Path $outputRoot 'artworks'
$profileOutput = Join-Path $outputRoot 'profile'
$searchPrototype = (-join ([char[]]@(0x641C, 0x7D22, 0x7ED3, 0x679C))) + '.png'
$profilePrototype = (-join ([char[]]@(0x4E2A, 0x4EBA, 0x8D44, 0x6599, 0x9875))) + '.png'

Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force -Path $artworkOutput, $profileOutput | Out-Null

function Export-Crop {
    param(
        [string]$Source,
        [string]$Destination,
        [int]$X,
        [int]$Y,
        [int]$Width,
        [int]$Height
    )

    $sourcePath = Join-Path $sourceRoot $Source
    if (-not (Test-Path -LiteralPath $sourcePath)) {
        throw "Prototype image not found: $sourcePath"
    }

    $image = [System.Drawing.Bitmap]::FromFile($sourcePath)
    try {
        if ($X -lt 0 -or $Y -lt 0 -or ($X + $Width) -gt $image.Width -or ($Y + $Height) -gt $image.Height) {
            throw "Crop rectangle exceeds source bounds: $Source"
        }

        $rectangle = [System.Drawing.Rectangle]::new($X, $Y, $Width, $Height)
        $crop = $image.Clone($rectangle, $image.PixelFormat)
        try {
            $crop.Save($Destination, [System.Drawing.Imaging.ImageFormat]::Png)
        }
        finally {
            $crop.Dispose()
        }
    }
    finally {
        $image.Dispose()
    }
}

$artworks = @(
    @{ File = 'artwork-01-yixiu-shanhai.png'; X = 144; Y = 427; Width = 316; Height = 216 },
    @{ File = 'artwork-02-yixiu-huayu.png'; X = 480; Y = 427; Width = 316; Height = 216 },
    @{ File = 'artwork-03-yiyun-chaosheng.png'; X = 144; Y = 751; Width = 316; Height = 205 },
    @{ File = 'artwork-04-dongfang-xiujing.png'; X = 480; Y = 751; Width = 316; Height = 205 },
    @{ File = 'artwork-05-liuguang-yixiu.png'; X = 144; Y = 1068; Width = 316; Height = 196 },
    @{ File = 'artwork-06-yixiu-future.png'; X = 480; Y = 1068; Width = 316; Height = 196 }
)

foreach ($artwork in $artworks) {
    Export-Crop -Source $searchPrototype -Destination (Join-Path $artworkOutput $artwork.File) `
        -X $artwork.X -Y $artwork.Y -Width $artwork.Width -Height $artwork.Height
}

Export-Crop -Source $profilePrototype -Destination (Join-Path $profileOutput 'avatar-lintong-manbu.png') `
    -X 177 -Y 204 -Width 170 -Height 170
Export-Crop -Source $profilePrototype -Destination (Join-Path $profileOutput 'profile-promo-banner.png') `
    -X 161 -Y 1320 -Width 618 -Height 143

Write-Output "Prototype assets exported to $outputRoot"
