# Treasure Coast AI - Component Inventory

## Core TCA Components (src/components/tca/)

### TcaButton
- **Variants**: primary, secondary, ghost, outline
- **Sizes**: sm, md, lg
- **Features**: Focus ring, hover animations, disabled state, full-width option
- **Usage**: Primary CTAs, form actions, navigation

### TcaCard
- **Variants**: default, elevated
- **Sub-components**: TcaCardHeader, TcaCardBody, TcaCardFooter
- **Features**: Consistent padding, border styling, shadow
- **Usage**: Content containers, settings panels, testimonials

### TcaBadge
- **Variants**: default, primary, success, warning, error, info
- **Features**: Pill shape, status indicators
- **Usage**: Status labels, tags, counters

### TcaPageShell
- **Features**: Consistent page header with title/subtitle/actions
- **Usage**: App page layouts

## CSS Utility Classes (globals.css)

### Surface Classes
- `.tca-surface` - Background surface
- `.tca-surface-elevated` - Elevated surface
- `.tca-background` - App background
- `.tca-border` - Standard border
- `.tca-border-subtle` - Subtle border

### Text Classes
- `.tca-text-primary` - Primary text color
- `.tca-text-secondary` - Secondary text color
- `.tca-text-muted` - Muted text color
- `.tca-text-brand` - Brand accent text

### Button Classes
- `.tca-btn-primary` - Gradient primary button
- `.tca-btn-secondary` - Secondary button with border

### Input Classes
- `.tca-input` - Styled form input with focus ring

### Table Classes
- `.tca-table` - Styled table with hover states
- `.tca-table th` - Table header styling
- `.tca-table td` - Table cell styling

### Status Badges
- `.tca-status-new` - Blue status
- `.tca-status-contacted` - Yellow status
- `.tca-status-booked` - Green status
- `.tca-status-closed` - Gray status

### Widget Bubbles
- `.tca-bubble-user` - User message bubble (gradient)
- `.tca-bubble-assistant` - Assistant message bubble

### Layout Classes
- `.tca-page-header` - Page header spacing
- `.tca-page-title` - Page title typography
- `.tca-page-subtitle` - Page subtitle typography
- `.tca-divider` - Horizontal divider
- `.tca-nav-link` - Navigation link styling

### Loading States
- `.tca-skeleton` - Skeleton loading animation
- `.tca-empty-state` - Empty state container

### Effects
- `.tca-gradient-text` - Brand gradient text effect
- `.tca-shadow-glow` - Brand glow shadow
- `.tca-focus-ring` - Accessible focus ring
- `.tca-radius-lg` / `.tca-radius-md` - Border radius

## Third-Party Components

### Lucide React Icons
- Used throughout for consistent iconography
- Icons: Lock, Plus, Pencil, Trash2, ChevronUp/Down, Copy, Check, ExternalLink, etc.

### Clerk Authentication
- UserButton for authenticated user avatar/menu

## Branding Components

### BrandingCssVars
- Injects custom branding CSS variables from organization settings

### PublicNav
- Marketing site navigation header

### PublicFooter
- Marketing site footer

## Dashboard Components

### RevenueMetricsCard
- KPI display for revenue analytics

### SetupStatusCard
- Onboarding progress with checkpoints

## Widget Components

### ChatBox
- Main chat interface with message history
- Lead capture form
- Booking flow integration

### BookingDirectives
- Service picker buttons
- Booking link CTA

---

## Identified Inconsistencies

1. **Icon Usage**: Mix of inline SVGs and Lucide icons
2. **Form Inputs**: Some pages use custom inputs vs `.tca-input`
3. **Card Usage**: Some pages use div with custom styling vs TcaCard
4. **Button Variants**: Occasional inline button styles instead of TcaButton
5. **Widget Styling**: Heavy inline styles instead of class-based approach
