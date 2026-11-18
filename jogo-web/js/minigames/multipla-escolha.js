// MINIGAME: desafio de múltipla escolha (alternativas A–D) com a imagem do produto.
// Entrada: alternativa escolhida · Validação: é a correta? · Resultado: ✓ na alternativa ou "TENTE NOVAMENTE"

import { el, botao, selo, icones } from '../view/componentes.js';
import { esperar } from '../util/formato.js';

const LETRAS = ['A', 'B', 'C', 'D'];

/** desafio: { imagens: [], texto, pergunta, alternativas: [], correta (índice) }  botaoTexto: "Comprar" */
export function criarMultiplaEscolha(desafio, { botaoTexto = 'Comprar', mensagemEscolha = 'Escolha uma alternativa.' } = {}) {
  let fundo, feedback, escolhida = null;
  const opcoes = [];

  return {
    montar(container, enviar) {
      const lista = el('div', { class: 'desafio__alternativas', role: 'radiogroup', 'aria-label': 'Alternativas' });
      desafio.alternativas.forEach((texto, i) => {
        const opcao = el('button', {
          type: 'button', class: 'alternativa', role: 'radio', 'aria-checked': 'false',
          onclick: () => {
            escolhida = i;
            opcoes.forEach((o, j) => o.setAttribute('aria-checked', String(j === i)));
            feedback.replaceChildren();
          },
        }, el('span', { class: 'alternativa__letra' }, LETRAS[i]), texto);
        opcoes.push(opcao);
        lista.append(opcao);
      });

      feedback = el('div', { class: 'desafio__feedback', 'aria-live': 'assertive' });
      const painel = el('div', { class: 'painel desafio', role: 'dialog', 'aria-label': 'Desafio' },
        el('div', { class: 'desafio__imagens' }, desafio.imagens.map((src) => el('img', { src, alt: '' }))),
        el('div', { class: 'desafio__conteudo' },
          el('p', { class: 'desafio__texto' }, desafio.texto, ' ', el('strong', {}, desafio.pergunta)),
          lista),
        feedback,
        el('div', { class: 'desafio__acao' }, botao(botaoTexto, () => enviar({ indice: escolhida }), 'grande')));
      fundo = el('div', { class: 'fundo-escuro' }, painel);
      container.append(fundo);
      opcoes[0].focus({ preventScroll: true });
    },

    validar({ indice }) {
      if (indice === null) return { ok: false, vazio: true };
      return { ok: indice === desafio.correta };
    },

    async resultado(r, { indice }) {
      if (r.vazio) { feedback.replaceChildren(mensagemEscolha); return false; }
      if (!r.ok) {
        opcoes[indice].classList.add('errada');
        feedback.replaceChildren(selo(false));
        return false;
      }
      opcoes[indice].classList.add('certa');
      feedback.replaceChildren(el('div', { class: 'desafio__certo' },
        el('span', { class: 'desafio__check', html: icones.certo }),
        `${LETRAS[indice]}) ${desafio.alternativas[indice]}`));
      opcoes.forEach((o) => { o.disabled = true; });
      await esperar(1500);
      return true;
    },

    desmontar() { fundo.remove(); },
  };
}
