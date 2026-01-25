# DELIVERABLE 4: PREMIUM UI UPGRADE SPEC

**Objective:** Transform UI from "good" to "multi-million-dollar agency-grade"
**Theme:** "Coastal Dusk Luxury" - Dark base + neon accents + glass effects + premium polish

---

## 1. DESIGN TOKENS (Exact Values)

### 1.1 Color Palette

#### Base Colors (Dark Luxury)
```css
:root {
  /* Backgrounds */
  --color-background: #09090b;           /* Deep near-black */
  --color-surface: #18181b;              /* Slightly lighter panels */
  --color-surface-elevated: #27272a;      /* Modals, important cards */
  --color-surface-hover: #3f3f46;         /* Hover states */

  /* Borders */
  --color-border: #27272a;                /* Subtle borders */
  --color-border-subtle: #1f1f23;         /* Even subtler */
  --color-border-focus: #6366f1;          /* Focus ring */

  /* Text */
  --color-text-primary: #fafafa;          /* Main text */
  --color-text-secondary: #a1a1aa;        /* Descriptions */
  --color-text-muted: #71717a;            /* Labels, hints */
  --color-text-inverse: #09090b;          /* Text on brand colors */

  /* Brand Colors (Neon Accents) */
  --color-brand-primary: #6366f1;         /* Indigo */
  --color-brand-primary-hover: #4f46e5;   /* Darker indigo */
  --color-brand-primary-light: #818cf8;   /* Lighter indigo */
  --color-brand-secondary: #8b5cf6;       /* Violet */
  --color-brand-accent: #22d3ee;          /* Cyan (use sparingly) */
  --color-brand-accent-alt: #ec4899;      /* Magenta (use sparingly) */

  /* Semantic Colors */
  --color-success: #10b981;               /* Green */
  --color-success-bg: #10b98115;          /* Green with 8% opacity */
  --color-warning: #f59e0b;               /* Amber */
  --color-warning-bg: #f59e0b15;
  --color-error: #ef4444;                 /* Red */
  --color-error-bg: #ef444415;
  --color-info: #3b82f6;                  /* Blue */
  --color-info-bg: #3b82f615;
}
```

### 1.2 Typography Scale

#### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

**Recommendation:** Add Inter font from Google Fonts for premium feel.

#### Type Scale
```css
/* Headings */
--font-size-h1: 2.25rem;    /* 36px */
--font-size-h2: 1.875rem;   /* 30px */
--font-size-h3: 1.5rem;     /* 24px */
--font-size-h4: 1.25rem;    /* 20px */
--font-size-h5: 1.125rem;   /* 18px */
--font-size-h6: 1rem;       /* 16px */

/* Body */
--font-size-base: 0.875rem;     /* 14px */
--font-size-lg: 1rem;           /* 16px */
--font-size-sm: 0.75rem;        /* 12px */
--font-size-xs: 0.6875rem;      /* 11px */

/* Weights */
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
--font-weight-extrabold: 800;

/* Line Heights */
--line-height-tight: 1.25;      /* Headings */
--line-height-normal: 1.5;      /* Body */
--line-height-relaxed: 1.625;   /* Long-form content */

/* Letter Spacing */
--letter-spacing-tight: -0.025em;   /* H1, H2 */
--letter-spacing-normal: 0;
--letter-spacing-wide: 0.025em;
```

### 1.3 Spacing Scale

```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

### 1.4 Border Radius

```css
--radius-sm: 0.375rem;    /* 6px - inputs, small buttons */
--radius-md: 0.5rem;      /* 8px - buttons, badges */
--radius-lg: 0.75rem;     /* 12px - cards, modals */
--radius-xl: 1rem;        /* 16px - large containers */
--radius-2xl: 1.5rem;     /* 24px - hero sections */
--radius-full: 9999px;    /* Fully rounded */
```

### 1.5 Shadows

```css
/* Subtle Elevation */
--shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);

