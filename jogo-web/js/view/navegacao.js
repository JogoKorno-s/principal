// VIEW: painel da casinha (para onde ir) e relatório de vendas do dia.

import { GameState } from '../model/game-state.js';
import { produto } from '../model/produtos.js';
import { el, botao, botaoIcone, icones, modal } from './componentes.js';
import { reais } from '../util/formato.js';

const PROIBIDO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M5.8 18.2 18.2 5.8"/></svg>';

/**
 * secoes: [{ id, titulo, imagem, estado: 'livre' | 'nivel' | 'missao', aviso?, alerta?, atual? }]
 * Resolve com o id escolhido (ou null se fechar).
 */
export function mostrarNavegacao({ titulo, secoes }) {
  return new Promise((resolver) => {
    const fechar = (id = null) => { fundo.remove(); resolver(id); };

    const cartoes = secoes.map((s) => {
      const bloqueado = s.estado !== 'livre';
      const imagem = s.imagem && s.estado !== 'nivel'
        ? el('img', { class: 'nav-secao__imagem', src: s.imagem, alt: '' })
        : el('div', { class: 'nav-secao__imagem nav-secao__imagem--vazia' });
      return el('button', {
        type: 'button',
        class: `nav-secao nav-secao--${s.estado} ${s.atual ? 'nav-secao--atual' : ''}`,
        'aria-disabled': String(bloqueado),
        'aria-label': bloqueado ? `${s.titulo}: ${s.aviso}` : `Ir para ${s.titulo}`,
        onclick: () => { if (!bloqueado) fechar(s.id); },
      },
      el('span', { class: 'nav-secao__titulo' }, s.titulo),
      el('span', { class: 'nav-secao__moldura' },
        imagem,
        bloqueado ? el('span', { class: 'nav-secao__bloqueio' },
          el('span', { class: 'nav-secao__icone', html: s.estado === 'nivel' ? PROIBIDO : icones.cadeado }),
          el('span', { class: 'nav-secao__aviso' }, s.aviso)) : null,
        s.alerta ? el('span', { class: 'nav-secao__alerta', 'aria-hidden': 'true' }, '!') : null));
    });

    const painel = el('div', { class: 'painel navegacao', role: 'dialog', 'aria-modal': 'true', 'aria-label': titulo },
      el('h2', { class: 'painel__titulo' }, titulo),
      el('div', { class: 'navegacao__grade' }, cartoes),
      botaoIcone(icones.fechar, 'Fechar', () => fechar(), 'painel__fechar botao-icone--pequeno'));
    const fundo = el('div', { class: 'fundo-escuro' }, painel);
    fundo.addEventListener('click', (e) => { if (e.target === fundo) fechar(); });
    fundo.addEventListener('keydown', (e) => { if (e.key === 'Escape') fechar(); });
    document.getElementById('sobreposicao').append(fundo);
    painel.querySelector('.nav-secao--livre')?.focus({ preventScroll: true });
  });
}

/** Computador do caixa: quanto foi vendido hoje, receita, custo e lucro. */
export function mostrarVendas(textos) {
  const vendas = Object.entries(GameState.get().vendasHoje);
  let soma = { qtd: 0, receita: 0, custo: 0 };
  const linhas = vendas.map(([id, v]) => {
    const p = produto(id);
    const custo = p.custoCentavos * v.qtd;
    soma = { qtd: soma.qtd + v.qtd, receita: soma.receita + v.receita, custo: soma.custo + custo };
    return el('div', { class: 'vendas__linha', role: 'row' },
      el('span', { class: 'estoque__produto' }, el('img', { src: p.imagem, alt: '' }), p.nome),
      el('span', {}, String(v.qtd)),
      el('span', {}, reais(v.receita)),
      el('span', {}, reais(custo)),
      el('span', { class: 'vendas__lucro' }, reais(v.receita - custo)));
  });
  const conteudo = vendas.length
    ? el('div', { class: 'vendas__tabela', role: 'table' },
      el('div', { class: 'vendas__linha estoque__cabecalho', role: 'row' },
        el('span', {}, 'Produto'), el('span', {}, 'Vendidos'), el('span', {}, 'Vendido por'), el('span', {}, 'Custo'), el('span', {}, 'Lucro')),
      linhas,
      el('div', { class: 'vendas__linha vendas__total', role: 'row' },
        el('span', {}, 'Total'), el('span', {}, String(soma.qtd)), el('span', {}, reais(soma.receita)),
        el('span', {}, reais(soma.custo)), el('span', { class: 'vendas__lucro' }, reais(soma.receita - soma.custo))),
      el('p', { class: 'vendas__explicacao' }, textos.explicacao))
    : el('p', { class: 'vendas__explicacao' }, textos.vazio);
  const fechar = modal({ titulo: textos.titulo, conteudo, acoes: [botao('Fechar', () => fechar(), 'secundario')] });
}
