from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path

from PIL import Image


SPRITE_SIZE = (64, 96)
RUNTIME_SPRITE_SIZE = (24, 36)
OPAQUE_COLORS = 19
STAR_DUST_COUNT = 4
STAR_DUST_PIXELS = ((9, 28), (54, 31), (10, 56), (53, 65))
MINT = (104, 245, 214)
GOLD = (255, 191, 46)
SOFT_WHITE = (247, 244, 224)
FORCED_PALETTE_COLORS = (MINT, GOLD, SOFT_WHITE)
RUNTIME_PALETTE_COLORS = (
    (9, 13, 26),       # outline
    (43, 29, 32),      # black hair
    (91, 58, 46),      # warm hair rim
    (231, 183, 119),   # skin
    (247, 225, 177),   # skin light
    (242, 151, 25),    # yellow jacket
    (194, 57, 22),     # coral hood
    (31, 48, 78),      # navy pants
    (53, 76, 108),     # blue fabric light
    SOFT_WHITE,        # sneakers and memory light
    MINT,              # bracelet and dream light
    GOLD,              # memory shard and rim light
)


def neighbors(index: int, width: int, height: int):
    x = index % width
    y = index // width
    for offset_y in (-1, 0, 1):
        for offset_x in (-1, 0, 1):
            if offset_x == 0 and offset_y == 0:
                continue
            next_x = x + offset_x
            next_y = y + offset_y
            if 0 <= next_x < width and 0 <= next_y < height:
                yield next_y * width + next_x


def flood_from_edges(passable: list[bool], width: int, height: int) -> set[int]:
    reached: set[int] = set()
    queue: deque[int] = deque()
    edge_indices = [
        *(x for x in range(width)),
        *((height - 1) * width + x for x in range(width)),
        *(y * width for y in range(height)),
        *(y * width + width - 1 for y in range(height)),
    ]
    for index in edge_indices:
        if passable[index] and index not in reached:
            reached.add(index)
            queue.append(index)
    while queue:
        index = queue.popleft()
        for next_index in neighbors(index, width, height):
            if passable[next_index] and next_index not in reached:
                reached.add(next_index)
                queue.append(next_index)
    return reached


def components(mask: list[bool], width: int, height: int) -> list[set[int]]:
    remaining = {index for index, enabled in enumerate(mask) if enabled}
    found: list[set[int]] = []
    while remaining:
        start = remaining.pop()
        component = {start}
        queue = deque([start])
        while queue:
            index = queue.popleft()
            for next_index in neighbors(index, width, height):
                if next_index in remaining:
                    remaining.remove(next_index)
                    component.add(next_index)
                    queue.append(next_index)
        found.append(component)
    return found


