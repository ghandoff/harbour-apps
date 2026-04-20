import { LitElement, css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { getStartup } from '../content/startups.js';
import { getValue } from '../content/values.js';
import { renderIdentityPng } from '../identity-card/render.js';

@customElement('va-identity-card')
export class VaIdentityCard extends LitElement {
  @property({ type: String }) startupId = '';
  @property({ type: String }) teamName = '';
  @property({ type: Array }) wonValues: string[] = [];
  @property({ type: String }) purposeStatement = '';
  @property({ type: String }) sessionCode = '';

  @query('.card') private cardEl?: HTMLElement;

  static override styles = css`
    :host { display: block; }
    .frame {
      display: grid;
      gap: var(--space-4);
      justify-items: center;
    }
    .card {
      width: 100%;
      max-width: 600px;
      aspect-ratio: 1200 / 630;
      background: var(--wv-champagne);
      border-radius: var(--radius-lg);
      padding: var(--space-5);
      box-shadow: var(--shadow-card-lifted);
      display: grid;
      grid-template-rows: auto 1fr auto;
      gap: var(--space-3);
    }
    header { display: flex; align-items: center; gap: var(--space-3); }
    .logo { width: 48px; height: 48px; border-radius: var(--radius-sm); background: var(--wv-white); display: grid; place-items: center; }
    .logo img { width: 40px; height: 40px; }
    h3 { margin: 0; font: var(--type-h2); }
    .team { font-size: 12px; opacity: 0.7; }
    .body { display: flex; flex-direction: column; gap: var(--space-3); }
    .purpose { font-style: italic; font-size: 14px; line-height: 1.4; }
    .pills { display: flex; flex-wrap: wrap; gap: 4px; }
    .pill {
      background: var(--wv-white);
      border: 1px solid var(--wv-burnt-sienna);
      border-radius: var(--radius-pill);
      padding: 2px 8px;
      font-size: 11px;
      font-weight: 700;
    }
    footer { display: flex; justify-content: space-between; font-size: 11px; opacity: 0.7; }
  `;

  private async download() {
    try {
      const blob = await renderIdentityPng({
        startupId: this.startupId,
        teamName: this.teamName,
        wonValues: this.wonValues,
        purposeStatement: this.purposeStatement,
        sessionCode: this.sessionCode,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.startupId}-identity-card.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      if (!this.cardEl) return;
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(this.cardEl);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${this.startupId}-identity-card.png`;
      a.click();
    }
  }

  override render() {
    const s = getStartup(this.startupId);
    return html`
      <div class="frame">
        <div class="card" role="img" aria-label="company identity card for ${s?.name ?? 'your company'}">
          <header>
            <div class="logo"><img src="/logos/${s?.logoKey ?? 'ethos'}.svg" alt="" /></div>
            <div>
              <div class="team">${this.teamName}</div>
              <h3>${s?.name}</h3>
            </div>
          </header>
          <div class="body">
            <div class="purpose">${this.purposeStatement || 'a company in search of its purpose.'}</div>
            <div class="pills">
              ${this.wonValues.map((id) => html`<span class="pill">${getValue(id)?.name ?? id}</span>`)}
            </div>
          </div>
          <footer>
            <span>values auction \u2022 winded.vertigo</span>
            <span>session ${this.sessionCode}</span>
          </footer>
        </div>
        <va-button variant="primary" @click=${() => this.download()}>download png</va-button>
      </div>
    `;
  }
}
