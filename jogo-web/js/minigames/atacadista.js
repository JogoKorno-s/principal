// MINIGAME: compra no Mercado Atacadista.
// Entrada: quantidades escolhidas · Validação: de 1 a 4 de cada produto e saldo suficiente
// Resultado: selo ✓ (fecha o painel) ou "TENTE NOVAMENTE" com a explicação.

import { el, botao, botaoIcone, icones, selo } from '../view/componentes.js';
import { reais, esperar } from '../util/formato.js';

/**
 * config: dados de data/dia1.json → compra
 * saldo(): devolve o dinheiro atual em centavos (lido do GameState)
 */
export function criarAtacadista({ config, saldo }) {
  const quantidades = Object.fromEntries(config.produtos.map((p) => [p.id, 0]));
  const saidas = {};
  let fundo, total, areaResultado;

  const calcularTotal = () =>
    config.produtos.reduce((soma, p) => soma + p.precoCentavos * quantidades[p.id], 0);

  function atualizar() {
    for (const p of config.produtos) saidas[p.id].value = quantidades[p.id];
    total.textContent = `TOTAL: ${reais(calcularTotal())}`;
  }

  function mudar(id, delta) {
    quantidades[id] = Math.min(config.quantidadeMaxima, Math.max(0, quantidades[id] + delta));
    areaResultado.replaceChildren();
    atualizar();
  }

  function cartao(p) {
    saidas[p.id] = el('output', { 'aria-live': 'polite', 'aria-label': `Quantidade de ${p.nome}` }, '0');
    return el('div', { class: 'produto-card' },
      el('img', { src: p.imagem, alt: p.nome }),
      el('div', { class: 'produto-card__nome' }, p.nome),
      el('div', { class: 'produto-card__preco' }, reais(p.precoCentavos)),
      el('div', { class: 'produto-card__unidade' }, `por ${p.unidade}`),
      el('div', { class: 'quantidade' },
        botaoIcone('−', `Tirar um ${p.nome}`, () => mudar(p.id, -1), 'botao-icone--pequeno'),
        saidas[p.id],
        botaoIcone('+', `Colocar mais um ${p.nome}`, () => mudar(p.id, +1), 'botao-icone--pequeno')));
  }

  return {
    montar(container, enviar) {
      total = el('div', { class: 'atacadista__total' });
      areaResultado = el('div', { class: 'atacadista__resultado', 'aria-live': 'assertive' });
      const painel = el('div', { class: 'painel atacadista', role: 'dialog', 'aria-label': config.titulo },
        el('div', { class: 'atacadista__topo' },
          el('span', { class: 'atacadista__selo-oferta' }, 'OFERTA DO DIA'),
          el('h2', { class: 'painel__titulo' }, config.titulo),
          el('div', { class: 'atacadista__saldo' }, 'Saldo', el('strong', {}, reais(saldo())))),
        el('div', { class: 'atacadista__produtos' }, config.produtos.map(cartao)),
        el('div', { class: 'atacadista__rodape' },
          total,
          botao('Comprar', () => enviar({ quantidades: { ...quantidades } }), 'grande')),
        areaResultado,
        botaoIcone(icones.fechar, 'Fechar o atacadista', () => enviar({ cancelar: true }), 'painel__fechar'));
      fundo = el('div', { class: 'fundo-escuro' }, painel);
      fundo.addEventListener('keydown', (e) => { if (e.key === 'Escape') enviar({ cancelar: true }); });
      container.append(fundo);
      atualizar();
    },

    validar(entrada) {
      if (entrada.cancelar) return { ok: false, cancelado: true };

      const { quantidadeMinima: min, quantidadeMaxima: max } = config;
      const certas = config.produtos.every((p) => entrada.quantidades[p.id] >= min && entrada.quantidades[p.id] <= max);
      if (!certas) return { ok: false, mensagem: config.mensagemQuantidade };

      const valor = config.produtos.reduce((s, p) => s + p.precoCentavos * entrada.quantidades[p.id], 0);
      if (valor > saldo()) return { ok: false, mensagem: config.mensagemSaldo };

      return { ok: true, total: valor, itens: { ...entrada.quantidades }, mensagem: config.mensagemSucesso };
    },

    async resultado(r) {
      if (r.cancelado) return true;
      areaResultado.replaceChildren(selo(r.ok), r.mensagem);
      if (!r.ok) return false;
      await esperar(1100);
      return true;
    },

    desmontar() { fundo.remove(); },
  };
}
