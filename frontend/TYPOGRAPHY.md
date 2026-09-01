# Typography System - LifeSync AI

## Font Stack

### Display & Headings (Tiêu đề)
**Font:** Sora + Inter
- Hỗ trợ đầy đủ tiếng Việt với dấu
- Modern, geometric, nổi bật
- Sử dụng cho H1, H2, H3 và các tiêu đề quan trọng

### Body Text (Nội dung)
**Font:** Inter
- Hỗ trợ đầy đủ tiếng Việt
- Dễ đọc, professional
- Tối ưu cho văn bản dài

## Usage Guide

### HTML Elements

```tsx
<h1>Tiêu đề cấp 1</h1>      // Sora, 36px, Bold
<h2>Tiêu đề cấp 2</h2>      // Sora, 28px, Bold  
<h3>Tiêu đề cấp 3</h3>      // Sora, 22px, SemiBold
<h4>Tiêu đề cấp 4</h4>      // Inter, 18px, SemiBold
<h5>Tiêu đề cấp 5</h5>      // Inter, 16px, SemiBold
<h6>Tiêu đề cấp 6</h6>      // Inter, 14px, SemiBold, UPPERCASE

<p>Nội dung thường</p>      // Inter, 16px, Regular
```

### CSS Classes

#### Font Family
```css
.font-display     /* Sora - dành cho tiêu đề nổi bật */
.font-body        /* Inter - dành cho nội dung */
```

#### Typography Styles
```css
.text-display          /* Tiêu đề lớn, bold, gradient */
.text-heading          /* Tiêu đề phụ, semibold */
.text-body-semibold    /* Nội dung nhấn mạnh */
.text-body-medium      /* Nội dung quan trọng */
.text-body             /* Nội dung thường */
```

#### Special Effects
```css
.text-emphasis    /* Text gradient, nổi bật */
.text-brand       /* Brand gradient, logo style */
```

## Examples

### Hero Section
```tsx
<h1 className="text-display text-4xl lg:text-5xl">
  Quản lý Công việc & Sức khỏe
</h1>
<p className="text-body-medium text-lg text-text-2">
  Ứng dụng tích hợp AI giúp bạn năng suất hơn
</p>
```

### Card Title
```tsx
<h3 className="font-display text-xl font-bold mb-2">
  Nhiệm vụ Hôm nay
</h3>
<p className="text-body text-text-3">
  Bạn có 5 nhiệm vụ cần hoàn thành
</p>
```

### Emphasized Text
```tsx
<span className="text-emphasis">
  Quan trọng:
</span>
<span className="text-body">
  Hoàn thành trước 6:00 PM
</span>
```

### Brand Text
```tsx
<span className="text-brand text-2xl">
  LifeSync AI
</span>
```

## Typography Scale

| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| H1 | 36px (2.25rem) | 700 Bold | Page titles |
| H2 | 28px (1.75rem) | 700 Bold | Section titles |
| H3 | 22px (1.375rem) | 600 SemiBold | Subsection titles |
| H4 | 18px (1.125rem) | 600 SemiBold | Card titles |
| H5 | 16px (1rem) | 600 SemiBold | Small titles |
| H6 | 14px (0.875rem) | 600 SemiBold | Labels |
| Body Large | 18px (1.125rem) | 400-600 | Hero text |
| Body | 16px (1rem) | 400-600 | Default text |
| Body Small | 14px (0.875rem) | 400-500 | Secondary text |
| Caption | 12px (0.75rem) | 400-500 | Metadata |

## Best Practices

### ✅ DO
- Sử dụng Sora cho tiêu đề quan trọng (H1-H3)
- Sử dụng Inter cho nội dung dài
- Dùng `.text-emphasis` cho từ khóa quan trọng
- Giữ line-height 1.5-1.6 cho body text
- Sử dụng font-weight 600+ cho tiêu đề

### ❌ DON'T
- Không dùng quá nhiều font khác nhau
- Không dùng font-weight < 400 (quá mỏng)
- Không dùng ALL CAPS cho đoạn văn dài
- Không dùng letter-spacing âm cho body text
- Không mix quá nhiều font-size trong cùng component

## Vietnamese Support

Cả Sora và Inter đều hỗ trợ đầy đủ:
- Dấu thanh: á à ả ã ạ
- Dấu phụ: ă â ê ô ơ ư
- Kết hợp: ằ ắ ẳ ẵ ặ...

## Performance

- Fonts được preload trong `<head>`
- Sử dụng `display=swap` để tránh FOIT
- Chỉ load 2 font families (Sora + Inter)
- Load weights cần thiết: 400, 500, 600, 700, 800