/* Brand Glow (use sparingly for CTAs) */
--shadow-glow: 0 0 24px 0 rgb(99 102 241 / 0.12);
--shadow-glow-hover: 0 0 32px 0 rgb(99 102 241 / 0.2);
```

### 1.6 Transitions

```css
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-bounce: 500ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

---

## 2. COMPONENT SPECIFICATIONS

### 2.1 TcaButton

#### Variants
| Variant | Background | Text | Border | Hover | Glow |
|---------|------------|------|--------|-------|------|
| **primary** | linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) | white | none | -translate-y-0.5 + glow | yes |
| **secondary** | surface-elevated | text-primary | 1px border | bg-surface-hover | no |
| **ghost** | transparent | text-secondary | none | bg-surface-hover | no |
| **destructive** | error | white | none | darker error | no |
| **outline** | transparent | text-primary | 1px border-primary | border-primary-light | no |

#### Sizes
| Size | Padding | Font Size | Min Height | Icon Size |
|------|---------|-----------|------------|-----------|
| **sm** | 8px 12px | 12px | 32px | 14px |
| **md** | 10px 16px | 14px | 44px | 16px |
| **lg** | 12px 24px | 16px | 52px | 20px |

#### States
- `:hover` - Transform + brightness increase
- `:active` - Scale 0.98
- `:focus-visible` - Ring 2px brand-primary with 2px offset
- `:disabled` - Opacity 50%, cursor not-allowed, no hover effects

#### Code Template
```tsx
<button className={cn(
  "inline-flex items-center justify-center gap-2",
  "font-medium rounded-md transition-all",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  "disabled:opacity-50 disabled:pointer-events-none",
  {
    primary: "bg-gradient-to-br from-brand-primary to-brand-secondary text-white hover:-translate-y-0.5 hover:shadow-glow active:scale-98",
    secondary: "bg-surface-elevated text-text-primary border border-border hover:bg-surface-hover",
    ghost: "text-text-secondary hover:bg-surface-hover",
    destructive: "bg-error text-white hover:bg-error-dark",
    outline: "border border-brand-primary text-brand-primary hover:bg-brand-primary/10",
  }[variant],
  {
    sm: "px-3 py-2 text-xs min-h-[32px]",
    md: "px-4 py-2.5 text-sm min-h-[44px]",
    lg: "px-6 py-3 text-base min-h-[52px]",
  }[size]
)}>
  {icon && <span className="icon">{icon}</span>}
  {children}
</button>
```

---

### 2.2 TcaInput

#### Base Styling
- **Height:** 44px (accessibility minimum)
- **Padding:** 10px 14px
- **Background:** var(--color-surface-elevated)
- **Border:** 1px solid var(--color-border)
- **Border Radius:** var(--radius-md)
- **Font Size:** 14px
- **Transition:** border-color 200ms, box-shadow 200ms

#### States
- `:focus` - border-color: brand-primary, box-shadow: 0 0 0 3px brand-primary/15
- `:hover` - border-color: slightly brighter
- `:disabled` - opacity 50%, cursor not-allowed
- `:error` - border-color: error, focus ring error color

#### With Icon
- **Icon Position:** Absolute left-12px
- **Input Padding:** pl-40px when icon present

#### Code Template
```tsx
<div className="relative">
  {icon && (
    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
      {icon}
    </div>
  )}
  <input
    className={cn(
      "w-full min-h-[44px] px-3.5 py-2.5",
      "bg-surface-elevated border border-border rounded-md",
      "text-sm text-text-primary placeholder:text-text-muted",
      "focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent",
      "transition-colors duration-200",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      icon && "pl-10",
      error && "border-error focus:ring-error"
    )}
    {...props}
  />
</div>
```

---

### 2.3 TcaCard

#### Variants
| Variant | Background | Shadow | Border | Usage |
|---------|------------|--------|--------|-------|
| **default** | surface | shadow-sm | 1px border-subtle | Standard containers |
| **elevated** | surface-elevated | shadow-md | 1px border | Modals, important cards |
| **glass** | surface-elevated/80 | shadow-lg | 1px border-subtle | Premium effect, hero |

