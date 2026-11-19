// MINIGAME: preço de venda.
// Entrada: preço que o jogador escolhe para cada produto
// Validação: pelo menos 25% acima do custo (lucro) e no máximo o dobro do custo (senão ninguém compra)
// Resultado: linhas certas em verde, erradas em vermelho com o motivo, e ✓ ou "TENTE NOVAMENTE".

import { el, botao, selo } from '../view/componentes.js';
import { reais, esperar } from '../util/formato.js';
import { lerValor } from './caixa.js';
import { botaoDica, passosCom } from '../view/dica.js';

/** itens: [{ id, nome, imagem, custoCentavos, minimoCentavos, maximoCentavos, atualCentavos? }] */
export function criarPrecificacao({ itens, titulo, instrucao, mensagens, dica }) {
  let fundo, feedback;
  const entradas = new Map();
  const linhas = new Map();
  const notas = new Map();

  return {
    montar(container, enviar) {
      const confirmar = () => enviar(Object.fromEntries([...entradas].map(([id, inp]) => [id, inp.value])));
      const tabela = el('div', { class: 'precos__tabela', role: 'table' },
        el('div', { class: 'precos__linha precos__cabecalho', role: 'row' },
          el('span', {}, 'Produto'), el('span', {}, 'Custo'), el('span', {}, 'Preço de venda'), el('span', {}, '')),
        itens.map((p) => {
          const entrada = el('input', {
            class: 'precos__entrada', type: 'text', inputmode: 'decimal', autocomplete: 'off',
            placeholder: 'R$ 0,00', 'aria-label': `Preço de venda de ${p.nome}`,
            value: p.atualCentavos ? reais(p.atualCentavos) : null,
            onkeydown: (e) => { if (e.key === 'Enter') confirmar(); },
            oninput: () => { linhas.get(p.id).classList.remove('certa', 'errada'); notas.get(p.id).textContent = ''; },
          });
          entradas.set(p.id, entrada);
          notas.set(p.id, el('span', { class: 'precos__nota' }));
          const linha = el('div', { class: 'precos__linha', role: 'row' },
            el('span', { class: 'precos__produto' }, el('img', { src: p.imagem, alt: '' }), p.nome),
            el('span', { class: 'precos__custo' }, reais(p.custoCentavos)),
            entrada, notas.get(p.id));
          linhas.set(p.id, linha);
          return linha;
        }));

      feedback = el('div', { class: 'precos__feedback', 'aria-live': 'assertive' });
      const painel = el('div', { class: 'painel precos', role: 'dialog', 'aria-label': titulo },
        el('h2', { class: 'painel__titulo' }, titulo),
        el('p', { class: 'precos__instrucao' }, instrucao),
        tabela,
        el('div', { class: 'precos__rodape' }, feedback,
          dica ? botaoDica(() => {
            // Exemplo com o primeiro produto da lista
            const p = itens[0];
            return {
              titulo: dica.titulo,
              passos: passosCom(dica.passos, {
                nome: p.nome, custo: reais(p.custoCentavos), quarto: reais(Math.round(p.custoCentavos / 4)),
                minimo: reais(p.minimoCentavos), maximo: reais(p.maximoCentavos),
              }),
            };
          }) : null,
          botao('Confirmar preços', confirmar, 'grande')));
      fundo = el('div', { class: 'fundo-escuro' }, painel);
      container.append(fundo);
      entradas.values().next().value.focus({ preventScroll: true });
    },

    validar(valores) {
      const problemas = {};   // id -> 'vazio' | 'baixo' | 'alto'
      const precos = {};
      for (const p of itens) {
        const v = lerValor(valores[p.id]);
        if (v === null) problemas[p.id] = 'vazio';
        else if (v < p.minimoCentavos - 1) problemas[p.id] = 'baixo';   // 1 centavo de folga no arredondamento
        else if (v > p.maximoCentavos) problemas[p.id] = 'alto';
        else precos[p.id] = v;
      }
      return { ok: Object.keys(problemas).length === 0, problemas, precos };
    },

    async resultado(r) {
      for (const p of itens) {
        const problema = r.problemas[p.id];
        linhas.get(p.id).classList.toggle('errada', Boolean(problema));
        linhas.get(p.id).classList.toggle('certa', !problema);
        notas.get(p.id).textContent = problema ? mensagens[problema] : '';
      }
      feedback.replaceChildren(selo(r.ok));
      if (!r.ok) return false;
      await esperar(1300);
      return true;
    },

    desmontar() { fundo.remove(); },
  };
}
