const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Read .env file manually
function loadEnv() {
    const envPath = path.join(__dirname, '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const match = trimmed.match(/^([^=]+)=["']?([^"']*)["']?$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim();
                process.env[key] = value;
            }
        }
    }
}

loadEnv();

async function checkUsage() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error('❌ Không tìm thấy GEMINI_API_KEY trong file .env');
        process.exit(1);
    }

    console.log('🔍 Đang kiểm tra trạng thái API key...\n');
    console.log(`🔑 Key: ${apiKey.substring(0, 15)}...${apiKey.substring(apiKey.length - 5)}\n`);

    // Test với nhiều requests nhỏ để check rate limit
    let successCount = 0;
    let failCount = 0;
    let rateLimitHit = false;

    console.log('📊 Đang test rate limit (sẽ gửi 5 requests)...\n');

    for (let i = 1; i <= 5; i++) {
        try {
            const startTime = Date.now();
            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
                {
                    contents: [{
                        parts: [{
                            text: `Test ${i}`
                        }]
                    }]
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 10000
                }
            );

            const duration = Date.now() - startTime;
            successCount++;
            console.log(`✅ Request ${i}/5 - Thành công (${duration}ms)`);

            // Đợi 1 giây giữa các requests để tránh rate limit
            if (i < 5) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

        } catch (error) {
            failCount++;
            const duration = Date.now() - startTime;

            if (error.response?.status === 429) {
                console.log(`⚠️  Request ${i}/5 - Rate limit hit (${duration}ms)`);
                rateLimitHit = true;

                // Parse retry-after nếu có
                const retryAfter = error.response.data?.error?.details?.find(
                    d => d['@type']?.includes('RetryInfo')
                )?.retryDelay;

                if (retryAfter) {
                    console.log(`   → Retry sau: ${retryAfter}`);
                }
                break; // Dừng test khi hit rate limit
            } else if (error.response?.status === 403) {
                console.log(`❌ Request ${i}/5 - Forbidden (key không hợp lệ hoặc bị vô hiệu hóa)`);
                break;
            } else if (error.response?.status === 400) {
                console.log(`❌ Request ${i}/5 - Bad request (key sai format)`);
                break;
            } else {
                console.log(`❌ Request ${i}/5 - Lỗi: ${error.message}`);
            }
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📈 KẾT QUẢ KIỂM TRA\n');
    console.log(`✅ Thành công: ${successCount}/5 requests`);
    console.log(`❌ Thất bại: ${failCount}/5 requests`);

    if (successCount > 0) {
        console.log('\n✨ API KEY ĐANG HOẠT ĐỘNG TỐT!');

        if (rateLimitHit) {
            console.log('\n⚠️  CẢNH BÁO: Đã chạm giới hạn rate limit');
            console.log('   Free tier: 15 requests/phút, 1500 requests/ngày');
            console.log('   → Đã có requests khác trong phút này');
            console.log('   → Có thể bạn hoặc ai đó đang dùng key này');
        } else {
            console.log('\n🎉 Quota vẫn còn, chưa vượt rate limit!');
        }
    } else if (failCount > 0) {
        console.log('\n❌ API KEY CÓ VẤN ĐỀ');
        console.log('   → Kiểm tra lại key tại: https://aistudio.google.com/app/apikey');
    }

    console.log('\n' + '='.repeat(60));
    console.log('💡 CÁCH KIỂM TRA AI ĐANG DÙNG KEY:\n');
    console.log('1. 🌐 Google AI Studio:');
    console.log('   https://aistudio.google.com/app/apikey');
    console.log('   → Click vào key → Xem Usage/Activity\n');

    console.log('2. ☁️  Google Cloud Console:');
    console.log('   https://console.cloud.google.com/');
    console.log('   → APIs & Services → Credentials');
    console.log('   → Monitoring → Metrics Explorer\n');

    console.log('3. 🔒 BẢO MẬT:');
    console.log('   - Nếu nghi ngờ key bị lộ → TẠO KEY MỚI ngay');
    console.log('   - Không commit key vào Git');
    console.log('   - Không share key trong screenshot/video');
    console.log('   - Xóa key cũ sau khi tạo key mới');
    console.log('='.repeat(60) + '\n');
}

checkUsage().catch(console.error);
