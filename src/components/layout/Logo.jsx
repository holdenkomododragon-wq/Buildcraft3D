export default function Logo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-label="RigForge logo">
      <path d="M16 2l12 7v14l-12 7L4 23V9l12-7z" fill="#ff2a85" />
      <path d="M16 2l12 7-12 7L4 9l12-7z" fill="#ff7ab2" />
      <path d="M16 16v14L4 23V9l12 7z" fill="#e0176b" />
      <path d="M16 11l5 3v6l-5 3-5-3v-6l5-3z" fill="#0a0a0c" />
      <path d="M16 13.5l2.8 1.6v3.2L16 20l-2.8-1.7v-3.2L16 13.5z" fill="#fff" />
    </svg>
  );
}