#!/usr/bin/env python3
"""Generate v8 Harin themes with one fixed rhythmic grid per track."""

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
from generate_harin_stage_themes_v6 import choose_degree_tone, normalize_rms  # noqa: E402
from generate_harin_stage_themes_v7 import (  # noqa: E402
    ReorchestratedSong,
    guitar_chord,
)


DEGREE_PATTERNS = {
    2: (
        (0, 1),
        (2, 1),
        (0, 2),
        (1, 0),
    ),
    3: (
        (0, 1, 2),
        (2, 1, 0),
        (0, 2, 1),
        (1, 0, 2),
    ),
    4: (
        (0, 1, 2, 1),
        (2, 1, 0, 1),
        (0, 2, 1, 2),
        (1, 0, 2, 0),
    ),
}


def resolve_tone(
    chord_name: str,
    degree: int,
    previous: int,
    register_bias: int,
    event_index: int,
) -> int:
    current = choose_degree_tone(chord_name, degree, previous, register_bias)
    if current == previous:
        chord, _ = CHORDS[chord_name]
        alternatives = []
        chord_classes = {note_to_midi(pitch) % 12 for pitch in chord}
        for midi in range(64, 89):
            if midi != previous and midi % 12 in chord_classes:
                alternatives.append(midi)
        if alternatives:
            target = previous + (4 if event_index % 2 == 0 else -4)
            current = min(alternatives, key=lambda midi: abs(midi - target))
    return current


