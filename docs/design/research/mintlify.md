# Mintlify Design Reference

Source: `docs/research/library/mintlify/` (screenshots, CSS, animations)

## Key Values

### Colors (Dark Mode)
- Background: `#08090a` (near-black)
- Text primary: `#fff`
- Text secondary: `rgba(255,255,255,.7)`
- Text muted: `rgba(255,255,255,.5)`
- Borders: `rgba(255,255,255,.07)` (ultra-subtle)
- Brand: `#18e299` (mint green)

### Typography
- Body: Inter
- Code: Geist Mono
- Heading tracking: `-0.24px`

### Animations
```css
@keyframes scaleIn {
  0% { opacity: 0; transform: rotateX(-10deg) scale(0.96); }
  100% { opacity: 1; transform: rotateX(0deg) scale(1); }
}
```

### Transitions
- Duration: `0.2s`
- Easing: `ease-out` (enter), `ease-in` (exit)

## Source Files
- `landing_deep.json` - CSS variables, keyframes
- `landing_desktop_*.png` - Screenshots
- `assets/css/*.css` - Compiled styles
