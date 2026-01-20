# Treasure Coast AI - UI Component Specifications

## Button Specifications

### TcaButton Component

| Variant | Background | Text | Border | Hover Effect |
|---------|------------|------|--------|--------------|
| Primary | Gradient (brand-primary to brand-primary-hover) | White | None | -translate-y-0.5, shadow-lg |
| Secondary | surface-elevated | text-primary | 1px border | bg-surface-hover |
| Ghost | Transparent | text-secondary | None | bg-surface-hover |
| Outline | Transparent | text-primary | 1px border | bg-surface-hover |

**Sizes:**
| Size | Padding | Font Size | Min Height |
|------|---------|-----------|------------|
| sm | px-3 py-1.5 | 12px | 32px |
| md | px-4 py-2.5 | 14px | 44px |
| lg | px-6 py-3 | 16px | 48px |

**States:**
- `:disabled` - opacity-50, cursor-not-allowed
- `:focus-visible` - ring-2 ring-brand-primary ring-offset-2

---

## Input Specifications

### .tca-input Class

| Property | Value |
|----------|-------|
| Height | 44px (min-height for accessibility) |
| Padding | 0.625rem 0.875rem |
| Background | var(--color-surface-elevated) |
| Border | 1px solid var(--color-border) |
| Border Radius | var(--radius-md) |
| Font Size | 0.875rem (14px) |

**States:**
- `:focus` - border-color: brand-primary, box-shadow: 0 0 0 3px rgb(99 102 241 / 0.15)
- `:disabled` - opacity-50, cursor-not-allowed
- `::placeholder` - color: text-muted

---

## Card Specifications

### TcaCard Component

| Variant | Background | Shadow | Usage |
|---------|------------|--------|-------|
| Default | surface | shadow-sm | Standard containers |
| Elevated | surface-elevated | shadow-md | Modals, important cards |

**Structure:**
```tsx
<TcaCard>
  <TcaCardHeader>Title area</TcaCardHeader>
  <TcaCardBody>Content area</TcaCardBody>
  <TcaCardFooter>Actions area</TcaCardFooter>
</TcaCard>
```

**Spacing:**
- Header/Body/Footer padding: px-5 py-4
- Border between sections: 1px solid border-subtle
- Card border-radius: radius-lg (12px)

---

## Badge Specifications

### TcaBadge Component

| Variant | Background | Text | Border |
|---------|------------|------|--------|
| Default | surface-elevated | text-primary | 1px border |
| Primary | brand-primary/15 | brand-primary | brand-primary/25 |
| Success | success/15 | success | success/25 |
| Warning | warning/15 | warning | warning/25 |
| Error | error/15 | error | error/25 |
| Info | info/15 | info | info/25 |

**Sizing:**
- Padding: px-2 py-0.5
- Font size: 0.75rem (12px)
- Font weight: 500
- Border radius: radius-md

---

## Status Badge Classes

### Lead Status Badges

| Class | Background | Text | Usage |
|-------|------------|------|-------|
| .tca-status-new | blue/15 | #60a5fa | New leads |
| .tca-status-contacted | yellow/15 | #facc15 | Contacted |
| .tca-status-booked | green/15 | #4ade80 | Booked |
| .tca-status-closed | gray/15 | #a1a1aa | Closed |

---

## Modal Specifications

### Modal Container
- Background: surface-elevated
- Border: 1px solid border
- Border radius: radius-lg
- Shadow: shadow-2xl
- Max width: 32rem (512px) for standard, 48rem (768px) for large

### Modal Structure
```tsx
<div className="tca-card shadow-2xl">
  <header className="px-6 py-4 border-b border-[var(--color-border)]">
    <h2 className="text-xl font-bold tracking-tight">Title</h2>
  </header>
  <div className="px-6 py-4">
    {/* Content */}
  </div>
  <footer className="px-6 py-4 border-t border-[var(--color-border-subtle)]">
    {/* Actions */}
  </footer>
</div>
```

---

## Table Specifications

### .tca-table Class

**Header Row:**
- Padding: 0.875rem 1.25rem
- Font size: 0.75rem (12px)
- Font weight: 600
- Text transform: uppercase
- Letter spacing: 0.05em
- Color: text-muted
- Background: surface
- Border bottom: 1px solid border

**Body Cells:**
- Padding: 1rem 1.25rem
- Font size: 0.875rem (14px)
- Color: text-primary
- Border bottom: 1px solid border-subtle

**Hover State:**
- Background: surface-hover
- Transition: 150ms

---

## Toast Specifications

**Container:**
- Position: fixed bottom-right
- Background: surface-elevated
- Border: 1px solid border
- Border radius: radius-lg
- Shadow: shadow-lg
- Max width: 24rem (384px)

**Content:**
- Padding: 1rem
- Title font-weight: 600
- Description color: text-secondary

---

## Loading States

### Skeleton Class (.tca-skeleton)
- Background: animated gradient shimmer
- Animation: 1.5s infinite
- Border radius: radius-sm

### Loading Spinner
- Size: 1.25rem (20px)
- Border: 2px solid
- Animation: spin 1s linear infinite

---

## Empty States

### .tca-empty-state Class
- Padding: 4rem 2rem
- Text align: center
- Display: flex column centered

**Structure:**
```tsx
<div className="tca-empty-state">
  <div className="tca-empty-state-icon">
    <Icon />
  </div>
  <h3 className="tca-empty-state-title">Title</h3>
  <p className="tca-empty-state-description">Description</p>
  <TcaButton>Action</TcaButton>
</div>
```

---

## Navigation

### Sidebar Nav Links

| State | Background | Text | Indicator |
|-------|------------|------|-----------|
| Default | Transparent | text-secondary | None |
| Hover | surface-hover | text-primary | None |
| Active | brand-primary | text-inverse | 3px left bar |

**Sizing:**
- Padding: 0.625rem 0.875rem
- Gap: 0.75rem (icon to text)
- Font size: 0.875rem (14px)
- Font weight: 500
- Border radius: radius-md

---

## Widget Components

### Chat Header
- Background: dynamic (brand-primary or custom)
- Text: text-inverse
- Padding: var(--space-md)
- Border radius: radius-lg (top only)
- Shadow: shadow-md

### Message Bubbles

| Role | Background | Text | Border |
|------|------------|------|--------|
| User | Gradient (brand-primary) | White | None |
| Assistant | surface-elevated | text-primary | 1px border |

**Sizing:**
- Padding: var(--space-sm) var(--space-lg)
- Max width: 80% (mobile), 70% (tablet), 60% (desktop)
- Border radius: radius-lg

### Chat Input
- Uses .tca-input class
- Height: 44px
- Combined with send button in flex row

---

## Accessibility Checklist

### Focus States
- All interactive elements must have visible focus ring
- Focus ring: `0 0 0 2px background, 0 0 0 4px brand-primary`
- Use `.tca-focus-ring` class for consistent styling

### Hit Targets
- Buttons: minimum 44px height
- Inputs: minimum 44px height
- Links: sufficient padding for 44x44px target

### Color Contrast
- Primary text on background: 4.5:1 minimum
- Secondary text: 4.5:1 minimum
- Brand colors on dark surfaces: verified for readability
