import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { getStartup } from '../content/startups.js';
import { getValue } from '../content/values.js';

@customElement('va-company-card')
export class VaCompanyCard extends LitElement {
  @property({ type: String }) startupId = '';
  @property({ type: Array }) wonValues: string[] = [];
  @property({ type: String }) purposeStatement = '';
  @property({ type: String }) teamName = '';

  static override styles = css`
    :host { display: block; }
    .wrap {
      background: var(--bg-card);
      border-radius: var(--radius-lg);
      padding: var(--space-5);
      box-shadow: var(--shadow-card);
    }
    header { display: flex; align-items: center; gap: var(--space-4); }
    .logo {
      width: 72px; height: 72px;
      border-radius: var(--radius-md);
      background: var(--wv-champagne);
      display: grid; place-items: center;
    }
    .logo img { width: 56px; height: 56px; }
    h2 { font: var(--type-h1); margin: 0; }
    .sector {
      display: inline-block;
      padding: 2px 10px;
      border-radius: var(--radius-pill);
      background: var(--wv-cadet-blue);
      color: var(--fg-inverse);
      font-size: 13px;
      margin-top: var(--space-2);
    }
    p { margin-top: var(--space-4); }
    .challenge { color: var(--accent-warm); }
    .won { margin-top: var(--space-5); display: flex; flex-wrap: wrap; gap: var(--space-2); }
    .won-pill {
      background: var(--wv-champagne);
      border: 1px solid var(--wv-burnt-sienna);
      border-radius: var(--radius-pill);
      padding: 4px 12px;
      font-size: 13px;
      font-weight: 700;
    }
    .purpose {
      margin-top: var(--space-5);
      padding: var(--space-4);
      background: var(--wv-champagne);
      border-radius: var(--radius-md);
      font-style: italic;
    }
    .team-label { font-size: 13px; opacity: 0.7; }
  `;

  override render() {
    const s = getStartup(this.startupId);
    if (!s) return html``;
    return html`
      <div class="wrap">
        <header>
          <div class="logo"><img src="/logos/${s.logoKey}.svg" alt="" /></div>
          <div>
            <div class="team-label">${this.teamName}</div>
            <h2>${s.name}</h2>
            <span class="sector">${s.sector}</span>
          </div>
        </header>
        <p>${s.profile}</p>
        <p class="challenge">${s.challenge}</p>
        ${this.wonValues.length
          ? html`<div class="won" aria-label="values you locked in">
              ${this.wonValues.map((id) => html`<span class="won-pill">${getValue(id)?.name ?? id}</span>`)}
            </div>`
          : null}
        ${this.purposeStatement
          ? html`<div class="purpose" aria-label="purpose statement">${this.purposeStatement}</div>`
          : null}
      </div>
    `;
  }
}
