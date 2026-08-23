param(
    [string]$OutputDirectory = (Join-Path $PSScriptRoot '..\assets\voice-previews')
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer

try {
    $koreanVoice = @($synth.GetInstalledVoices() |
        Where-Object { $_.Enabled -and $_.VoiceInfo.Culture.Name -eq 'ko-KR' } |
        ForEach-Object { $_.VoiceInfo } |
        Sort-Object @{ Expression = { $_.Name -notmatch 'Desktop' } }, Name |
        Select-Object -First 1)

    if (-not $koreanVoice) {
        throw 'A Korean Windows TTS voice (ko-KR) is required to create the preview files.'
    }

    $samples = @(
        [PSCustomObject]@{ Id = 'protagonist'; Name = '주인공'; Rate = 0; Pitch = '+2st'; Line = '하린아, 아직 늦지 않았어. 네 꿈을 돌려줄게.' }
        [PSCustomObject]@{ Id = 'harin'; Name = '하린'; Rate = -1; Pitch = '+4st'; Line = '정말… 내가 웃지 못해도, 넌 내 곁에 있을 거야?' }
        [PSCustomObject]@{ Id = 'yuna'; Name = '유나'; Rate = -2; Pitch = '+3st'; Line = '들려? 사라졌던 내 노래가 다시 이어지고 있어.' }
        [PSCustomObject]@{ Id = 'haneul'; Name = '하늘'; Rate = 2; Pitch = '+1st'; Line = '이번에는 멈추지 않을래. 바람이 세도 앞으로 갈 거야.' }
        [PSCustomObject]@{ Id = 'daughter'; Name = '과학자의 딸'; Rate = -2; Pitch = '+5st'; Line = '아빠, 나 혼자 웃는 건 행복이 아니야. 모두의 꿈을 돌려줘.' }
        [PSCustomObject]@{ Id = 'assistant'; Name = '전 조수'; Rate = -2; Pitch = '-2st'; Line = '꿈은 기억을 담지만, 누구의 감정도 빼앗아선 안 됩니다.' }
        [PSCustomObject]@{ Id = 'scientist'; Name = '수면 과학자'; Rate = -3; Pitch = '-6st'; Line = '내 딸에게 남은 건 이 꿈뿐이라고… 그렇게 믿고 싶었다.' }
    )

    foreach ($sample in $samples) {
        $path = Join-Path $OutputDirectory ("{0}-voice-preview-v1.wav" -f $sample.Id)
        $text = [System.Security.SecurityElement]::Escape($sample.Line)
        $ssml = @"
<speak version=""1.0"" xml:lang=""ko-KR"">
  <prosody rate=""$($sample.Rate)"" pitch=""$($sample.Pitch)"">$text</prosody>
</speak>
"@

        $synth.SelectVoice($koreanVoice.Name)
        $synth.SetOutputToWaveFile($path)
        try {
            $synth.SpeakSsml($ssml)
        }
        catch {
            # Older SAPI Korean voices may not support SSML prosody. Preserve a rate distinction.
            $synth.Rate = $sample.Rate
            $synth.Speak($sample.Line)
        }
        finally {
            $synth.SetOutputToNull()
        }

        Write-Output ("{0}: {1}" -f $sample.Name, $path)
    }

    Write-Output ("Voice used: {0}" -f $koreanVoice.Name)
}
finally {
    $synth.Dispose()
}
