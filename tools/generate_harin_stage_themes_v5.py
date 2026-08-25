#!/usr/bin/env python3
"""Generate legato, voice-led v5 Harin themes with natural room continuity."""

from __future__ import annotations

import argparse
import math
import sys
import wave
from pathlib import Path

import numpy as np

sys.dont_write_bytecode = True
from generate_harin_stage_themes_v4 import (  # noqa: E402
    SAMPLE_RATE,
    CHORDS,
    AcousticSong,
    instrument_sample,
    midi_to_note,
    note_to_midi,
)


class LegatoSong(AcousticSong):
    def __init__(self, title: str, bpm: float, bars: int, beats_per_bar: int, loop_mode: bool):
        super().__init__(title, bpm, bars, beats_per_bar)
        self.loop_mode = loop_mode

    def note(
        self,
        bus: str,
        beat: float,
        duration_beats: float,
        pitch: str,
        velocity: float,
        instrument: str,
        pan: float = 0.0,
    ) -> None:
        start = int(round(beat * self.seconds_per_beat * SAMPLE_RATE))
        sample = instrument_sample(
            pitch,
            max(0.025, duration_beats * self.seconds_per_beat),
            instrument,
        ) * velocity
        angle = (max(-1.0, min(1.0, pan)) + 1.0) * math.pi / 4.0
        left = sample * math.cos(angle)
        right = sample * math.sin(angle)
        end = start + sample.size
        if start >= self.total_samples:
            return
        direct_end = min(self.total_samples, end)
        direct_length = direct_end - start
        self.buses[bus][start:direct_end, 0] += left[:direct_length]
        self.buses[bus][start:direct_end, 1] += right[:direct_length]
        overflow = end - self.total_samples
        if self.loop_mode and overflow > 0:
            wrap_length = min(overflow, self.total_samples)
            self.buses[bus][:wrap_length, 0] += left[direct_length:direct_length + wrap_length]
            self.buses[bus][:wrap_length, 1] += right[direct_length:direct_length + wrap_length]

    def sustained_chord(self, bar: int, chord_name: str, velocity: float, instrument: str = "strings") -> None:
        pitches, _ = CHORDS[chord_name]
        for index, pitch in enumerate(pitches):
            self.note(
                "room",
                self.bar_beat(bar),
                self.beats_per_bar * 0.985,
                pitch,
                velocity,
                instrument,
                (-0.24, 0.0, 0.24)[index],
            )

    def render_legato(
        self,
        gains: dict[str, float],
        timed_fade: bool = False,
        room_amount: float = 0.12,
    ) -> np.ndarray:
        mix = np.zeros_like(self.buses["room"])
        for bus_name, bus in self.buses.items():
            mix += bus * gains.get(bus_name, 1.0)

        dry = mix.copy()
        reflections = ((0.052, 0.42), (0.107, 0.3), (0.173, 0.2))
        for delay_seconds, relative_gain in reflections:
            delay = int(delay_seconds * SAMPLE_RATE)
            gain = room_amount * relative_gain
            if self.loop_mode:
                reflected = np.roll(dry, delay, axis=0)
                reflected = (reflected + np.roll(reflected, 1, axis=0) + np.roll(reflected, 2, axis=0)) / 3.0
                mix += reflected * gain
            else:
                reflected = (dry[:-delay] + np.roll(dry[:-delay], 1, axis=0) + np.roll(dry[:-delay], 2, axis=0)) / 3.0
                mix[delay:] += reflected * gain

        mix -= np.mean(mix, axis=0, keepdims=True)
        mix = np.tanh(mix * 1.02)
        peak = float(np.max(np.abs(mix)))
        if peak > 0:
            mix *= 0.8 / peak

        edge = max(16, int(0.006 * SAMPLE_RATE))
        mix[:edge] *= np.linspace(0.0, 1.0, edge, dtype=np.float32)[:, None]
        if self.loop_mode:
            mix[-edge:] *= np.linspace(1.0, 0.0, edge, dtype=np.float32)[:, None]
        elif timed_fade:
            times = np.arange(self.total_samples, dtype=np.float32) / SAMPLE_RATE
            volume = np.interp(
                times,
                (0.0, 40.0, 52.0, 58.5, 60.0),
                (1.0, 1.0, 0.68, 0.22, 0.0),
            ).astype(np.float32)
            mix *= volume[:, None]
        return mix.astype(np.float32)


