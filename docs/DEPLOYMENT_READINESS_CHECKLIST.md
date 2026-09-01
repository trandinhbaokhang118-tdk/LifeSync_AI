# Checklist hoàn thiện và triển khai LifeSync AI

Ngày kiểm tra: 24/08/2026  
Mục tiêu: frontend trên Vercel, backend NestJS trên Render, MySQL do dịch vụ bên ngoài cung cấp.

## Kết luận nhanh

**Trạng thái tổng thể: CHƯA SẴN SÀNG DEPLOY.**

- Backend đã build, lint, test và khởi động production thành công ở local.
- Frontend chạy dev và lint thành công, nhưng lệnh build chính thức đang lỗi TypeScript.
- Cấu hình hiện tại vẫn trộn hai phương án: frontend Render và frontend Vercel.
- Chuỗi Prisma migration chưa được Git theo dõi đầy đủ, nên database mới trên production chưa thể khởi tạo an toàn.
- Cần xử lý credential trong Git remote, dữ liệu thanh toán nhạy cảm và dependency có lỗ hổng trước khi public repository/deploy.

Ký hiệu:

- [x] Đã kiểm tra và hoạt động.
- [ ] Chưa hoạt động hoặc bắt buộc phải làm.
- [~] Có mã nguồn nhưng chưa thể xác nhận production/thao tác thủ công.
- [-] Tính năng đang chủ động tắt hoặc không bắt buộc cho bản demo.

## 1. Những phần đã hoạt động

### Backend

- [x] `npm run build` thành công.
- [x] ESLint thành công: 0 lỗi, 1 cảnh báo test về kiểu `any`.
- [x] Unit test thành công: 6 test suites, 17 tests.
- [x] E2E test thành công với MySQL local: 8 test suites, 40 tests.
- [x] `npx prisma validate` thành công.
- [x] Database local có 7 migration và đang ở trạng thái up to date.
- [x] Bản build production khởi động thành công bằng `npm run start:prod`.
- [x] `GET http://127.0.0.1:3000/health` trả HTTP 200.
- [x] Swagger local tại `/api-docs` trả HTTP 200.
- [x] Backend bind `0.0.0.0` và đọc `PORT`, phù hợp yêu cầu của Render.
- [x] CORS đã có cơ chế đọc `FRONTEND_URL`.

### Frontend

- [x] Vite dev server tại `http://localhost:5173` trả HTTP 200.
- [x] ESLint thư mục `src` thành công.
- [x] Bundler Vite riêng lẻ tạo được `dist` và service worker PWA.
- [x] Frontend đã đọc API URL qua biến `VITE_API_URL`.
- [x] Thanh toán đang tắt mặc định bằng `VITE_PAYMENTS_ENABLED=false`, an toàn cho lần deploy đầu.

### Repository và vận hành

- [x] Có workflow CI cho Node 20, backend lint/test/build và frontend lint/build.
- [x] Có `.env.example` cho frontend và backend.
- [x] File `.env` thật không được Git theo dõi.
- [x] Docker local có MySQL, Redis và phpMyAdmin phục vụ phát triển.
- [~] Máy local đang có hai tiến trình Node cùng lắng nghe cổng 3000 theo IPv4/IPv6. API đúng trả health tại `127.0.0.1:3000`, còn `localhost:3000` có thể đi nhầm dịch vụ; cần dừng tiến trình thừa hoặc dùng `VITE_API_URL=http://127.0.0.1:3000` khi phát triển.

## 2. Các lỗi đang chặn deploy

### P0 — Bảo mật và dữ liệu nhạy cảm

- [ ] **Thu hồi và tạo lại GitHub Personal Access Token ngay.** Git remote local đang chứa credential trực tiếp trong URL. Không chia sẻ hoặc commit `.git/config`.
- [ ] Đổi Git remote sang URL không chứa credential (HTTPS dùng credential manager hoặc SSH).
- [ ] Xóa thông tin ngân hàng/merchant thật khỏi `render.yaml`, `backend/render.yaml` và `.env.example`; thay bằng placeholder hoặc biến môi trường `sync: false`.
- [ ] Kiểm tra tài liệu có mật khẩu admin/demo; xóa mọi mật khẩu thật và không dùng mật khẩu mẫu trên production.
- [ ] Tạo secret production mới, tối thiểu cho `JWT_SECRET`; không tái sử dụng secret local.

Không đưa repository lên public hoặc kích hoạt deploy tự động trước khi hoàn tất nhóm P0.

### P1 — Frontend chưa build được

