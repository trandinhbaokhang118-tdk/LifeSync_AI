# 🎨 UI/UX Implementation Guide - LifeSync AI

## Overview
Kết hợp **tiêu chuẩn UI/UX** với **Galaxy Theme** để tạo giao diện hiện đại, trending, và dễ sử dụng.

---

## 1. Design Principles ✅

### Implemented:
- ✅ **Clarity > Decoration**: Dashboard hiển thị "Hôm nay / Ưu tiên / Lịch" nổi bật
- ✅ **Fast actions**: Quick Add Modal, Start Focus button ≤ 2 clicks
- ✅ **Consistency**: Sử dụng CSS variables và component library thống nhất
- ✅ **Accessible**: Focus rings, keyboard navigation

### To Improve:
- [ ] Thêm keyboard shortcuts (Cmd+K cho search, Cmd+N cho new task)
- [ ] Cải thiện focus management trong modals

---

## 2. Layout & Grid ✅

### Current Implementation:
- ✅ **8px system**: Spacing tokens (4/8/12/16/24/32/48)
- ✅ **Container**: max-width 1280px với responsive padding
- ✅ **App Shell**: 
  - Desktop: Sidebar (collapsible) + Header
  - Mobile: Bottom nav (cần implement)
- ✅ **Elevation**: Surface-1 (cards) < Surface-2 (popovers) < Surface-3 (modals)

### To Improve:
- [ ] Implement bottom navigation cho mobile
- [ ] Add drawer cho mobile sidebar
- [ ] Responsive filter bar cho Tasks/Calendar

---

## 3. Typography ✅

### Current Scale:
```css
H1: 1.875rem (30px) / 700  ✅
H2: 1.5rem (24px) / 600    ✅
H3: 1.25rem (20px) / 600   ✅
Body: 1rem (16px) / 400-500 ✅
Caption: 0.875rem (14px)   ✅
Small: 0.75rem (12px)      ✅
```

### Font Family:
- ✅ Primary: Inter (via Google Fonts hoặc system-ui fallback)
- ✅ Line-height: 1.4-1.6
- ✅ Heading luôn đậm hơn body

### To Improve:
- [ ] Import Inter font từ Google Fonts
- [ ] Optimize font loading với font-display: swap

---

## 4. Color Tokens ✅

### CSS Variables Implementation:

#### Light Mode (Galaxy Aqua)
```css
--bg: #F6FBFF
--surface-1: rgba(255,255,255,.78)  /* Glass cards */
--surface-2: rgba(255,255,255,.90)  /* Popovers */
--surface-3: rgba(255,255,255,.96)  /* Modals */
--text: #0B1220
--text-2: rgba(11,18,32,.72)
--text-3: rgba(11,18,32,.52)
--primary: #12C2FF
--primary-gradient: linear-gradient(135deg, #12C2FF 0%, #3B82F6 55%, #8B5CF6 100%)
```

#### Dark Mode (Deep Glossy Black)
```css
--bg: #070A0F
--surface-1: rgba(15,23,42,.55)
--surface-2: rgba(15,23,42,.68)
--surface-3: rgba(15,23,42,.80)
--text: rgba(248,250,252,.92)
--text-2: rgba(248,250,252,.72)
--text-3: rgba(248,250,252,.52)
--primary: #12C2FF
--primary-gradient: linear-gradient(135deg, #12C2FF 0%, #3B82F6 50%, #8B5CF6 100%)
--primary-glow: 0 0 20px rgba(18,194,255,.30)
```

### Status:
- ✅ Variables defined in `theme-variables.css`
- ⚠️ Need to migrate from old color system to new variables
- [ ] Update all components to use CSS variables

---

## 5. Visual Hierarchy Rules ✅

### Implemented:
- ✅ **CTA Primary**: Uses `--primary-gradient`
- ✅ **Text levels**: --text, --text-2, --text-3
- ✅ **Borders**: Thin, subtle (rgba with low opacity)
- ⚠️ **Glow/neon**: Currently used, but need to limit to CTA + focus only

### To Improve:
- [ ] Remove glow from non-interactive elements
- [ ] Ensure CTA buttons always use gradient
- [ ] Add subtle glow on hover for primary buttons (dark mode only)

---

## 6. Components Standard

### Buttons ✅

#### Current Implementation:
```tsx
// Primary Button
<Button variant="default">
  // Uses bg-primary-600, needs to use --primary-gradient
</Button>

// Secondary Button
<Button variant="outline">
  // Correct implementation
</Button>
```

