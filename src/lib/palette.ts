export type SectionColor = {
  color: string;
  onColor: string;
  soft: string;
};

/**
 * Warna mengikuti seatplan AYO SENYUMLAH:
 * CAT 1 merah, CAT 2 kuning, CAT 3 ungu, CAT 4 oranye,
 * CAT 5 hijau, CAT 6 biru, CAT 7 pink.
 */
const PALETTE: SectionColor[] = [
  { color: "#e53935", onColor: "#ffffff", soft: "#fdecea" }, // CAT 1
  { color: "#fdd835", onColor: "#422006", soft: "#fef9c3" }, // CAT 2
  { color: "#8e24aa", onColor: "#ffffff", soft: "#f5e8fa" }, // CAT 3
  { color: "#fb8c00", onColor: "#ffffff", soft: "#fff3e0" }, // CAT 4
  { color: "#43a047", onColor: "#ffffff", soft: "#e8f5e9" }, // CAT 5
  { color: "#1e88e5", onColor: "#ffffff", soft: "#e3f2fd" }, // CAT 6
  { color: "#f06292", onColor: "#ffffff", soft: "#fce4ec" }, // CAT 7
];

export function colorForSection(code: string, fallbackIndex = 0): SectionColor {
  const match = code.match(/(\d+)/);
  if (match) {
    const number = Number(match[1]);
    if (number >= 1 && number <= PALETTE.length) return PALETTE[number - 1];
  }
  return PALETTE[fallbackIndex % PALETTE.length];
}

export const SECTION_PALETTE = PALETTE;
