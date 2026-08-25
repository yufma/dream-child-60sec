from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
STRUCTURES = ROOT / "assets" / "structures"


def normalize_relay(stem: str, target_size: tuple[int, int]) -> None:
    for state in ("off", "on"):
        source = STRUCTURES / f"harin-stage-03-{stem}-relay-{state}-v1.png"
        output = STRUCTURES / f"harin-stage-03-{stem}-relay-{state}-game-v2.png"
        image = Image.open(source).convert("RGBA")
        scale = min(target_size[0] / image.width, target_size[1] / image.height)
        resized = image.resize(
            (max(1, round(image.width * scale)), max(1, round(image.height * scale))),
            Image.Resampling.NEAREST,
        )
        alpha_box = resized.getchannel("A").getbbox()
        if alpha_box is None:
            raise RuntimeError(f"No visible pixels in {source}")
        x = (target_size[0] - resized.width) // 2
        y = target_size[1] - 1 - alpha_box[3]
        canvas = Image.new("RGBA", target_size, (0, 0, 0, 0))
        canvas.alpha_composite(resized, (x, y))
        canvas.save(output, optimize=True)


def normalize_collector(state: str) -> None:
    source = STRUCTURES / f"harin-stage-03-collector-{state}-v1.png"
    output = STRUCTURES / f"harin-stage-03-collector-{state}-game-v2.png"
    image = Image.open(source).convert("RGBA")
    # 좌우 기준은 유지해 문 중심 판정을 보존하고, 위아래 투명 여백만 제거해 바닥을 y=500에 맞춘다.
    cropped = image.crop((0, 23, image.width, 1004))
    cropped.resize((122, 448), Image.Resampling.NEAREST).save(output, optimize=True)


normalize_relay("moon", (80, 112))
normalize_relay("star-balloon", (112, 128))
normalize_relay("carousel", (96, 112))
normalize_collector("closed")
normalize_collector("open")