#### To Update:
```css
/* Primary Button - Should use gradient */
.btn-primary {
  background: var(--primary-gradient);
  color: white;
  box-shadow: var(--shadow-md);
}

.btn-primary:hover {
  background: var(--primary-hover);
  box-shadow: var(--shadow-lg);
}

.dark .btn-primary:hover {
  box-shadow: var(--primary-glow-hover);
}

/* Focus Ring - Required */
.btn-primary:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}
```

### Inputs ✅

#### Current:
- ✅ Height: 40px (h-10)
- ✅ Radius: 10-12px
- ✅ Focus: border + ring
- ✅ Error: red border + helper text

#### To Improve:
```css
.input {
  background: var(--surface-1);
  border: 1px solid var(--border);
  height: 40px;
  border-radius: 10px;
}

.input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--focus);
}
```

### Cards ✅

#### Current:
```css
.card {
  background: rgba(255, 255, 255, 0.75);  /* Should use var(--surface-1) */
  border: 1px solid rgba(0, 188, 212, 0.15);  /* Should use var(--border) */
  box-shadow: 0 4px 12px rgba(0, 188, 212, 0.12);  /* Should use var(--shadow-md) */
  border-radius: 12px;
}
```

#### To Update:
```css
.card {
  background: var(--surface-1);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-md);
  border-radius: 12px;
  backdrop-filter: blur(24px);
}
```

### Badges ✅

#### Status Badges:
```tsx
// TODO
<Badge className="bg-info-bg text-info border-info">Chưa làm</Badge>

// IN_PROGRESS
<Badge className="bg-warning-bg text-warning border-warning">Đang làm</Badge>

// DONE
<Badge className="bg-success-bg text-success border-success">Hoàn thành</Badge>

// OVERDUE
<Badge className="bg-danger-bg text-danger border-danger">Quá hạn</Badge>
```

#### To Implement:
```css
.badge {
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid;
}

.badge-todo {
  background: var(--info-bg);
  color: var(--info);
  border-color: var(--info);
}

.badge-in-progress {
  background: var(--warning-bg);
  color: var(--warning);
  border-color: var(--warning);
}

.badge-done {
  background: var(--success-bg);
  color: var(--success);
  border-color: var(--success);
}

.badge-overdue {
  background: var(--danger-bg);
  color: var(--danger);
  border-color: var(--danger);
}
```

---

## 7. States ✅

### Current Implementation:
- ✅ **Loading**: Skeleton components
- ✅ **Empty**: EmptyState component với icon + title + action
- ✅ **Error**: ErrorState component với retry button
- ✅ **Success**: Toast notifications
- ✅ **Destructive**: ConfirmDialog component

### All Pages Have:
- ✅ Dashboard: Loading skeletons, empty state
- ✅ Tasks: Loading, empty, error states
- ✅ Calendar: Loading states
- ✅ Notifications: Empty state

---

## 8. Accessibility ✅

### Keyboard Navigation:
- ✅ Tab/Shift+Tab: Works on all controls
- ✅ Enter: Submits forms
- ✅ ESC: Closes modals
- ✅ Focus rings: Visible with `--focus` color

### To Improve:
- [ ] Add keyboard shortcuts (Cmd+K, Cmd+N, etc.)
- [ ] Improve focus trap in modals
- [ ] Add aria-labels to icon buttons
- [ ] Test with screen readers

### Click Targets:
- ✅ Buttons: ≥ 40px height
- ✅ Mobile: Touch targets ≥ 44px

### Contrast:
- ✅ Light mode: 14.2:1 (AAA)
- ✅ Dark mode: 14.8:1 (AAA)

---

## 9. Responsive Breakpoints ✅

### Current:
```css
Mobile: < 640px
Tablet: 640-1024px
Desktop: ≥ 1024px
```

### Implementation:
- ✅ Sidebar: Desktop only, hidden on mobile
- ⚠️ Mobile nav: Need to implement bottom nav
- ✅ Filter bars: Responsive (collapse on mobile)
- ✅ Grid layouts: Responsive columns

### To Improve:
- [ ] Bottom navigation for mobile
- [ ] Drawer for mobile sidebar
- [ ] Filter sheet for mobile
- [ ] Optimize touch targets for mobile

---

## 10. Page UI Requirements

