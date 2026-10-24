/** Original vector illustration; no third-party vehicle photography. */
export function CarArtwork({ category, index = 0, hero = false }: { category: string; index?: number; hero?: boolean }) {
  const colors = ['#c4c9bc', '#4c6863', '#c4ab8b', '#667a8d', '#8b9697', '#c4b59b'];
  const color = colors[index % colors.length];
  const suv = category.toLowerCase().includes('suv');
  return <svg viewBox="0 0 600 260" role="img" aria-label={`${category} illustration`} className={hero ? 'hero-car' : 'car-art'}>
    <ellipse cx="303" cy="218" rx="240" ry="15" fill="#102d29" opacity=".12" />
    <path d={suv ? 'M54 179 L68 123 Q76 108 98 108 L164 106 L207 47 Q216 37 237 37 L389 37 Q410 37 424 58 L468 111 L524 129 Q550 138 553 166 L549 193 L54 193Z' : 'M46 168 Q55 142 87 136 L151 124 L219 64 Q230 55 252 55 L350 55 Q374 56 394 74 L449 120 L506 131 Q548 140 555 168 L552 194 L45 194Z'} fill={color} stroke="#233f3b" strokeWidth="2" />
    <path d={suv ? 'M181 106 L222 53 L278 53 L278 106Z M292 53 L383 53 Q393 53 406 71 L433 107 L292 106Z' : 'M174 122 L231 71 L278 71 L278 119Z M291 71 L346 71 Q366 72 382 88 L414 119 L291 119Z'} fill="#243e3c" />
    <path d="M236 74 L268 74 L195 115Z M310 75 L332 75 L298 110Z" fill="#e9f2eb" opacity=".18" />
    <path d="M74 151 Q270 135 518 148" fill="none" stroke="#fff" opacity=".35" strokeWidth="3" />
    <path d="M285 126 L285 181 M419 128 L429 181 M95 187 L506 187" fill="none" stroke="#1c3935" opacity=".3" strokeWidth="2" />
    <rect x="300" y="132" width="25" height="5" rx="2" fill="#1e3b37" opacity=".6" />
    <rect x="191" y="132" width="23" height="5" rx="2" fill="#1e3b37" opacity=".6" />
    <path d="M49 157 L91 150 L91 163 L48 169Z" fill="#d85b40" />
    <path d="M507 143 L540 153 L547 167 L506 161Z" fill="#f9edc8" />
    <path d="M546 176 L550 176" stroke="#16352f" strokeWidth="8" />
    {[145, 450].map(x => <g key={x}><circle cx={x} cy="191" r="40" fill="#19312e" /><circle cx={x} cy="191" r="26" fill="#a6b1ad" /><circle cx={x} cy="191" r="20" fill="#3e5550" />{[0, 60, 120].map(angle => <path key={angle} d={`M${x - 19} 191h38`} stroke="#bec7c1" strokeWidth="5" transform={`rotate(${angle} ${x} 191)`} />)}<circle cx={x} cy="191" r="7" fill="#9aa8a1" /></g>)}
  </svg>;
}
