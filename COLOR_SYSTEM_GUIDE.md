# 🎨 HƯỚNG DẪN HỆ THỐNG MÀU - LifeSync AI

## ⚠️ VẤN ĐỀ: Tại sao `text-blue-500` không hoạt động?

Dự án này dùng **TailwindCSS v4** - phiên bản mới không có màu mặc định như `blue`, `red`, `green` nữa!

### ❌ KHÔNG THỂ DÙNG (Tailwind v3 cũ):
```jsx
<div className="text-blue-500">Text</div>        // ❌ KHÔNG TỒN TẠI
<div className="bg-red-500">Background</div>     // ❌ KHÔNG TỒN TẠI
<div className="border-green-500">Border</div>   // ❌ KHÔNG TỒN TẠI
```

---

## 📁 FILE ĐIỀU CHỈNH MÀU

### **File chính: `frontend/src/index.css`**

```
Dòng 1-100:    CSS Variables (:root và .dark)
Dòng 100-200:  @theme directive (Tailwind v4)
Dòng 1000+:    Utility classes (text-primary-*, bg-primary-*, etc.)
```

---

## ✅ CÁC CÁCH DÙNG MÀU

### **1. Dùng Primary Colors (Aqua/Cyan) - Đã có sẵn**

```jsx
// Text colors
<div className="text-primary-500">Aqua text</div>
<div className="text-primary-600">Darker aqua</div>
<div className="text-primary-400">Lighter aqua</div>

// Background colors
<div className="bg-primary-500">Aqua background</div>
<div className="bg-primary-100">Light aqua bg</div>

// Border colors
<div className="border border-primary-500">Aqua border</div>

// Hover states
<button className="hover:bg-primary-600">Hover me</button>
<a className="hover:text-primary-700">Link</a>
```

