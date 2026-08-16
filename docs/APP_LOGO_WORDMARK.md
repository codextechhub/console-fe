# The CodeX wordmark and its write-on

`src/components/app-logo.tsx` turns the XVS shield over on hover and writes
"CodeX" in calligraphy underneath it. This note covers where the artwork came
from and how to change it, because none of it is obvious from the path data.

## What ships

Nothing is downloaded at runtime. `src/components/app-logo-wordmark.ts` holds:

- `INK` - the filled wordmark as a single SVG path.
- `PEN` - eight pen strokes tracing the letters in the order a hand writes them,
  each with its slice of the write-on's timeline.

Shipping outlines rather than a webfont means no extra request, no flash of a
fallback face while the font loads, and no dependency on a font being installed.

## Where the letterforms came from

Grand Hotel, under the SIL Open Font License 1.1, which permits using and
redistributing the outlines: <https://fonts.google.com/specimen/Grand+Hotel>. It
was chosen because it is the closest open face to the brush-script feel of the
Instagram wordmark, which is the reference the animation is modelled on.

## How the write-on works

The filled wordmark is painted through an SVG `<mask>` whose content is the pen
strokes, stroked thick and white. Walking a stroke's `stroke-dashoffset` down to
zero grows the mask along the stroke, so the letters emerge along the path the
pen travels rather than fading in or wiping across. All eight strokes are laid
end to end on one timeline, so the letters arrive in the order they are written.

Three details that are load-bearing:

- **Timing comes from arc length.** `s` (start) and `l` (length) are each
  stroke's share of the real total, so the pen holds a constant speed instead of
  spending as long on the curl inside the C as on the whole of the letter e.
- **`o` (the resting dash offset) is above 1, per stroke.** The mask strokes have
  round caps, so at an offset of exactly 1 the cap still paints a dot half a
  stroke-width beyond the end of the dash: a speck of ink appears before the pen
  has reached it. Each stroke is pushed back by its own half-cap-over-length, so
  the short strokes need a much larger push than the long ones.
- **Everything is a CSS transition, never a keyframe animation.** Transitions
  retarget from wherever the property currently sits, so moving the pointer on
  and off quickly reverses the spin from mid-flight rather than snapping back and
  replaying. The delays are declared twice - in the resting rule (which plays on
  the way out) and in the hover rule (the way in) - which is what makes the
  letters un-write from the X back to the C.

## Changing it

**Retiming** - the CSS custom properties on `.app-logo` in `src/index.css`
(`--flip-in`, `--draw-in`, `--draw-start` and their `-out` counterparts). No
regeneration needed.

**A different mask stroke-width** - `o` in `app-logo-wordmark.ts` is derived from
it, so regenerate (below) with the new half-width. Too thin and the pen misses
parts of a letter; too thick and it spills into the next letter and reveals it
early. 30 against the 100-unit-tall wordmark is the tested value.

**New word, or a different face** - regenerate `INK`, then re-trace `PEN` by
hand. There is no automatic way to get a centreline from a filled outline; the
strokes were drawn against a coordinate grid over the artwork and checked by
rendering the reveal at intervals and looking at it.

### Regenerating INK

The generator is `scripts/wordmark-path.py` (needs `fonttools`):

```bash
python3 scripts/wordmark-path.py /path/to/GrandHotel.ttf CodeX 100
```

It lays the glyphs out with the font's own advances and kerning, measures the ink
box, flips y (font space is y-up, SVG is y-down), normalises to a 100-unit height
and prints the viewBox and the path. Keep `WORDMARK_VIEWBOX` and `WORDMARK_RATIO`
in step with the viewBox it reports.

### Checking a change

Coverage matters as much as looks: at the end of the write-on the mask must
reveal *all* the ink, or letters keep a permanently missing sliver. Render the
reveal at 0%, 25%, 50%, 75% and 100% and compare the 100% frame against the raw
fill - the current strokes leave 0.28% of ink pixels unrevealed, which is
antialiased edges only.
