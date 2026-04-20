import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { getValue } from '../content/values.js';

@customElement('va-value-card')
export class VaValueCard extends LitElement {
  @property({ type: String }) valueId = '';
  @property({ type: Boolean }) big = false;
  @property({ type: String }) zone: '' | 'must' | 'nice' | 'wont' = '';

  static override styles = css`
    :host {
      display: block;
      background: var(--bg-card);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-card);
      padding: var(--space-4);
      transition: transform var(--dur-base) var(--ease-out-quart),
        box-shadow var(--dur-base) var(--ease-out-quart);
      cursor: grab;
    }
    :host([big]) {
      padding: var(--space-6) var(--space-7);
      text-align: center;
    }
    .name { font: var(--type-h2); font-weight: 700; }
    :host([big]) .name { font: var(--type-display); }
    .desc { margin-top: var(--space-2); color: var(--fg); opacity: 0.85; }
    :host([big]) .desc { font-size: 18px; line-height: 1.5; margin-top: var(--space-4); }
    :host([zone='must']) { border-left: 4px solid var(--wv-redwood); }
    :host([zone='nice']) { border-left: 4px solid var(--wv-burnt-sienna); }
    :host([zone='wont']) { border-left: 4px solid var(--wv-cadet-blue); opacity: 0.7; }
  `;

  override render() {
    const v = getValue(this.valueId);
    if (!v) return html``;
    return html`
      <div class="name">${v.name}</div>
      <div class="desc">${v.description}</div>
    `;
  }
}