- [ ] Sửa 5 lỗi TypeScript trong `frontend/src/services/device-permissions.service.ts`:
  - Chuẩn hóa trạng thái Capacitor `prompt-with-rationale`.
  - Chuẩn hóa trạng thái web Notification `default`.
  - Bảo đảm `body` của local notification luôn là `string`.
- [ ] Cập nhật mapping/label tương ứng trong `DevicePermissionCenter.tsx` hoặc chuẩn hóa hai trạng thái trên về `prompt`.
- [ ] Chạy lại `npm run build`; chỉ đạt khi exit code bằng 0.
- [ ] Commit file service quyền thiết bị và toàn bộ file được import. File service hiện chưa được Git theo dõi, nên build từ Git có thể thiếu module.

### P1 — Prisma migration chưa thể triển khai từ Git

- [ ] Bỏ rule `.gitignore` đang loại phần lớn `backend/prisma/migrations`.
- [ ] Kiểm tra và commit đủ cả 7 thư mục migration, gồm migration khởi tạo schema và các migration tiếp theo.
- [ ] Tạo database staging trống và chạy `npx prisma migrate deploy` để chứng minh một Git checkout mới có thể tạo schema đầy đủ.
- [ ] Không dùng `prisma db push` thay cho lịch sử migration trên production.

### P1 — Dependency có lỗ hổng đã biết

- [ ] Frontend: xử lý 11 cảnh báo runtime từ `npm audit --omit=dev` — 1 moderate, 9 high, 1 critical.
- [ ] Ưu tiên cập nhật `axios`, `react-router-dom`, `@capacitor/cli`/`tar`, `lodash`, `xmldom` và dependency liên quan.
- [ ] Backend: xử lý 18 cảnh báo runtime — 11 moderate, 7 high.
- [ ] Ưu tiên cập nhật `axios`, `multer`, Express/Nest platform, `js-yaml`, `lodash`, `qs`, `uuid` và dependency liên quan.
- [ ] Nâng theo từng nhóm nhỏ, chạy lại lint + unit + E2E + build sau mỗi nhóm.
- [ ] Không chạy mù `npm audit fix --force`; báo cáo hiện tại đề xuất các nâng cấp breaking lên NestJS 11 và package lớn khác.
- [ ] Chạy lại audit và yêu cầu không còn critical/high trước khi phát hành công khai.

### P1 — Git chưa ở trạng thái có thể phát hành

- [ ] Rà và chia 294 thay đổi hiện có thành các commit có chủ đích: 43 staged, 144 unstaged, 117 untracked tại thời điểm kiểm tra.
- [ ] Không commit file build, log, `.env`, upload local, khóa ký Android hoặc credential.
- [ ] Sửa cảnh báo `git diff --check`; worktree hiện có rất nhiều lỗi line-ending/trailing whitespace.
- [ ] Đưa branch cần deploy lên remote sau khi kiểm tra diff cuối cùng.
- [ ] Xác nhận CI xanh. CI hiện sẽ đỏ vì frontend `npm run build` đang lỗi.

## 3. Cấu hình frontend trên Vercel

- [ ] Trong Vercel, import đúng repository và chọn **Root Directory: `frontend`**.
- [ ] Framework Preset: Vite.
- [ ] Install Command: `npm ci`.
- [ ] Build Command: `npm run build`.
- [ ] Output Directory: `dist`.
- [ ] Đổi `base: './'` trong cấu hình Vite thành base phù hợp web `/`, hoặc tách base theo mode nếu Capacitor vẫn cần đường dẫn tương đối.
- [ ] Thêm `frontend/vercel.json` để mọi route SPA rewrite về `index.html`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

- [ ] Tạo biến Vercel Production `VITE_API_URL=https://<render-service>.onrender.com`.
- [ ] Tạo biến `VITE_PAYMENTS_ENABLED=false` cho lần deploy đầu.
- [ ] Deploy và kiểm tra trực tiếp `/`, `/login`, `/register`, `/app/tasks`; refresh route sâu không được 404 và JS/CSS phải trả 200.
- [ ] Nếu dùng Vercel Preview, quyết định rõ chính sách CORS. Backend hiện phù hợp với một origin production chính xác, chưa tự động chấp nhận mọi preview domain.

