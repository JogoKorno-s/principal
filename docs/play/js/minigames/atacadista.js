// MINIGAME: compra no Mercado Atacadista.
// Entrada: quantidades escolhidas · Validação: de 1 a 4 de cada produto e saldo suficiente
// Resultado: selo ✓ (fecha o painel) ou "TENTE NOVAMENTE" com a explicação.

import { mostrarFalencia } from '../view/falencia.js';
import { el, botao, botaoIcone, icones, selo } from '../view/componentes.js';
import { reais, esperar } from '../util/formato.js';

/**
 * config: dados de data/dia1.json → compra
 * saldo(): devolve o dinheiro atual em centavos (lido do GameState)
 */
export function criarAtacadista({ config, saldo }) {
  const quantidades = Object.fromEntries(config.produtos.map((p) => [p.id, 0]));
  const saidas = {};
  let fundo, total, areaResultado, grade, abas;
  // Aba aberta: cada atacadista mostra só os seus produtos
  let abaAtiva = config.abas?.find((a) => a.ativa)?.id ?? null;
  const visiveis = () => config.produtos.filter((p) => !abaAtiva || (p.aba ?? abaAtiva) === abaAtiva);

  const calcularTotal = () =>
    config.produtos.reduce((soma, p) => soma + p.precoCentavos * quantidades[p.id], 0);

  function atualizar() {
    for (const p of visiveis()) saidas[p.id].value = quantidades[p.id];
    total.textContent = `TOTAL: ${reais(calcularTotal())}`;
  }

  function mudar(id, delta) {
    quantidades[id] = Math.min(config.quantidadeMaxima, Math.max(0, quantidades[id] + delta));
    areaResultado.replaceChildren();
    atualizar();
  }

  function cartao(p) {
    saidas[p.id] = el('output', { 'aria-live': 'polite', 'aria-label': `Quantidade de ${p.nome}` }, '0');
    if (p.bloqueio) {   // produto que só é liberado em outro nível
      return el('div', { class: 'produto-card produto-card--bloqueado' },
        el('img', { src: p.imagem, alt: p.nome }),
        el('div', { class: 'produto-card__nome' }, p.nome),
        el('div', { class: 'produto-card__estoque', html: `${icones.cadeado} ${p.bloqueio}` }));
    }
    return el('div', { class: 'produto-card' },
      el('img', { src: p.imagem, alt: p.nome }),
      el('div', { class: 'produto-card__nome' }, p.nome),
      el('div', { class: 'produto-card__preco' }, reais(p.precoCentavos)),
      el('div', { class: 'produto-card__unidade' }, `por ${p.unidade}`),
      p.estoque !== undefined ? el('div', { class: 'produto-card__estoque' }, `Em estoque: ${p.estoque}`) : null,
      el('div', { class: 'quantidade' },
        botaoIcone('−', `Tirar um ${p.nome}`, () => mudar(p.id, -1), 'botao-icone--pequeno'),
        saidas[p.id],
        botaoIcone('+', `Colocar mais um ${p.nome}`, () => mudar(p.id, +1), 'botao-icone--pequeno')));
  }

  return {
    montar(container, enviar) {
      grade = el('div', { class: 'atacadista__produtos' });
      const mostrarAba = () => {
        grade.replaceChildren(...visiveis().map(cartao));
        abas?.querySelectorAll('[role=tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.aba === abaAtiva)));
        atualizar();
      };
      abas = config.abas ? el('div', { class: 'atacadista__abas', role: 'tablist', 'aria-label': 'Atacadistas' },
        config.abas.map((a) => el('button', {
          type: 'button', role: 'tab', class: 'atacadista__aba', 'aria-selected': String(a.ativa), 'data-aba': a.id,
          title: a.bloqueio ? `Desbloqueia no ${a.bloqueio}` : a.nome,
          onclick: () => {
            if (a.bloqueio) { areaResultado.replaceChildren(`${a.nome}: desbloqueia no ${a.bloqueio}.`); return; }
            abaAtiva = a.id;
            mostrarAba();
          },
        }, a.bloqueio ? el('span', { html: icones.cadeado, class: 'atacadista__cadeado' }) : null, a.nome))) : null;
      total = el('div', { class: 'atacadista__total' });
      areaResultado = el('div', { class: 'atacadista__resultado', 'aria-live': 'assertive' });
      const compacto = config.produtos.length > 3 ? 'atacadista--compacto' : '';
      const painel = el('div', { class: `painel atacadista ${compacto}`, role: 'dialog', 'aria-label': config.titulo },
        el('div', { class: 'atacadista__topo' },
          el('span', { class: 'atacadista__selo-oferta' }, config.selo ?? 'OFERTA DO DIA'),
          el('h2', { class: 'painel__titulo' }, config.titulo),
          el('div', { class: 'atacadista__saldo' }, 'Saldo', el('strong', {}, reais(saldo())))),
        abas,
        config.instrucao ? el('p', { class: 'atacadista__instrucao' }, config.instrucao) : null,
        grade,
        el('div', { class: 'atacadista__rodape' },
          total,
          botao('Comprar', () => enviar({ quantidades: { ...quantidades } }), 'grande')),
        areaResultado,
        botaoIcone(icones.fechar, 'Fechar o atacadista', () => enviar({ cancelar: true }), 'painel__fechar'));
      fundo = el('div', { class: 'fundo-escuro' }, painel);
      fundo.addEventListener('keydown', (e) => { if (e.key === 'Escape') enviar({ cancelar: true }); });
      container.append(fundo);
      mostrarAba();
    },

    validar(entrada) {
      if (entrada.cancelar) return { ok: false, cancelado: true };

      const { quantidadeMinima: min, quantidadeMaxima: max } = config;
      const totalItens = Object.values(entrada.quantidades).reduce((a, b) => a + b, 0);
      if (config.minimoTotal && totalItens < config.minimoTotal) return { ok: false, mensagem: config.mensagemTotal };
      const liberados = config.produtos.filter((p) => !p.bloqueio);
      const certas = liberados.every((p) => entrada.quantidades[p.id] >= min && entrada.quantidades[p.id] <= max);
      if (!certas) return { ok: false, mensagem: config.mensagemQuantidade };

      // Reposição: cada produto precisa terminar com um mínimo no estoque
      if (config.estoqueMinimo) {
        const falta = liberados.find((p) => (p.estoque ?? 0) + entrada.quantidades[p.id] < config.estoqueMinimo);
        if (falta) return { ok: false, mensagem: config.mensagemEstoque.replace('{nome}', falta.nome.toLowerCase()) };
      }
      // Missões: ex.: pelo menos 1 de cada bebida, ou 1 congelado e 1 do açougue
      for (const regra of config.exigir ?? []) {
        const doGrupo = liberados.filter((p) => (regra.ids ? regra.ids.includes(p.id) : p.aba === regra.aba));
        const ok = regra.cada
          ? doGrupo.every((p) => (p.estoque ?? 0) + entrada.quantidades[p.id] >= regra.minimo)
          : doGrupo.reduce((soma, p) => soma + entrada.quantidades[p.id], 0) >= regra.minimo;
        if (!ok) return { ok: false, mensagem: regra.mensagem };
      }

      const valor = config.produtos.reduce((s, p) => s + p.precoCentavos * entrada.quantidades[p.id], 0);
      if (valor > saldo()) {
        // Não dá nem para a compra mínima obrigatória: o jogador ficou sem saída
        if (saldo() < compraMinima(config, liberados)) return { ok: false, falencia: true };
        return { ok: false, mensagem: config.mensagemSaldo };
      }

      return { ok: true, total: valor, itens: { ...entrada.quantidades }, mensagem: config.mensagemSucesso };
    },

    async resultado(r) {
      if (r.cancelado) return true;
      if (r.falencia) {
        mostrarFalencia('Não sobrou dinheiro nem para a compra mínima que o mercado precisa agora.');
        return false;
      }
      areaResultado.replaceChildren(selo(r.ok), r.mensagem);
      if (!r.ok) return false;
      await esperar(1100);
      return true;
    },

    desmontar() { fundo.remove(); },
  };
}

/** Menor valor que o jogador precisa gastar para cumprir as regras da compra (mínimos e missões). */
function compraMinima(config, liberados) {
  const min = config.quantidadeMinima ?? 0;
  let total = liberados.reduce((s, p) => s + p.precoCentavos * min, 0);
  for (const regra of config.exigir ?? []) {
    const doGrupo = liberados.filter((p) => (regra.ids ? regra.ids.includes(p.id) : p.aba === regra.aba));
    if (!doGrupo.length) continue;
    total += regra.cada
      ? doGrupo.reduce((s, p) => s + p.precoCentavos * Math.max(0, regra.minimo - (p.estoque ?? 0)), 0)
      : Math.min(...doGrupo.map((p) => p.precoCentavos)) * regra.minimo;
  }
  if (!total && config.minimoTotal) total = Math.min(...liberados.map((p) => p.precoCentavos));
  return total;
}
