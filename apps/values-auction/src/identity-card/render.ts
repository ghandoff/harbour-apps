import { getStartup } from '../content/startups.js';
import { getValue } from '../content/values.js';

export interface IdentityCardInput {
  startupId: string;
  teamName: string;
  wonValues: string[];
  purposeStatement: string;
  sessionCode: string;
}

/**
 * server-first: posts to /api/identity-card and expects png bytes.
 * if that isn't reachable (mvp has no running api), throw and let caller fall back to html-to-image.
 */
export async function renderIdentityPng(input: IdentityCardInput): Promise<Blob> {
  const res = await fetch('/api/identity-card', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`identity-card render failed: ${res.status}`);
  return await res.blob();
}

/**
 * server-side satori template (consumed by server/index.ts if it exposes /api/identity-card).
 * kept as a pure builder so it can be unit-tested.
 */
export function identityCardSatoriTemplate(input: IdentityCardInput): Record<string, unknown> {
  const s = getStartup(input.startupId);
  const vals = input.wonValues.map((id) => getValue(id)?.name ?? id);
  return {
    type: 'div',
    props: {
      style: {
        width: 1200,
        height: 630,
        display: 'flex',
        flexDirection: 'column',
        padding: 64,
        background: '#ffebd2',
        color: '#273248',
        fontFamily: 'Inter',
      },
      children: [
        { type: 'div', props: { style: { fontSize: 18, opacity: 0.6 }, children: input.teamName } },
        { type: 'div', props: { style: { fontSize: 64, fontWeight: 700, marginTop: 8 }, children: s?.name ?? input.startupId } },
        { type: 'div', props: { style: { marginTop: 24, fontSize: 24, fontStyle: 'italic' }, children: input.purposeStatement || 'a company in search of its purpose.' } },
        {
          type: 'div',
          props: {
            style: { marginTop: 'auto', display: 'flex', flexWrap: 'wrap', gap: 8 },
            children: vals.map((v) => ({
              type: 'div',
              props: {
                style: {
                  padding: '6px 14px',
                  border: '1px solid #cb7858',
                  borderRadius: 999,
                  fontSize: 18,
                  fontWeight: 700,
                  background: '#ffffff',
                  marginRight: 8,
                  marginBottom: 8,
                },
                children: v,
              },
            })),
          },
        },
        {
          type: 'div',
          props: {
            style: { marginTop: 24, display: 'flex', justifyContent: 'space-between', fontSize: 14, opacity: 0.7 },
            children: [
              { type: 'div', props: { children: 'values auction \u2022 winded.vertigo' } },
              { type: 'div', props: { children: `session ${input.sessionCode}` } },
            ],
          },
        },
      ],
    },
  };
}