Tài liệu tham khảo: [Vercel Vite](https://vercel.com/docs/frameworks/frontend/vite), [Vercel monorepo/root directory](https://vercel.com/docs/monorepos/monorepo-faq), [Vercel rewrites](https://vercel.com/docs/routing/rewrites).

## 4. Cấu hình backend trên Render

### Dọn cấu hình Blueprint

- [ ] Chỉ giữ một nguồn cấu hình Render ở root `render.yaml`.
- [ ] Xóa phần Render Static Site vì frontend sẽ chạy trên Vercel.
- [ ] Xóa hoặc đồng bộ `backend/render.yaml` để tránh hai Blueprint khác nhau.
- [ ] `FRONTEND_URL` phải là URL Vercel production thực tế, không tham chiếu một Render frontend service đã bỏ.
- [ ] Không hard-code callback OAuth theo tên service giả định; cập nhật sau khi Render cấp URL thật.
- [ ] Pin Node 20 bằng `engines` hoặc `.node-version` để giống CI.
- [ ] Dùng build command xác định được dependency: `npm ci && npx prisma generate && npm run build`.
- [ ] Với gói Render hỗ trợ pre-deploy command, dùng `npx prisma migrate deploy`; nếu gói free không hỗ trợ, giữ migration trước start và theo dõi lỗi chặt chẽ.
- [ ] Start command cuối cùng phải khởi động `npm run start:prod`.
- [x] Health Check Path có thể dùng `/health`.

### Biến môi trường bắt buộc trên Render

| Biến | Bắt buộc | Giá trị/nguyên tắc |
|---|---:|---|
| `NODE_ENV` | Có | `production` |
| `HOST` | Có | `0.0.0.0` |
| `DATABASE_URL` | Có | URL MySQL production, không phải localhost |
| `JWT_SECRET` | Có | Secret dài, ngẫu nhiên, chỉ lưu trên Render |
| `JWT_EXPIRES_IN` | Có | Theo chính sách dự án |
| `JWT_REFRESH_EXPIRES_IN` | Có | Theo chính sách dự án |
| `FRONTEND_URL` | Có | URL Vercel production chính xác, không có path thừa |
| `PORT` | Không tự đặt | Render cấp giá trị; ứng dụng đã đọc biến này |
| `REDIS_URL` | Khuyến nghị | Redis/Render Key Value cho OTP và trạng thái tạm |
| `RESEND_API_KEY`, `EMAIL_FROM` | Nếu dùng quên mật khẩu | Thiếu hai biến này thì email reset không được gửi thật |
| OAuth client/secret/callback | Nếu bật OAuth | Đăng ký callback đúng URL Render thật ở từng provider |
| AI provider key | Nếu bật AI | Chỉ lưu trong Render, không đưa vào frontend |
| Payment/SePay variables | Chưa bật | Giữ `PAYMENTS_ENABLED=false` đến khi webhook được kiểm thử |

### Database và lưu trữ

- [ ] Chọn MySQL managed bên ngoài có thể truy cập từ Render, hoặc dùng Render private MySQL kèm persistent disk trên gói phù hợp.
- [ ] Bật TLS/SSL nếu nhà cung cấp database yêu cầu.
- [ ] Tạo user database riêng với quyền tối thiểu, không dùng root.
- [ ] Backup trước migration và xác nhận restore thử nghiệm.
- [ ] Không lưu avatar production ở `backend/uploads`. Filesystem web service của Render là tạm thời; chuyển ảnh sang S3/R2/Cloudinary hoặc persistent disk phù hợp.
- [ ] Nếu chưa có Redis, ghi nhận OTP sẽ mất khi backend restart; Redis là bắt buộc nếu cần luồng xác thực ổn định.

Tài liệu tham khảo: [Render web services](https://render.com/docs/web-services), [Render environment variables](https://render.com/docs/configure-environment-variables), [Render health checks](https://render.com/docs/health-checks), [Render MySQL](https://render.com/docs/deploy-mysql), [Render free limitations](https://render.com/docs/free).

## 5. Chức năng chưa xác nhận trên production

- [~] URL Render API đang ghi trong cấu hình không trả health thành công; chưa có backend production hoạt động được xác nhận.
- [~] Chưa có URL Vercel production để kiểm tra.
- [~] Đăng ký, đăng nhập, refresh token và đăng xuất mới được xác nhận qua E2E local, chưa xác nhận qua hai domain production.
- [~] Google OAuth và Facebook OAuth đang báo chưa cấu hình ở local.
- [~] Quên mật khẩu có code, nhưng cần Resend và địa chỉ gửi mới gửi email thật.
- [~] Upload avatar chạy local, nhưng chưa bền vững trên Render do lưu local filesystem.
- [~] CRUD tasks, tags, planner/time blocks, reminders, notifications và analytics cần smoke test bằng trình duyệt sau deploy.
- [~] PWA được build, nhưng manifest hiện chưa có icon và ngôn ngữ output đang là `en`; cần sửa nếu phát hành như PWA tiếng Việt.
- [~] Bundle frontend có chunk khoảng 578 KB và chart chunk khoảng 420 KB; PWA precache khoảng 15.7 MB. Nên tối ưu/lazy-load và nén ảnh/video sau khi hết blocker.
- [-] Thanh toán/SePay nên tiếp tục tắt ở lần phát hành đầu.

## 6. Thứ tự thực hiện đề xuất

1. **Khóa rủi ro bảo mật:** rotate GitHub token, dọn credential và dữ liệu tài chính khỏi file.
2. **Ổn định Git:** commit đủ migration và các source file cần thiết; bỏ file rác/secret; xử lý line endings.
3. **Sửa frontend build:** giải quyết 5 lỗi TypeScript và đạt `npm run build`.
4. **Nâng dependency an toàn:** xử lý critical/high rồi chạy lại toàn bộ test.
5. **Chuẩn hóa deploy config:** Vercel cho frontend; một Render Blueprint chỉ cho backend.
6. **Tạo MySQL production:** chạy migration trên database staging trống trước.
7. **Deploy Render trước:** thêm env, deploy, đợi `/health` trả 200 và kiểm tra log.
8. **Deploy Vercel sau:** đặt `VITE_API_URL` theo URL Render thật, sau đó cập nhật `FRONTEND_URL` trên Render theo URL Vercel thật.
9. **Cấu hình email/OAuth/object storage** nếu những tính năng này nằm trong phạm vi bản phát hành.
10. **Chạy checklist smoke test** bên dưới trước khi công bố.

## 7. Smoke test sau deploy

### Hạ tầng

- [ ] Render deploy thành công, không lặp restart.
- [ ] `GET /health` trả 200 trong trạng thái bình thường.
- [ ] Database migration chạy thành công đúng một chuỗi và không làm mất dữ liệu.
- [ ] Vercel deploy thành công từ commit đã chọn.
- [ ] Refresh route sâu trên Vercel không 404.
- [ ] Không có secret, token, database URL hoặc thông tin cá nhân trong browser bundle/log công khai.

### Xác thực

- [ ] Đăng ký tài khoản mới.
- [ ] Đăng nhập đúng và báo lỗi hợp lý khi sai mật khẩu.
- [ ] Refresh trang vẫn giữ phiên hợp lệ.
- [ ] Logout xóa phiên.
- [ ] Quên mật khẩu gửi email và link/token đổi mật khẩu hoạt động, nếu tính năng được bật.
- [ ] OAuth hoạt động từ đầu đến cuối, nếu tính năng được bật.
- [ ] CORS chấp nhận Vercel production và từ chối origin không hợp lệ.

### Chức năng chính

- [ ] Tạo/sửa/xóa task và tag.
- [ ] Planner/time block hiển thị và kéo thả đúng.
- [ ] Reminder/notification hoạt động theo quyền của trình duyệt.
- [ ] Dashboard/analytics lấy đúng dữ liệu của người đang đăng nhập.
- [ ] Settings cập nhật hồ sơ và đổi mật khẩu.
- [ ] Avatar vẫn còn sau khi Render restart/redeploy.
- [ ] Admin route yêu cầu đúng role và user thường không truy cập được.
- [ ] AI chat trả kết quả hoặc hiển thị trạng thái chưa cấu hình rõ ràng.

### Chất lượng phát hành

- [ ] Backend: lint, unit, E2E, build đều xanh.
- [ ] Frontend: lint và build đều xanh.
- [ ] `npm audit --omit=dev --audit-level=high` đạt chính sách phát hành.
- [ ] CI xanh trên đúng commit deploy.
- [ ] Kiểm tra responsive ở mobile, tablet và desktop.
- [ ] Kiểm tra Chrome/Edge và ít nhất một trình duyệt mobile.
- [ ] Có backup database, tài khoản quản trị production và quy trình rollback.

## 8. Tiêu chí được phép phát hành

Chỉ chuyển trạng thái sang **SẴN SÀNG DEPLOY** khi đồng thời đạt:

- Không còn mục P0.
- Frontend và backend build thành công từ một Git checkout sạch.
- Đủ 7 migration được commit và chạy thành công trên database trống.
- Không còn dependency critical/high chưa được đánh giá/chấp nhận rõ ràng.
- Render `/health` trả 200 và Vercel route sâu hoạt động.
- Auth, CRUD task/planner, CORS và dữ liệu người dùng vượt qua smoke test.
- CI xanh trên đúng commit chuẩn bị phát hành.
