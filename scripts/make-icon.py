#!/usr/bin/env python3
"""Draw an original GrokDesktop icon. Not an xAI or Grok logo."""

import struct
import zlib
from pathlib import Path

SIZE = 512
TEAL = (31, 106, 100, 255)
PAPER = (243, 237, 226, 255)
AMBER = (224, 159, 62, 255)
CLEAR = (0, 0, 0, 0)


def rounded_mask(x: int, y: int, left: int, top: int, right: int, bottom: int, radius: int) -> bool:
    if x < left or y < top or x >= right or y >= bottom:
        return False
    cx = left + radius if x < left + radius else right - radius - 1 if x >= right - radius else x
    cy = top + radius if y < top + radius else bottom - radius - 1 if y >= bottom - radius else y
    return (x - cx) * (x - cx) + (y - cy) * (y - cy) <= radius * radius


def pixel(x: int, y: int) -> tuple[int, int, int, int]:
    if not rounded_mask(x, y, 36, 36, 476, 476, 84):
        return CLEAR
    if rounded_mask(x, y, 92, 120, 420, 400, 28):
        if y < 176:
            for center in (148, 176, 204):
                if (x - center) * (x - center) + (y - 148) * (y - 148) <= 36:
                    return TEAL
            return AMBER
        return PAPER
    return TEAL


def chunk(tag: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)


def main() -> None:
    rows = []
    for y in range(SIZE):
        row = bytearray([0])
        for x in range(SIZE):
            row.extend(pixel(x, y))
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
