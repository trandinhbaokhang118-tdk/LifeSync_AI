export default function FontTest() {
    return (
        <div className="min-h-screen bg-surface-1 p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-brand text-5xl mb-4">
                        LifeSync AI
                    </h1>
                    <p className="text-text-2 text-lg">
                        Kiểm tra Font Tiếng Việt
                    </p>
                </div>

                {/* Typography Scale */}
                <div className="surface-card p-6 space-y-6">
                    <h2 className="text-heading text-2xl mb-4">
                        📝 Typography Scale Test
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <h1>H1: Quản lý Công việc và Sức khỏe Thông minh</h1>
                            <code className="text-xs text-text-3">Manrope, 36px, Bold 800</code>
                        </div>

                        <div>
                            <h2>H2: Nhiệm vụ Hôm nay - Đạt mục tiêu</h2>
                            <code className="text-xs text-text-3">Manrope, 28px, Bold 700</code>
                        </div>

                        <div>
                            <h3>H3: Danh sách Công việc Ưu tiên</h3>
                            <code className="text-xs text-text-3">Manrope, 22px, Bold 700</code>
                        </div>

                        <div>
                            <h4>H4: Thông báo từ Hệ thống</h4>
                            <code className="text-xs text-text-3">Noto Sans, 18px, SemiBold 600</code>
                        </div>

                        <div>
                            <h5>H5: Chi tiết Nhiệm vụ</h5>
                            <code className="text-xs text-text-3">Noto Sans, 16px, SemiBold 600</code>
                        </div>

                        <div>
                            <h6>H6: Nhãn Phân loại</h6>
                            <code className="text-xs text-text-3">Noto Sans, 14px, SemiBold 600</code>
                        </div>
                    </div>
                </div>

                {/* Vietnamese Diacritics Test */}
                <div className="surface-card p-6 space-y-4">
                    <h2 className="text-heading text-2xl mb-4">
                        ✅ Kiểm tra Dấu Tiếng Việt
                    </h2>

                    <div className="space-y-3">
                        <div>
                            <h3 className="font-semibold mb-2">Dấu thanh:</h3>
                            <p className="text-lg">
                                á à ả ã ạ - é è ẻ ẽ ẹ - í ì ỉ ĩ ị - ó ò ỏ õ ọ - ú ù ủ ũ ụ - ý ỳ ỷ ỹ ỵ
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">Dấu phụ:</h3>
                            <p className="text-lg">
                                ă â ê ô ơ ư đ
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">Kết hợp:</h3>
                            <p className="text-lg">
                                ằ ắ ẳ ẵ ặ - ầ ấ ẩ ẫ ậ - ề ế ể ễ ệ - ồ ố ổ ỗ ộ - ờ ớ ở ỡ ợ - ừ ứ ử ữ ự
                            </p>
                        </div>
                    </div>
                </div>

                {/* Real Content Examples */}
                <div className="surface-card p-6 space-y-4">
                    <h2 className="text-heading text-2xl mb-4">
                        📄 Ví dụ Nội dung Thực tế
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <h3 className="font-bold text-xl mb-2">
                                Công việc Ưu tiên Cao
                            </h3>
                            <p className="text-body">
                                Hoàn thành <span className="text-emphasis">báo cáo tháng</span> trước 5:00 chiều.
                                Đây là nhiệm vụ quan trọng cần được ưu tiên hàng đầu.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-bold text-xl mb-2">
                                Thông báo Hệ thống
                            </h3>
                            <p className="text-body">
                                Bạn có <span className="text-emphasis">3 nhiệm vụ mới</span> được giao từ
                                người quản lý. Vui lòng kiểm tra và xác nhận trong vòng 24 giờ.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-bold text-xl mb-2">
                                Mục tiêu Sức khỏe
                            </h3>
                            <p className="text-body">
                                Đạt được <span className="text-emphasis">10,000 bước chân</span> mỗi ngày
                                để duy trì sức khỏe tốt. Hiện tại bạn đã đi được 7,245 bước.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Emphasis Test */}
                <div className="surface-card p-6">
                    <h2 className="text-heading text-2xl mb-4">
                        ✨ Test Nhấn mạnh
                    </h2>

                    <div className="space-y-3">
                        <p className="text-lg">
                            Text thường: Quản lý công việc hiệu quả
                        </p>
                        <p className="text-lg font-medium">
                            Font Medium: Quản lý công việc hiệu quả
                        </p>
                        <p className="text-lg font-semibold">
                            Font SemiBold: Quản lý công việc hiệu quả
                        </p>
                        <p className="text-lg font-bold">
                            Font Bold: Quản lý công việc hiệu quả
                        </p>
                        <p className="text-lg font-extrabold">
                            Font ExtraBold: Quản lý công việc hiệu quả
                        </p>
                        <p className="text-lg">
                            Với <span className="text-emphasis">text-emphasis class</span> gradient
                        </p>
                    </div>
                </div>

                {/* Size Test */}
                <div className="surface-card p-6 space-y-3">
                    <h2 className="text-heading text-2xl mb-4">
                        📏 Test Kích thước
                    </h2>

                    <p className="text-xs">Extra Small (12px): Văn bản rất nhỏ với dấu tiếng Việt</p>
                    <p className="text-sm">Small (14px): Văn bản nhỏ với dấu tiếng Việt</p>
                    <p className="text-base">Base (16px): Văn bản thường với dấu tiếng Việt</p>
                    <p className="text-lg">Large (18px): Văn bản lớn với dấu tiếng Việt</p>
                    <p className="text-xl">XL (20px): Văn bản rất lớn với dấu tiếng Việt</p>
                    <p className="text-2xl">2XL (24px): Văn bản cực lớn với dấu tiếng Việt</p>
                </div>

                {/* Summary */}
                <div className="surface-card p-6 bg-surface-highlight border-surface-highlight-border">
                    <h2 className="text-heading text-2xl mb-4">
                        📊 Tổng kết
                    </h2>
                    <ul className="space-y-2 text-body">
                        <li>✅ Font Manrope cho tiêu đề (H1-H3)</li>
                        <li>✅ Font Noto Sans cho nội dung (H4-H6, body)</li>
                        <li>✅ Hỗ trợ đầy đủ dấu tiếng Việt</li>
                        <li>✅ Weight: 400, 500, 600, 700, 800</li>
                        <li>✅ Tối ưu readability và hierarchy</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
