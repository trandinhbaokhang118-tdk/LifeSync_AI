import { getLunarDate } from '@dqcai/vn-lunar';

export function calendarDateInfo(date: Date) {
    const solar: Record<string, string> = { '1-1': 'Tết Dương lịch', '30-4': 'Ngày Thống nhất', '1-5': 'Quốc tế Lao động', '2-9': 'Quốc khánh' };
    const lunarHolidays: Record<string, string> = { '1-1': 'Tết Nguyên đán', '2-1': 'Mùng 2 Tết', '3-1': 'Mùng 3 Tết', '10-3': 'Giỗ Tổ Hùng Vương', '15-8': 'Tết Trung thu' };
    const holidays = [solar[`${date.getDate()}-${date.getMonth() + 1}`]].filter(Boolean);
    // The library uses Vietnamese lunar dates (UTC+7), supported in 1800–2199.
    if (date.getFullYear() < 1800 || date.getFullYear() > 2199) return { lunar: 'Ngoài phạm vi lịch âm', holidays };
    const lunar = getLunarDate(date.getDate(), date.getMonth() + 1, date.getFullYear());
    const holiday = !lunar.leap && lunarHolidays[`${lunar.day}-${lunar.month}`];
    if (holiday) holidays.push(holiday);
    return { lunar: `${lunar.day}/${lunar.month}${lunar.leap ? ' nhuận' : ''} âm lịch`, holidays };
}
