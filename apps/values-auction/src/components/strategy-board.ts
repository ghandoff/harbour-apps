import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { VALUES, getValue } from '../content/values.js';
import { COPY } from '../content/copy.js';
import type { Zone } from '../state/types.js';

interface DragEventish extends DragEvent {}

@customElement('va-strategy-board')
export class VaStrategyBoard extends LitElement {
  @property({ type: Object }) intentions: Record<string, Zone | null> = {};
  @property({ type: Object }) softCeilings: Record<string, number> = {};
  @property({ type: Number }) credos = 150;

  @state() private dragId: string | null = null;

  static override styles = css`
    :host { display: block; }
    .grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--space-4);
    }
    @media (min-width: 768px) {
      .grid { grid-template-columns: repeat(4, 1fr); }
    }
    .zone {
      background: var(--bg-card);
      border-radius: var(--radius-md);
      padding: var(--space-3);
      min-height: 240px;
      border: 2px dashed transparent;
      transition: border-color var(--dur-base);
    }
    .zone.drop { border-color: var(--accent-urgent); }
    .zone h3 { font: var(--type-h2); margin-bottom: var(--space-2); font-size: 16px; }
    .zone[data-zone='must'] h3 { color: var(--wv-redwood); }
    .zone[data-zone='nice'] h3 { color: var(--wv-burnt-sienna); }
    .zone[data-zone='wont'] h3 { color: var(--wv-cadet-blue); opacity: 0.6; }
    .card {
      background: var(--wv-champagne);
      border-radius: var(--radius-sm);
      padding: var(--space-2) var(--space-3);
      margin-bottom: var(--space-2);
      font-size: 14px;
      cursor: grab;
      outline: none;
    }
    .card:focus { box-shadow: 0 0 0 3px var(--wv-cadet-blue); }
    .card.focused { box-shadow: 0 0 0 3px var(--wv-redwood); }
    .card .name { font-weight: 700; }
    .card .ceiling {
      margin-top: var(--space-2);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
    .card .ceiling input {
      width: 5ch;
      padding: 2px var(--space-2);
      border: 1px solid var(--wv-cadet-blue);
      border-radius: var(--radius-sm);
    }
    .hint { font-size: 13px; opacity: 0.7; margin-bottom: var(--space-3); }
    .deck-hint { font-size: 13px; opacity: 0.7; }
  `;

  private zoneFor(id: string): Zone | null {
    return this.intentions[id] ?? null;
  }

  private onDragStart(e: DragEventish, id: string) {
    this.dragId = id;
    e.dataTransfer?.setData('text/plain', id);
    e.dataTransfer!.effectAllowed = 'move';
  }

  private onDrop(e: DragEventish, zone: Zone | null) {
    e.preventDefault();
    const id = e.dataTransfer?.getData('text/plain') ?? this.dragId;
    if (!id) return;
    this.emitIntention(id, zone);
    this.dragId = null;
    (e.currentTarget as HTMLElement).classList.remove('drop');
  }

  private onDragOver(e: DragEventish) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.add('drop');
  }

  private onDragLeave(e: DragEventish) {
    (e.currentTarget as HTMLElement).classList.remove('drop');
  }

  private emitIntention(valueId: string, zone: Zone | null) {
    this.dispatchEvent(new CustomEvent('intention', { detail: { valueId, zone }, bubbles: true, composed: true }));
  }

  private emitCeiling(valueId: string, amount: number) {
    this.dispatchEvent(new CustomEvent('ceiling', { detail: { valueId, amount }, bubbles: true, composed: true }));
  }

  private onKey(e: KeyboardEvent, id: string) {
    const k = e.key.toLowerCase();
    if (k === 'm') this.emitIntention(id, 'must');
    else if (k === 'n') this.emitIntention(id, 'nice');
    else if (k === 'w') this.emitIntention(id, 'wont');
    else if (k === 'backspace' || k === 'delete') this.emitIntention(id, null);
    else return;
    e.preventDefault();
  }

  private renderCard(id: string) {
    const v = getValue(id);
    if (!v) return null;
    const ceiling = this.softCeilings[id] ?? 0;
    const zone = this.zoneFor(id);
    return html`
      <div
        class="card"
        draggable="true"
        tabindex="0"
        role="button"
        aria-label="${v.name}. zone ${zone ?? 'unassigned'}. press m for must, n for nice, w for won\u2019t."
        @dragstart=${(e: DragEventish) => this.onDragStart(e, id)}
        @keydown=${(e: KeyboardEvent) => this.onKey(e, id)}
      >
        <div class="name">${v.name}</div>
        ${zone === 'must' || zone === 'nice'
          ? html`<div class="ceiling">
              <label class="sr-only" for="ceil-${id}">soft ceiling for ${v.name}</label>
              <input
                id="ceil-${id}"
                type="number"
                min="0"
                max=${this.credos}
                .value=${String(ceiling)}
                @change=${(e: Event) => this.emitCeiling(id, Number((e.target as HTMLInputElement).value))}
              /><span style="font-size:12px;opacity:0.7">credo ceiling</span>
            </div>`
          : null}
      </div>
    `;
  }

  override render() {
    const unassigned = VALUES.filter((v) => !this.intentions[v.id]);
    const must = VALUES.filter((v) => this.intentions[v.id] === 'must');
    const nice = VALUES.filter((v) => this.intentions[v.id] === 'nice');
    const wont = VALUES.filter((v) => this.intentions[v.id] === 'wont');

    return html`
      <p class="hint">${COPY.strategy.prompt}</p>
      <div class="grid">
        <section
          class="zone"
          data-zone="deck"
          @dragover=${this.onDragOver}
          @dragleave=${this.onDragLeave}
          @drop=${(e: DragEventish) => this.onDrop(e, null)}
        >
          <h3>deck</h3>
          <div class="deck-hint">drag or focus + press m / n / w.</div>
          ${unassigned.map((v) => this.renderCard(v.id))}
        </section>
        <section
          class="zone"
          data-zone="must"
          @dragover=${this.onDragOver}
          @dragleave=${this.onDragLeave}
          @drop=${(e: DragEventish) => this.onDrop(e, 'must')}
        >
          <h3>${COPY.strategy.zones.must}</h3>
          ${must.map((v) => this.renderCard(v.id))}
        </section>
        <section
          class="zone"
          data-zone="nice"
          @dragover=${this.onDragOver}
          @dragleave=${this.onDragLeave}
          @drop=${(e: DragEventish) => this.onDrop(e, 'nice')}
        >
          <h3>${COPY.strategy.zones.nice}</h3>
          ${nice.map((v) => this.renderCard(v.id))}
        </section>
        <section
          class="zone"
          data-zone="wont"
          @dragover=${this.onDragOver}
          @dragleave=${this.onDragLeave}
          @drop=${(e: DragEventish) => this.onDrop(e, 'wont')}
        >
          <h3>${COPY.strategy.zones.wont}</h3>
          ${wont.map((v) => this.renderCard(v.id))}
        </section>
      </div>
    `;
  }
}
