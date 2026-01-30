# Multi-Part Support Implementation Plan

## Goal
Support scores with multiple parts for one instrument (e.g., 2 trumpet parts).
Numbering stays consistent across instruments: song 1 is always 1, with sub-numbers for multiple parts (1.1, 1.2).

## Example
- "Nice Song": 2 trumpet parts, 1 trombone part
- "My Track": 1 trumpet part, 2 trombone parts

**Trumpet scorebook:**
```
1.1 NICE SONG: LEAD
1.2 NICE SONG: SUPPORT
2   MY TRACK
```

**Trombone scorebook:**
```
1   NICE SONG
2.1 MY TRACK: MELODY
2.2 MY TRACK: BASS
```

---

## No Changes Needed
- `types.ts` - use existing `part.name`
- `scripts/indexCollection.ts` - already extracts part names

---

## Changes Required

### 1. Helper function (`src/instrument.ts`)
Extract display label from part name:
- `"vapor barato - trombone melodia"` → `"melodia"`
- Strip song title + instrument, return remainder (or undefined if empty)

### 2. PDF Generation (`src/createSongBook.ts`)

#### Song loop (lines 107-128)
- Change `.find()` → `.filter()` to get ALL parts for instrument
- Loop through matching parts, generate page for each
- Numbering:
  - Multiple parts: `N.1`, `N.2`, etc.
  - Single part: `N`
- Title on page: append extracted label when multiple parts
  - e.g., "VAPOR BARATO: MELODIA"
- Back sheet: show just song number `N` (not sub-number)
- Destination IDs: `song.id + "_" + partIndex` for multi-part linking

#### Index (`addIndexPage`, lines 357-533)
- Multi-part songs: show sub-entries with sub-numbers
  ```
  1.1 VAPOR BARATO: MELODIA
  1.2 VAPOR BARATO: BAIXO
  ```
- Single-part songs: show as before
  ```
  2 MY TRACK
  ```
- Missing (0 parts for instrument): grayed + strikethrough, integer number `N`

---

## Files to Modify
1. `src/instrument.ts` - add `extractVoiceLabel(partName, songTitle, instrument)` helper
2. `src/createSongBook.ts` - song loop + index generation