def chord_candidates(chord_name: str, low_midi: int = 65, high_midi: int = 86) -> list[int]:
    chord, _ = CHORDS[chord_name]
    pitch_classes = {note_to_midi(note) % 12 for note in chord}
    return [midi for midi in range(low_midi, high_midi + 1) if midi % 12 in pitch_classes]


def nearest_tone(chord_name: str, target_midi: float, low_midi: int = 65, high_midi: int = 86) -> int:
    candidates = chord_candidates(chord_name, low_midi, high_midi)
    return min(candidates, key=lambda candidate: abs(candidate - target_midi))


def add_voice_led_line(
    song: LegatoSong,
    progression,
    instrument: str,
    velocity: float,
    notes_per_bar: int,
    start_midi: int,
    active_bars=None,
    bus: str = "melody",
    pan_width: float = 0.16,
) -> None:
    previous = start_midi
    directions = (4.0, -3.0, 5.0, -4.0, 3.0, 4.0, -5.0, 3.0)
    if active_bars is None:
        active_bars = set(range(len(progression)))
    else:
        active_bars = set(active_bars)
    for bar, chord_name in enumerate(progression):
        if bar not in active_bars:
            previous = nearest_tone(chord_name, previous)
            continue
        spacing = song.beats_per_bar / notes_per_bar
        for note_index in range(notes_per_bar):
            direction = directions[(bar * notes_per_bar + note_index) % len(directions)]
            target = previous + direction
            ranked = sorted(
                chord_candidates(chord_name),
                key=lambda candidate: abs(candidate - target),
            )
            current = next(
                (candidate for candidate in ranked if candidate != previous),
                ranked[0],
            )
            duration = spacing * 1.02
            pan = -pan_width + 2.0 * pan_width * ((note_index + bar) % notes_per_bar) / max(1, notes_per_bar - 1)
            song.note(
                bus,
                song.bar_beat(bar) + note_index * spacing,
                duration,
                midi_to_note(current),
                velocity,
                instrument,
                pan,
            )
            previous = current


def add_root_motion(song: LegatoSong, progression, hits, velocity: float) -> None:
    for bar, chord_name in enumerate(progression):
        song.bass(bar, chord_name, hits, velocity)


def add_subtle_park_motif(
    song: LegatoSong,
    progression,
    every_bars: int,
    velocity: float,
) -> None:
    """A restrained harp rise suggesting carousel lights without a circus flourish."""
    for bar in range(every_bars - 1, len(progression), every_bars):
        chord, _ = CHORDS[progression[bar]]
        if song.beats_per_bar == 3:
            offsets = (1.8, 2.15, 2.5)
            duration = 0.32
        else:
            offsets = (2.75, 3.15, 3.55)
            duration = 0.32
        for index, offset in enumerate(offsets):
            song.note(
                "harmony",
                song.bar_beat(bar) + offset,
                duration,
                midi_to_note(note_to_midi(chord[index]) + 12),
                velocity,
                "harp",
                -0.1 + index * 0.1,
            )


def stage_01() -> tuple[LegatoSong, np.ndarray, str, bool]:
    progression = ("Dm", "Bb", "F", "C", "Dm", "Bb", "F", "C", "Gm", "Bb", "F", "C", "Dm", "Bb", "Gm", "A")
    song = LegatoSong("01 · 첫 접속", 120, 16, 4, True)
    for bar, chord_name in enumerate(progression):
        song.sustained_chord(bar, chord_name, 0.3, "strings")
    add_root_motion(song, progression, ((0.0, 1.92), (2.0, 1.88)), 0.34)
    add_voice_led_line(song, progression, "felt_piano", 0.48, 2, 69, active_bars=range(0, 16), pan_width=0.1)
    add_subtle_park_motif(song, progression, 4, 0.15)
    audio = song.render_legato({"room": 0.72, "bass": 0.58, "harmony": 0.0, "melody": 0.88, "percussion": 0.0}, room_amount=0.16)
    return song, audio, "stage-01-first-link-legato-loop-v5.wav", True


