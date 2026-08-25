#!/usr/bin/env python3
"""Render the v11 Harin compositions with a softer flute lead."""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np

import generate_harin_stage_themes_v11 as score


score.HIGH_MELODY_INSTRUMENT = "flute"
score.HIGH_MELODY_VELOCITY_SCALE = 0.88


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("assets/audio/harin-stage-themes-v12-flute-test"),
    )
    args = parser.parse_args()

    changed_stages = {0, 1, 3, 5}
    for stage_index, builder in enumerate(score.BUILDERS):
        if stage_index not in changed_stages:
            continue
        song, audio, filename, is_loop = builder()
        filename = filename.replace("-v11.wav", "-soft-flute-v12.wav")
        score.write_wav(args.output_dir / filename, audio)
        print(
            f"{filename}\t{audio.shape[0] / score.SAMPLE_RATE:.3f}s\t"
            f"{'LOOP' if is_loop else 'TIMED'}\t"
            f"rms={float(np.sqrt(np.mean(audio * audio))):.4f}\t"
            f"boundary={float(np.max(np.abs(audio[0] - audio[-1]))):.6f}"
        )


if __name__ == "__main__":
    main()
