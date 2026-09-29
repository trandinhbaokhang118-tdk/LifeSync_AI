import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Input } from '../ui';
import { weatherLabel, weatherService, type WeatherPlace } from '../../services/weather.service';

export function CalendarWeather() {
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const [place, setPlace] = useState<WeatherPlace | null>(null);
    const [day, setDay] = useState('');
    const [locating, setLocating] = useState(false);
    const [error, setError] = useState('');
    const status = useQuery({ queryKey: ['weather-status'], queryFn: weatherService.status, staleTime: 300000, retry: false });
    const places = useQuery({ queryKey: ['weather-places', query], queryFn: () => weatherService.search(query), enabled: query.length >= 2, staleTime: 3600000, retry: false });
    const forecast = useQuery({ queryKey: ['weather', place?.latitude, place?.longitude], queryFn: () => weatherService.forecast(place!), enabled: !!place, staleTime: 15 * 60000, retry: false });
    const days = [...new Set(forecast.data?.hours.map(h => h.time.slice(0, 10)) || [])];
    const selectedDay = days.includes(day) ? day : days[0];
    const choose = (p: WeatherPlace) => { setPlace(p); setQuery(''); setError(''); setDay(''); };
    const locate = () => {
        setError('');
        if (!navigator.geolocation) { setError('Thiết bị không hỗ trợ vị trí. Hãy tìm thành phố.'); return; }
        setLocating(true);
        navigator.geolocation.getCurrentPosition(p => {
            choose({ id: 0, name: 'Vị trí hiện tại', latitude: p.coords.latitude, longitude: p.coords.longitude }); setLocating(false);
        }, () => { setError('Không lấy được vị trí. Bạn có thể tìm thành phố.'); setLocating(false); }, { timeout: 10000, maximumAge: 300000, enableHighAccuracy: false });
    };
    return <section className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-4 space-y-3">
        <h2 className="font-semibold">Thời tiết cho lịch ngoài trời</h2>
        <p className="text-sm text-[var(--text-2)]">Dự báo 7 ngày giúp chọn giờ chạy bộ, đạp xe hoặc di chuyển. Địa điểm được gửi tới Open-Meteo khi bạn chọn.</p>
        {status.isPending && <p role="status">Đang kiểm tra nguồn thời tiết…</p>}
        {status.isError && <p role="alert">Không kiểm tra được nguồn thời tiết. <button className="underline" onClick={() => status.refetch()}>Thử lại</button></p>}
        {status.data && !status.data.configured && <p role="status">Nguồn thời tiết chưa được quản trị viên cấu hình.</p>}
        <form className="flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); if (status.data?.configured && search.trim().length >= 2) setQuery(search.trim()); }}>
            <Input aria-label="Thành phố dự báo" value={search} onChange={e => setSearch(e.target.value)} placeholder="Ví dụ: Ho Chi Minh City" />
            <Button type="submit" variant="secondary" disabled={!status.data?.configured || search.trim().length < 2} loading={places.isFetching}>Tìm thành phố</Button>
            <Button type="button" variant="secondary" disabled={!status.data?.configured} loading={locating} onClick={locate}>Dùng vị trí hiện tại</Button>
            {place && <Button type="button" variant="ghost" onClick={() => { setPlace(null); setDay(''); }}>Ẩn thời tiết</Button>}
        </form>
        {error && <p role="alert">{error}</p>}
        {query && places.isError && <p role="alert">Không tìm được địa điểm. <button onClick={() => places.refetch()} className="underline">Thử lại</button></p>}
        {query && places.data?.length === 0 && <p>Không tìm thấy thành phố. Thử tên khác.</p>}
        {query && places.data && <ul className="space-y-2">{places.data.map(p => <li key={p.id}><button className="text-left underline" onClick={() => choose(p)}>{p.name}, {p.admin1}, {p.country}</button></li>)}</ul>}
        {place && <>
            <p className="font-medium">{place.name}</p>
            {forecast.isPending ? <p role="status">Đang tải dự báo…</p> : forecast.isError ? <p role="alert">Không tải được thời tiết. Lịch vẫn hoạt động. <button onClick={() => forecast.refetch()} className="underline">Thử lại</button></p> : <>
                <label className="text-sm">Ngày dự báo <select className="input" value={selectedDay || ''} onChange={e => setDay(e.target.value)}>{days.map(d => <option key={d} value={d}>{d.split('-').reverse().join('/')}</option>)}</select></label>
                <p className="text-xs text-[var(--text-2)]">Giờ địa phương: {forecast.data.timezone} · Dự báo có thể thay đổi.</p>
                <div className="overflow-x-auto max-h-64"><table className="w-full text-sm text-left"><thead><tr><th className="p-2">Giờ</th><th className="p-2">Thời tiết</th><th className="p-2">°C</th><th className="p-2">Mưa</th><th className="p-2">Gió</th></tr></thead><tbody>
                    {forecast.data.hours.filter(h => h.time.startsWith(selectedDay)).map(h => <tr key={h.time} className="border-t border-[var(--border)]"><td className="p-2">{h.time.slice(11, 16)}</td><td className="p-2">{weatherLabel(h.code)}{h.rain >= 60 ? ' · Cân nhắc đổi giờ' : ''}</td><td className="p-2">{h.temperature ?? '—'}</td><td className="p-2">{h.rain ?? '—'}%</td><td className="p-2 whitespace-nowrap">{h.wind ?? '—'} km/h</td></tr>)}
                </tbody></table></div>
            </>}
        </>}
        <a className="text-xs underline" href="https://open-meteo.com/" target="_blank" rel="noreferrer">Dữ liệu thời tiết: Open-Meteo (CC BY 4.0)</a>
    </section>;
}