#### Structure
```tsx
<div className="tca-card bg-surface border border-border-subtle rounded-lg shadow-sm overflow-hidden">
  <div className="tca-card-header px-6 py-4 border-b border-border-subtle">
    <h3 className="text-lg font-semibold tracking-tight">Title</h3>
    <p className="text-sm text-text-secondary">Description</p>
  </div>
  <div className="tca-card-body px-6 py-4">
    {/* Content */}
  </div>
  <div className="tca-card-footer px-6 py-4 border-t border-border-subtle bg-surface/50">
    {/* Actions */}
  </div>
</div>
```

---

### 2.4 TcaModal

#### Backdrop
- **Background:** rgba(0, 0, 0, 0.75)
- **Blur:** backdrop-blur-sm (optional, if supported)
- **Z-index:** 50

#### Container
- **Max Width:** 32rem (512px) standard, 48rem (768px) large
- **Background:** surface-elevated
- **Border:** 1px solid border
- **Border Radius:** radius-lg
- **Shadow:** shadow-2xl
- **Animation:** Scale in from 95% + fade in (200ms)

#### Behavior
- **ESC key:** Closes modal
- **Click outside:** Closes modal (except destructive confirms)
- **Focus trap:** Enabled
- **Body scroll:** Locked when open

#### Structure
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
  <div className="relative bg-surface-elevated border border-border rounded-lg shadow-2xl max-w-lg w-full animate-in fade-in zoom-in-95 duration-200">
    <div className="px-6 py-4 border-b border-border">
      <h2 className="text-xl font-bold tracking-tight">Modal Title</h2>
      <button className="absolute top-4 right-4" onClick={onClose}>
        <XIcon className="h-5 w-5" />
      </button>
    </div>
    <div className="px-6 py-4">
      {/* Content */}
    </div>
    <div className="px-6 py-4 border-t border-border-subtle flex justify-end gap-3">
      <TcaButton variant="ghost" onClick={onClose}>Cancel</TcaButton>
      <TcaButton variant="primary" onClick={onConfirm}>Confirm</TcaButton>
    </div>
  </div>
</div>
```

---

### 2.5 TcaToast

#### Position
- **Fixed:** bottom-right (desktop), bottom-center (mobile)
- **Offset:** 16px from edges
- **Z-index:** 60 (above modals)
- **Stack:** Vertical, newest on top, max 3 visible

#### Styling
- **Background:** surface-elevated
- **Border:** 1px solid border
- **Border Radius:** radius-lg
- **Shadow:** shadow-lg
- **Max Width:** 24rem (384px)
- **Animation:** Slide in from right + fade in (300ms)
- **Auto-dismiss:** 5 seconds (configurable)

#### Variants
| Type | Icon | Icon Color | Border Left |
|------|------|------------|-------------|
| **success** | CheckCircleIcon | success | 4px solid success |
| **error** | XCircleIcon | error | 4px solid error |
| **warning** | AlertTriangleIcon | warning | 4px solid warning |
| **info** | InfoIcon | info | 4px solid info |

#### Structure
```tsx
<div className="bg-surface-elevated border border-border rounded-lg shadow-lg border-l-4 border-l-success p-4 flex items-start gap-3 animate-in slide-in-from-right fade-in duration-300">
  <CheckCircleIcon className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
  <div className="flex-1">
    <p className="text-sm font-medium text-text-primary">Success!</p>
    <p className="text-sm text-text-secondary mt-1">Your changes have been saved.</p>
  </div>
  <button onClick={onDismiss} className="text-text-muted hover:text-text-primary">
    <XIcon className="h-4 w-4" />
  </button>
