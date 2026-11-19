// VIEW: faixa da cestinha enquanto o jogador separa um pedido do Moto Entrega.
// Fica no topo da tela em todas as seções: mostra o que falta pegar, "Enviar pedido" e "Cancelar".

import { produto } from '../model/produtos.js';
import { numeroDoPedido } from '../model/entregas.js';
import { separacaoAtual, separacaoCompleta, ouvirSeparacao } from '../model/separacao.js';
import { el, botao, icones } from './componentes.js';

export const CESTA_SVG = `
<svg viewBox="0 0 380 340" aria-hidden="true">
  <path d="M118 175 C 112 40, 222 40, 214 170" fill="none" stroke="#2b2b2b" stroke-width="22" stroke-linecap="round"/>
  <path d="M176 175 C 172 52, 286 52, 276 172" fill="none" stroke="#3a3a3a" stroke-width="22" stroke-linecap="round"/>
  <path d="M28 168 H352 L322 318 Q318 330 304 330 H76 Q62 330 58 318 Z" fill="#e3262d" stroke="#3a0b0b" stroke-width="8" stroke-linejoin="round"/>
  <rect x="16" y="146" width="348" height="40" rx="14" fill="#f2454b" stroke="#3a0b0b" stroke-width="8"/>
  <g fill="#9c1117">
    ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="${62 + i * 33}" y="206" width="20" height="40" rx="8"/>`).join('')}
    ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${80 + i * 33}" y="262" width="20" height="40" rx="8"/>`).join('')}
  </g>
</svg>`;

let fecharAtual = null;

/** Fecha a faixa aberta (troca de tela no meio da separação): conta como cancelar. */
export function fecharFaixaSeparacao() { fecharAtual?.(); }

/**
 * Mostra a faixa. textos: entregas.json → separacao.
 * Resolve com 'enviar' (tudo na cestinha) ou 'cancelar'.
 */
export function mostrarFaixaSeparacao(textos) {
  return new Promise((resolver) => {
    const itens = el('ul', { class: 'separacao__itens', 'aria-label': 'Produtos do pedido' });
    const titulo = el('div', { class: 'separacao__titulo' });
    const dica = el('p', { class: 'separacao__dica' });
    const enviar = botao(textos.enviar, () => sair('enviar'), 'pequeno');
    const cancelar = botao(textos.cancelar, () => sair('cancelar'), 'pequeno claro');
    const faixa = el('div', { class: 'separacao', role: 'region', 'aria-label': textos.titulo },
      el('div', { class: 'separacao__cesta', html: CESTA_SVG }),
      el('div', { class: 'separacao__meio' }, titulo, itens, dica),
      el('div', { class: 'separacao__acoes' }, enviar, cancelar));

    function desenhar() {
      const s = separacaoAtual();
      if (!s) return;
      titulo.textContent = `${textos.titulo} · Pedido ${numeroDoPedido(s.pedido.numero)}`;
      itens.replaceChildren(...s.pedido.itens.map((id) => {
        const p = produto(id);
        const pego = s.pegos.has(id);
        return el('li', { class: `separacao__item ${pego ? 'separacao__item--pego' : ''}` },
          el('img', { src: p.imagem, alt: '' }),
          el('span', {}, p.nome),
          pego ? el('span', { class: 'separacao__check', html: icones.certo }) : null);
      }));
      const completa = separacaoCompleta();
      enviar.disabled = !completa;
      dica.textContent = completa ? textos.pronto : textos.dica;
      faixa.classList.toggle('separacao--pronta', completa);
    }

    const parar = ouvirSeparacao(desenhar);
    function sair(escolha) {
      if (escolha === 'enviar' && !separacaoCompleta()) return;
      fecharAtual = null;
      parar();
      faixa.remove();
      resolver(escolha);
    }

    document.getElementById('hud').after(faixa);
    fecharAtual = () => sair('cancelar');
    desenhar();
  });
}
