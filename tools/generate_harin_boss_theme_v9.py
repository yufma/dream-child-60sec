#!/usr/bin/env python3
"""Generate a heavier, natural-instrument 60-second Harin boss theme."""

from __future__ import annotations

import argparse
import sys
import wave
from pathlib import Path

import numpy as np

sys.dont_write_bytecode = True
from generate_harin_stage_themes_v4 import (  # noqa: E402
    SAMPLE_RATE,
    CHORDS,
    midi_to_note,
    note_to_midi,
)
from generate_harin_stage_themes_v6 import normalize_rms  # noqa: E402
from generate_harin_stage_themes_v7 import ReorchestratedSong  # noqa: E402


PROGRESSION = (
    "Dm", "Dm", "Eb", "A",
    "Dm", "Bb", "Gm", "A",
    "Dm", "Eb", "Bb", "A",
    "Dm", "Gm", "Eb", "A",
    "Dm", "Eb", "Gm", "A",
    "Dm", "Bb", "A", "Dm",
)

DEGREE_PAIRS = (
    (0, 2),
    (1, 0),
    (2, 1),
    (0, 1),
)


def low_chord_tone(chord_name: str, degree: int, previous: int, direction: int) -> int:
    chord, _ = CHORDS[chord_name]
    pitch_class = note_to_midi(chord[degree % 3]) % 12
    candidates = [
        midi
        for midi in range(50, 75)
        if midi % 12 == pitch_class
    ]
    current = min(candidates, key=lambda midi: abs(midi - (previous + direction)))
    if current == previous:
        alternatives = []
        chord_classes = {note_to_midi(pitch) % 12 for pitch in chord}
        for midi in range(50, 75):
            if midi != previous and midi % 12 in chord_classes:
                alternatives.append(midi)
        if alternatives:
            current = min(
                alternatives,
                key=lambda midi: abs(midi - (previous + direction)),
            )
    return current


def build_boss_theme() -> tuple[ReorchestratedSong, np.ndarray]:
    # 24 bars * 4 beats * 60 / 96 BPM = exactly 60 seconds.
    song = ReorchestratedSong(
        "05 · 하린이 가장 두려워한 것 · 중압감 변주",
        bpm=96,
        bars=24,
        beats_per_bar=4,
        loop_mode=False,
    )

    previous = 57  # A3
    for bar, chord_name in enumerate(PROGRESSION):
        phase = bar // 4
        chord, _ = CHORDS[chord_name]

        # Low cello voicing replaces the lighter guitar texture.
        for voice_index, pitch in enumerate(chord):
            song.note(
                "room",
                song.bar_beat(bar),
                3.94,
                midi_to_note(note_to_midi(pitch) - 12),
                0.17 + min(phase, 3) * 0.01,
                "cello",
                -0.16 + voice_index * 0.16,
            )
            song.note(
                "room",
                song.bar_beat(bar),
                3.9,
                pitch,
                0.13,
                "cello",
                -0.11 + voice_index * 0.11,
            )

        song.bass(
            bar,
            chord_name,
            ((0.0, 1.94), (2.0, 1.9)),
            0.43 + min(phase, 3) * 0.015,
        )
        song.hand_drum(
            song.bar_beat(bar),
            0.38 + min(phase, 3) * 0.018,
            -0.04,
            True,
        )
        song.hand_drum(
            song.bar_beat(bar) + 2.0,
            0.27 + min(phase, 3) * 0.014,
            0.04,
            True,
        )

        degrees = DEGREE_PAIRS[bar % 4]
        for event_index, (offset, degree) in enumerate(zip((0.0, 2.0), degrees)):
            direction = 4 if event_index == 0 else -3
            current = low_chord_tone(
                chord_name,
                (degree + (bar // 8)) % 3,
                previous,
                direction,
            )
            song.note(
                "melody" if bar < 12 else "harmony",
                song.bar_beat(bar) + offset,
                1.94,
                midi_to_note(current),
                0.34 if bar < 12 else 0.31,
                "bassoon" if bar < 12 else "cello",
                -0.06 if event_index == 0 else 0.06,
            )
            previous = current

    audio = song.render_legato(
        {
            "room": 0.78,
            "bass": 0.64,
            "harmony": 0.7,
            "melody": 0.78,
            "percussion": 0.5,
        },
        timed_fade=True,
        room_amount=0.12,
    )
    return song, normalize_rms(audio, 0.135)


def write_wav(path: Path, audio: np.ndarray) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    pcm = np.clip(audio * 32767.0, -32768, 32767).astype("<i2")
    with wave.open(str(path), "wb") as output:
        output.setnchannels(2)
        output.setsampwidth(2)
        output.setframerate(SAMPLE_RATE)
        output.writeframes(pcm.tobytes())


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(
            "assets/audio/harin-stage-themes-v9/"
            "stage-05-heavy-boss-60s-v9.wav"
        ),
    )
    args = parser.parse_args()
    song, audio = build_boss_theme()
    write_wav(args.output, audio)
    print(f"file={args.output}")
    print(f"duration={audio.shape[0] / SAMPLE_RATE:.3f}s")
    print(f"bpm={song.bpm:.0f}")
    print(f"rms={float(np.sqrt(np.mean(audio * audio))):.4f}")
    print(f"peak={float(np.max(np.abs(audio))):.4f}")


if __name__ == "__main__":
    main()
