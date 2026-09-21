#!/usr/bin/env python3
"""Pre-publish checks for the things that break silently.

Every check here exists because the failure it catches is invisible: the page
still loads, the game still runs, and a button is simply blank or a page is
quietly a version behind. Run it before pushing.

    python3 check.py

No dependencies, no framework. Add a check when you find another failure that
does not announce itself.
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).parent
PAGES = {"index.html": "bogota", "jungle/index.html": "jungle"}

failures = []


def fail(check, detail):
    failures.append(f"{check}: {detail}")


def strings_for(game):
    return json.loads((ROOT / f"js/games/{game}/strings.json").read_text(encoding="utf-8"))


def flatten(node, prefix=""):
    """Dotted keys of a strings file, skipping the _comment preamble."""
    keys = set()
    for key, value in node.items():
        if key == "_comment":
            continue
        if isinstance(value, dict):
            keys |= flatten(value, prefix + key + ".")
        else:
            keys.add(prefix + key)
    return keys


def check_string_key_parity():
    """Every pack must define the same keys: the markup is shared, so a key one
    game lacks renders as the literal key on that game's page."""
    packs = {game: flatten(strings_for(game)) for game in set(PAGES.values())}
    reference, expected = next(iter(packs.items()))
    for game, keys in packs.items():
        missing = expected - keys
        extra = keys - expected
        if missing:
            fail("string parity", f"{game} is missing {sorted(missing)} (present in {reference})")
        if extra:
            fail("string parity", f"{game} has {sorted(extra)}, absent from {reference}")


def check_every_key_resolves():
    """Every data-text in the markup must exist in that page's pack, or the
    element renders its own key as visible text."""
    for page, game in PAGES.items():
        html = (ROOT / page).read_text(encoding="utf-8")
        keys = flatten(strings_for(game))
        used = re.findall(r'data-text(?:-[a-z-]+)?="([^"]+)"', html)
        for key in sorted(set(used)):
            if key not in keys:
                fail("missing string", f"{page} uses '{key}', not defined for {game}")
        if not used:
            fail("missing string", f"{page} has no data-text attributes at all")


def check_bodies_match():
    """The two pages deliberately share a <body>; only their <head> differs.
    Nothing enforces that at runtime, so a change to one silently leaves the
    other a version behind. Asset prefixes are the one allowed difference."""
    bodies = {}
    for page in PAGES:
        html = (ROOT / page).read_text(encoding="utf-8")
        start = html.find("<body>")
        if start == -1:
            fail("shared body", f"{page} has no <body>")
            return
        body = html[start:]
        # /jungle/ climbs one directory for anything at the project root
        body = body.replace("../", "").replace(
            "images/jungle/kong-defeated.png", "images/ragnar-defeated.webp"
        )
        bodies[page] = body.split("\n")

    (page_a, lines_a), (page_b, lines_b) = bodies.items()
    if lines_a != lines_b:
        for n, (line_a, line_b) in enumerate(zip(lines_a, lines_b), 1):
            if line_a != line_b:
                fail("shared body", f"{page_a}:{n} and {page_b}:{n} differ\n"
                                    f"    {page_a}: {line_a.strip()}\n"
                                    f"    {page_b}: {line_b.strip()}")
                break
        else:
            fail("shared body", f"{page_a} and {page_b} differ in length "
                                f"({len(lines_a)} vs {len(lines_b)} lines)")


def check_assets_exist():
    """A game naming a file that is not in the repo degrades quietly — a
    missing background falls back to a gradient — so it is easy to ship."""
    for game in set(PAGES.values()):
        pack = (ROOT / f"js/games/{game}/index.js").read_text(encoding="utf-8")
        for path in re.findall(r'"((?:sprites|images|audio|js)/[^"]+)"', pack):
            # Audio is referenced without its extension: two encodings exist.
            candidates = [path, path + ".ogg", path + ".m4a"]
            if not any((ROOT / c).exists() for c in candidates):
                print(f"  note: {game} names {path}, which is absent "
                      f"(intended for the jungle skeleton)")


for check in (check_string_key_parity, check_every_key_resolves,
              check_bodies_match, check_assets_exist):
    check()

if failures:
    print("FAILED")
    for line in failures:
        print(" ", line)
    sys.exit(1)

print("ok — strings parity, every key resolves, both pages share one body")
