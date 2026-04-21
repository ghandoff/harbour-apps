import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { navigate } from '@/router';
import { randomCode } from '@/utils/id';
import '@/components/va-button';

@customElement('va-landing')
export class VaLanding extends LitElement {
  @state() private code = '';
  @state() private codeError = false;
  @state() private wallCode = '';
  @state() private wallCodeError = false;

  private joinWithCode(e: Event) {
    e.preventDefault();
    const trimmed = this.code.trim().toUpperCase();
    if (!trimmed) {
      this.codeError = true;
      return;
    }
    navigate('join', trimmed);
  }

  private startNewSession() {
    navigate('facilitate', randomCode());
  }

  private openWallWithCode(e: Event) {
    e.preventDefault();
    const trimmed = this.wallCode.trim().toUpperCase();
    if (!trimmed) {
      this.wallCodeError = true;
      return;
    }
    navigate('wall', trimmed);
  }

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      background: var(--bg);
      font: var(--type-body);
      color: var(--fg);
    }
    header {
      padding: var(--space-5) var(--space-6);
    }
    .wordmark {
      height: 32px;
    }
    .hero {
      max-width: 960px;
      margin: 0 auto;
      padding: var(--space-7) var(--space-6) var(--space-5);
      text-align: center;
      animation: va-fade-in var(--dur-slow) var(--ease-out-quart) both;
    }
    .hero h1 {
      font: var(--type-display);
      margin-bottom: var(--space-4);
    }
    .hero .tagline {
      color: var(--fg-muted);
      max-width: 540px;
      margin: 0 auto;
    }
    .roles {
      max-width: 960px;
      margin: 0 auto;
      padding: var(--space-5) var(--space-6) var(--space-8);
      display: grid;
      gap: var(--space-4);
      grid-template-columns: 1fr;
      animation: va-fade-in var(--dur-slow) var(--ease-out-quart) 80ms both;
    }
    @media (min-width: 720px) {
      .roles {
        grid-template-columns: 1fr 1fr 1fr;
      }
    }
    .role-card {
      background: var(--bg-card);
      border-radius: var(--radius-md);
      padding: var(--space-6);
      box-shadow: var(--shadow-card);
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      transition:
        transform var(--dur-base) var(--ease-out-quart),
        box-shadow var(--dur-base) var(--ease-out-quart);
    }
    .role-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-card-lifted);
    }
    .role-card:focus-within {
      box-shadow: var(--shadow-card-lifted);
    }
    .role-label {
      font: var(--type-mono);
      color: var(--fg-muted);
    }
    .role-card h2 {
      font: var(--type-h2);
    }
    .role-card > p {
      color: var(--fg-muted);
      flex: 1;
    }
    .code-form {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }
    .code-form input {
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-pill);
      border: 2px solid var(--wv-cadet-blue);
      background: var(--bg);
      font: var(--type-body);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      width: 100%;
      box-sizing: border-box;
    }
    .code-form input::placeholder {
      text-transform: none;
      letter-spacing: normal;
      color: var(--fg-muted);
    }
    .code-form input[aria-invalid='true'] {
      border-color: var(--wv-redwood);
    }
    .code-form input:focus-visible {
      outline: var(--focus-ring);
      outline-offset: var(--focus-ring-offset);
    }
    .field-error {
      font: var(--type-small);
      color: var(--wv-redwood);
    }
    .demo-hint {
      font: var(--type-small);
      color: var(--fg-muted);
      text-align: center;
      margin-top: var(--space-1);
    }
    .demo-hint button {
      all: unset;
      text-decoration: underline;
      cursor: pointer;
      color: var(--fg-muted);
    }
    .demo-hint button:hover {
      color: var(--fg);
    }
    .demo-hint button:focus-visible {
      outline: var(--focus-ring);
      outline-offset: var(--focus-ring-offset);
    }
  `;

  render() {
    return html`
      <header>
        <img class="wordmark" src="/wordmark.svg" alt="winded.vertigo" />
      </header>

      <section class="hero">
        <h1>values auction</h1>
        <p class="tagline">
          a team-based activity exploring personal and organisational values through a simulated
          auction. every bid shapes the company you become.
        </p>
      </section>

      <div class="roles">
        <div class="role-card">
          <span class="role-label">participant</span>
          <h2>join a session</h2>
          <p>enter your session code and bid for what your team stands for. every credo counts.</p>
          <form class="code-form" @submit=${(e: Event) => this.joinWithCode(e)}>
            <input
              id="session-code"
              type="text"
              aria-label="session code"
              placeholder="session code"
              maxlength="16"
              autocomplete="off"
              spellcheck="false"
              .value=${this.code}
              aria-invalid=${this.codeError ? 'true' : 'false'}
              aria-describedby=${this.codeError ? 'code-error' : ''}
              @input=${(e: Event) => {
                this.code = (e.target as HTMLInputElement).value;
                this.codeError = false;
              }}
            />
            ${this.codeError
              ? html`<span id="code-error" class="field-error" role="alert"
                    >enter a session code to continue.</span
                  >`
              : ''}
            <va-button
              variant="primary"
              size="lg"
              @va-click=${(e: Event) => this.joinWithCode(e)}
            >
              join
            </va-button>
          </form>
          <p class="demo-hint">
            no code?
            <button type="button" @click=${() => navigate('join', 'DEMO')}>try the demo</button>
          </p>
        </div>

        <div class="role-card">
          <span class="role-label">facilitator</span>
          <h2>run a session</h2>
          <p>
            control the auction pace, broadcast messages, and guide reflection. you hold the
            clock.
          </p>
          <va-button variant="primary" size="lg" @va-click=${() => this.startNewSession()}>
            start new session
          </va-button>
          <p class="demo-hint">
            returning?
            <button type="button" @click=${() => navigate('facilitate', 'DEMO')}>open demo panel</button>
          </p>
        </div>

        <div class="role-card">
          <span class="role-label">wall display</span>
          <h2>project the room</h2>
          <p>
            the shared screen for the whole group. shows live auction state, team bids, and
            closing results.
          </p>
          <form class="code-form" @submit=${(e: Event) => this.openWallWithCode(e)}>
            <input
              id="wall-code"
              type="text"
              aria-label="wall session code"
              placeholder="session code"
              maxlength="16"
              autocomplete="off"
              spellcheck="false"
              .value=${this.wallCode}
              aria-invalid=${this.wallCodeError ? 'true' : 'false'}
              aria-describedby=${this.wallCodeError ? 'wall-code-error' : ''}
              @input=${(e: Event) => {
                this.wallCode = (e.target as HTMLInputElement).value;
                this.wallCodeError = false;
              }}
            />
            ${this.wallCodeError
              ? html`<span id="wall-code-error" class="field-error" role="alert"
                    >enter the facilitator's session code.</span
                  >`
              : ''}
            <va-button
              variant="ghost"
              @va-click=${(e: Event) => this.openWallWithCode(e)}
            >
              open wall display
            </va-button>
          </form>
          <p class="demo-hint">
            no code?
            <button type="button" @click=${() => navigate('wall', 'DEMO')}>open demo wall</button>
          </p>
        </div>
      </div>
    `;
  }
}
