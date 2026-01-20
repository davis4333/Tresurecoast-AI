# Treasure Coast AI - Design System Tokens

## Color System

### Brand Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--color-brand-primary` | `#6366f1` | Primary brand accent, CTAs |
| `--color-brand-primary-hover` | `#4f46e5` | Primary hover state |
| `--color-brand-secondary` | `#8b5cf6` | Secondary brand accent |
| `--color-brand-accent` | `#22d3ee` | Accent highlights |

### Surface Colors (Light Mode)
| Token | Value | Usage |
|-------|-------|-------|
| `--color-background` | `#ffffff` | App background |
| `--color-surface` | `#f8fafc` | Cards, panels |
| `--color-surface-elevated` | `#ffffff` | Elevated surfaces, modals |
| `--color-surface-hover` | `#f1f5f9` | Hover states |

### Surface Colors (Dark Mode)
| Token | Value | Usage |
|-------|-------|-------|
| `--color-background` | `#09090b` | App background |
| `--color-surface` | `#18181b` | Cards, panels |
| `--color-surface-elevated` | `#27272a` | Elevated surfaces |
| `--color-surface-hover` | `#27272a` | Hover states |

### Border Colors
| Token | Light | Dark |
|-------|-------|------|
| `--color-border` | `#e2e8f0` | `#27272a` |
| `--color-border-subtle` | `#f1f5f9` | `#1f1f23` |

### Text Colors
| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--color-text-primary` | `#0f172a` | `#fafafa` | Headlines, body |
| `--color-text-secondary` | `#475569` | `#a1a1aa` | Descriptions |
| `--color-text-muted` | `#94a3b8` | `#71717a` | Labels, hints |
| `--color-text-inverse` | `#ffffff` | `#09090b` | On brand colors |

### Semantic Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--color-success` | `#10b981` | Success states, positive |
| `--color-warning` | `#f59e0b` | Warnings, caution |
| `--color-error` | `#ef4444` | Errors, destructive |
| `--color-info` | `#3b82f6` | Informational |

---

## Typography Scale

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

### Heading Sizes
| Element | Size | Weight | Letter Spacing |
|---------|------|--------|----------------|
| H1 | 2.25rem (36px) | 800 | -0.025em |
| H2 | 1.875rem (30px) | 700 | -0.025em |
| H3 | 1.5rem (24px) | 600 | -0.02em |
| H4 | 1.25rem (20px) | 600 | -0.01em |
| H5 | 1.125rem (18px) | 600 | 0 |
| H6 | 1rem (16px) | 600 | 0 |

### Body Text
| Variant | Size | Line Height |
|---------|------|-------------|
| Large | 1.125rem (18px) | 1.75 |
| Base | 1rem (16px) | 1.625 |
| Small | 0.875rem (14px) | 1.5 |
| XSmall | 0.75rem (12px) | 1.5 |

### Labels
| Variant | Size | Weight | Transform |
|---------|------|--------|-----------|
| Label | 0.875rem | 500 | none |
| Caption | 0.75rem | 500 | uppercase |

---

## Spacing Scale

| Token | Value | Pixels |
|-------|-------|--------|
| `--space-xs` | 0.25rem | 4px |
| `--space-sm` | 0.5rem | 8px |
| `--space-md` | 1rem | 16px |
| `--space-lg` | 1.5rem | 24px |
| `--space-xl` | 2rem | 32px |
| `--space-2xl` | 3rem | 48px |

### Extended Scale (Tailwind)
| Class | Value |
|-------|-------|
| `gap-1` | 4px |
| `gap-2` | 8px |
| `gap-3` | 12px |
| `gap-4` | 16px |
| `gap-5` | 20px |
| `gap-6` | 24px |
| `gap-8` | 32px |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 0.375rem (6px) | Small elements, inputs |
| `--radius-md` | 0.5rem (8px) | Buttons, badges |
| `--radius-lg` | 0.75rem (12px) | Cards, modals |
| `--radius-xl` | 1rem (16px) | Large containers |
| `--radius-2xl` | 1.5rem (24px) | Hero sections |

---

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-xs` | `0 1px 2px 0 rgb(0 0 0 / 0.03)` | Subtle elevation |
| `--shadow-sm` | `0 1px 3px 0 rgb(0 0 0 / 0.05)` | Default cards |
| `--shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.05)` | Elevated cards |
| `--shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.05)` | Modals, dropdowns |
| `--shadow-glow` | `0 0 24px 0 rgb(99 102 241 / 0.12)` | Brand emphasis |

---

## Transitions

| Token | Value | Usage |
|-------|-------|-------|
| `--transition-fast` | 150ms ease | Hover states |
| `--transition-base` | 200ms ease | Interactive elements |
| `--transition-slow` | 300ms ease | Layout changes |

---

## Component Tokens

### Buttons
| Property | Primary | Secondary | Ghost |
|----------|---------|-----------|-------|
| Background | gradient | surface-elevated | transparent |
| Border | none | 1px border | none |
| Text | inverse | primary | secondary |
| Height (md) | 44px | 44px | 44px |
| Padding | 0.625rem 1rem | 0.625rem 1rem | 0.625rem 1rem |

### Inputs
| Property | Value |
|----------|-------|
| Height | 44px |
| Padding | 0.625rem 0.875rem |
| Border | 1px solid border |
| Border (focus) | brand-primary |
| Background | surface-elevated |

### Cards
| Property | Default | Elevated |
|----------|---------|----------|
| Background | surface | surface-elevated |
| Border | 1px solid border | 1px solid border |
| Shadow | shadow-sm | shadow-md |
| Radius | radius-lg | radius-lg |
| Padding | 1.25rem (20px) | 1.25rem (20px) |

---

## Accessibility Standards

### Focus States
- All interactive elements must have visible focus ring
- Focus ring: `0 0 0 2px background, 0 0 0 4px brand-primary`

### Hit Targets
- Minimum touch target: 44px x 44px
- Buttons, links, inputs must meet this minimum

### Color Contrast
- Text on background: minimum 4.5:1 ratio
- Large text (18px+): minimum 3:1 ratio
- UI components: minimum 3:1 ratio

### Motion
- Respect `prefers-reduced-motion` media query
- Keep transitions under 300ms