</div>
```

---

### 2.6 TcaTable

#### Base Styling
- **Border:** 1px solid border
- **Border Radius:** radius-lg
- **Overflow:** hidden (for rounded corners)

#### Header
- **Background:** surface
- **Padding:** 12px 16px
- **Font Size:** 12px
- **Font Weight:** 600
- **Text Transform:** uppercase
- **Letter Spacing:** 0.05em
- **Color:** text-muted
- **Border Bottom:** 1px solid border

#### Rows
- **Padding:** 16px 16px
- **Font Size:** 14px
- **Border Bottom:** 1px solid border-subtle
- **Hover:** bg-surface-hover, transition 150ms

#### Empty State
- **Padding:** 48px 32px
- **Text Align:** center
- **Icon:** 40px, text-muted
- **Title:** font-semibold, text-text-primary
- **Description:** text-sm, text-text-secondary

---

### 2.7 TcaSkeleton

#### Shimmer Effect
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.tca-skeleton {
  background: linear-gradient(
    90deg,
    var(--color-surface) 0%,
    var(--color-surface-hover) 50%,
    var(--color-surface) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-md);
}
```

#### Variants
- **Text:** h-4, w-full or w-[percentage]
- **Circle:** rounded-full, w-[size], h-[size]
- **Rectangle:** rounded-md, w-[width], h-[height]

---

### 2.8 TcaEmptyState

#### Structure
- **Container:** py-12 px-6, text-center
- **Icon:** 48px, text-text-muted, mb-4
- **Title:** text-lg, font-semibold, text-text-primary, mb-2
- **Description:** text-sm, text-text-secondary, mb-6, max-w-md mx-auto
- **Action:** TcaButton variant="primary"

#### Usage
```tsx
<TcaEmptyState
  icon={<InboxIcon className="h-12 w-12" />}
  title="No leads yet"
  description="Leads will appear here once visitors interact with your AI assistant. Install the widget on your website to get started."
  action={{
    label: "View embed instructions",
    href: "/app/settings/embed"
  }}
/>
```

---

## 3. PAGE-BY-PAGE VISUAL FIXES

### 3.1 Marketing Site

#### Landing Page (`/`)

**Issues:**
- Hero section lacks visual impact
- CTA buttons blend in
- Feature grid spacing inconsistent
- Testimonials feel flat

**Fixes:**
```tsx
// Hero Section
<div className="relative overflow-hidden bg-gradient-to-br from-background via-background to-brand-primary/5">
  <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
  <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32">
    <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight">
      <span className="block text-text-primary">AI that answers</span>
      <span className="block bg-gradient-to-r from-brand-primary via-brand-accent to-brand-secondary bg-clip-text text-transparent">
        books appointments
      </span>
      <span className="block text-text-primary">and captures leads</span>
    </h1>
    <p className="mt-6 text-lg sm:text-xl text-text-secondary max-w-2xl">
      Automatically. Correctly. With proof it's making you money.
    </p>
    <div className="mt-10 flex flex-col sm:flex-row gap-4">
      <TcaButton variant="primary" size="lg" className="shadow-glow">
        Request Demo
      </TcaButton>
      <TcaButton variant="secondary" size="lg">
        Try Live Demo →
      </TcaButton>
    </div>
  </div>
</div>

// Feature Grid - Consistent Spacing
<div className="grid md:grid-cols-3 gap-8">
  {features.map((feature) => (
    <TcaCard key={feature.title} variant="default" className="hover:shadow-lg transition-shadow">
      <TcaCardBody>
        <div className="h-12 w-12 rounded-lg bg-brand-primary/10 flex items-center justify-center mb-4">
          {feature.icon}
        </div>
        <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
        <p className="text-sm text-text-secondary">{feature.description}</p>
      </TcaCardBody>
    </TcaCard>
  ))}
</div>

// Testimonials - Add Depth
<div className="grid md:grid-cols-3 gap-6">
  {testimonials.map((t) => (
    <TcaCard key={t.author} variant="glass" className="border-l-4 border-l-brand-accent">
      <TcaCardBody>
        <div className="flex items-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <StarIcon key={i} className="h-4 w-4 text-warning fill-current" />
          ))}
        </div>
        <blockquote className="text-sm italic text-text-secondary mb-4">
          "{t.quote}"
        </blockquote>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary"></div>
          <div>
            <p className="font-semibold text-sm">{t.author}</p>
            <p className="text-xs text-text-muted">{t.role}</p>
          </div>
        </div>
      </TcaCardBody>
    </TcaCard>
  ))}
</div>
```

