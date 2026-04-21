import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import './va-button';
import { asset } from '@/utils/asset';

export interface OnboardingStep {
  heading: string;
  body: string;
}

@customElement('va-onboarding')
export class VaOnboarding extends LitElement {
  @property({ type: String }) title = '';
  @property({ type: Array }) steps: OnboardingStep[] = [];
  @property({ type: String }) enterLabel = 'enter';
  @property({ type: String }) skipLabel = 'skip';

  @state() private index = 0;

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      padding: var(--space-6) var(--space-5);
    }
    .shell {
      max-width: 640px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: var(--space-5);
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .wordmark {
      height: 32px;
    }
    .skip {
      font: var(--type-small);
      color: var(--fg-muted);
      text-decoration: underline;
      cursor: pointer;
      background: none;
      border: 0;
    }
    .skip:focus-visible {
      outline: var(--focus-ring);
      outline-offset: var(--focus-ring-offset);
    }
    .title {
      font: var(--type-small);
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--accent-urgent);
      font-weight: 700;
    }
    .step {
      background: var(--bg-card);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
      box-shadow: var(--shadow-card);
      min-height: 280px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    h2 {
      font: var(--type-h1);
      margin-bottom: var(--space-4);
    }
    p {
      font: var(--type-body);
      font-size: 17px;
      line-height: 1.55;
      color: var(--fg);
      max-width: 56ch;
    }
    nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4);
    }
    .pips {
      display: flex;
      gap: var(--space-2);
    }
    .pip {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: rgba(39, 50, 72, 0.2);
      border: 0;
      padding: 0;
      cursor: pointer;
    }
    .pip[data-active] {
      background: var(--wv-cadet-blue);
      transform: scale(1.2);
    }
    .pip:focus-visible {
      outline: var(--focus-ring);
      outline-offset: var(--focus-ring-offset);
    }
    .controls {
      display: flex;
      gap: var(--space-2);
    }
  `;

  private next = () => {
    if (this.index < this.steps.length - 1) {
      this.index += 1;
    } else {
      this.enter();
    }
  };

  private prev = () => {
    if (this.index > 0) this.index -= 1;
  };

  private enter() {
    this.dispatchEvent(new CustomEvent('va-onboarding-done', { bubbles: true, composed: true }));
  }

  private skip() {
    this.dispatchEvent(new CustomEvent('va-onboarding-skip', { bubbles: true, composed: true }));
  }

  private onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') this.next();
    if (e.key === 'ArrowLeft') this.prev();
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('keydown', this.onKey.bind(this));
  }

  render() {
    const step = this.steps[this.index];
    if (!step) return html``;
    const isLast = this.index === this.steps.length - 1;
    return html`
      <div class="shell" tabindex="0" aria-label=${this.title}>
        <header>
          <img class="wordmark" src=${asset('wordmark.svg')} alt="winded.vertigo" />
          <button type="button" class="skip" @click=${() => this.skip()}>
            ${this.skipLabel}
          </button>
        </header>
        <div class="title">${this.title}</div>
        <section
          class="step fade-in"
          role="group"
          aria-labelledby="onboarding-heading"
          aria-live="polite"
        >
          <h2 id="onboarding-heading">${step.heading}</h2>
          <p>${step.body}</p>
        </section>
        <nav aria-label="primer steps">
          <div class="pips" role="tablist">
            ${this.steps.map(
              (_, i) => html`
                <button
                  type="button"
                  class="pip"
                  role="tab"
                  aria-label=${`go to step ${i + 1} of ${this.steps.length}`}
                  aria-selected=${i === this.index}
                  data-active=${i === this.index ? true : null}
                  @click=${() => (this.index = i)}
                ></button>
              `,
            )}
          </div>
          <div class="controls">
            ${this.index > 0
              ? html`<va-button variant="ghost" size="sm" @va-click=${() => this.prev()}>
                  back
                </va-button>`
              : ''}
            <va-button
              variant=${isLast ? 'primary' : 'primary'}
              size="md"
              @va-click=${() => this.next()}
            >
              ${isLast ? this.enterLabel : 'next'}
            </va-button>
          </div>
        </nav>
      </div>
    `;
  }
}
