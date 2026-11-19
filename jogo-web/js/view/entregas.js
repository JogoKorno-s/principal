// VIEW: telas do Moto Entrega (lista de pedidos, notinha do pedido), índice de atendimento
// e o balão de compra de melhorias (geladeira de bebidas).

import { GameState } from '../model/game-state.js';
import { produto } from '../model/produtos.js';
import { numeroDoPedido } from '../model/entregas.js';
import { indiceDeAtendimento, faixaDoIndice } from '../model/atendimento.js';
import { el, botao, modal } from './componentes.js';
import { reais } from '../util/formato.js';

/** Código de barras desenhado a partir do número do pedido (sempre o mesmo para o mesmo pedido). */
export function codigoDeBarras(numero, variante = '') {
  const digitos = `1234${String(numero).padStart(3, '0')}67254512`;
  let x = 0;
  const barras = [];
  for (let i = 0; i < 46; i++) {
    const d = Number(digitos[i % digitos.length]) + i;
    const largura = 1 + (d % 3);
    if (i % 2 === 0) barras.push(`<rect x="${x}" y="0" width="${largura}" height="40"/>`);
    x += largura + 1;
  }
  return el('div', { class: `codigo-barras ${variante ? `codigo-barras--${variante}` : ''}`.trim(), 'aria-hidden': 'true' },
    el('span', { html: `<svg viewBox="0 0 ${x} 40" preserveAspectRatio="none">${barras.join('')}</svg>` }),
    el('span', { class: 'codigo-barras__numero' }, digitos));
}

/** Lista de pedidos pendentes. Resolve com o pedido escolhido ou null. */
export function escolherPedido(pedidos, textos) {
  return new Promise((resolver) => {
    let escolhido = null;
    const cartoes = pedidos.map((p) => el('div', { class: 'pedido-cartao' },
      el('div', { class: 'pedido-cartao__numero' }, `Pedido ${numeroDoPedido(p.numero)}`),
      el('div', { class: 'pedido-cartao__info' },
        el('span', {}, p.rota.bairro),
        el('span', {}, p.itens.length === 1 ? textos.item : textos.itens.replace('{n}', p.itens.length)),
        el('b', {}, reais(p.totalCentavos))),
      el('div', { class: 'pedido-cartao__fotos' }, p.itens.map((id) => el('img', { src: produto(id).imagem, alt: produto(id).nome }))),
      botao(textos.botaoSeparar, () => { escolhido = p; fechar(); }, 'pequeno')));
    const conteudo = pedidos.length
      ? el('div', { class: 'pedidos__lista' }, cartoes)
      : el('p', { class: 'vendas__explicacao' }, textos.listaVazia);
    const fechar = modal({ titulo: textos.listaTitulo, conteudo, aoFechar: () => resolver(escolhido) });
  });
}

/** Notinha do pedido (itens, preços e total). Resolve quando o jogador clica em Avançar. */
export function mostrarPedido(container, pedido, textos) {
  return new Promise((avancar) => {
    const linhas = pedido.itens.map((id, i) => el('li', { class: 'entrega__linha' },
      el('span', {}, String(i + 1).padStart(2, '0')),
      el('span', {}, produto(id).nome.toUpperCase()),
      el('span', {}, reais(pedido.valores[i]))));
    const raiz = el('div', { class: 'entrega' },
      el('div', { class: 'entrega__painel' },
        el('div', { class: 'entrega__titulo' }, `PEDIDO ${numeroDoPedido(pedido.numero)}`),
        el('div', { class: 'entrega__loja' }, textos.loja),
        el('div', { class: 'pontilhado' }),
        el('ol', { class: 'entrega__itens' }, linhas),
        el('div', { class: 'pontilhado' }),
        el('div', { class: 'entrega__total' }, el('span', {}, 'TOTAL'), el('b', {}, reais(pedido.totalCentavos))),
        el('div', { class: 'pontilhado' }),
        el('div', { class: 'entrega__rodape' },
          codigoDeBarras(pedido.numero),
          botao(textos.botaoAvancar, () => { raiz.remove(); avancar(); }, 'grande'))));
    container.append(raiz);
    raiz.querySelector('.botao').focus({ preventScroll: true });
  });
}

/** Janela do índice de atendimento: nota geral e os últimos clientes. */
export function mostrarIndice(textos) {
  const lista = GameState.get().atendimentos ?? [];
  const indice = indiceDeAtendimento(lista);
  const faixa = faixaDoIndice(indice, textos.faixas);
  const conteudo = [
    indice === null
      ? el('p', { class: 'vendas__explicacao' }, textos.semDados)
      : el('div', { class: `indice__grande indice--${faixa.cor}` }, `${indice}%`, el('span', {}, faixa.nome)),
    lista.length ? el('ol', { class: 'indice__lista' }, lista.map((a, i) => el('li', {},
      el('span', {}, `Cliente ${i + 1}`),
      el('span', {}, `${a.segundos} s`),
      el('span', {}, a.erros ? `${a.erros} erro(s) no troco` : 'troco certo'),
      el('b', {}, `${a.nota} pts`)))) : null,
    el('p', { class: 'vendas__explicacao' }, textos.explicacao),
  ];
  const fechar = modal({ titulo: textos.titulo, conteudo, acoes: [botao('Fechar', () => fechar(), 'secundario')] });
}

/**
 * Balão de compra obrigatória (sem botão de fechar): imagem, preço e "Comprar".
 * Resolve quando o jogador compra.
 */
export function mostrarCompraMelhoria({ titulo, imagem, descricao, precoCentavos, botao: texto }) {
  return new Promise((comprar) => {
    const fundo = el('div', { class: 'fundo-escuro' },
      el('div', { class: 'painel melhoria', role: 'dialog', 'aria-modal': 'true', 'aria-label': titulo },
        el('img', { class: 'melhoria__imagem', src: imagem, alt: '' }),
        el('div', { class: 'melhoria__texto' },
          el('h2', { class: 'painel__titulo' }, titulo),
          el('p', {}, descricao),
          el('div', { class: 'melhoria__preco' }, reais(precoCentavos)),
          botao(texto, () => { fundo.remove(); comprar(); }, 'grande'))));
    document.getElementById('sobreposicao').append(fundo);
    fundo.querySelector('.botao').focus({ preventScroll: true });
  });
}
