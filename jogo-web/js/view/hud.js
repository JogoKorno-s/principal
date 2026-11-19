// VIEW: HUD do topo direito — carrinho (com "!"), dinheiro e dia.
// Ouve o GameState: quando o dinheiro muda, o número atualiza sozinho.

import { GameState } from '../model/game-state.js';
import { el, icones } from './componentes.js';
import { reais, doisDigitos } from '../util/formato.js';
import { abrirEstoque } from './estoque.js';
import { abrirMercado } from '../controller/mercado.js';
import { abrirNavegacao } from '../controller/secoes.js';

let raiz, dinheiro, dia, carrinho, alerta, oferta, estoqueBtn, botaoInicio;
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

  // Casinha: abre o painel para ir à Tela inicial ou a outra seção do mercado
  botaoInicio = el('button', {
    type: 'button',
    class: 'casinha',
    'aria-label': 'Navegar pelo mercado',
    title: 'Navegar pelo mercado',
    hidden: true,
    onclick: () => abrirNavegacao(),
  }, el('img', { src: 'assets/ui/casinha.webp', alt: '' }));
  raiz.after(botaoInicio);
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
  botaoInicio.hidden = !visivel;
  esconderCarrinho();
  if (!visivel) carrinho.hidden = true;
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

/** Tira o "!" e a oferta. Depois que o mercado digital é liberado, o carrinho continua abrindo ele. */
export function esconderCarrinho() {
  if (!carrinho) return;
  const liberado = GameState.get().mercadoLiberado;
  carrinho.hidden = !liberado;
  alerta.hidden = true;
  aoClicarCarrinho = liberado ? () => abrirMercado() : null;
  carrinho.title = liberado ? 'Mercado digital' : 'Carrinho de compras';
  esconderOferta();
}