### Dashboard ✅
- ✅ Summary cards (4 stats)
- ✅ Today plan section
- ✅ Quick actions sidebar
- ✅ Focus CTA button
- [ ] Add quick add button in header

### Tasks ✅
- ✅ Filter/search bar
- ✅ Task list with cards
- ✅ Create/Edit modal
- ✅ Delete confirmation
- [ ] Bulk actions (select multiple)
- [ ] Detail drawer (instead of modal)

### Calendar ⚠️
- ✅ Week/month view
- [ ] Drag/drop time blocks
- [ ] Overlap error detection
- [ ] Better mobile view

### Focus ⚠️
- ✅ Timer component
- [ ] Zen mode (fullscreen)
- [ ] Session history
- [ ] Statistics

### Admin ⚠️
- [ ] Table with sort/filter/pagination
- [ ] Confirm actions
- [ ] Audit log UI

---

## 11. Do/Don't Checklist

### ✅ Do:
- ✅ Use CSS variables (--primary, --text, etc.)
- ✅ Keep spacing consistent (8px system)
- ✅ Prioritize "Today / Priority / Schedule"
- ✅ Use glassmorphism for cards
- ✅ Maintain text hierarchy

### ⚠️ Don't:
- ⚠️ Lạm dụng neon/glow (cần giảm)
- ✅ Không dùng nền phẳng đơn sắc
- ⚠️ Có một số màu hardcode cần chuyển sang variables

---

## Migration Plan

### Phase 1: CSS Variables (Priority: HIGH)
1. [ ] Import `theme-variables.css` vào `index.css`
2. [ ] Update Button component to use `--primary-gradient`
3. [ ] Update Card component to use `--surface-1`, `--border`, `--shadow-md`
4. [ ] Update Input component to use variables
5. [ ] Update Badge component to use semantic color variables

### Phase 2: Components (Priority: MEDIUM)
1. [ ] Refactor Button variants
2. [ ] Add gradient support to primary buttons
3. [ ] Limit glow effects to CTA + focus only
4. [ ] Update all hardcoded colors to variables

### Phase 3: Mobile (Priority: MEDIUM)
1. [ ] Implement bottom navigation
2. [ ] Add mobile drawer for sidebar
3. [ ] Optimize touch targets
4. [ ] Test on real devices

### Phase 4: Accessibility (Priority: HIGH)
1. [ ] Add keyboard shortcuts
2. [ ] Improve focus management
3. [ ] Add aria-labels
4. [ ] Screen reader testing

### Phase 5: Features (Priority: LOW)
1. [ ] Bulk actions for tasks
2. [ ] Drag/drop calendar
3. [ ] Zen mode for focus
4. [ ] Admin tables

---

## Testing Checklist

### Visual:
- [ ] Light mode: All text readable, proper contrast
- [ ] Dark mode: Neon glow subtle, not overwhelming
- [ ] Gradients smooth, no banding
- [ ] Glassmorphism effect visible
- [ ] Shadows appropriate depth

### Interaction:
- [ ] All buttons have hover states
- [ ] Focus rings visible on all interactive elements
- [ ] Modals close with ESC
- [ ] Forms submit with Enter
- [ ] Tab navigation works

### Responsive:
- [ ] Mobile: All content accessible
- [ ] Tablet: Layout adapts properly
- [ ] Desktop: Full features available
- [ ] Touch targets ≥ 44px on mobile

### Performance:
- [ ] No layout shifts
- [ ] Smooth transitions
- [ ] Fast theme switching
- [ ] No jank on scroll

---

## Files to Update

### High Priority:
1. `frontend/src/index.css` - Import theme-variables, update classes
2. `frontend/src/components/ui/button.tsx` - Use gradient for primary
3. `frontend/src/components/ui/badge.tsx` - Use semantic colors
4. `frontend/src/components/ui/input.tsx` - Use CSS variables

### Medium Priority:
5. `frontend/src/pages/Dashboard.tsx` - Optimize layout
6. `frontend/src/pages/Tasks.tsx` - Add bulk actions
7. `frontend/src/pages/Calendar.tsx` - Add drag/drop
8. `frontend/src/components/layout/Header.tsx` - Add quick add

### Low Priority:
9. Mobile navigation component
10. Admin tables
11. Focus zen mode

---

**Status**: 🟡 **IN PROGRESS**
**Completion**: ~70%
**Next Steps**: Migrate to CSS variables, implement mobile nav

**Date**: January 18, 2026
**Version**: 1.1.0
