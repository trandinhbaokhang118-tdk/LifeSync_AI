# ANDREJ KARPATHY CODING SKILLS - TÓM TẮT CHI TIẾT

> Nguồn: https://github.com/multica-ai/andrej-karpathy-skills
> Tác giả: Forrest Chang (inspired by Andrej Karpathy)
> Stars: 178k+ | Forks: 18.2k+

## 📌 MỤC ĐÍCH

Cải thiện hành vi của AI coding assistants (Claude Code, Cursor, v.v.) dựa trên quan sát của Andrej Karpathy về các lỗi phổ biến khi LLMs viết code.

---

## ❌ CÁC VẤN ĐỀ THƯỜNG GẶP

### 1. **Đưa ra giả định sai và chạy theo nó**
- LLMs không kiểm tra giả định
- Không quản lý confusion (sự không rõ ràng)
- Không tìm kiếm clarifications
- Không nêu ra inconsistencies
- Không present tradeoffs
- Không push back khi cần

### 2. **Overcomplicate code và APIs**
- Thích tạo abstractions phức tạp
- Bloat code không cần thiết
- Không dọn dẹp dead code
- Implement 1000 dòng khi 100 dòng là đủ

### 3. **Thay đổi code không liên quan**
- Sửa/xóa comments và code mà không hiểu đủ
- Thay đổi những phần orthogonal (không liên quan) với task
- Side effects không cần thiết

---

## ✅ 4 NGUYÊN TẮC GIẢI PHÁP

## 1️⃣ THINK BEFORE CODING (Suy nghĩ trước khi code)

**Mục tiêu**: Không giả định, không giấu confusion, nêu ra tradeoffs

### Áp dụng:
- ✅ **State assumptions explicitly** - Nếu không chắc, hỏi thay vì đoán
- ✅ **Present multiple interpretations** - Đừng chọn im lặng khi có ambiguity
- ✅ **Push back when warranted** - Nếu có cách đơn giản hơn, nói ra
- ✅ **Stop when confused** - Nêu rõ điều không rõ và hỏi clarification

### Ví dụ:
```
❌ SAI: Im lặng implement theo hiểu biết riêng
✅ ĐÚNG: "Tôi thấy có 2 cách hiểu yêu cầu này:
         1. [Cách A]
         2. [Cách B]
         Bạn muốn cách nào?"
```

---

## 2️⃣ SIMPLICITY FIRST (Đơn giản trước tiên)

**Mục tiêu**: Code tối thiểu giải quyết vấn đề. Không speculative.

### Quy tắc:
- ❌ **KHÔNG** thêm features ngoài yêu cầu
- ❌ **KHÔNG** abstractions cho single-use code
- ❌ **KHÔNG** "flexibility" hoặc "configurability" không được yêu cầu
- ❌ **KHÔNG** error handling cho scenarios không thể xảy ra
- ✅ **NẾU** 200 dòng có thể là 50, rewrite nó

### Test:
> "Một senior engineer có nói đây là overcomplicated không?"
> Nếu CÓ → Đơn giản hóa

### Ví dụ:
```typescript
// ❌ QUÁDỨC PHỨC TẠP:
interface ConfigOptions {
  strategy?: 'default' | 'advanced' | 'custom';
  cacheEnabled?: boolean;
  retryConfig?: {
    maxRetries: number;
    backoff: 'linear' | 'exponential';
  };
}

class DataProcessor {
  constructor(private config: ConfigOptions) {}
  // ... 200 dòng code
}

// ✅ ĐƠN GIẢN:
function processData(data: string[]): string[] {
  return data.filter(d => d.length > 0)
             .map(d => d.trim());
}
```

---

## 3️⃣ SURGICAL CHANGES (Thay đổi phẫu thuật)

**Mục tiêu**: Chỉ động vào những gì cần thiết. Chỉ dọn dẹp mess của mình.

### Khi edit code hiện có:
- ❌ **KHÔNG** "improve" code, comments, hoặc formatting bên cạnh
- ❌ **KHÔNG** refactor những thứ không bị broken
- ✅ **MATCH** existing style, ngay cả khi bạn làm khác
- ✅ **NẾU** thấy unrelated dead code, mention nó - KHÔNG xóa

### Khi changes tạo ra orphans:
- ✅ **XÓA** imports/variables/functions mà CHANGES CỦA BẠN làm unused
- ❌ **KHÔNG** xóa pre-existing dead code trừ khi được yêu cầu

### Test:
> "Mỗi dòng thay đổi có trace trực tiếp đến request của user không?"

### Ví dụ:
```diff
// YÊU CẦU: "Fix bug ở hàm calculateTotal"

// ❌ SAI - Sửa luôn cả formatting không liên quan:
  function calculateTotal(items) {
-   return items.reduce((sum, item) => sum + item.price, 0)
+   return items.reduce((sum, item) => sum + item.price, 0);
  }
  
- function oldUnusedFunction() { ... }  // ← Không được yêu cầu xóa

// ✅ ĐÚNG - Chỉ fix bug được yêu cầu:
  function calculateTotal(items) {
-   return items.reduce((sum, item) => sum + item.price, 0)
+   return items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }
```

