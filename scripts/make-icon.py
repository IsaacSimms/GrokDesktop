#!/usr/bin/env python3
"""Draw an original GrokDesktop icon. Not an xAI, Grok, or Cursor logo.

Dark rounded tile, one warm off-white window stroke, one diamond.
"""

import struct
import zlib
from pathlib import Path

SIZE = 512
SAMPLES = 3
INK = (17, 19, 24, 255)
SHEEN = (46, 50, 60, 255)
MARK = (243, 237, 226, 255)
CLEAR = (0, 0, 0, 0)

TILE = (26, 26, 486, 486, 108)
FRAME = (146, 186, 366, 326, 16)
STROKE = 14
DIAMOND_CENTER = (256, 256)
DIAMOND_RADIUS = 22


def lerp(a: int, b: int, t: float) -> int:
    return int(a + (b - a) * t)


def rounded_mask(x: float, y: float, left: int, top: int, right: int, bottom: int, radius: int) -> bool:
    if x < left or y < top or x >= right or y >= bottom:
        return False
    cx = left + radius if x < left + radius else right - radius if x >= right - radius else x
    cy = top + radius if y < top + radius else bottom - radius if y >= bottom - radius else y
    dx = x - cx
    dy = y - cy
    return dx * dx + dy * dy <= radius * radius


def tile_color(y: float) -> tuple[int, int, int, int]:
    top = TILE[1]
    span = 96
    if y >= top + span:
        return INK
    t = 1 - (y - top) / span
    t = t * t
    return (
        lerp(INK[0], SHEEN[0], t),
        lerp(INK[1], SHEEN[1], t),
        lerp(INK[2], SHEEN[2], t),
        255,
    )


def pixel(x: float, y: float) -> tuple[int, int, int, int]:
    if not rounded_mask(x, y, *TILE):
        return CLEAR
    left, top, right, bottom, radius = FRAME
    outer = rounded_mask(x, y, left, top, right, bottom, radius)
    inner = rounded_mask(
        x,
        y,
        left + STROKE,
        top + STROKE,
        right - STROKE,
        bottom - STROKE,
        max(radius - STROKE, 1),
    )
    cx, cy = DIAMOND_CENTER
    if abs(x - cx) + abs(y - cy) <= DIAMOND_RADIUS or (outer and not inner):
        return MARK
    return tile_color(y)


def chunk(tag: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)


def main() -> None:
    rows = []
    step = 1 / SAMPLES
    origin = step / 2
    for y in range(SIZE):
        row = bytearray([0])
        for x in range(SIZE):
            red = green = blue = alpha = 0
            for sy in range(SAMPLES):
                for sx in range(SAMPLES):
                    sample = pixel(x + origin + sx * step, y + origin + sy * step)
                    red += sample[0]
                    green += sample[1]
                    blue += sample[2]
                    alpha += sample[3]
            count = SAMPLES * SAMPLES
            row.extend((red // count, green // count, blue // count, alpha // count))
        rows.append(bytes(row))
    raw = b"".join(rows)
    png = b"".join(
        [
            b"\x89PNG\r\n\x1a\n",
            chunk(b"IHDR", struct.pack(">IIBBBBB", SIZE, SIZE, 8, 6, 0, 0, 0)),
            chunk(b"IDAT", zlib.compress(raw, 9)),
            chunk(b"IEND", b""),
        ]
    )
    destination = Path(__file__).resolve().parents[1] / "build" / "icon.png"
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(png)


if __name__ == "__main__":
    main()
