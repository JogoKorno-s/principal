// MINIGAME: rolos de arame farpado para cercar o mercado (perímetro ÷ tamanho do rolo).
//   Entrada: quantidade de rolos (− e +) · Validação: cobre o perímetro sem sobrar um rolo inteiro?
//   Resultado: ✓ (e a compra é descontada do caixa) ou "TENTE NOVAMENTE" com o motivo.

import { el, botao, botaoIcone, selo } from '../view/componentes.js';
import { reais, esperar } from '../util/formato.js';
import { botaoDica, passosCom } from '../view/dica.js';

/** config: { perimetroM, roloM, precoCentavos, imagem, textos, saldo() } */
export function criarArame({ perimetroM, roloM, precoCentavos, imagem, textos, saldo }) {
  const certo = Math.ceil(perimetroM / roloM);
  const valores = { perimetro: perimetroM, rolo: roloM, certo };
  const preencher = (t, extra = {}) => t.replace(/\{(\w+)\}/g, (_, k) => ({ ...valores, ...extra })[k] ?? '');
  let raiz, feedback, qtdEl, totalEl;
  let qtd = 0;

  return {
    montar(container, enviar) {
      const mudar = (delta) => {
        qtd = Math.max(0, Math.min(20, qtd + delta));
        qtdEl.textContent = String(qtd);
        totalEl.textContent = preencher(textos.total, { total: reais(qtd * precoCentavos) });
        feedback.replaceChildren();
      };
      qtdEl = el('output', { class: 'arame__qtd', 'aria-live': 'polite' }, '0');
      totalEl = el('p', { class: 'arame__total' });
      feedback = el('div', { class: 'entrega__feedback arame__feedback', 'aria-live': 'assertive' });
      const painel = el('div', { class: 'painel arame', role: 'dialog', 'aria-label': textos.titulo },
        el('p', { class: 'trig__enunciado arame__pergunta' }, preencher(textos.pergunta)),
        el('div', { class: 'arame__linha' },
          el('img', { class: 'arame__imagem', src: imagem, alt: textos.altImagem }),
          el('div', {},
            el('div', { class: 'quantidade arame__contador' },
              botaoIcone('−', 'Tirar um rolo', () => mudar(-1)),
              qtdEl,
              botaoIcone('+', 'Colocar mais um rolo', () => mudar(+1))),
            el('p', { class: 'arame__preco' }, preencher(textos.preco, { preco: reais(precoCentavos) })),
            totalEl)),
        el('div', { class: 'trig__acoes trig__acoes--fim' },
          feedback,
          botaoDica(() => ({ titulo: textos.dicaPassos.titulo, passos: passosCom(textos.dicaPassos.passos, valores) })),
          botao(textos.botaoComprar, () => enviar({ qtd }), 'grande')));
      raiz = el('div', { class: 'entrega' }, painel);
      container.append(raiz);
      mudar(0);
    },

    validar({ qtd: n }) {
      if (n === 0) return { ok: false, mensagem: textos.zero };
      if (n * roloM < perimetroM) return { ok: false, mensagem: preencher(textos.pouco, { n, m: n * roloM, falta: perimetroM - n * roloM }) };
      if (n > certo) return { ok: false, mensagem: preencher(textos.muito, { n, m: n * roloM }) };
      if (n * precoCentavos > saldo()) return { ok: false, mensagem: textos.saldo };
      return { ok: true, qtd: n, total: n * precoCentavos };
    },

    async resultado(r) {
      feedback.replaceChildren(selo(r.ok), el('span', {}, r.ok ? preencher(textos.certo) : r.mensagem));
      if (!r.ok) return false;
      await esperar(1800);
      return true;
    },

    desmontar() { raiz.remove(); },
  };
}