def add_fixed_grid_melody(
    song: ReorchestratedSong,
    progression,
    offsets,
    durations,
    instrument_by_bar,
    velocity: float,
    start_midi: int,
    bus_by_bar=None,
) -> None:
    note_count = len(offsets)
    patterns = DEGREE_PATTERNS[note_count]
    previous = start_midi
    for bar, chord_name in enumerate(progression):
        section = (bar // 4) % 4
        degree_pattern = patterns[bar % 4]
        register_bias = (0, 2, 3, -2)[section]
        instrument = instrument_by_bar(bar)
        bus = bus_by_bar(bar) if bus_by_bar else "melody"
        for event_index, (offset, duration, degree) in enumerate(
            zip(offsets, durations, degree_pattern)
        ):
            varied_degree = (degree + section) % 3
            current = resolve_tone(
                chord_name,
                varied_degree,
                previous,
                register_bias,
                event_index,
            )
            song.note(
                bus,
                song.bar_beat(bar) + offset,
                duration,
                midi_to_note(current),
                velocity * (1.0 + 0.035 * section),
                instrument,
                -0.08 + 0.16 * event_index / max(1, note_count - 1),
            )
            previous = current


def add_fixed_bass(song: ReorchestratedSong, progression, hits, velocity: float) -> None:
    for bar, chord_name in enumerate(progression):
        song.bass(bar, chord_name, hits, velocity)


def stage_01() -> tuple[ReorchestratedSong, np.ndarray, str, bool]:
    progression = ("Dm", "Bb", "F", "C", "Dm", "Bb", "F", "C", "Gm", "Bb", "F", "C", "Dm", "Bb", "Gm", "A")
    song = ReorchestratedSong("01 · 첫 접속", 120, 16, 4, True)
    for bar, chord in enumerate(progression):
        guitar_chord(song, bar, chord, 0.25 + 0.012 * (bar // 4))
    add_fixed_bass(song, progression, ((0.0, 1.92), (2.0, 1.88)), 0.28)
    add_fixed_grid_melody(
        song,
        progression,
        offsets=(0.0, 1.0, 2.0, 3.0),
        durations=(1.02, 1.02, 1.02, 0.94),
        instrument_by_bar=lambda bar: "clarinet",
        velocity=0.36,
        start_midi=69,
    )
    audio = song.render_legato({"room": 0.72, "bass": 0.5, "harmony": 0.0, "melody": 0.72, "percussion": 0.0}, room_amount=0.12)
    return song, normalize_rms(audio, 0.13), "stage-01-straight-beat-loop-v8.wav", True


def stage_02() -> tuple[ReorchestratedSong, np.ndarray, str, bool]:
    progression = ("Dm", "C", "Bb", "A", "Dm", "C", "Gm", "A", "F", "C", "Dm", "Bb", "Gm", "C", "Bb", "A")
    song = ReorchestratedSong("02 · 상상력의 첫걸음", 120, 16, 4, True)
    for bar, chord in enumerate(progression):
        guitar_chord(song, bar, chord, 0.23 + 0.01 * (bar // 4))
    add_fixed_bass(song, progression, ((0.0, 1.92), (2.0, 1.88)), 0.28)
    add_fixed_grid_melody(
        song,
        progression,
        offsets=(0.0, 2.0),
        durations=(2.02, 1.94),
        instrument_by_bar=lambda bar: "clarinet" if bar < 8 else "nylon_guitar",
        bus_by_bar=lambda bar: "melody" if bar < 8 else "harmony",
        velocity=0.35,
        start_midi=69,
    )
    audio = song.render_legato({"room": 0.7, "bass": 0.5, "harmony": 0.7, "melody": 0.72, "percussion": 0.0}, room_amount=0.11)
    return song, normalize_rms(audio, 0.125), "stage-02-half-note-grid-loop-v8.wav", True


def stage_03() -> tuple[ReorchestratedSong, np.ndarray, str, bool]:
    progression = ("Dm", "Gm", "Bb", "A") * 4
    song = ReorchestratedSong("03 · 달빛 유원지의 벽", 128, 16, 4, True)
    for bar, chord in enumerate(progression):
        guitar_chord(song, bar, chord, 0.21)
        song.hand_drum(song.bar_beat(bar), 0.22, -0.04, True)
        song.hand_drum(song.bar_beat(bar) + 1.5, 0.14, 0.04, False)
        song.hand_drum(song.bar_beat(bar) + 3.0, 0.13, 0.0, False)
    add_fixed_bass(song, progression, ((0.0, 1.48), (1.5, 1.48), (3.0, 0.94)), 0.34)
    add_fixed_grid_melody(
        song,
        progression,
        offsets=(0.0, 1.5, 3.0),
        durations=(1.52, 1.52, 0.94),
        instrument_by_bar=lambda bar: "cello",
        velocity=0.32,
        start_midi=69,
    )
    audio = song.render_legato({"room": 0.66, "bass": 0.56, "harmony": 0.0, "melody": 0.7, "percussion": 0.34}, room_amount=0.1)
    return song, normalize_rms(audio, 0.13), "stage-03-consistent-332-loop-v8.wav", True


def stage_04() -> tuple[ReorchestratedSong, np.ndarray, str, bool]:
    progression = ("Dm", "A", "Dm", "Bb", "F", "C", "Gm", "A", "Dm", "A", "Bb", "F", "Gm", "Dm", "Bb", "A", "Dm", "Bb", "Gm", "A")
    song = ReorchestratedSong("04 · 무너지는 회전목마", 120, 20, 3, True)
    for bar, chord in enumerate(progression):
        song.sustained_chord(bar, chord, 0.13, "accordion")
        guitar_chord(song, bar, chord, 0.17)
        song.bass(bar, chord, ((0.0, 2.86),), 0.26)
    add_fixed_grid_melody(
        song,
        progression,
        offsets=(0.0, 1.0, 2.0),
        durations=(1.02, 1.02, 0.94),
        instrument_by_bar=lambda bar: "clarinet",
        velocity=0.3,
        start_midi=69,
    )
    audio = song.render_legato({"room": 0.44, "bass": 0.46, "harmony": 0.0, "melody": 0.66, "percussion": 0.0}, room_amount=0.12)
    return song, normalize_rms(audio, 0.12), "stage-04-consistent-waltz-loop-v8.wav", True


def stage_05() -> tuple[ReorchestratedSong, np.ndarray, str, bool]:
    progression = (
        "Dm", "Dm", "Eb", "A", "Dm", "Bb", "Gm", "A",
        "Dm", "Eb", "Bb", "A", "Dm", "Gm", "Eb", "A",
        "Dm", "Eb", "Gm", "A", "Dm", "Bb", "Eb", "A",
        "F", "C", "Dm", "Bb", "Gm", "A", "Dm", "Dm",
    )
    song = ReorchestratedSong("05 · 하린이 가장 두려워한 것", 128, 32, 4, False)
    for bar, chord in enumerate(progression):
        guitar_chord(song, bar, chord, 0.19)
        song.hand_drum(song.bar_beat(bar), 0.22, -0.04, True)
        song.hand_drum(song.bar_beat(bar) + 2.0, 0.13, 0.04, False)
    add_fixed_bass(song, progression, ((0.0, 1.92), (2.0, 1.88)), 0.34)
    add_fixed_grid_melody(
        song,
        progression,
        offsets=(0.0, 2.0),
        durations=(2.02, 1.94),
        instrument_by_bar=lambda bar: "bassoon" if bar < 16 else "cello",
        bus_by_bar=lambda bar: "melody" if bar < 16 else "harmony",
        velocity=0.3,
        start_midi=65,
    )
    audio = song.render_legato({"room": 0.64, "bass": 0.58, "harmony": 0.62, "melody": 0.66, "percussion": 0.32}, timed_fade=True, room_amount=0.09)
    return song, normalize_rms(audio, 0.125), "stage-05-half-note-grid-60s-v8.wav", False


def stage_06() -> tuple[ReorchestratedSong, np.ndarray, str, bool]:
    progression = ("F", "C", "Dm", "Bb", "Gm", "C", "F", "C", "F", "Dm", "Bb", "Gm", "F", "Bb", "Gm", "C")
    song = ReorchestratedSong("06 · 하린의 웃음이 남긴 빛", 120, 16, 4, True)
    for bar, chord in enumerate(progression):
        guitar_chord(song, bar, chord, 0.18)
    add_fixed_bass(song, progression, ((0.0, 1.92), (2.0, 1.88)), 0.18)
    add_fixed_grid_melody(
        song,
        progression,
        offsets=(0.0, 2.0),
        durations=(2.02, 1.94),
        instrument_by_bar=lambda bar: "clarinet",
        velocity=0.27,
        start_midi=69,
    )
    audio = song.render_legato({"room": 0.6, "bass": 0.34, "harmony": 0.0, "melody": 0.58, "percussion": 0.0}, room_amount=0.14)
    return song, normalize_rms(audio, 0.105), "stage-06-half-note-grid-loop-v8.wav", True


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
        default=Path("assets/audio/harin-stage-themes-v8"),
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
