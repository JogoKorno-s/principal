// VIEW: cenário do Dia 1 (mercado). Só desenha; quem decide o que acontece é controller/dia1.js.

import { el, icones, carregarImagem } from './componentes.js';

export function criarCenaDia1(container) {
  let fundo = null;
  const camadaFundo = el('div');
  const camadaJogo = el('div', { style: { position: 'absolute', inset: '0' } });
  container.append(camadaFundo, camadaJogo);

  return {
    camada: camadaJogo,

    /** Troca o cenário (sem fade; o controlador escurece a tela antes, se quiser). */
    async trocarFundo(src, alt = 'Interior do supermercado') {
      if (fundo?.dataset.src === src) return;
      const img = await carregarImagem(src);
      img.className = 'cenario';
      img.alt = alt;
      img.dataset.src = src;
      camadaFundo.replaceChildren(img);
      fundo = img;
    },

    /** Área da prateleira do meio: o olho aparece ao passar o mouse. Resolve ao clicar. */
    esperarCliqueNaPrateleira(area) {
      return new Promise((resolver) => {
        const olho = el('button', {
          type: 'button',
          class: 'botao-icone botao-olho',
          'aria-label': 'Ver a prateleira de perto',
          title: 'Ver a prateleira de perto',
          html: icones.olho,
        });
        const zona = el('div', {
          class: 'area-prateleira',
          style: { left: `${area.x}px`, top: `${area.y}px`, width: `${area.largura}px`, height: `${area.altura}px` },
        }, olho);
        const abrir = () => { zona.remove(); resolver(); };
        zona.addEventListener('click', abrir);
        camadaJogo.append(zona);
      });
    },
  };
}