def stage_02() -> tuple[LegatoSong, np.ndarray, str, bool]:
    progression = ("Dm", "C", "Bb", "A", "Dm", "C", "Gm", "A", "F", "C", "Dm", "Bb", "Gm", "C", "Bb", "A")
    song = LegatoSong("02 · 상상력의 첫걸음", 120, 16, 4, True)
    for bar, chord_name in enumerate(progression):
        song.sustained_chord(bar, chord_name, 0.27, "strings")
        song.woodblock(song.bar_beat(bar), 0.11, -0.08)
        song.woodblock(song.bar_beat(bar) + 2.0, 0.09, 0.08)
    add_root_motion(song, progression, ((0.0, 1.9), (2.0, 1.85)), 0.36)
    add_voice_led_line(song, progression, "felt_piano", 0.44, 2, 69, active_bars=range(0, 16, 2), pan_width=0.12)
    add_voice_led_line(song, progression, "harp", 0.4, 2, 72, active_bars=range(1, 16, 2), bus="harmony", pan_width=0.12)
    add_subtle_park_motif(song, progression, 4, 0.12)
    audio = song.render_legato({"room": 0.68, "bass": 0.62, "harmony": 0.78, "melody": 0.84, "percussion": 0.26}, room_amount=0.14)
    return song, audio, "stage-02-imagination-step-legato-loop-v5.wav", True


def stage_03() -> tuple[LegatoSong, np.ndarray, str, bool]:
    progression = ("Dm", "Gm", "Bb", "A") * 4
    song = LegatoSong("03 · 달빛 유원지의 벽", 128, 16, 4, True)
    for bar, chord_name in enumerate(progression):
        song.sustained_chord(bar, chord_name, 0.28, "strings")
        song.hand_drum(song.bar_beat(bar), 0.32, -0.05, True)
        song.hand_drum(song.bar_beat(bar) + 2.0, 0.22, 0.05, False)
    add_root_motion(song, progression, ((0.0, 1.45), (1.5, 1.42), (3.0, 0.9)), 0.46)
    add_voice_led_line(song, progression, "flute", 0.42, 4, 69, active_bars=range(0, 16), pan_width=0.08)
    add_subtle_park_motif(song, progression, 4, 0.1)
    audio = song.render_legato({"room": 0.66, "bass": 0.7, "harmony": 0.0, "melody": 0.84, "percussion": 0.48}, room_amount=0.13)
    return song, audio, "stage-03-moonlight-wall-legato-loop-v5.wav", True


def stage_04() -> tuple[LegatoSong, np.ndarray, str, bool]:
    progression = ("Dm", "A", "Dm", "Bb", "F", "C", "Gm", "A", "Dm", "A", "Bb", "F", "Gm", "Dm", "Bb", "A", "Dm", "Bb", "Gm", "A")
    song = LegatoSong("04 · 무너지는 회전목마", 120, 20, 3, True)
    for bar, chord_name in enumerate(progression):
        chord, _ = CHORDS[chord_name]
        song.bass(bar, chord_name, ((0.0, 0.92),), 0.42)
        for beat in (1.0, 2.0):
            for index, pitch in enumerate(chord):
                song.note("harmony", song.bar_beat(bar) + beat, 0.92, pitch, 0.22, "felt_piano", -0.14 + index * 0.14)
    add_voice_led_line(song, progression, "flute", 0.4, 3, 69, active_bars=range(0, 20), pan_width=0.08)
    add_subtle_park_motif(song, progression, 4, 0.11)
    audio = song.render_legato({"room": 0.0, "bass": 0.58, "harmony": 0.8, "melody": 0.82, "percussion": 0.0}, room_amount=0.17)
    return song, audio, "stage-04-carousel-legato-loop-v5.wav", True


