"""Unit-based storage: list, load, and save units (e.g. chapters of vocab)."""

import json
import re
from pathlib import Path

from app.schemas import SaveUnitRequest, Unit, UnitEntry


def _slugify(name: str) -> str:
    """Safe filename: lowercase, non-alphanumeric replaced with dash."""
    s = re.sub(r"[^a-z0-9\u00c0-\u024f]+", "-", name.lower().strip())
    return s.strip("-") or "unit"


def get_units_dir() -> Path:
    """Directory where unit JSON files are stored."""
    return Path(__file__).resolve().parent.parent / "data" / "units"


def list_units() -> list[dict]:
    """
    List all units. Returns [ { "slug": "...", "name": "..." } ].
    Slug is the filename without .json; name is from the file content.
    """
    units_dir = get_units_dir()
    if not units_dir.exists():
        return []
    result = []
    for path in sorted(units_dir.glob("*.json")):
        slug = path.stem
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            name = data.get("name", slug)
        except (json.JSONDecodeError, OSError):
            name = slug
        result.append({"slug": slug, "name": name})
    return result


def get_unit(slug: str) -> Unit | None:
    """Load a unit by slug (filename without .json). Returns None if not found."""
    units_dir = get_units_dir()
    path = units_dir / f"{slug}.json"
    if not path.exists():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return Unit.model_validate(data)
    except (json.JSONDecodeError, ValueError):
        return None


def save_unit(body: SaveUnitRequest) -> Path:
    """Write unit to data/units/{slug}.json. Creates directory if needed. Returns path."""
    if not body.unit_name.strip():
        raise ValueError("unit_name is required")
    units_dir = get_units_dir()
    units_dir.mkdir(parents=True, exist_ok=True)
    slug = _slugify(body.unit_name)
    path = units_dir / f"{slug}.json"
    payload = Unit(name=body.unit_name.strip(), entries=body.entries).model_dump(mode="json")
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return path