---

#### Pricing Page (`/pricing`)

**Issues:**
- Tiers look generic
- No visual hierarchy for recommended plan
- CTA buttons not prominent

**Fixes:**
```tsx
<div className="grid md:grid-cols-3 gap-8">
  {plans.map((plan) => (
    <TcaCard
      key={plan.name}
      variant={plan.recommended ? "elevated" : "default"}
      className={cn(
        "relative",
        plan.recommended && "ring-2 ring-brand-primary shadow-glow"
      )}
    >
      {plan.recommended && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-gradient-to-r from-brand-primary to-brand-secondary text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
            MOST POPULAR
          </span>
        </div>
      )}
      <TcaCardBody className="pt-8">
        <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
        <div className="mb-6">
          <span className="text-4xl font-extrabold">${plan.price}</span>
          <span className="text-text-secondary">/month</span>
        </div>
        <ul className="space-y-3 mb-8">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <CheckIcon className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
        <TcaButton
          variant={plan.recommended ? "primary" : "secondary"}
          className="w-full"
        >
          {plan.cta}
        </TcaButton>
      </TcaCardBody>
    </TcaCard>
  ))}
</div>
```

---

### 3.2 App Pages

#### Dashboard (`/app`)

**Issues:**
- KPI cards lack hierarchy
- Layout feels cramped
- No visual flow

**Fixes:**
```tsx
// KPI Cards with Gradient Backgrounds
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <TcaCard className="bg-gradient-to-br from-brand-primary/10 to-transparent border-brand-primary/20">
    <TcaCardBody>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text-secondary">Total Leads</p>
          <p className="text-3xl font-bold text-text-primary mt-1">{stats.leads}</p>
        </div>
        <div className="h-12 w-12 rounded-lg bg-brand-primary/10 flex items-center justify-center">
          <UsersIcon className="h-6 w-6 text-brand-primary" />
        </div>
      </div>
      <div className="mt-4 flex items-center text-sm">
        <TrendingUpIcon className="h-4 w-4 text-success mr-1" />
        <span className="text-success font-medium">+12%</span>
        <span className="text-text-muted ml-1">from last month</span>
      </div>
    </TcaCardBody>
  </TcaCard>
  {/* Repeat for other KPIs */}
</div>
```

---

#### Leads Page (`/app/leads`)

**Issues:**
- Table feels cluttered
- Status badges inconsistent
- Filters not prominent

**Fixes:**
```tsx
// Filters Section - Prominent
<div className="bg-surface border border-border rounded-lg p-4 mb-6">
  <div className="flex flex-wrap items-center gap-4">
    <TcaSelect label="Status" options={statusOptions} />
    <TcaSelect label="Temperature" options={tempOptions} />
    <TcaInput
      icon={<SearchIcon />}
      placeholder="Search leads..."
      className="min-w-[240px]"
    />
    <TcaButton variant="ghost" size="sm">
      Clear filters
    </TcaButton>
  </div>
</div>

// Table with Better Styling
<TcaTable>
  <thead>
    <tr>
      <th>Date</th>
      <th>Name</th>
      <th>Service</th>
      <th>Temperature</th>
      <th>Status</th>
      <th>Score</th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    {leads.map((lead) => (
      <tr key={lead.id} className="hover:bg-surface-hover cursor-pointer" onClick={() => openDrawer(lead)}>
        <td className="text-sm text-text-muted">{formatDate(lead.createdAt)}</td>
        <td className="font-medium">{lead.name}</td>
        <td className="text-sm">{lead.service?.name}</td>
        <td>
          <TcaBadge variant={getTempVariant(lead.temperature)}>
            {lead.temperature}
          </TcaBadge>
        </td>
        <td>
          <TcaBadge variant={getStatusVariant(lead.status)}>
            {lead.status}
          </TcaBadge>
        </td>
        <td className="font-semibold">{lead.score}</td>
        <td>
          <ChevronRightIcon className="h-4 w-4 text-text-muted" />
        </td>
      </tr>
    ))}
  </tbody>
</TcaTable>
```