def component_box(component: set[int], width: int) -> tuple[int, int, int, int]:
    xs = [index % width for index in component]
    ys = [index // width for index in component]
    return min(xs), min(ys), max(xs), max(ys)


def box_distance(a: tuple[int, int, int, int], b: tuple[int, int, int, int]) -> int:
    left_a, top_a, right_a, bottom_a = a
    left_b, top_b, right_b, bottom_b = b
    dx = max(left_a - right_b - 1, left_b - right_a - 1, 0)
    dy = max(top_a - bottom_b - 1, top_b - bottom_a - 1, 0)
    return dx + dy


def extract_mask(image: Image.Image) -> tuple[list[bool], dict[str, object]]:
    rgb = image.convert('RGB').resize(SPRITE_SIZE, Image.Resampling.NEAREST)
    pixels = list(rgb.getdata())
    width, height = SPRITE_SIZE

    background_candidate = []
    for red, green, blue in pixels:
        darkest = min(red, green, blue)
        chroma = max(red, green, blue) - darkest
        background_candidate.append(darkest >= 175 and chroma <= 22)

    background = flood_from_edges(background_candidate, width, height)
    foreground_mask = [index not in background for index in range(width * height)]
    groups = sorted(components(foreground_mask, width, height), key=len, reverse=True)
    if not groups:
        raise RuntimeError('No foreground component was detected.')

    character = groups[0]
    character_box = component_box(character, width)
    star_candidates = []
    for group in groups[1:]:
        if not 1 <= len(group) <= 16:
            continue
        chroma = max(max(pixels[index]) - min(pixels[index]) for index in group)
        brightness = max(max(pixels[index]) for index in group)
        distance = box_distance(component_box(group, width), character_box)
        if chroma < 28 or brightness < 120 or distance < 1:
            continue
        star_candidates.append((distance * 20 + chroma + brightness / 8, group))
    star_candidates.sort(key=lambda item: item[0], reverse=True)
    stars = [group for _, group in star_candidates[:STAR_DUST_COUNT]]

    # Fill only holes enclosed by the main silhouette. This restores white shoe,
    # eye, and memory-shard pixels without bringing back the pale checkerboard.
    outside = flood_from_edges(
        [index not in character for index in range(width * height)], width, height
    )
    final_mask = [index not in outside for index in range(width * height)]
    for star in stars:
        for index in star:
            final_mask[index] = True

    details = {
        'character_pixels': len(character),
        'character_box': character_box,
        'star_components': len(stars),
        'star_pixels': sum(len(star) for star in stars),
    }
    return final_mask, details


def build_shared_palette(images: dict[str, Image.Image], masks: dict[str, list[bool]]) -> Image.Image:
    samples = []
    for name, image in images.items():
        pixels = list(image.convert('RGB').resize(SPRITE_SIZE, Image.Resampling.NEAREST).getdata())
        samples.extend(pixel for pixel, keep in zip(pixels, masks[name]) if keep)
    sample_image = Image.new('RGB', (len(samples), 1))
    sample_image.putdata(samples)
    reduced = sample_image.quantize(
        colors=OPAQUE_COLORS - len(FORCED_PALETTE_COLORS),
        method=Image.Quantize.MEDIANCUT,
        dither=Image.Dither.NONE,
    )
    source_palette = reduced.getpalette() or []
    used_indices = sorted(index for _, index in (reduced.getcolors() or []))
    palette_colors = [
        tuple(source_palette[index * 3:index * 3 + 3]) for index in used_indices
    ]
    palette_colors.extend(FORCED_PALETTE_COLORS)
    palette_colors = palette_colors[:OPAQUE_COLORS]
    while len(palette_colors) < OPAQUE_COLORS:
        palette_colors.append(palette_colors[-1])
    palette_colors.extend([palette_colors[0]] * (256 - len(palette_colors)))
    palette_image = Image.new('P', (1, 1))
    palette_image.putpalette([channel for color in palette_colors for channel in color])
    return palette_image


def save_sprite(
    image: Image.Image,
    mask: list[bool],
    palette: Image.Image,
    destination: Path,
) -> tuple[int, int]:
    rgb = image.convert('RGB').resize(SPRITE_SIZE, Image.Resampling.NEAREST)
    reduced = rgb.quantize(palette=palette, dither=Image.Dither.NONE).convert('RGB')
    reduced_pixels = list(reduced.getdata())
    dust_colors = (GOLD, GOLD, MINT, GOLD)
    effective_mask = list(mask)
    for (x, y), color in zip(STAR_DUST_PIXELS, dust_colors):
        index = y * SPRITE_SIZE[0] + x
        reduced_pixels[index] = color
        effective_mask[index] = True

    output = Image.new('RGBA', SPRITE_SIZE, (0, 0, 0, 0))
    output_pixels = []
    for pixel, keep in zip(reduced_pixels, effective_mask):
        output_pixels.append((*pixel, 255) if keep else (0, 0, 0, 0))
    output.putdata(output_pixels)
    destination.parent.mkdir(parents=True, exist_ok=True)
    output.save(destination, 'PNG', optimize=False)
    colors = output.getcolors(maxcolors=SPRITE_SIZE[0] * SPRITE_SIZE[1]) or []
    opaque_colors = {color for _, color in colors if color[3] == 255}
    transparent_pixels = sum(count for count, color in colors if color[3] == 0)
    return len(opaque_colors), transparent_pixels


def save_preview(output_dir: Path, destination: Path, names: list[str]) -> None:
    scale = 8
    gap = 16
    tile_width = SPRITE_SIZE[0] * scale
    tile_height = SPRITE_SIZE[1] * scale
    preview = Image.new(
        'RGBA',
        (tile_width * len(names) + gap * (len(names) - 1), tile_height),
        (18, 22, 42, 255),
    )
    for index, name in enumerate(names):
        sprite = Image.open(output_dir / f'protagonist-{name}.png').convert('RGBA')
        sprite = sprite.resize((tile_width, tile_height), Image.Resampling.NEAREST)
        preview.alpha_composite(sprite, (index * (tile_width + gap), 0))
    destination.parent.mkdir(parents=True, exist_ok=True)
    preview.convert('RGB').save(destination, 'PNG')


def save_runtime_sprite(source: Path, destination: Path) -> tuple[int, int]:
    runtime = Image.open(source).convert('RGBA').resize(
        RUNTIME_SPRITE_SIZE, Image.Resampling.NEAREST
    )

    # Enlarge only the central head mass. The body, bracelet, memory shard,
    # feet baseline, and transparent canvas stay on the same gameplay grid.
    head_box = (5, 2, 16, 13)
    head = runtime.crop(head_box).resize((13, 13), Image.Resampling.NEAREST)
    runtime.paste(Image.new('RGBA', (11, 11), (0, 0, 0, 0)), head_box[:2])
    runtime.alpha_composite(head, (4, 0))

    palette_colors = list(RUNTIME_PALETTE_COLORS)
    palette_colors.extend([palette_colors[0]] * (256 - len(palette_colors)))
    palette = Image.new('P', (1, 1))
    palette.putpalette([channel for color in palette_colors for channel in color])
    alpha = runtime.getchannel('A').point(lambda value: 255 if value >= 128 else 0)
    reduced = runtime.convert('RGB').quantize(palette=palette, dither=Image.Dither.NONE).convert('RGB')
    runtime = Image.new('RGBA', RUNTIME_SPRITE_SIZE, (0, 0, 0, 0))
    runtime_pixels = []
    for color, alpha_value in zip(reduced.getdata(), alpha.getdata()):
        runtime_pixels.append((*color, 255) if alpha_value else (0, 0, 0, 0))

    runtime_dust = ((3, 10), (20, 11), (4, 21))
    dust_colors = (GOLD, GOLD, MINT)
    for (x, y), color in zip(runtime_dust, dust_colors):
        runtime_pixels[y * RUNTIME_SPRITE_SIZE[0] + x] = (*color, 255)
    runtime.putdata(runtime_pixels)
    destination.parent.mkdir(parents=True, exist_ok=True)
    runtime.save(destination, 'PNG', optimize=False)
    colors = runtime.getcolors(maxcolors=RUNTIME_SPRITE_SIZE[0] * RUNTIME_SPRITE_SIZE[1]) or []
    opaque_colors = {color for _, color in colors if color[3] == 255}
    transparent_pixels = sum(count for count, color in colors if color[3] == 0)
    return len(opaque_colors), transparent_pixels


def save_runtime_preview(output_dir: Path, destination: Path, names: list[str]) -> None:
    scale = 16
    gap = 16
    tile_width = RUNTIME_SPRITE_SIZE[0] * scale
    tile_height = RUNTIME_SPRITE_SIZE[1] * scale
    preview = Image.new(
        'RGBA',
        (tile_width * len(names) + gap * (len(names) - 1), tile_height),
        (18, 22, 42, 255),
    )
    for index, name in enumerate(names):
        sprite = Image.open(output_dir / 'runtime' / f'protagonist-{name}.png').convert('RGBA')
        sprite = sprite.resize((tile_width, tile_height), Image.Resampling.NEAREST)
        preview.alpha_composite(sprite, (index * (tile_width + gap), 0))
    destination.parent.mkdir(parents=True, exist_ok=True)
    preview.convert('RGB').save(destination, 'PNG')


def main() -> None:
    parser = argparse.ArgumentParser()
    for name in ('determined', 'surprised', 'sad', 'rewind'):
        parser.add_argument(f'--{name}', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--preview', type=Path)
    parser.add_argument('--runtime-preview', type=Path)
    args = parser.parse_args()

    names = ['determined', 'surprised', 'sad', 'rewind']
    images = {name: Image.open(getattr(args, name)).convert('RGB') for name in names}
    masks = {}
    details = {}
    for name, image in images.items():
        masks[name], details[name] = extract_mask(image)

    palette = build_shared_palette(images, masks)
    for name in names:
        destination = args.output / f'protagonist-{name}.png'
        opaque_colors, transparent_pixels = save_sprite(
            images[name], masks[name], palette, destination
        )
        print(
            f'{name}: {destination} {SPRITE_SIZE[0]}x{SPRITE_SIZE[1]}, '
            f'{opaque_colors} opaque colors + transparency, '
            f'{transparent_pixels} transparent pixels, {details[name]}'
        )
        runtime_destination = args.output / 'runtime' / f'protagonist-{name}.png'
        runtime_colors, runtime_transparent = save_runtime_sprite(
            destination, runtime_destination
        )
        print(
            f'{name} runtime: {runtime_destination} '
            f'{RUNTIME_SPRITE_SIZE[0]}x{RUNTIME_SPRITE_SIZE[1]}, '
            f'{runtime_colors} opaque colors + transparency, '
            f'{runtime_transparent} transparent pixels'
        )
    if args.preview:
        save_preview(args.output, args.preview, names)
        print(f'preview: {args.preview}')
    if args.runtime_preview:
        save_runtime_preview(args.output, args.runtime_preview, names)
        print(f'runtime preview: {args.runtime_preview}')


if __name__ == '__main__':
    main()
