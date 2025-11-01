# Text Color Guide - Dark Theme

## Quick Reference for Readable Text on Dark Backgrounds

### Primary Text (Headings, Important Content)
```css
text-slate-100  /* #F1F5F9 - Brightest, for H1, H2, important labels */
text-slate-200  /* #E2E8F0 - For H3, H4, card titles */
```

### Secondary Text (Body, Descriptions)
```css
text-slate-300  /* #CBD5E1 - For body text, readable paragraphs */
text-slate-400  /* #94A3B8 - For descriptions, helper text */
```

### Tertiary Text (Muted, Less Important)
```css
text-slate-500  /* #64748B - For timestamps, metadata */
text-slate-600  /* #475569 - For very subtle text */
```

### Accent Colors (Links, Actions)
```css
text-blue-300   /* #93C5FD - For links (lighter) */
text-blue-400   /* #60A5FA - For links, CTAs */
text-blue-500   /* #3B82F6 - For hover states */
```

### Status Colors
```css
/* Success */
text-green-400  /* #4ADE80 - Success messages */
text-green-500  /* #22C55E - Success badges */

/* Error */
text-red-400    /* #F87171 - Error messages */
text-red-500    /* #EF4444 - Error badges */

/* Warning */
text-amber-400  /* #FBBF24 - Warning messages */
text-amber-500  /* #F59E0B - Warning badges */
```

---

## Component-Specific Guidelines

### Cards
- **Title**: `text-slate-100` or `text-slate-200`
- **Description**: `text-slate-400`
- **Metadata**: `text-slate-500`

### Buttons
- **Primary Button Text**: `text-white` (on gradient background)
- **Secondary Button Text**: `text-slate-200`
- **Link Buttons**: `text-blue-400 hover:text-blue-300`

### Forms
- **Labels**: `text-slate-300`
- **Input Text**: `text-slate-200`
- **Placeholder**: `text-slate-500`
- **Helper Text**: `text-slate-400`
- **Error Text**: `text-red-400`

### Tables
- **Headers**: `text-slate-400` (uppercase, smaller)
- **Cell Content**: `text-slate-300`
- **Metadata Cells**: `text-slate-400`

### Navigation
- **Active Link**: `text-white` (on gradient background)
- **Inactive Link**: `text-slate-400`
- **Hover**: `text-slate-200`

---

## Common Mistakes to Avoid

### ❌ Don't Use
```css
text-gray-900   /* Too dark, invisible on dark bg */
text-gray-800   /* Too dark */
text-gray-700   /* Too dark */
text-gray-600   /* Hard to read */
```

### ✅ Use Instead
```css
text-slate-100  /* For dark text-gray-900 */
text-slate-200  /* For dark text-gray-800 */
text-slate-300  /* For dark text-gray-700 */
text-slate-400  /* For dark text-gray-600 */
```

---

## Background Colors for Text

### Card Backgrounds
```css
bg-slate-900/80  /* Main card background */
bg-slate-800/50  /* Secondary sections */
bg-slate-950/50  /* Chat/message areas */
```

### Hover States
```css
hover:bg-slate-800/30  /* Subtle hover */
hover:bg-slate-700/50  /* More prominent hover */
```

---

## Contrast Ratios (WCAG AA Compliance)

| Text Color | Background | Contrast Ratio | Status |
|------------|------------|----------------|--------|
| slate-100 | slate-900 | 12.6:1 | ✅ AAA |
| slate-200 | slate-900 | 10.4:1 | ✅ AAA |
| slate-300 | slate-900 | 7.8:1 | ✅ AAA |
| slate-400 | slate-900 | 5.2:1 | ✅ AA |
| slate-500 | slate-900 | 3.4:1 | ⚠️ Large text only |

---

## Quick Find & Replace

When updating old components:

```bash
# Find all gray text
text-gray-900 → text-slate-100
text-gray-800 → text-slate-200
text-gray-700 → text-slate-300
text-gray-600 → text-slate-400
text-gray-500 → text-slate-500
text-gray-400 → text-slate-600
```

---

## Testing Checklist

- [ ] All headings are readable (slate-100 or slate-200)
- [ ] Body text has good contrast (slate-300 or slate-400)
- [ ] Links are clearly visible (blue-400)
- [ ] Form labels are readable (slate-300)
- [ ] Placeholders are distinguishable (slate-500)
- [ ] Status messages use appropriate colors
- [ ] Hover states provide visual feedback
- [ ] Focus states are clearly visible

---

**Last Updated**: 2024  
**Theme**: Dark Mode (slate-950 background)
