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

async function checkQuota() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error('❌ Không tìm thấy GEMINI_API_KEY trong file .env');
        process.exit(1);
    }

    console.log('🔍 Kiểm tra thông tin API key và quota...\n');

    try {
        // List các models có sẵn
        console.log('📋 Đang lấy danh sách models...');
        const modelsResponse = await axios.get(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
            { timeout: 10000 }
        );

        console.log('✅ API Key hợp lệ!\n');
        console.log('📊 Các models bạn có thể sử dụng:');

        if (modelsResponse.data.models) {
            modelsResponse.data.models.forEach((model, index) => {
                if (model.name.includes('gemini')) {
                    console.log(`  ${index + 1}. ${model.name}`);
                    console.log(`     - Display Name: ${model.displayName || 'N/A'}`);
                    console.log(`     - Supported: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
                }
            });
        }

        console.log('\n💡 Gợi ý:');
        console.log('  - Nếu bạn thấy lỗi 429, có nghĩa là đã vượt quota FREE TIER');
        console.log('  - Free tier giới hạn: 15 requests/phút, 1M tokens/ngày');
        console.log('  - Kiểm tra usage tại: https://aistudio.google.com/app/apikey');
        console.log('  - Hoặc nâng cấp lên Paid tier tại: https://console.cloud.google.com/');

    } catch (error) {
        console.error('\n❌ Lỗi khi kiểm tra quota:');

        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Error:', JSON.stringify(error.response.data, null, 2));

            if (error.response.status === 429) {
                console.log('\n⚠️  QUOTA ĐÃ HẾT!');
                console.log('\n🔍 Nguyên nhân có thể:');
                console.log('  1. Key này đã được dùng trước đó hôm nay');
                console.log('  2. Đang có ứng dụng khác dùng key này');
                console.log('  3. Key bị lộ và người khác đang dùng');
                console.log('  4. Vượt giới hạn 15 requests/phút của free tier');
                console.log('\n✅ Giải pháp:');
                console.log('  - Đợi đến 00:00 UTC để quota reset');
                console.log('  - Tạo API key mới tại: https://aistudio.google.com/app/apikey');
                console.log('  - Nâng cấp lên Pay-as-you-go plan');
            } else if (error.response.status === 403) {
                console.log('\n⚠️  API key không có quyền hoặc đã bị vô hiệu hóa');
            } else if (error.response.status === 400) {
                console.log('\n⚠️  API key không hợp lệ hoặc sai format');
            }
        } else {
            console.error('❌ Không thể kết nối:', error.message);
        }

        process.exit(1);
    }
}

checkQuota();
