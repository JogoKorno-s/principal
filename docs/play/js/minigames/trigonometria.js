// MINIGAME: câmera de segurança (trigonometria no triângulo retângulo).
//   Passo 1: o problema e a tabela de dados (botão Avançar).
//   Passo 2: o triângulo desenhado sobre o mercado, tan(ângulo) = altura ÷ x, e a resposta.
//   Entrada: comprimento digitado · Validação: é altura ÷ tan(ângulo)? (aceita 2 casas, com folga de arredondamento)
//   Resultado: ✓ ou "TENTE NOVAMENTE" (botão Dica com o passo a passo)

import { el, botao, selo } from '../view/componentes.js';
import { lerNumero } from '../model/entregas.js';
import { esperar } from '../util/formato.js';
import { botaoDica, passosCom } from '../view/dica.js';

/** Comprimento coberto pela câmera: cateto adjacente = altura ÷ tan(ângulo). */
export function alcanceDaCamera(alturaM, anguloGraus) {
  return alturaM / Math.tan((anguloGraus * Math.PI) / 180);
}

const virgula = (n, casas = 2) => n.toFixed(casas).replace('.', ',');

/** config: { alturaM, anguloGraus, imagem, textos } */
export function criarTrigonometria({ alturaM, anguloGraus, imagem, textos }) {
  const resposta = alcanceDaCamera(alturaM, anguloGraus);
  const tangente = Math.tan((anguloGraus * Math.PI) / 180);
  const valores = { altura: alturaM, angulo: anguloGraus, tan: virgula(tangente, 3), x: virgula(resposta) };
  const preencher = (t) => t.replace(/\{(\w+)\}/g, (_, k) => valores[k] ?? '');
  let raiz, entrada, feedback;
  let erros = 0;

  return {
    montar(container, enviar) {
      const responder = () => enviar(entrada.value);
      entrada = el('input', {
        class: 'entrega__entrada', type: 'text', inputmode: 'decimal', autocomplete: 'off',
        placeholder: textos.placeholder, 'aria-label': `Comprimento do corredor em ${textos.unidade}`,
        onkeydown: (e) => { if (e.key === 'Enter') responder(); },
      });
      feedback = el('div', { class: 'entrega__feedback', 'aria-live': 'assertive' });

      // Passo 2: triângulo + resposta
      const passo2 = el('div', { class: 'trig__passo', hidden: true },
        el('p', { class: 'trig__enunciado' }, preencher(textos.instrucao)),
        el('img', { class: 'trig__imagem', src: imagem, alt: preencher(textos.altImagem) }),
        el('div', { class: 'trig__acoes' },
          el('div', { class: 'trig__formula', 'aria-label': `tangente de ${anguloGraus} graus igual a ${alturaM} sobre x` },
            `tan(${anguloGraus}°) = `, el('span', { class: 'trig__fracao' }, el('span', {}, String(alturaM)), el('span', {}, 'x'))),
          entrada, el('span', { class: 'entrega__unidade' }, textos.unidade),
          botaoDica(() => ({ titulo: textos.dicaPassos.titulo, passos: passosCom(textos.dicaPassos.passos, valores) })),
          botao(textos.botaoAvancar, responder, 'grande')),
        feedback);

      // Passo 1: problema + dados
      const passo1 = el('div', { class: 'trig__passo' },
        el('p', { class: 'trig__enunciado' }, preencher(textos.problema)),
        el('table', { class: 'trig__dados' },
          el('caption', {}, textos.dadosTitulo),
          el('tbody', {}, textos.dados.map(([nome, valor]) => el('tr', {}, el('th', { scope: 'row' }, nome), el('td', {}, preencher(valor)))))),
        el('div', { class: 'trig__acoes trig__acoes--fim' },
          botao(textos.botaoAvancar, () => {
            passo1.hidden = true; passo2.hidden = false; entrada.focus({ preventScroll: true });
          }, 'grande')));

      raiz = el('div', { class: 'entrega' }, el('div', { class: 'painel trig', role: 'dialog', 'aria-label': textos.titulo }, passo1, passo2));
      container.append(raiz);
      passo1.querySelector('button').focus({ preventScroll: true });
    },

    validar(texto) {
      const valor = lerNumero(texto);
      if (valor === null) return { ok: false, vazio: true };
      // 6,93 · 6,928 · 6,9 são aceitos (diferença de arredondamento)
      return { ok: Math.abs(valor - resposta) <= 0.06, valor };
    },

    async resultado(r) {
      if (r.vazio) { feedback.replaceChildren(textos.vazio); return false; }
      if (!r.ok) {
        erros += 1;
        feedback.replaceChildren(selo(false), el('span', {}, textos.erro),
          ...(erros >= 2 ? [el('p', { class: 'entrega__dica' }, textos.lembrete)] : []));
        entrada.select();
        return false;
      }
      entrada.disabled = true;
      feedback.replaceChildren(selo(true), el('span', {}, preencher(textos.certo)));
      await esperar(2000);
      return true;
    },

    desmontar() { raiz.remove(); },
  };
}
