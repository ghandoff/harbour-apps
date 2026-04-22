import type { Team } from '@/state/types';
import { getStartup } from '@/content/startups';
import { getValue } from '@/content/values';

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function wrapSvgText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (test.length > maxCharsPerLine && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

function buildSvg(team: Team): string {
  const startup = getStartup(team.startupId);
  if (!startup) return '';
  const purpose =
    team.purposeStatement && team.purposeStatement.trim().length > 0
      ? team.purposeStatement
      : 'a company still finding its purpose.';
  const values = team.wonValues
    .map((id) => getValue(id)?.name)
    .filter((n): n is string => Boolean(n));

  const purposeLines = wrapSvgText(truncate(purpose, 200), 54);
  const purposeSvg = purposeLines
    .map(
      (line, i) =>
        `<text x="80" y="${300 + i * 38}" font-family="Inter, sans-serif" font-size="26" font-weight="700" fill="#273248">${escapeXml(line)}</text>`,
    )
    .join('');

  const chipsStartY = Math.max(440, 300 + purposeLines.length * 38 + 24);

  const valueItems = team.wonValues
    .map((id) => ({ name: getValue(id)?.name, desc: getValue(id)?.description }))
    .filter((v): v is { name: string; desc: string } => Boolean(v.name));

  const chips = valueItems
    .map(({ name, desc }, idx) => {
      const x = 80 + (idx % 3) * 360;
      const y = chipsStartY + Math.floor(idx / 3) * 80;
      return `
        <rect x="${x}" y="${y}" rx="10" ry="10" width="340" height="64" fill="#ffebd2" stroke="#273248" stroke-width="1.5"/>
        <text x="${x + 16}" y="${y + 24}" font-family="Inter, sans-serif" font-size="15" font-weight="700" fill="#273248">${escapeXml(truncate(name, 38))}</text>
        <text x="${x + 16}" y="${y + 46}" font-family="Inter, sans-serif" font-size="12" fill="#273248" opacity="0.7">${escapeXml(truncate(desc, 48))}</text>
      `;
    })
    .join('');

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 700" width="1200" height="700">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffebd2"/>
      <stop offset="0.6" stop-color="#ffffff"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="700" fill="url(#bg)"/>
  <rect x="32" y="32" width="1136" height="636" rx="24" fill="#ffffff" stroke="#273248" stroke-width="2"/>
  <text x="80" y="112" font-family="Inter, sans-serif" font-size="18" font-weight="700" fill="#b15043" letter-spacing="4">WINDED.VERTIGO · VALUES AUCTION</text>
  <text x="80" y="200" font-family="Inter, sans-serif" font-size="72" font-weight="700" fill="#273248">${escapeXml(startup.name)}</text>
  <rect x="80" y="218" rx="16" ry="16" width="${startup.sector.length * 12 + 40}" height="32" fill="#273248"/>
  <text x="${100}" y="240" font-family="Inter, sans-serif" font-size="16" font-weight="700" fill="#ffffff">${escapeXml(startup.sector)}</text>
  ${purposeSvg}
  ${chips}
  <text x="80" y="664" font-family="Inter, sans-serif" font-size="14" fill="#273248" opacity="0.6">team ${escapeXml(team.colour)} · ${valueItems.length} values locked in · ${team.credos} credos remaining</text>
</svg>
`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + '…';
}

async function svgToPngBlob(svg: string, width = 1200, height = 700): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Use data: URL to avoid canvas taint from objectURL + cross-origin SVG restrictions
    const encoded = btoa(unescape(encodeURIComponent(svg)));
    const url = `data:image/svg+xml;base64,${encoded}`;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('no 2d context'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((pngBlob) => {
        if (pngBlob) resolve(pngBlob);
        else reject(new Error('png encode failed'));
      }, 'image/png');
    };
    img.onerror = () => {
      reject(new Error('svg load failed'));
    };
    img.src = url;
  });
}

export async function exportIdentityCard(team: Team): Promise<void> {
  const svg = buildSvg(team);
  const png = await svgToPngBlob(svg);
  const startup = getStartup(team.startupId);
  const filename = `${slugify(startup?.name ?? 'values-auction')}-${team.colour}.png`;
  const url = URL.createObjectURL(png);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export { buildSvg };
