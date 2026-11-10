"""Builds tiny, valid FIT files for tests.

FIT is Garmin's binary format: a 14-byte header, then "definition" messages
(describing the fields) and "data" messages (the values), then a checksum.
We only write a file_id and a session (the workout summary), which is all
the importer reads.
"""

import struct
from datetime import datetime, timezone

FIT_EPOCH = datetime(1989, 12, 31, tzinfo=timezone.utc)  # FIT counts seconds from here

_CRC_TABLE = [
    0x0000, 0xCC01, 0xD801, 0x1400, 0xF001, 0x3C00, 0x2800, 0xE401,
    0xA001, 0x6C00, 0x7800, 0xB401, 0x5000, 0x9C01, 0x8801, 0x4400,
]


def fit_crc(data: bytes, crc: int = 0) -> int:
    for byte in data:
        tmp = _CRC_TABLE[crc & 0xF]
        crc = (crc >> 4) & 0x0FFF
        crc = crc ^ tmp ^ _CRC_TABLE[byte & 0xF]
        tmp = _CRC_TABLE[crc & 0xF]
        crc = (crc >> 4) & 0x0FFF
        crc = crc ^ tmp ^ _CRC_TABLE[(byte >> 4) & 0xF]
    return crc


def _fit_time(dt: datetime) -> int:
    return int((dt - FIT_EPOCH).total_seconds())


def _message(local: int, global_num: int, fields: list[tuple[int, str, int, int]]) -> bytes:
    """fields: (field number, struct format, FIT base type, value)"""
    definition = struct.pack("<BBBHB", 0x40 | local, 0, 0, global_num, len(fields))
    for number, fmt, base_type, _ in fields:
        definition += struct.pack("<BBB", number, struct.calcsize("<" + fmt), base_type)
    data = struct.pack("<B", local) + b"".join(struct.pack("<" + fmt, value) for _, fmt, _, value in fields)
    return definition + data


ENUM, UINT8, UINT16, UINT32 = 0x00, 0x02, 0x84, 0x86
SPORTS = {"running": 1, "cycling": 2, "swimming": 5, "training": 10, "walking": 11}


def build_fit(
    sport: str = "running",
    distance_m: float = 5200,
    duration_s: float = 1900,
    avg_heart_rate: int | None = 148,
    start: datetime = datetime(2026, 11, 6, 6, 45, tzinfo=timezone.utc),
) -> bytes:
    start_ts = _fit_time(start)
    body = _message(0, 0, [(0, "B", ENUM, 4), (4, "I", UINT32, start_ts)])  # file_id: type=activity
    session_fields = [
        (253, "I", UINT32, start_ts + int(duration_s)),  # timestamp
        (2, "I", UINT32, start_ts),  # start_time
        (5, "B", ENUM, SPORTS[sport]),  # sport
        (7, "I", UINT32, int(duration_s * 1000)),  # total_elapsed_time (ms)
        (8, "I", UINT32, int(duration_s * 1000)),  # total_timer_time (ms)
        (9, "I", UINT32, int(distance_m * 100)),  # total_distance (cm)
    ]
    if avg_heart_rate is not None:
        session_fields.append((16, "B", UINT8, avg_heart_rate))
    body += _message(1, 18, session_fields)  # 18 = session

    header = struct.pack("<BBHI4s", 14, 0x20, 2132, len(body), b".FIT")
    header += struct.pack("<H", fit_crc(header))
    content = header + body
    return content + struct.pack("<H", fit_crc(content))