---

## 4. ACCESSIBILITY REQUIREMENTS

### 4.1 Focus Rings
- **Visible on all interactive elements**
- **Style:** 2px solid brand-primary with 2px offset
- **Contrast ratio:** Minimum 3:1 against background

### 4.2 Color Contrast
- **Text on background:** Minimum 4.5:1
- **Large text (18px+):** Minimum 3:1
- **UI components:** Minimum 3:1

### 4.3 Keyboard Navigation
- **Tab order:** Logical flow
- **Enter/Space:** Activates buttons
- **Escape:** Closes modals/drawers
- **Arrow keys:** Navigate lists/menus

### 4.4 ARIA Labels
- **All icons:** aria-label or aria-labelledby
- **Form inputs:** Associated labels
- **Modals:** role="dialog", aria-modal="true"
- **Toasts:** role="alert"

### 4.5 Screen Reader Support
- **Skip links:** "Skip to main content"
- **Landmark regions:** nav, main, aside, footer
- **Live regions:** aria-live for dynamic updates

---

## 5. VISUAL REGRESSION TEST COVERAGE

### Pages to Baseline
1. Landing page (/)
2. Pricing page (/pricing)
3. Demo page (/demo)
4. Dashboard (/app)
5. Analytics (/app/analytics)
6. Leads list (/app/leads)
7. Lead detail drawer (open)
8. KB page (/app/kb)
9. Settings hub (/app/settings)
10. Services settings (/app/settings/services)
11. Hours settings (/app/settings/hours)
12. Widget (/widget/[key])
13. Widget with message bubbles
14. Widget booking flow (service selection)
15. Widget completion screen

### Masked Elements
- Timestamps (e.g., "2 minutes ago")
- Random IDs (e.g., lead publicIds)
- Dynamic counts (if unstable in test)
- API response times

---

## 6. IMPLEMENTATION CHECKLIST

### Phase 1: Design Tokens (1 hour)
- [ ] Create `src/styles/tokens.css` with all CSS variables
- [ ] Import in `src/app/globals.css`
- [ ] Test dark mode only (light mode deferred)

### Phase 2: Core Components (6 hours)
- [ ] TcaButton - all variants
- [ ] TcaInput
- [ ] TcaSelect
- [ ] TcaModal
- [ ] TcaDrawer
- [ ] TcaToast + Provider
- [ ] TcaTable
- [ ] TcaSkeleton
- [ ] TcaEmptyState

### Phase 3: Marketing Pages (4 hours)
- [ ] Landing page hero upgrade
- [ ] Feature grid polish
- [ ] Testimonials redesign
- [ ] Pricing page premium treatment
- [ ] Demo page polish

### Phase 4: App Pages (6 hours)
- [ ] Dashboard KPI cards
- [ ] Leads table + filters
- [ ] Lead detail drawer
- [ ] Analytics page
- [ ] Settings pages
- [ ] KB page

### Phase 5: Widget (2 hours)
- [ ] Chat header gradient
- [ ] Message bubble styling
- [ ] Booking button prominence
- [ ] Completion screen polish

### Phase 6: Visual Regression (2 hours)
- [ ] Generate baselines for all pages
- [ ] Mask dynamic elements
- [ ] Add to CI pipeline
- [ ] Document process

---

**Total Time:** ~21 hours for complete premium UI upgrade

