#!/usr/bin/env python3
"""Generate v6 Harin themes with varied A/A'/B/A melodies and no surprise park stingers."""

from __future__ import annotations

import argparse
import math
import sys
import wave
from pathlib import Path

import numpy as np

sys.dont_write_bytecode = True
from generate_harin_stage_themes_v5 import (  # noqa: E402
    SAMPLE_RATE,
    CHORDS,
    LegatoSong,
    chord_candidates,
    midi_to_note,
    note_to_midi,
)


FOUR_FOUR_PATTERNS = (
    (
        ((0.0, 1.92, 0), (2.0, 1.92, 1)),
        ((0.0, 1.92, 2), (2.0, 1.92, 1)),
        ((0.0, 1.92, 0), (2.0, 1.92, 2)),
        ((0.0, 1.92, 1), (2.0, 1.92, 0)),
    ),
    (
        ((0.0, 1.18, 0), (1.25, 0.72, 1), (2.25, 1.62, 2)),
        ((0.0, 1.18, 2), (1.25, 0.72, 1), (2.25, 1.62, 0)),
        ((0.0, 1.18, 1), (1.25, 0.72, 2), (2.25, 1.62, 0)),
        ((0.0, 1.18, 0), (1.25, 0.72, 2), (2.25, 1.62, 1)),
    ),
    (
        ((0.0, 2.68, 2), (2.75, 1.12, 1)),
        ((0.0, 2.68, 1), (2.75, 1.12, 0)),
        ((0.0, 2.68, 2), (2.75, 1.12, 0)),
        ((0.0, 2.68, 1), (2.75, 1.12, 2)),
    ),
    (
        ((0.0, 0.92, 0), (1.0, 1.78, 1), (2.85, 1.02, 0)),
        ((0.0, 0.92, 2), (1.0, 1.78, 1), (2.85, 1.02, 0)),
        ((0.0, 0.92, 1), (1.0, 1.78, 2), (2.85, 1.02, 1)),
        ((0.0, 0.92, 0), (1.0, 1.78, 1), (2.85, 1.02, 2)),
    ),
)

THREE_FOUR_PATTERNS = (
    (
        ((0.0, 1.42, 0), (1.5, 1.42, 1)),
        ((0.0, 1.42, 2), (1.5, 1.42, 1)),
        ((0.0, 1.42, 0), (1.5, 1.42, 2)),
        ((0.0, 1.42, 1), (1.5, 1.42, 0)),
    ),
    (
        ((0.0, 0.82, 0), (0.9, 0.82, 1), (1.8, 1.08, 2)),
        ((0.0, 0.82, 2), (0.9, 0.82, 1), (1.8, 1.08, 0)),
        ((0.0, 0.82, 1), (0.9, 0.82, 2), (1.8, 1.08, 0)),
        ((0.0, 0.82, 0), (0.9, 0.82, 2), (1.8, 1.08, 1)),
    ),
    (
        ((0.0, 2.86, 2),),
        ((0.0, 2.86, 1),),
        ((0.0, 2.86, 0),),
        ((0.0, 2.86, 1),),
    ),
    (
        ((0.0, 1.08, 0), (1.15, 1.72, 1)),
        ((0.0, 1.08, 2), (1.15, 1.72, 1)),
        ((0.0, 1.08, 1), (1.15, 1.72, 0)),
        ((0.0, 1.08, 0), (1.15, 1.72, 2)),
    ),
    (
        ((0.0, 0.78, 0), (0.85, 0.78, 1), (1.7, 1.18, 2)),
        ((0.0, 0.78, 2), (0.85, 0.78, 1), (1.7, 1.18, 0)),
        ((0.0, 0.78, 1), (0.85, 0.78, 2), (1.7, 1.18, 0)),
        ((0.0, 0.78, 0), (0.85, 0.78, 2), (1.7, 1.18, 1)),
    ),
)


def choose_degree_tone(
    chord_name: str,
    degree: int,
    previous_midi: int,
    register_bias: int,
) -> int:
    chord, _ = CHORDS[chord_name]
    pitch_class = note_to_midi(chord[degree % 3]) % 12
    candidates = [
        midi
        for midi in chord_candidates(chord_name, 64, 88)
        if midi % 12 == pitch_class
    ]
    target = previous_midi + register_bias
    return min(candidates, key=lambda midi: abs(midi - target))


