"""Create offline Korean neural-TTS previews with Supertone Supertonic 3.

The runtime/model cache stays under LOCALAPPDATA. Only the final WAV previews
are saved in the game project, so the project repository is not bloated by
model weights. Run this with the local virtual environment created for the game.
"""

from __future__ import annotations

import os
from pathlib import Path

import numpy as np
from supertonic import Style, TTS


PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIRECTORY = PROJECT_ROOT / "assets" / "voice-previews" / "local-neural"
MODEL_DIRECTORY = Path(
    os.environ.get(
        "DREAM_CHILD_TTS_MODEL_DIR",
        Path(os.environ.get("LOCALAPPDATA", ".")) / "dream-child-local-tts" / "models",
    )
)


SAMPLES = (
    {
        "id": "protagonist",
        "name": "주인공",
        "voice": "F3",
        "speed": 1.02,
        "line": "하린아, 아직 늦지 않았어. 네 꿈을 돌려줄게.",
    },
    {
        "id": "harin",
        "name": "하린",
        "voice": "F1",
        "speed": 0.94,
        "line": "정말… 내가 웃지 못해도, 넌 내 곁에 있을 거야?",
    },
    {
        "id": "yuna",
        "name": "유나",
        "voice": "F2",
        "speed": 0.95,
        "line": "들려? 사라졌던 내 노래가 다시 이어지고 있어.",
    },
    {
        "id": "haneul",
        "name": "하늘",
        "voice": "M1",
        "speed": 1.06,
        "line": "이번에는 멈추지 않을래. 바람이 세도 앞으로 갈 거야.",
    },
    {
        "id": "daughter",
        "name": "과학자의 딸",
        "voice": "F1+F3:0.62",
        "speed": 0.91,
        "line": "아빠, 나 혼자 웃는 건 행복이 아니야. 모두의 꿈을 돌려줘.",
    },
    {
        "id": "assistant",
        "name": "전 조수",
        "voice": "M2",
        "speed": 0.95,
        "line": "꿈은 기억을 담지만, 누구의 감정도 빼앗아선 안 됩니다.",
    },
    {
        "id": "scientist",
        "name": "수면 과학자",
        "voice": "M3",
        "speed": 0.88,
        "line": "내 딸에게 남은 건 이 꿈뿐이라고… 그렇게 믿고 싶었다.",
    },
)


def resolve_style(tts: TTS, recipe: str) -> Style:
    """Use a stock style, or blend two stock styles for one additional child voice."""
    if "+" not in recipe:
        return tts.get_voice_style(voice_name=recipe)

    pair, weight_text = recipe.split(":", maxsplit=1)
    left_name, right_name = pair.split("+", maxsplit=1)
    left_weight = float(weight_text)
    right_weight = 1.0 - left_weight
    left = tts.get_voice_style(voice_name=left_name)
    right = tts.get_voice_style(voice_name=right_name)
    return Style(
        style_ttl_onnx=(left.ttl * left_weight + right.ttl * right_weight).astype(np.float32),
        style_dp_onnx=(left.dp * left_weight + right.dp * right_weight).astype(np.float32),
    )


def main() -> None:
    OUTPUT_DIRECTORY.mkdir(parents=True, exist_ok=True)
    # auto_download fetches the open model only on its first execution.
    tts = TTS(model="supertonic-3", model_dir=MODEL_DIRECTORY, auto_download=True)

    for sample in SAMPLES:
        style = resolve_style(tts, sample["voice"])
        waveform, _metadata = tts.synthesize(
            sample["line"],
            voice_style=style,
            lang="ko",
            speed=sample["speed"],
            total_steps=12,
            silence_duration=0.35,
        )
        destination = OUTPUT_DIRECTORY / f"{sample['id']}-local-neural-voice-preview-v1.wav"
        tts.save_audio(waveform, str(destination))
        duration_seconds = np.asarray(waveform).size / tts.sample_rate
        print(f"{sample['name']}: {duration_seconds:.2f}s · {destination.name}")


if __name__ == "__main__":
    main()
