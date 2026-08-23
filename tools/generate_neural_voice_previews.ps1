param(
    [string]$OutputDirectory = (Join-Path $PSScriptRoot '..\assets\voice-previews\neural')
)

$ErrorActionPreference = 'Stop'
$apiKey = $env:OPENAI_API_KEY
if ([string]::IsNullOrWhiteSpace($apiKey)) {
    throw 'OPENAI_API_KEY is not set in this PowerShell session.'
}

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null

# 미리듣기용 짧은 한 줄이다. 게임에 실제 연결할 대사본은 톤이 확정된 뒤 별도 생성한다.
$samples = @(
    [PSCustomObject]@{
        Id = 'protagonist'; Name = '주인공'; Voice = 'ash'; Speed = 1.02
        Line = '하린아, 아직 늦지 않았어. 네 꿈을 돌려줄게.'
        Direction = 'Speak in natural Korean. A young, courageous child protagonist. Clear, warm and determined, with a small breath before the final promise. Avoid announcer delivery.'
    }
    [PSCustomObject]@{
        Id = 'harin'; Name = '하린'; Voice = 'coral'; Speed = 0.96
        Line = '정말… 내가 웃지 못해도, 넌 내 곁에 있을 거야?'
        Direction = 'Speak in natural Korean. A kind child who is trying not to cry after a long nightmare. Delicate, hesitant, intimate and vulnerable. Let the pause after 정말 linger naturally.'
    }
    [PSCustomObject]@{
        Id = 'yuna'; Name = '유나'; Voice = 'ballad'; Speed = 0.94
        Line = '들려? 사라졌던 내 노래가 다시 이어지고 있어.'
        Direction = 'Speak in natural Korean. A thoughtful young girl discovering her lost music again. Softly musical rhythm, relieved wonder, brightening gently by the last words. Do not sing.'
    }
    [PSCustomObject]@{
        Id = 'haneul'; Name = '하늘'; Voice = 'cedar'; Speed = 1.06
        Line = '이번에는 멈추지 않을래. 바람이 세도 앞으로 갈 거야.'
        Direction = 'Speak in natural Korean. A young friend gathering courage in a strong wind. Energetic but sincere, a little breathless, then firm and forward-looking. No exaggerated cartoon acting.'
    }
    [PSCustomObject]@{
        Id = 'daughter'; Name = '과학자의 딸'; Voice = 'shimmer'; Speed = 0.93
        Line = '아빠, 나 혼자 웃는 건 행복이 아니야. 모두의 꿈을 돌려줘.'
        Direction = 'Speak in natural Korean. A gentle child speaking honestly to a beloved father. Tender, sad and compassionate, never accusatory. The final plea should be quiet but unwavering.'
    }
    [PSCustomObject]@{
        Id = 'assistant'; Name = '전 조수'; Voice = 'sage'; Speed = 0.95
        Line = '꿈은 기억을 담지만, 누구의 감정도 빼앗아선 안 됩니다.'
        Direction = 'Speak in natural Korean. A calm adult researcher carrying guilt and responsibility. Low-key, steady and sincere, with clear diction. This is a private warning, not a lecture.'
    }
    [PSCustomObject]@{
        Id = 'scientist'; Name = '수면 과학자'; Voice = 'onyx'; Speed = 0.90
        Line = '내 딸에게 남은 건 이 꿈뿐이라고… 그렇게 믿고 싶었다.'
        Direction = 'Speak in natural Korean. An exhausted father and sleep scientist confronting his mistake. Deep, restrained, grief under control, voice slightly breaking only at the final phrase. Never villainous or theatrical.'
    }
)

$headers = @{ Authorization = "Bearer $apiKey" }
foreach ($sample in $samples) {
    $outputPath = Join-Path $OutputDirectory ("{0}-neural-voice-preview-v1.mp3" -f $sample.Id)
    $payload = @{
        model = 'gpt-4o-mini-tts'
        voice = $sample.Voice
        input = $sample.Line
        instructions = $sample.Direction
        response_format = 'mp3'
        speed = $sample.Speed
    } | ConvertTo-Json -Compress

    Invoke-WebRequest -Uri 'https://api.openai.com/v1/audio/speech' -Method Post `
        -Headers $headers -ContentType 'application/json' -Body $payload -OutFile $outputPath

    $file = Get-Item -LiteralPath $outputPath
    if ($file.Length -lt 1024) {
        throw "Generated voice preview is unexpectedly small: $($file.Name)"
    }
    Write-Output ("{0}: {1} KB" -f $sample.Name, [Math]::Round($file.Length / 1KB, 1))
}
