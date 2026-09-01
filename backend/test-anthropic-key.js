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

async function testAnthropicKey() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error('❌ Không tìm thấy GEMINI_API_KEY trong file .env');
        process.exit(1);
    }

    console.log('🔑 Testing Gemini API key...');
    console.log(`Key (first 20 chars): ${apiKey.substring(0, 20)}...`);

    try {
        // Test với một request đơn giản tới Gemini API
        // Thử với gemini-2.0-flash trước (model mặc định)
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                contents: [{
                    parts: [{
                        text: "Say 'OK' if you can read this message."
                    }]
                }]
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );

        if (response.data && response.data.candidates) {
            console.log('\n✅ API key hoạt động tốt!');
            console.log('📝 Response từ Gemini:');
            console.log(JSON.stringify(response.data.candidates[0].content, null, 2));
            console.log('\n✨ Test thành công! Key của bạn đã được xác thực.');
            process.exit(0);
        } else {
            console.error('❌ Response không đúng format mong đợi');
            console.log(JSON.stringify(response.data, null, 2));
            process.exit(1);
        }
    } catch (error) {
        console.error('\n❌ Test thất bại!');

        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Error:', JSON.stringify(error.response.data, null, 2));

            if (error.response.status === 400) {
                console.error('\n💡 Lỗi 400: API key không hợp lệ hoặc sai format');
            } else if (error.response.status === 403) {
                console.error('\n💡 Lỗi 403: API key không có quyền truy cập');
            } else if (error.response.status === 429) {
                console.error('\n💡 Lỗi 429: Vượt quá giới hạn rate limit');
            }
        } else if (error.request) {
            console.error('❌ Không thể kết nối tới Gemini API');
            console.error('Chi tiết:', error.message);
        } else {
            console.error('❌ Lỗi:', error.message);
        }

        process.exit(1);
    }
}

testAnthropicKey();
