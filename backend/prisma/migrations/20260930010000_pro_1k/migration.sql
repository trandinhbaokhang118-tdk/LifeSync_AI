UPDATE `subscription_plans`
SET `priceVND` = 1000, `interval` = 'month',
    `features` = JSON_ARRAY('Unlimited Tasks & Calendar', 'AI mở rộng: ngữ cảnh 40 tin nhắn, 100 công việc và lịch 7 ngày', 'Unlimited Time Blocks', 'Nhật ký tập luyện: lưu thời lượng, quãng đường, calories', 'Không quảng cáo')
WHERE `tier` = 'PRO';
