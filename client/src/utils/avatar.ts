export interface AvatarColor {
  bg: string;
  text: string;
  border: string;
}

// Harmonious, curated dark-mode gradient / color palettes
const AVATAR_PALETTES: AvatarColor[] = [
  { bg: 'rgba(99, 102, 241, 0.2)', text: '#818cf8', border: 'rgba(99, 102, 241, 0.4)' }, // Indigo
  { bg: 'rgba(6, 182, 212, 0.2)', text: '#22d3ee', border: 'rgba(6, 182, 212, 0.4)' },  // Cyan
  { bg: 'rgba(16, 185, 129, 0.2)', text: '#34d399', border: 'rgba(16, 185, 129, 0.4)' }, // Emerald
  { bg: 'rgba(168, 85, 247, 0.2)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.4)' }, // Purple
  { bg: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.4)' }, // Amber
  { bg: 'rgba(244, 63, 94, 0.2)', text: '#fb7185', border: 'rgba(244, 63, 94, 0.4)' },  // Rose
  { bg: 'rgba(59, 130, 246, 0.2)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.4)' }, // Blue
  { bg: 'rgba(20, 184, 166, 0.2)', text: '#2dd4bf', border: 'rgba(20, 184, 166, 0.4)' }, // Teal
];

/**
 * Generates deterministic avatar styling based on user ID or name string.
 * Always returns the exact same palette for the same string across renders.
 */
export const getDeterministicAvatarColor = (identifier: string): AvatarColor => {
  if (!identifier) {
    return {
      bg: 'rgba(148, 163, 184, 0.15)',
      text: '#94a3b8',
      border: 'rgba(148, 163, 184, 0.3)',
    };
  }

  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
};

/**
 * Extracts initials from a user's full name.
 * e.g., "Alex Rivera" -> "AR", "Elena" -> "EL"
 */
export const getInitials = (name?: string): string => {
  if (!name || !name.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
};
