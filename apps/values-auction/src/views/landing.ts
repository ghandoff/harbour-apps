import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { COPY } from '@/content/copy';
import { randomCode } from '@/utils/id';
import '@/components/va-button';
import '@/components/va-card';

@customElement('va-landing')
export class VaLanding extends LitElement {
  @state() private joinCode = '';
  @state() private joinError = '';

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
    }
    main {
      max-width: 960px;
      margin: 0 auto;
      padding: var(--space-6) var(--space-5) var(--space-8);
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-7);
    }
    .wordmark {
      height: 36px;
    }
    .attribution {
      font: var(--type-small);
      color: var(--fg-muted);
    }
    .hero {
      margin-bottom: var(--space-8);
    }
    .eyebrow {
      font: var(--type-small);
      text-transform: uppercase;
      letter-spacing: 0.18em;
      color: var(--accent-urgent);
      font-weight: 700;
      margin-bottom: var(--space-3);
    }
    h1 {
      font: var(--type-display);
      font-size: 64px;
      line-height: 1;
      margin-bottom: var(--space-4);
    }
    @media (max-width: 640px) {
      h1 {
        font-size: 44px;
      }
    }
    .lede {
      font-size: 22px;
      line-height: 1.4;
      max-width: 36ch;
      color: var(--fg);
    }
    section {
      margin-bottom: var(--space-7);
    }
    h2 {
      font: var(--type-h1);
      font-size: 28px;
      margin-bottom: var(--space-4);
    }
    .two-col {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--space-5);
    }
    @media (min-width: 760px) {
      .two-col {
        grid-template-columns: 1fr 1fr;
        gap: var(--space-7);
      }
    }
    p.body {
      font-size: 17px;
      line-height: 1.55;
      margin-bottom: var(--space-3);
      max-width: 56ch;
    }
    ul.bullets {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }
    ul.bullets li {
      font-size: 17px;
      line-height: 1.5;
      padding-left: var(--space-4);
      position: relative;
    }
    ul.bullets li::before {
      content: '';
      position: absolute;
      left: 0;
      top: 11px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--wv-redwood);
    }
    .arc {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--space-3);
    }
    @media (min-width: 760px) {
      .arc {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    .arc-item {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: baseline;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      background: var(--bg-card);
      border-radius: var(--radius-md);
      border-left: 4px solid var(--wv-cadet-blue);
    }
    .arc-index {
      font: var(--type-mono);
      color: var(--fg-muted);
      font-weight: 700;
      min-width: 16px;
    }
    .arc-name {
      font-weight: 700;
      font-size: 16px;
    }
    .arc-note {
      font: var(--type-small);
      color: var(--fg-muted);
      grid-column: 2 / -1;
    }
    .arc-duration {
      font: var(--type-mono);
      font-size: 14px;
      color: var(--fg);
      background: var(--wv-champagne);
      padding: 2px var(--space-2);
      border-radius: var(--radius-sm);
    }
    .cta-row {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--space-5);
      margin-top: var(--space-6);
    }
    @media (min-width: 760px) {
      .cta-row {
        grid-template-columns: 1fr 1fr;
      }
    }
    .cta-card {
      padding: var(--space-5);
    }
    .cta-card h3 {
      font: var(--type-h2);
      margin-bottom: var(--space-2);
    }
    .cta-card p.hint {
      color: var(--fg-muted);
      font: var(--type-small);
      margin-bottom: var(--space-4);
    }
    form {
      display: flex;
      gap: var(--space-2);
      flex-wrap: wrap;
      margin-bottom: var(--space-2);
    }
    input {
      flex: 1;
      min-width: 160px;
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-pill);
      border: 2px solid var(--wv-cadet-blue);
      background: var(--bg-card);
      font: var(--type-body);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    input:focus-visible {
      outline: var(--focus-ring);
      outline-offset: var(--focus-ring-offset);
    }
    .join-error {
      color: var(--wv-redwood);
      font: var(--type-small);
      margin-bottom: var(--space-2);
    }
    .divider {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin: var(--space-4) 0;
      color: var(--fg-muted);
      font: var(--type-small);
    }
    .divider::before,
    .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: rgba(39, 50, 72, 0.15);
    }
    .stack {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      align-items: flex-start;
    }
    footer {
      margin-top: var(--space-8);
      padding-top: var(--space-5);
      border-top: 1px solid rgba(39, 50, 72, 0.15);
      font: var(--type-small);
      color: var(--fg-muted);
    }
  `;

  private submitJoin(e: Event) {
    e.preventDefault();
    const code = this.joinCode.trim().toUpperCase();
    if (!code) {
      this.joinError = 'enter a session code.';
      return;
    }
    this.joinError = '';
    window.location.hash = `/join?code=${encodeURIComponent(code)}`;
  }

  private runNew() {
    const code = randomCode('VA');
    window.location.hash = `/facilitate?code=${encodeURIComponent(code)}`;
  }

  private runDemo() {
    window.location.hash = `/facilitate?code=DEMO`;
  }

  render() {
    const c = COPY.landing;
    return html`
      <main>
        <header>
          <img class="wordmark" src="/wordmark.svg" alt="winded.vertigo" />
          <span class="attribution">${c.attribution}</span>
        </header>

        <section class="hero">
          <div class="eyebrow">${c.eyebrow}</div>
          <h1>${c.heading}</h1>
          <p class="lede">${c.sub}</p>
        </section>

        <section class="two-col">
          <div>
            <h2>${c.whatHeading}</h2>
            ${c.whatBody.map((para) => html`<p class="body">${para}</p>`)}
          </div>
          <div>
            <h2>${c.whoHeading}</h2>
            <ul class="bullets">
              ${c.whoBody.map((item) => html`<li>${item}</li>`)}
            </ul>
          </div>
        </section>

        <section>
          <h2>${c.arcHeading}</h2>
          <div class="arc">
            ${c.arcItems.map(
              (item, i) => html`
                <div class="arc-item">
                  <span class="arc-index">${i}</span>
                  <span class="arc-name">${item.name}</span>
                  <span class="arc-duration">${item.duration}</span>
                  <span class="arc-note">${item.note}</span>
                </div>
              `,
            )}
          </div>
        </section>

        <section class="cta-row">
          <va-card class="cta-card">
            <h3>${c.joinHeading}</h3>
            <p class="hint">${c.joinHint}</p>
            <form @submit=${(e: Event) => this.submitJoin(e)}>
              <label for="code" class="sr-only">session code</label>
              <input
                id="code"
                type="text"
                autocomplete="off"
                autocapitalize="characters"
                spellcheck="false"
                placeholder=${c.joinPlaceholder}
                .value=${this.joinCode}
                @input=${(e: Event) =>
                  (this.joinCode = (e.target as HTMLInputElement).value)}
              />
              <va-button variant="primary" @va-click=${(e: Event) => this.submitJoin(e)}>
                ${c.joinCta}
              </va-button>
            </form>
            ${this.joinError ? html`<div class="join-error">${this.joinError}</div>` : ''}
          </va-card>

          <va-card class="cta-card">
            <h3>${c.runHeading}</h3>
            <p class="hint">${c.runHint}</p>
            <div class="stack">
              <va-button variant="primary" @va-click=${() => this.runNew()}>
                ${c.runNew}
              </va-button>
              <div class="divider">${c.or}</div>
              <va-button variant="ghost" @va-click=${() => this.runDemo()}>
                ${c.runDemo}
              </va-button>
            </div>
          </va-card>
        </section>

        <footer>
          <span>${c.attribution}</span>
        </footer>
      </main>
    `;
  }
}
