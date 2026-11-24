// VIEW: "O dinheiro acabou" — quando o jogador não consegue mais seguir (sem dinheiro para
// uma compra obrigatória, ou sem dinheiro e sem nada no estoque para vender).
// O botão volta o jogo para o começo do dia, com o dinheiro e o estoque daquele momento.

import { GameState } from '../model/game-state.js';
import { el, botao } from './componentes.js';
import { ir } from '../controller/roteador.js';
import { reais } from '../util/formato.js';

let aberta = false;

export function mostrarFalencia(motivo = '') {
  if (aberta) return;
  aberta = true;
  const recomecar = () => {
    fundo.remove();
    aberta = false;
    const tela = GameState.voltarAoInicioDoDia() ?? GameState.get().tela;
    ir(tela);
  };
  const painel = el('div', { class: 'painel falencia', role: 'alertdialog', 'aria-modal': 'true', 'aria-label': 'O dinheiro acabou' },
    el('h2', { class: 'painel__titulo falencia__titulo' }, 'O dinheiro acabou!'),
    el('p', { class: 'falencia__texto' }, motivo || 'O caixa do Korno\'s não tem dinheiro suficiente para continuar.'),
    el('p', { class: 'falencia__saldo' }, `Saldo atual: ${reais(GameState.get().dinheiroCentavos)}`),
    el('p', { class: 'falencia__texto' },
      'Administrar um mercado é isso: comprar só o que dá para vender e guardar dinheiro para as próximas compras. Recomece o dia e tente de novo!'),
    el('div', { class: 'modal__acoes' }, botao('Recomeçar o dia', recomecar, 'grande')));
  const fundo = el('div', { class: 'fundo-escuro falencia__fundo' }, painel);
  document.getElementById('palco').append(fundo);
  painel.querySelector('button').focus({ preventScroll: true });
}
