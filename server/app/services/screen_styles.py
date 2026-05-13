"""Extract per-cell styled runs from iTerm2 ScreenContents."""

from typing import Any

# xterm 256-color palette
_BASE_16 = [
    "#000000", "#cd0000", "#00cd00", "#cdcd00",
    "#0000ee", "#cd00cd", "#00cdcd", "#e5e5e5",
    "#7f7f7f", "#ff0000", "#00ff00", "#ffff00",
    "#5c5cff", "#ff00ff", "#00ffff", "#ffffff",
]
_CUBE = [0, 95, 135, 175, 215, 255]


def palette_to_hex(n: int) -> str:
    if 0 <= n < 16:
        return _BASE_16[n]
    if 16 <= n < 232:
        i = n - 16
        r = _CUBE[i // 36]
        g = _CUBE[(i // 6) % 6]
        b = _CUBE[i % 6]
        return f"#{r:02x}{g:02x}{b:02x}"
    if 232 <= n < 256:
        v = 8 + (n - 232) * 10
        return f"#{v:02x}{v:02x}{v:02x}"
    return "#ffffff"


def _color_to_hex(color: Any) -> str | None:
    if color is None:
        return None
    try:
        if color.is_rgb():
            rgb = color.rgb()
            return f"#{rgb.red:02x}{rgb.green:02x}{rgb.blue:02x}"
        if color.is_standard():
            return palette_to_hex(color.standard())
    except Exception:
        return None
    return None  # alternate (default) — let client use its theme


# Flag bits — keep small for payload size
F_BOLD = 1
F_ITALIC = 2
F_UNDERLINE = 4
F_INVERSE = 8


def _style_signature(style: Any) -> tuple:
    try:
        return (
            _color_to_hex(style.fg_color),
            _color_to_hex(style.bg_color),
            bool(style.bold),
            bool(style.italic),
            bool(style.underline),
            bool(style.inverse),
        )
    except Exception:
        return (None, None, False, False, False, False)


def line_to_runs(line: Any) -> list[dict]:
    """Convert a LineContents into compact styled runs."""
    runs: list[dict] = []
    current_sig: tuple | None = None
    buf: list[str] = []

    def flush() -> None:
        if not buf or current_sig is None:
            return
        fg, bg, bold, italic, underline, inverse = current_sig
        flags = 0
        if bold:
            flags |= F_BOLD
        if italic:
            flags |= F_ITALIC
        if underline:
            flags |= F_UNDERLINE
        if inverse:
            flags |= F_INVERSE
        run: dict = {"t": "".join(buf)}
        if fg:
            run["f"] = fg
        if bg:
            run["b"] = bg
        if flags:
            run["fl"] = flags
        runs.append(run)

    x = 0
    while True:
        style = line.style_at(x)
        if style is None:
            break
        ch = line.string_at(x) or " "
        sig = _style_signature(style)
        if sig != current_sig:
            flush()
            buf = []
            current_sig = sig
        buf.append(ch)
        x += 1
    flush()

    # Trim trailing default-styled spaces for payload size
    while runs:
        last = runs[-1]
        if last.get("f") or last.get("b") or last.get("fl"):
            break
        stripped = last["t"].rstrip()
        if stripped:
            last["t"] = stripped
            break
        runs.pop()

    return runs


def extract_styled_lines(contents: Any) -> list[list[dict]]:
    """Returns a list of lines; each line is a list of styled runs."""
    result = []
    for i in range(contents.number_of_lines):
        result.append(line_to_runs(contents.line(i)))
    return result