**Màu Primary có sẵn:**
- `primary-50` → `primary-900` (Light mode: #e0f7fa → #006064)
- Dark mode tự động chuyển sang neon cyan

---

### **2. Dùng CSS Variables - Linh hoạt nhất**

```jsx
// Text colors
<div style={{ color: 'var(--primary)' }}>Primary text</div>
<div style={{ color: 'var(--text)' }}>Normal text</div>
<div style={{ color: 'var(--text-2)' }}>Secondary text</div>
<div style={{ color: 'var(--text-3)' }}>Muted text</div>

// Background colors
<div style={{ background: 'var(--surface-1)' }}>Glass surface</div>
<div style={{ background: 'var(--primary-gradient)' }}>Gradient</div>

// Semantic colors
<div style={{ color: 'var(--success)' }}>Success</div>
<div style={{ color: 'var(--warning)' }}>Warning</div>
<div style={{ color: 'var(--danger)' }}>Danger</div>
<div style={{ color: 'var(--info)' }}>Info</div>
```

**CSS Variables có sẵn:**
```css
/* Backgrounds */
--bg, --surface-1, --surface-2, --surface-3

/* Text */
--text, --text-2, --text-3

/* Primary */
--primary, --primary-2, --primary-gradient, --primary-hover

/* Semantic */
--success, --warning, --danger, --info
--success-bg, --warning-bg, --danger-bg, --info-bg

/* Borders & Shadows */
--border, --shadow, --shadow-md, --shadow-lg, --focus
```

---

### **3. Dùng Utility Classes - Đã định nghĩa sẵn**

```jsx
// Glass effect
<div className="glass">Glass card</div>
<div className="card">Normal card</div>
<div className="card-hover">Card with hover</div>

// Badges
<span className="badge badge-todo">TODO</span>
<span className="badge badge-in-progress">In Progress</span>
<span className="badge badge-done">Done</span>
<span className="badge badge-high">High Priority</span>
<span className="badge badge-medium">Medium</span>
<span className="badge badge-low">Low</span>

// Input
<input className="input" />
<input className="input input-error" />

// Typography
<h1 className="h1">Heading 1</h1>
<p className="body">Body text</p>
<p className="caption">Caption</p>
<p className="small">Small text</p>
```

---

## 🔧 THÊM MÀU MỚI (Blue, Red, Green, etc.)

Nếu bạn muốn dùng `text-blue-500`, cần thêm vào `frontend/src/index.css`:

### **Bước 1: Thêm vào @theme (sau dòng 200)**

```css
@theme {
  /* ... existing code ... */

  /* ===== BLUE COLORS ===== */
  --color-blue-50: #eff6ff;
  --color-blue-100: #dbeafe;
  --color-blue-200: #bfdbfe;
  --color-blue-300: #93c5fd;
  --color-blue-400: #60a5fa;
  --color-blue-500: #3b82f6;
  --color-blue-600: #2563eb;
  --color-blue-700: #1d4ed8;
  --color-blue-800: #1e40af;
  --color-blue-900: #1e3a8a;

  /* ===== RED COLORS ===== */
  --color-red-50: #fef2f2;
  --color-red-100: #fee2e2;
  --color-red-200: #fecaca;
  --color-red-300: #fca5a5;
  --color-red-400: #f87171;
  --color-red-500: #ef4444;
  --color-red-600: #dc2626;
  --color-red-700: #b91c1c;
  --color-red-800: #991b1b;
  --color-red-900: #7f1d1d;

  /* ===== GREEN COLORS ===== */
  --color-green-50: #f0fdf4;
  --color-green-100: #dcfce7;
  --color-green-200: #bbf7d0;
  --color-green-300: #86efac;
  --color-green-400: #4ade80;
  --color-green-500: #22c55e;
  --color-green-600: #16a34a;
  --color-green-700: #15803d;
  --color-green-800: #166534;
  --color-green-900: #14532d;
}
```

### **Bước 2: Thêm utility classes (cuối file)**

```css
/* ===== BLUE COLORS ===== */
.text-blue-500 { color: #3b82f6 !important; }
.text-blue-600 { color: #2563eb !important; }
.bg-blue-500 { background-color: #3b82f6 !important; }
.bg-blue-600 { background-color: #2563eb !important; }
.border-blue-500 { border-color: #3b82f6 !important; }

/* ===== RED COLORS ===== */
.text-red-500 { color: #ef4444 !important; }
.bg-red-500 { background-color: #ef4444 !important; }
.border-red-500 { border-color: #ef4444 !important; }

/* ===== GREEN COLORS ===== */
.text-green-500 { color: #22c55e !important; }
.bg-green-500 { background-color: #22c55e !important; }
.border-green-500 { border-color: #22c55e !important; }
```

---

## 💡 KHUYẾN NGHỊ

### **Nên dùng:**
1. **CSS Variables** - Tự động chuyển đổi light/dark mode
2. **Primary colors** - Đã có sẵn, nhất quán với design system
3. **Utility classes** - Glass effect, badges, cards

### **Không nên:**
- Dùng màu Tailwind v3 cũ (`text-blue-500`) - sẽ không hoạt động
- Hardcode màu trực tiếp (`color: '#3b82f6'`) - không responsive với theme

---

## 📝 VÍ DỤ THỰC TẾ

### **Dashboard Card:**
```jsx
<div className="card-hover p-6">
  <h3 className="h3" style={{ color: 'var(--text)' }}>
    Tasks Today
  </h3>
  <p className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
    12
  </p>
  <span className="badge badge-in-progress">In Progress</span>
</div>
```

### **Button với gradient:**
```jsx
<button 
  className="px-4 py-2 rounded-lg font-medium"
  style={{ 
    background: 'var(--primary-gradient)',
    color: 'white'
  }}
>
  Save Changes
</button>
```

### **Input field:**
```jsx
<div>
  <label className="label">Email</label>
  <input 
    type="email" 
    className="input"
    placeholder="Enter your email"
  />
</div>
```

---

## 🎯 TÓM TẮT

| Cách dùng | Ví dụ | Khi nào dùng |
|-----------|-------|--------------|
| **CSS Variables** | `style={{ color: 'var(--primary)' }}` | ✅ Khuyến nghị - Tự động dark mode |
| **Primary classes** | `className="text-primary-500"` | ✅ Tốt - Màu aqua/cyan |
| **Utility classes** | `className="glass card-hover"` | ✅ Tốt - Effects & layouts |
| **Tailwind v3 colors** | `className="text-blue-500"` | ❌ KHÔNG hoạt động |

---

## 🔗 FILES LIÊN QUAN

- `frontend/src/index.css` - Định nghĩa tất cả màu sắc
- `frontend/src/components/ui/button.tsx` - Button với gradient
- `frontend/src/components/ui/input.tsx` - Input với CSS variables
- `tieuchuanuiux.md` - UI/UX standards

---

**Cần thêm màu mới?** Hỏi tôi và tôi sẽ thêm vào `index.css` cho bạn! 🚀
