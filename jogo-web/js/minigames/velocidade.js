// MINIGAME: velocidade média mínima da moto (Moto Entrega).
//   Entrada: velocidade digitada · Validação: é igual a distância ÷ tempo (em horas)?
//   Resultado: ✓ ou "TENTE NOVAMENTE" (com dica depois de 2 erros)

import { el, botao, selo } from '../view/componentes.js';
import { codigoDeBarras } from '../view/entregas.js';
import { velocidadeMinima, lerNumero, numeroDoPedido } from '../model/entregas.js';
import { esperar } from '../util/formato.js';

/** config: { numero, loja, rota: { bairro, km, minutos }, textos, botaoAvancar } */
export function criarVelocidade(config) {
  const { rota, textos } = config;
  const resposta = velocidadeMinima(rota);
  const preencher = (t) => t.replace('{km}', rota.km).replace('{min}', rota.minutos).replace('{v}', resposta);
  let raiz, entrada, feedback;
  let erros = 0;

  return {
    montar(container, enviar) {
      const responder = () => enviar(entrada.value);
      entrada = el('input', {
        class: 'entrega__entrada', type: 'text', inputmode: 'decimal', autocomplete: 'off',
        placeholder: textos.placeholder, 'aria-label': `Velocidade em ${textos.unidade}`,
        onkeydown: (e) => { if (e.key === 'Enter') responder(); },
      });
      feedback = el('div', { class: 'entrega__feedback', 'aria-live': 'assertive' });
      const notinha = el('div', { class: 'entrega__notinha' },
        el('div', { class: 'entrega__titulo' }, `PEDIDO ${numeroDoPedido(config.numero)}`),
        el('div', { class: 'entrega__loja' }, config.loja),
        el('div', { class: 'pontilhado' }),
        el('p', { class: 'entrega__rota' },
          `${textos.bairro}: ${rota.bairro.toUpperCase()}`, el('br'),
          `${textos.distancia}: ${rota.km} KM`, el('br'),
          `${textos.tempo}: ${rota.minutos} MINUTOS`),
        el('div', { class: 'pontilhado' }),
        codigoDeBarras(config.numero));
      raiz = el('div', { class: 'entrega' },
        el('div', { class: 'entrega__painel entrega__painel--duplo' },
          notinha,
          el('div', { class: 'entrega__pergunta' },
            el('p', {}, preencher(textos.pergunta)),
            el('div', { class: 'entrega__acoes' }, entrada, el('span', { class: 'entrega__unidade' }, textos.unidade),
              botao(config.botaoAvancar, responder, 'grande')),
            feedback)));
      container.append(raiz);
      entrada.focus({ preventScroll: true });
    },

    validar(texto) {
      const valor = lerNumero(texto);
      if (valor === null) return { ok: false, vazio: true };
      return { ok: Math.abs(valor - resposta) < 0.01, valor };
    },

    async resultado(r) {
      if (r.vazio) { feedback.replaceChildren(textos.vazio); return false; }
      if (!r.ok) {
        erros += 1;
        feedback.replaceChildren(selo(false), el('span', {}, textos.erro),
          erros >= 2 ? el('p', { class: 'entrega__dica' }, textos.dica) : null);
        entrada.select();
        return false;
      }
      entrada.disabled = true;
      feedback.replaceChildren(selo(true), el('span', {}, preencher(textos.certo)));
      await esperar(1800);
      return true;
    },

    desmontar() { raiz.remove(); },
  };
}
