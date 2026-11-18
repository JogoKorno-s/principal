// MINIGAME: preço de venda com lucro.
// Entrada: preço digitado para cada produto · Validação: custo + 25% (até 1 centavo de diferença, por causa do arredondamento)
// Resultado: linhas certas em verde, erradas em vermelho, e "TENTE NOVAMENTE" ou ✓.

import { el, botao, selo } from '../view/componentes.js';
import { reais, esperar } from '../util/formato.js';
import { lerValor } from './caixa.js';

/** itens: [{ id, nome, imagem, custoCentavos, esperadoCentavos }] */
export function criarPrecificacao({ itens, titulo, instrucao, mensagens }) {
  let fundo, feedback;
  const entradas = new Map();
  const linhas = new Map();

  return {
    montar(container, enviar) {
      const confirmar = () => enviar(Object.fromEntries([...entradas].map(([id, inp]) => [id, inp.value])));
      const tabela = el('div', { class: 'precos__tabela', role: 'table' },
        el('div', { class: 'precos__linha precos__cabecalho', role: 'row' },
          el('span', {}, 'Produto'), el('span', {}, 'Custo'), el('span', {}, 'Preço de venda')),
        itens.map((p) => {
          const entrada = el('input', {
            class: 'precos__entrada', type: 'text', inputmode: 'decimal', autocomplete: 'off',
            placeholder: 'R$ 0,00', 'aria-label': `Preço de venda de ${p.nome}`,
            onkeydown: (e) => { if (e.key === 'Enter') confirmar(); },
            oninput: () => linhas.get(p.id).classList.remove('certa', 'errada'),
          });
          entradas.set(p.id, entrada);
          const linha = el('div', { class: 'precos__linha', role: 'row' },
            el('span', { class: 'precos__produto' }, el('img', { src: p.imagem, alt: '' }), p.nome),
            el('span', { class: 'precos__custo' }, reais(p.custoCentavos)),
            entrada);
          linhas.set(p.id, linha);
          return linha;
        }));

      feedback = el('div', { class: 'precos__feedback', 'aria-live': 'assertive' });
      const painel = el('div', { class: 'painel precos', role: 'dialog', 'aria-label': titulo },
        el('h2', { class: 'painel__titulo' }, titulo),
        el('p', { class: 'precos__instrucao' }, instrucao),
        tabela,
        el('div', { class: 'precos__rodape' }, feedback, botao('Confirmar preços', confirmar, 'grande')));
      fundo = el('div', { class: 'fundo-escuro' }, painel);
      container.append(fundo);
      entradas.values().next().value.focus({ preventScroll: true });
    },

    validar(valores) {
      const erradas = [];
      const vazias = [];
      for (const p of itens) {
        const v = lerValor(valores[p.id]);
        if (v === null) vazias.push(p.id);
        else if (Math.abs(v - p.esperadoCentavos) > 1) erradas.push(p.id);
      }
      if (vazias.length) return { ok: false, vazio: true, erradas };
      return { ok: erradas.length === 0, erradas };
    },

    async resultado(r) {
      for (const p of itens) {
        linhas.get(p.id).classList.toggle('errada', r.erradas.includes(p.id));
        linhas.get(p.id).classList.toggle('certa', !r.vazio && !r.erradas.includes(p.id));
      }
      if (r.vazio) { feedback.replaceChildren(mensagens.vazio); return false; }
      feedback.replaceChildren(selo(r.ok), r.ok ? '' : ` ${mensagens.erro}`);
      if (!r.ok) return false;
      await esperar(1300);
      return true;
    },

    desmontar() { fundo.remove(); },
  };
}
