// VIEW: HUD do topo direito — carrinho (com "!"), dinheiro e dia.
// Ouve o GameState: quando o dinheiro muda, o número atualiza sozinho.

import { GameState } from '../model/game-state.js';
import { el, icones } from './componentes.js';
import { reais, doisDigitos } from '../util/formato.js';
import { abrirEstoque } from './estoque.js';

let raiz, dinheiro, dia, carrinho, alerta, oferta, estoqueBtn;
let aoClicarCarrinho = null;
let aoClicarDia = null;

export function criarHUD() {
  raiz = document.getElementById('hud');

  alerta = el('span', { class: 'hud__alerta', 'aria-hidden': 'true', hidden: true }, '!');
  carrinho = el('button', {
    type: 'button',
    class: 'botao-icone hud__carrinho',
    'aria-label': 'Carrinho de compras',
    title: 'Carrinho de compras',
    hidden: true,
    html: icones.carrinho,
    onclick: () => aoClicarCarrinho?.(),
  });
  carrinho.append(alerta);

  dinheiro = el('div', { class: 'hud__placa hud__dinheiro', 'aria-label': 'Dinheiro' });
  dia = el('button', {
    type: 'button',
    class: 'hud__placa',
    title: 'Ver progresso',
    style: { cursor: 'pointer' },
    onclick: () => aoClicarDia?.(),
  });

  // Botão de estoque: aparece a partir do Dia 2, quando o mercado começa a vender
  estoqueBtn = el('button', {
    type: 'button',
    class: 'botao-icone',
    'aria-label': 'Estoque',
    title: 'Estoque',
    html: icones.caixa,
    onclick: () => abrirEstoque(),
  });

  raiz.replaceChildren(estoqueBtn, carrinho, dinheiro, dia);
  GameState.ouvir((estado, mudanca) => atualizar(estado, mudanca));
  atualizar(GameState.get());
}

function atualizar(estado, mudanca) {
  dinheiro.textContent = reais(estado.dinheiroCentavos);
  estoqueBtn.hidden = estado.dia < 2;
  dia.replaceChildren(el('span', { class: 'hud__rotulo' }, 'DIA'), doisDigitos(estado.dia));
  if (mudanca === 'dinheiro') {
    dinheiro.classList.remove('mudou');
    void dinheiro.offsetWidth; // reinicia a animação
    dinheiro.classList.add('mudou');
  }
}

export function mostrarHUD(visivel = true) {
  raiz.hidden = !visivel;
  if (!visivel) esconderCarrinho();
}

export function aoClicarNoDia(fn) { aoClicarDia = fn; }

/** Mostra o carrinho com "!" e a faixa de oferta. */
export function mostrarCarrinho({ linhas = [], aoClicar }) {
  aoClicarCarrinho = aoClicar;
  carrinho.hidden = false;
  alerta.hidden = false;
  oferta?.remove();
  if (linhas.length) {
    oferta = el('div', { class: 'oferta', role: 'note' },
      el('div', { class: 'oferta__linha1' }, linhas[0]),
      linhas[1] ? el('div', { class: 'oferta__linha2' }, linhas[1]) : null);
    raiz.after(oferta);
  }
  carrinho.focus({ preventScroll: true });
}

export function esconderOferta() {
  oferta?.remove();
  oferta = null;
}

export function esconderCarrinho() {
  if (!carrinho) return;
  carrinho.hidden = true;
  alerta.hidden = true;
  aoClicarCarrinho = null;
  esconderOferta();
}