---

## 4️⃣ GOAL-DRIVEN EXECUTION (Thực thi hướng mục tiêu)

**Mục tiêu**: Định nghĩa success criteria. Loop cho đến khi verified.

### Transform imperative → verifiable goals:

| Imperative (Mệnh lệnh) | Goal-Driven (Hướng mục tiêu) |
|-------------------------|-------------------------------|
| "Add validation" | "Write tests for invalid inputs, then make them pass" |
| "Fix the bug" | "Write a test that reproduces it, then make it pass" |
| "Refactor X" | "Ensure tests pass before and after" |

### Cho multi-step tasks, state plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

### Key Insight từ Andrej:
> "LLMs rất giỏi looping cho đến khi đạt được specific goals...
> Đừng bảo nó làm gì, đưa cho nó success criteria và xem nó làm."

### Ví dụ:
```
❌ SAI: "Thêm validation cho form"

✅ ĐÚNG: 
"Goal: Form validation works correctly
Success criteria:
1. Write test: empty email → shows error
2. Write test: invalid email → shows error  
3. Write test: valid email → no error
4. Implement validation to make all tests pass
5. Verify: npm test passes"
```

---

## 🎯 BIẾT NÓ ĐANG HOẠT ĐỘNG KHI:

1. ✅ **Ít unnecessary changes trong diffs** - Chỉ có requested changes
2. ✅ **Ít rewrites do overcomplication** - Code đơn giản ngay lần đầu
3. ✅ **Clarifying questions đến trước implementation** - Không phải sau mistakes
4. ✅ **Clean, minimal PRs** - Không có drive-by refactoring

---

## 📥 CÀI ĐẶT

### Option A: Claude Code Plugin (Khuyến nghị)
```bash
# Add marketplace
/plugin marketplace add forrestchang/andrej-karpathy-skills

# Install plugin
/plugin install andrej-karpathy-skills@karpathy-skills
```

### Option B: CLAUDE.md (Per-project)
```bash
# New project
curl -o CLAUDE.md https://raw.githubusercontent.com/forrestchang/andrej-karpathy-skills/main/CLAUDE.md

# Existing project (append)
echo "" >> CLAUDE.md
curl https://raw.githubusercontent.com/forrestchang/andrej-karpathy-skills/main/CLAUDE.md >> CLAUDE.md
```

### Option C: Cursor
Repository bao gồm committed Cursor project rule (`.cursor/rules/karpathy-guidelines.mdc`)

---

## ⚖️ TRADEOFF NOTE

Guidelines này bias về **caution over speed**.

- ✅ **Áp dụng đầy đủ**: Non-trivial work (features mới, bug fixes phức tạp)
- ⚠️ **Dùng judgment**: Trivial tasks (typo fixes, obvious one-liners)

**Mục tiêu**: Giảm costly mistakes trên non-trivial work, không làm chậm simple tasks.

---

## 🎓 CUSTOMIZATION

Merge với project-specific instructions:

```markdown
## Project-Specific Guidelines

- Use TypeScript strict mode
- All API endpoints must have tests
- Follow the existing error handling patterns in `src/utils/errors.ts`
- Use Prisma for database queries
- Follow the component structure in `src/components/`
```

---

## 💡 KEY TAKEAWAYS

1. **Think First**: Clarify before coding
2. **Keep It Simple**: Minimum viable solution
3. **Be Surgical**: Only touch what's needed
4. **Verify Goals**: Loop until success criteria met

### Câu châm ngôn:
> "Don't tell the LLM what to do.
> Give it success criteria and watch it go."
> — Andrej Karpathy

---

## 📊 THỐNG KÊ

- ⭐ Stars: **178,000+**
- 🔀 Forks: **18,200+**
- 👀 Watching: **990+**
- 👥 Contributors: **8**

---

## 📚 TÀI LIỆU THAM KHẢO

1. **Main Repository**: https://github.com/multica-ai/andrej-karpathy-skills
2. **CLAUDE.md**: Guidelines chi tiết
3. **EXAMPLES.md**: Ví dụ principles và common mistakes
4. **CURSOR.md**: Setup cho Cursor IDE
5. **Andrej's Original Post**: https://x.com/karpathy/status/2015883857489522876

---

## 🔖 NOTES CHO LẦN SAU

Khi user yêu cầu apply Karpathy's principles:

1. **Luôn hỏi clarification** trước khi implement
2. **Prefer simple solutions** - không over-engineer
3. **Minimal changes** - chỉ sửa những gì cần
4. **Test-driven** - define success criteria rõ ràng
5. **Loop until verified** - không dừng cho đến khi pass criteria

---

**License**: MIT
**Created**: 2024
**Last Updated**: 2026-06-18
