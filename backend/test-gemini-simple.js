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

async function testNewKey() {
    const apiKey = process.env.GEMINI_API_KEY;

    console.log('🔑 Testing KEY MỚI của bạn...');
    console.log(`Key: ${apiKey.substring(0, 20)}...${apiKey.substring(apiKey.length - 5)}\n`);

    console.log('⏳ Đang đợi 60 giây để quota reset...\n');

    // Countdown
    for (let i = 60; i > 0; i -= 10) {
        process.stdout.write(`   ${i} giây nữa...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
        process.stdout.write('\r');
    }

    console.log('\n✅ Đã đợi xong, bắt đầu test!\n');

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                contents: [{
                    parts: [{
                        text: "Chỉ cần trả lời 'OK' nếu bạn nhận được tin nhắn này."
                    }]
                }]
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 15000
            }
        );

        if (response.data?.candidates?.[0]?.content) {
            console.log('✅✅✅ KEY MỚI HOẠT ĐỘNG HOÀN HẢO! ✅✅✅\n');
            console.log('📝 Response từ Gemini:');
            const text = response.data.candidates[0].content.parts[0].text;
            console.log(`   "${text}"\n`);
            console.log('🎉 Bạn đã sẵn sàng sử dụng Gemini API!');
            console.log('🖼️  Có thể tạo ảnh với model: gemini-3-pro-image');
            console.log('💬 Có thể chat với model: gemini-2.5-flash hoặc gemini-2.5-pro\n');
        }

    } catch (error) {
        if (error.response?.status === 429) {
            console.log('⚠️  Vẫn bị rate limit (429)');
            console.log('💡 Nguyên nhân: Quota tính theo ACCOUNT, không phải KEY');
            console.log('✅ Key MỚI của bạn HỢP LỆ, chỉ cần đợi thêm');
            console.log('\n🕐 Giải pháp:');
            console.log('   1. Đợi đến 00:00 UTC để quota reset hoàn toàn');
            console.log('   2. Hoặc chờ thêm vài phút nữa');
            console.log('   3. Key đã sẵn sàng dùng trong app khi quota reset!\n');
        } else if (error.response?.status === 403 || error.response?.status === 400) {
            console.log('❌ Key không hợp lệ hoặc bị vô hiệu hóa');
            console.error('Error:', error.response?.data);
        } else {
            console.log('❌ Lỗi:', error.message);
        }
    }
}

testNewKey().catch(console.error);
