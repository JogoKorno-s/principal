// VIEW: HUD do topo direito — carrinho (com "!"), dinheiro e dia.
// No topo esquerdo (Nível 4 em diante): balão do Moto Entrega e índice de atendimento.
// Ouve o GameState: quando o dinheiro muda, o número atualiza sozinho.

import { GameState } from '../model/game-state.js';
import { el, icones } from './componentes.js';
import { reais, doisDigitos } from '../util/formato.js';
import { abrirEstoque } from './estoque.js';
import { abrirMercado } from '../controller/mercado.js';
import { abrirNavegacao } from '../controller/secoes.js';
import { indiceDeAtendimento, faixaDoIndice } from '../model/atendimento.js';

// Motinho desenhada em SVG para o balão do Moto Entrega
const MOTO = `<svg viewBox="0 0 64 48" fill="none" stroke="#3a2200" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <circle cx="14" cy="36" r="8" fill="#fff"/><circle cx="50" cy="36" r="8" fill="#fff"/>
  <circle cx="14" cy="36" r="3" fill="#3a2200"/><circle cx="50" cy="36" r="3" fill="#3a2200"/>
  <path d="M22 36h18l6-14h-9l-4 8H16" fill="#ffd23f"/>
  <path d="M46 22l-4-12h-6M38 10h8" /><path d="M8 26h12l4 4" fill="#ffd23f"/>
  <path d="M2 22h6M0 28h5M3 34h4" stroke-width="2.4"/>
</svg>`;

let raiz, dinheiro, dia, carrinho, alerta, oferta, estoqueBtn, botaoInicio, topoEsquerdo, moto, motoAlerta, indice;
let textosIndice = null;
let aoClicarIndice = null;
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

  // Topo esquerdo: Moto Entrega e índice de atendimento (aparecem no Nível 4)
  motoAlerta = el('span', { class: 'moto-entrega__alerta', 'aria-hidden': 'true', hidden: true });
  moto = el('button', { type: 'button', class: 'moto-entrega', hidden: true, 'aria-label': 'Moto Entrega' },
    el('span', { class: 'moto-entrega__icone', html: MOTO }),
    el('span', { class: 'moto-entrega__nome' }, 'MOTO', el('br'), 'ENTREGA'),
    motoAlerta);
  indice = el('button', { type: 'button', class: 'indice', hidden: true, onclick: () => aoClicarIndice?.() });
  topoEsquerdo = el('div', { class: 'hud-esquerda' }, moto, indice);
  raiz.after(topoEsquerdo);
  GameState.ouvir((estado, mudanca) => atualizar(estado, mudanca));
  atualizar(GameState.get());
}

function atualizar(estado, mudanca) {
  dinheiro.textContent = reais(estado.dinheiroCentavos);
  estoqueBtn.hidden = estado.dia < 2;
  dia.replaceChildren(el('span', { class: 'hud__rotulo' }, 'DIA'), doisDigitos(estado.dia));
  atualizarIndice(estado);
  if (mudanca === 'dinheiro') {
    dinheiro.classList.remove('mudou');
    void dinheiro.offsetWidth; // reinicia a animação
    dinheiro.classList.add('mudou');
  }
}

export function mostrarHUD(visivel = true) {
  raiz.hidden = !visivel;
  botaoInicio.hidden = !visivel;
  topoEsquerdo.hidden = !visivel;
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

// ----- Moto Entrega e índice de atendimento -----

/** Mostra o balão do Moto Entrega. pendentes: quantos pedidos esperam (vira o "!"). */
export function configurarMotoEntrega({ visivel = true, pendentes = 0, aoClicar = null } = {}) {
  moto.hidden = !visivel;
  if (aoClicar) moto.onclick = aoClicar;
  motoAlerta.hidden = pendentes <= 0;
  motoAlerta.textContent = pendentes > 1 ? String(pendentes) : '!';
  moto.classList.toggle('moto-entrega--novo', pendentes > 0);
  moto.setAttribute('aria-label', pendentes ? `Moto Entrega: ${pendentes} pedido(s)` : 'Moto Entrega');
}

/** Liga o índice de atendimento no HUD. textos: entregas.json → indice. */
export function mostrarIndiceNoHUD(textos, aoClicar) {
  textosIndice = textos;
  aoClicarIndice = aoClicar;
  indice.hidden = false;
  atualizarIndice(GameState.get());
}

export function esconderTopoEsquerdo() {
  moto.hidden = true;
  indice.hidden = true;
  textosIndice = null;
}

function atualizarIndice(estado) {
  if (!indice || !textosIndice) return;
  const valor = indiceDeAtendimento(estado.atendimentos);
  const faixa = faixaDoIndice(valor, textosIndice.faixas);
  indice.className = `indice ${faixa ? `indice--${faixa.cor}` : ''}`.trim();
  const partes = [
    el('span', { class: 'indice__rotulo' }, textosIndice.rotulo),
    el('span', { class: 'indice__valor' }, valor === null ? '—' : `${valor}%`),
  ];
  if (faixa) partes.push(el('span', { class: 'indice__faixa' }, faixa.nome));
  indice.replaceChildren(...partes);
  indice.setAttribute('aria-label', `${textosIndice.titulo}: ${valor === null ? 'sem dados' : `${valor}%, ${faixa.nome}`}`);
}
