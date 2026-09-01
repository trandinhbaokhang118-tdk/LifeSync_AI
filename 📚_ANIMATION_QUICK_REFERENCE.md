# 📚 Animation Quick Reference Card

## 🎯 Cách Sử Dụng Nhanh

### Import Animations
```typescript
import { fadeInUp, staggerContainer, buttonHover } from '@/lib/animations';
import { motion, AnimatePresence } from 'framer-motion';
```

---

## 🎨 Animation Variants

### Fade Animations
```typescript
// Simple fade
<motion.div variants={fadeIn} initial="hidden" animate="visible">

// Fade + slide up
<motion.div variants={fadeInUp} initial="hidden" animate="visible">

// Fade + slide down
<motion.div variants={fadeInDown} initial="hidden" animate="visible">

// Fade + slide left/right
<motion.div variants={fadeInLeft} initial="hidden" animate="visible">
<motion.div variants={fadeInRight} initial="hidden" animate="visible">
```

### Scale Animations
```typescript
// Simple scale
<motion.div variants={scaleIn} initial="hidden" animate="visible">

// Bounce scale
<motion.div variants={scaleInBounce} initial="hidden" animate="visible">
```

### Stagger Children
```typescript
<motion.div variants={staggerContainer} initial="hidden" animate="visible">
  {items.map(item => (
    <motion.div key={item.id} variants={staggerItem}>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

---

## 🎯 Hover Effects

### Button Hover
```typescript
<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
  Click me
</motion.button>
```

### Card Hover
```typescript
<motion.div whileHover={{ y: -4, scale: 1.02 }}>
  Card content
</motion.div>
```

### Icon Hover
```typescript
<motion.div whileHover={{ rotate: 360, scale: 1.1 }}>
  <Icon />
</motion.div>
```

---

## 🔄 Transitions

### With AnimatePresence (for exits)
```typescript
<AnimatePresence mode="wait">
  {isVisible && (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      Content
    </motion.div>
  )}
</AnimatePresence>
```

### Layout Animations
```typescript
<motion.div layout>
  Content that changes size/position
</motion.div>
```

---

## ⏱️ Timing Reference

| Use Case | Duration | Example |
|----------|----------|---------|
| Quick hover | 0.2s | Button hover |
| Standard | 0.3-0.4s | Modals, cards |
| Page change | 0.5-0.6s | Route transitions |
| Stagger delay | 0.05-0.1s | List items |

---

## 🎨 Common Patterns

### Modal/Dialog
```typescript
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.95 }}
  transition={{ duration: 0.3 }}
>
  Modal content
</motion.div>
```

### Page Entrance
```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
>
  Page content
</motion.div>
```

### Loading Spinner
```typescript
<motion.div
  animate={{ rotate: 360 }}
  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
>
  <Loader />
</motion.div>
```

### Pulse Effect
```typescript
<motion.div
  animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
  transition={{ duration: 2, repeat: Infinity }}
>
  Pulsing element
</motion.div>
```

---

## 🎯 Best Practices

### ✅ DO:
- Use `transform` and `opacity` (GPU-accelerated)
- Keep animations under 0.6s
- Use consistent timing
- Test on mobile
- Respect `prefers-reduced-motion`

### ❌ DON'T:
- Animate `width`, `height`, `top`, `left`
- Use too many animations at once
- Make animations too long
- Forget exit animations
- Block user interactions

---

## 📱 Responsive Animations

```typescript
const isMobile = window.innerWidth < 768;

<motion.div
  animate={{ 
    y: isMobile ? -10 : -20,
    scale: isMobile ? 1.02 : 1.05
  }}
>
  Responsive animation
</motion.div>
```

---

## ♿ Accessibility

```typescript
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

<motion.div
  animate={prefersReducedMotion ? {} : { y: -20 }}
>
  Accessible animation
</motion.div>
```

---

## 🔧 Debugging

```typescript
// Log animation state
<motion.div
  onAnimationStart={() => console.log('Started')}
  onAnimationComplete={() => console.log('Completed')}
>
  Content
</motion.div>
```

---

## 📊 Performance Tips

1. **Use `will-change` sparingly**
```typescript
<motion.div style={{ willChange: 'transform' }}>
```

2. **Avoid animating many elements**
```typescript
// ❌ Bad
{items.map(item => <motion.div animate={{...}} />)}

// ✅ Good - Use stagger
<motion.div variants={staggerContainer}>
  {items.map(item => <motion.div variants={staggerItem} />)}
</motion.div>
```

3. **Use `layoutId` for shared transitions**
```typescript
<motion.div layoutId="shared-element">
```

---

## 🎬 Examples From Project

### Dashboard Stats Card
```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  whileHover={{ y: -4, scale: 1.02 }}
  className="stats-card"
>
  <motion.div whileHover={{ rotate: 360 }}>
    <Icon />
  </motion.div>
  <h3>{value}</h3>
</motion.div>
```

### Task Item
```typescript
<motion.div
  layout
  initial={{ opacity: 0, x: -20 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: -100 }}
  whileHover={{ y: -2 }}
>
  <motion.button
    whileHover={{ scale: 1.1, rotate: 5 }}
    whileTap={{ scale: 0.9 }}
  >
    <Checkbox />
  </motion.button>
  <span>{task.title}</span>
</motion.div>
```

### Focus Timer
```typescript
<motion.div
  animate={isRunning ? {
    scale: [1, 1.02, 1],
    filter: ["drop-shadow(0 0 8px rgba(255,255,255,0.8))", 
             "drop-shadow(0 0 15px rgba(255,255,255,0.5))",
             "drop-shadow(0 0 8px rgba(255,255,255,0.8))"]
  } : {}}
  transition={{ duration: 2, repeat: Infinity }}
>
  Timer Ring
</motion.div>
```

---

## 🚀 Quick Start Template

```typescript
import { motion } from 'framer-motion';
import { fadeInUp } from '@/lib/animations';

export function MyComponent() {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
    >
      <h1>My Content</h1>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Action
      </motion.button>
    </motion.div>
  );
}
```

---

**Reference**: `frontend/src/lib/animations.ts`  
**Docs**: https://www.framer.com/motion/  
**Updated**: June 20, 2026
