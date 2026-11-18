// MINIGAME: limpeza com bolinhas vermelhas numeradas.
// Entrada: a bolinha clicada · Validação: é a próxima da ordem? · Resultado: troca o cenário ou avisa.

import { el, avisar } from '../view/componentes.js';
import { preencher } from '../util/formato.js';

/**
 * config:      dados de data/dia1.json → limpeza
 * inicio:      quantas etapas já foram feitas (vem do save)
 * aoLimpar(n): troca o cenário para o estado n (o controlador faz o fade e salva)
 */
export function criarLimpeza({ config, inicio = 0, aoLimpar }) {
  const { etapas } = config;
  let passo = inicio;
  let camada;
  const bolinhas = new Map();

  return {
    montar(container, enviar) {
      camada = el('div', { class: 'limpeza', 'aria-label': 'Locais para limpar' });
      etapas.forEach((etapa, i) => {
        if (i < passo) return; // já limpo
        const bolinha = el('button', {
          type: 'button',
          class: 'bolinha',
          style: { left: `${etapa.x}px`, top: `${etapa.y}px` },
          'aria-label': `${i + 1}: limpar ${etapa.nome}`,
          onclick: () => enviar({ id: etapa.id }),
        }, String(i + 1), el('span', { class: 'bolinha__rotulo' }, etapa.rotulo));
        bolinhas.set(etapa.id, bolinha);
        camada.append(bolinha);
      });
      container.append(camada);
    },

    validar({ id }) {
      const esperada = etapas[passo];
      if (id !== esperada.id) {
        return { ok: false, mensagem: preencher(config.mensagemErro, { nome: esperada.nome }) };
      }
      const proxima = etapas[passo + 1];
      return {
        ok: true,
        concluido: !proxima,
        mensagem: proxima ? preencher(config.mensagemProxima, { nome: proxima.nome }) : '',
      };
    },

    async resultado(r, { id }) {
      if (!r.ok) {
        const bolinha = bolinhas.get(id);
        bolinha.classList.remove('errou');
        void bolinha.offsetWidth;
        bolinha.classList.add('errou');
        avisar(r.mensagem, 'erro');
        return false;
      }
      passo += 1;
      await aoLimpar(passo, () => bolinhas.get(id).remove());
      if (r.concluido) return true;
      avisar(r.mensagem, 'sucesso');
      return false;
    },

    desmontar() { camada.remove(); },
  };
}
