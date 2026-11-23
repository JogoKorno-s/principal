// VIEW: painel de estoque — quantidade de cada produto, custo e preço de venda.
// Também mostra as notificações de reposição ("Leite está acabando").

import { GameState } from '../model/game-state.js';
import { produtos, produtosDoNivel, limiteEstoqueBaixo } from '../model/produtos.js';
import { nivelAtual } from '../model/niveis.js';
import { el, botao, modal } from './componentes.js';
import { reais } from '../util/formato.js';

export function abrirEstoque() {
  const { estoque, precos } = GameState.get();
  const limite = limiteEstoqueBaixo();
  const tabela = el('div', { class: 'estoque__tabela', role: 'table' },
    el('div', { class: 'estoque__linha estoque__cabecalho', role: 'row' },
      el('span', {}, 'Produto'), el('span', {}, 'Estoque'), el('span', {}, 'Custo'), el('span', {}, 'Venda')),
    // Só os produtos já liberados (com o catálogo grande, a lista rola)
    produtosDoNivel(nivelAtual(GameState.get())).map((p) => {
      const qtd = estoque[p.id] ?? 0;
      return el('div', { class: `estoque__linha ${qtd <= limite ? 'estoque__linha--baixo' : ''}`, role: 'row' },
        el('span', { class: 'estoque__produto' }, el('img', { src: p.imagem, alt: '' }), p.nome),
        el('span', { class: 'estoque__qtd' }, String(qtd), qtd <= limite ? el('small', {}, qtd === 0 ? ' esgotado' : ' acabando') : null),
        el('span', {}, reais(p.custoCentavos)),
        el('span', {}, precos[p.id] ? reais(precos[p.id]) : '—'));
    }));
  const fechar = modal({
    titulo: 'Estoque',
    conteudo: tabela,
    acoes: [botao('Fechar', () => fechar(), 'secundario')],
  });
}

const DURACAO_NOTIFICACAO_MS = 8000;  // some sozinha depois desse tempo
const MAXIMO_NA_TELA = 3;             // as mais antigas saem quando chegam novas

/** Tira uma notificação com uma animação curta. */
function tirarNotificacao(card) {
  if (!card.isConnected || card.classList.contains('saindo')) return;
  clearTimeout(card._timer);
  card.classList.add('saindo');
  setTimeout(() => card.remove(), 250);
}

/** Avisos de reposição no canto da tela. Somem sozinhos (ou no ×); passar o mouse/dedo por cima segura o aviso. */
export function notificarReposicao(ids) {
  const { estoque } = GameState.get();
  let area = document.getElementById('notificacoes');
  if (!area) {
    area = el('div', { id: 'notificacoes', role: 'status' });
    document.getElementById('palco').append(area);
  }
  for (const id of ids) {
    const p = produtos().find((x) => x.id === id);
    const qtd = estoque[id] ?? 0;
    area.querySelector(`[data-produto="${id}"]`)?.remove();
    const card = el('div', { class: 'notificacao', 'data-produto': id },
      el('span', { class: 'notificacao__icone', 'aria-hidden': 'true', html: ICONE_CELULAR }),
      el('span', { class: 'notificacao__texto' },
        el('strong', {}, 'REPOR ESTOQUE!'),
        `${p.nome}: ${qtd === 0 ? 'esgotado' : `só ${qtd} ${qtd === 1 ? 'unidade' : 'unidades'}`}`),
      el('button', { type: 'button', class: 'notificacao__fechar', 'aria-label': 'Fechar aviso', onclick: () => tirarNotificacao(card) }, '×'),
      el('span', { class: 'notificacao__tempo', 'aria-hidden': 'true', style: { animationDuration: `${DURACAO_NOTIFICACAO_MS}ms` } }));
    const agendar = () => { clearTimeout(card._timer); card._timer = setTimeout(() => tirarNotificacao(card), DURACAO_NOTIFICACAO_MS); };
    card.addEventListener('pointerenter', () => { clearTimeout(card._timer); card.classList.add('pausada'); });
    card.addEventListener('pointerleave', () => { card.classList.remove('pausada'); agendar(); });
    area.append(card);
    agendar();
  }
  // No máximo 3 na tela: as mais antigas saem primeiro
  const visiveis = [...area.querySelectorAll('.notificacao:not(.saindo)')];
  visiveis.slice(0, Math.max(0, visiveis.length - MAXIMO_NA_TELA)).forEach(tirarNotificacao);
}

const ICONE_CELULAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10.5 18.5h3"/><path d="M12 7.5a2.5 2.5 0 0 0-2.5 2.5v2l-1 1.5h7l-1-1.5v-2A2.5 2.5 0 0 0 12 7.5Z" fill="#D96300" stroke="#5B1F00"/></svg>';
