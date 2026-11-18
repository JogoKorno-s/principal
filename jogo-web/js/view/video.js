// VIEW: vídeo em tela cheia (cenas da história). Resolve quando o vídeo termina ou o jogador pula.

import { el, botao, criarVideo } from './componentes.js';

export function tocarVideo(container, base, { legenda = '', textoPular = 'Pular vídeo' } = {}) {
  return new Promise((terminar) => {
    const video = criarVideo(base, { repetir: false, classe: 'abertura__midia' });
    const fim = () => { camada.remove(); terminar(); };
    const pular = botao(textoPular, fim, 'pequeno claro');
    pular.classList.add('abertura__pular');
    const camada = el('div', { class: 'video-cena' },
      video,
      legenda ? el('p', { class: 'video-cena__legenda' }, legenda) : null,
      pular);
    video.addEventListener('ended', fim, { once: true });
    video.addEventListener('error', fim, { once: true });
    container.append(camada);
    // Sem um clique antes, o navegador pode bloquear o som: tenta mudo
    video.play().catch(() => { video.muted = true; video.play().catch(fim); });
    pular.focus({ preventScroll: true });
  });
}