def stage_05() -> tuple[LegatoSong, np.ndarray, str, bool]:
    progression = (
        "Dm", "Dm", "Eb", "A", "Dm", "Bb", "Gm", "A",
        "Dm", "Eb", "Bb", "A", "Dm", "Gm", "Eb", "A",
        "Dm", "Eb", "Gm", "A", "Dm", "Bb", "Eb", "A",
        "F", "C", "Dm", "Bb", "Gm", "A", "Dm", "Dm",
    )
    song = LegatoSong("05 · 하린이 가장 두려워한 것", 128, 32, 4, False)
    for bar, chord_name in enumerate(progression):
        phase = bar // 8
        song.sustained_chord(bar, chord_name, 0.28 + phase * 0.012, "strings")
        song.hand_drum(song.bar_beat(bar), 0.32 + phase * 0.015, -0.05, True)
        song.hand_drum(song.bar_beat(bar) + 2.0, 0.22 + phase * 0.012, 0.05, False)
    add_root_motion(song, progression, ((0.0, 1.88), (2.0, 1.82)), 0.46)
    add_voice_led_line(song, progression, "felt_piano", 0.42, 2, 69, active_bars=range(0, 24), pan_width=0.08)
    add_voice_led_line(song, progression, "harp", 0.36, 2, 72, active_bars=range(24, 32), pan_width=0.1)
    add_subtle_park_motif(song, progression, 8, 0.1)
    audio = song.render_legato(
        {"room": 0.72, "bass": 0.72, "harmony": 0.74, "melody": 0.84, "percussion": 0.52},
        timed_fade=True,
        room_amount=0.12,
    )
    return song, audio, "stage-05-harin-fear-legato-60s-v5.wav", False


def stage_06() -> tuple[LegatoSong, np.ndarray, str, bool]:
    progression = ("F", "C", "Dm", "Bb", "Gm", "C", "F", "C", "F", "Dm", "Bb", "Gm", "F", "Bb", "Gm", "C")
    song = LegatoSong("06 · 하린의 웃음이 남긴 빛", 120, 16, 4, True)
    for bar, chord_name in enumerate(progression):
        song.sustained_chord(bar, chord_name, 0.24, "strings")
    add_root_motion(song, progression, ((0.0, 3.82),), 0.28)
    add_voice_led_line(song, progression, "flute", 0.38, 2, 69, active_bars=range(0, 16), pan_width=0.05)
    add_subtle_park_motif(song, progression, 4, 0.09)
    audio = song.render_legato({"room": 0.6, "bass": 0.48, "harmony": 0.0, "melody": 0.76, "percussion": 0.0}, room_amount=0.18)
    return song, audio, "stage-06-lantern-river-legato-loop-v5.wav", True


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
        default=Path("assets/audio/harin-stage-themes-v5"),
    )
    args = parser.parse_args()
    target_rms_by_stage = (0.15, 0.15, 0.16, 0.15, 0.14, 0.13)
    for stage_index, builder in enumerate((stage_01, stage_02, stage_03, stage_04, stage_05, stage_06)):
        song, audio, filename, is_loop = builder()
        current_rms = float(np.sqrt(np.mean(audio * audio)))
        if current_rms > 0:
            audio *= min(1.0, target_rms_by_stage[stage_index] / current_rms)
        output = args.output_dir / filename
        write_wav(output, audio)
        boundary = float(np.max(np.abs(audio[0] - audio[-1])))
        rms = float(np.sqrt(np.mean(audio * audio)))
        print(
            f"{filename}\t{audio.shape[0] / SAMPLE_RATE:.3f}s\t"
            f"{'LOOP' if is_loop else 'TIMED'}\tboundary={boundary:.6f}\trms={rms:.4f}"
        )


if __name__ == "__main__":
    main()