def add_varied_melody(
    song: LegatoSong,
    progression,
    instrument: str,
    velocity: float,
    start_midi: int,
    bus: str = "melody",
    cycle_offset: int = 0,
    start_bar: int = 0,
) -> None:
    previous = start_midi
    if song.beats_per_bar == 3:
        patterns = THREE_FOUR_PATTERNS
        section_length = 4
    else:
        patterns = FOUR_FOUR_PATTERNS
        section_length = 4
    for local_bar, chord_name in enumerate(progression):
        bar = start_bar + local_bar
        section = ((local_bar // section_length) + cycle_offset) % len(patterns)
        bar_pattern = patterns[section][local_bar % 4]
        register_bias = 3 if section == 2 else -2 if section == 3 else 0
        for event_index, (offset, duration, degree) in enumerate(bar_pattern):
            if cycle_offset % 2 == 1:
                degree = (degree + 1) % 3
            current = choose_degree_tone(
                chord_name,
                degree,
                previous,
                register_bias,
            )
            if current == previous:
                alternatives = [
                    midi
                    for midi in chord_candidates(chord_name, 64, 88)
                    if midi != previous
                ]
                if alternatives:
                    current = min(
                        alternatives,
                        key=lambda midi: abs(
                            midi - (previous + (4 if event_index % 2 == 0 else -4))
                        ),
                    )
            song.note(
                bus,
                song.bar_beat(bar) + offset,
                duration,
                midi_to_note(current),
                velocity,
                instrument,
                -0.1 + 0.2 * ((bar + event_index) % 3) / 2.0,
            )
            previous = current


def add_root_motion(song: LegatoSong, progression, velocity: float, active: bool = True) -> None:
    if not active:
        return
    for bar, chord_name in enumerate(progression):
        if bar % 4 in (0, 1):
            hits = ((0.0, 1.92), (2.0, 1.86))
        elif bar % 4 == 2:
            hits = ((0.0, 2.85), (3.0, 0.86))
        else:
            hits = ((0.0, 3.82),)
        song.bass(bar, chord_name, hits, velocity)


def normalize_rms(audio: np.ndarray, target_rms: float) -> np.ndarray:
    rms = float(np.sqrt(np.mean(audio * audio)))
    if rms > 0:
        audio *= min(1.0, target_rms / rms)
    return audio


def stage_01() -> tuple[LegatoSong, np.ndarray, str, bool]:
    progression = ("Dm", "Bb", "F", "C", "Dm", "Bb", "F", "C", "Gm", "Bb", "F", "C", "Dm", "Bb", "Gm", "A")
    song = LegatoSong("01 · 첫 접속", 120, 16, 4, True)
    for bar, chord in enumerate(progression):
        song.sustained_chord(bar, chord, 0.28 + (0.025 if bar // 4 == 2 else 0.0), "strings")
    add_root_motion(song, progression, 0.32)
    add_varied_melody(song, progression, "felt_piano", 0.46, 69)
    audio = song.render_legato({"room": 0.7, "bass": 0.56, "harmony": 0.0, "melody": 0.86, "percussion": 0.0}, room_amount=0.15)
    return song, normalize_rms(audio, 0.145), "stage-01-first-link-varied-loop-v6.wav", True


def stage_02() -> tuple[LegatoSong, np.ndarray, str, bool]:
    progression = ("Dm", "C", "Bb", "A", "Dm", "C", "Gm", "A", "F", "C", "Dm", "Bb", "Gm", "C", "Bb", "A")
    song = LegatoSong("02 · 상상력의 첫걸음", 120, 16, 4, True)
    for bar, chord in enumerate(progression):
        song.sustained_chord(bar, chord, 0.25 + 0.018 * (bar // 4), "strings")
    add_root_motion(song, progression, 0.34)
    add_varied_melody(song, progression[:8], "felt_piano", 0.43, 69)
    add_varied_melody(song, progression[8:], "harp", 0.38, 72, bus="harmony", cycle_offset=2, start_bar=8)
    audio = song.render_legato({"room": 0.67, "bass": 0.6, "harmony": 0.78, "melody": 0.82, "percussion": 0.0}, room_amount=0.14)
    return song, normalize_rms(audio, 0.145), "stage-02-imagination-step-varied-loop-v6.wav", True


def stage_03() -> tuple[LegatoSong, np.ndarray, str, bool]:
    progression = ("Dm", "Gm", "Bb", "A") * 4
    song = LegatoSong("03 · 달빛 유원지의 벽", 128, 16, 4, True)
    for bar, chord in enumerate(progression):
        song.sustained_chord(bar, chord, 0.26 + 0.015 * ((bar // 4) % 2), "strings")
        song.hand_drum(song.bar_beat(bar), 0.28, -0.04, True)
        if bar % 2 == 1:
            song.hand_drum(song.bar_beat(bar) + 2.5, 0.18, 0.04, False)
    add_root_motion(song, progression, 0.42)
    add_varied_melody(song, progression, "flute", 0.39, 69)
    audio = song.render_legato({"room": 0.64, "bass": 0.66, "harmony": 0.0, "melody": 0.82, "percussion": 0.42}, room_amount=0.12)
    return song, normalize_rms(audio, 0.15), "stage-03-moonlight-wall-varied-loop-v6.wav", True


def stage_04() -> tuple[LegatoSong, np.ndarray, str, bool]:
    progression = ("Dm", "A", "Dm", "Bb", "F", "C", "Gm", "A", "Dm", "A", "Bb", "F", "Gm", "Dm", "Bb", "A", "Dm", "Bb", "Gm", "A")
    song = LegatoSong("04 · 무너지는 회전목마", 120, 20, 3, True)
    for bar, chord_name in enumerate(progression):
        chord, _ = CHORDS[chord_name]
        song.bass(bar, chord_name, ((0.0, 0.9),), 0.38)
        for beat in (1.0, 2.0):
            for index, pitch in enumerate(chord):
                song.note("harmony", song.bar_beat(bar) + beat, 0.9, pitch, 0.19 + 0.02 * (bar // 8), "felt_piano", -0.12 + index * 0.12)
    add_varied_melody(song, progression, "flute", 0.37, 69)
    audio = song.render_legato({"room": 0.0, "bass": 0.55, "harmony": 0.76, "melody": 0.8, "percussion": 0.0}, room_amount=0.15)
    return song, normalize_rms(audio, 0.14), "stage-04-carousel-varied-loop-v6.wav", True


def stage_05() -> tuple[LegatoSong, np.ndarray, str, bool]:
    progression = (
        "Dm", "Dm", "Eb", "A", "Dm", "Bb", "Gm", "A",
        "Dm", "Eb", "Bb", "A", "Dm", "Gm", "Eb", "A",
        "Dm", "Eb", "Gm", "A", "Dm", "Bb", "Eb", "A",
        "F", "C", "Dm", "Bb", "Gm", "A", "Dm", "Dm",
    )
    song = LegatoSong("05 · 하린이 가장 두려워한 것", 128, 32, 4, False)
    for bar, chord in enumerate(progression):
        phase = bar // 8
        song.sustained_chord(bar, chord, 0.27 + phase * 0.01, "strings")
        song.hand_drum(song.bar_beat(bar), 0.28 + phase * 0.012, -0.04, True)
        if bar % 2 == 0:
            song.hand_drum(song.bar_beat(bar) + 2.0, 0.17 + phase * 0.01, 0.04, False)
    add_root_motion(song, progression, 0.42)
    add_varied_melody(song, progression[:16], "felt_piano", 0.39, 69)
    add_varied_melody(song, progression[16:], "harp", 0.34, 72, bus="harmony", cycle_offset=2, start_bar=16)
    audio = song.render_legato({"room": 0.7, "bass": 0.68, "harmony": 0.7, "melody": 0.8, "percussion": 0.44}, timed_fade=True, room_amount=0.11)
    return song, normalize_rms(audio, 0.135), "stage-05-harin-fear-varied-60s-v6.wav", False


def stage_06() -> tuple[LegatoSong, np.ndarray, str, bool]:
    progression = ("F", "C", "Dm", "Bb", "Gm", "C", "F", "C", "F", "Dm", "Bb", "Gm", "F", "Bb", "Gm", "C")
    song = LegatoSong("06 · 하린의 웃음이 남긴 빛", 120, 16, 4, True)
    for bar, chord in enumerate(progression):
        song.sustained_chord(bar, chord, 0.22 + 0.015 * (bar // 8), "strings")
    add_root_motion(song, progression, 0.25)
    add_varied_melody(song, progression, "flute", 0.34, 69)
    audio = song.render_legato({"room": 0.58, "bass": 0.45, "harmony": 0.0, "melody": 0.7, "percussion": 0.0}, room_amount=0.17)
    return song, normalize_rms(audio, 0.12), "stage-06-lantern-river-varied-loop-v6.wav", True


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
        "--output-dir",
        type=Path,
        default=Path("assets/audio/harin-stage-themes-v6"),
    )
    args = parser.parse_args()
    for builder in (stage_01, stage_02, stage_03, stage_04, stage_05, stage_06):
        song, audio, filename, is_loop = builder()
        output = args.output_dir / filename
        write_wav(output, audio)
        rms = float(np.sqrt(np.mean(audio * audio)))
        boundary = float(np.max(np.abs(audio[0] - audio[-1])))
        print(
            f"{filename}\t{audio.shape[0] / SAMPLE_RATE:.3f}s\t"
            f"{'LOOP' if is_loop else 'TIMED'}\trms={rms:.4f}\tboundary={boundary:.6f}"
        )


if __name__ == "__main__":
    main()
