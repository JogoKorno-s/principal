// CELULAR E TABLET: textos com "toque", botão de tela cheia e teclado.
// Com o celular em pé, o palco é desenhado girado (ver ajustarPalco em main.js e css/celular.css).
// Só age em telas de toque; no computador não muda nada.

export const ehToque = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

/** No celular não existe mouse: troca "clique" por "toque" e "passe o mouse" por "toque" nos textos. */
export function textoParaToque(texto) {
  if (!ehToque || typeof texto !== 'string') return texto;
  return texto
    .replace(/Passe o mouse no freezer, na geladeira e no açougue e clique no olho/g, 'Toque no olho do freezer, da geladeira e do açougue')
    .replace(/Passe o mouse sobre a /g, 'Toque na ')
    .replace(/passe o mouse sobre a /g, 'toque na ')
    .replace(/Passe o mouse/g, 'Toque').replace(/passe o mouse/g, 'toque')
    .replace(/CLIQUE/g, 'TOQUE').replace(/Clique/g, 'Toque').replace(/clique/g, 'toque');
}

const iconeTelaCheia = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';

export function iniciarCelular() {
  if (!ehToque) return;
  document.documentElement.classList.add('toque');

  // Tela cheia (Android e tablets). No iPhone o Safari não permite: lá, "Adicionar à Tela de Início" abre o jogo sem barras.
  const raiz = document.documentElement;
  const pedir = raiz.requestFullscreen || raiz.webkitRequestFullscreen;
  const emTelaCheia = () => document.fullscreenElement || document.webkitFullscreenElement;
  if (!pedir) return;

  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'botao-tela-cheia';
  botao.innerHTML = `${iconeTelaCheia}<span>Tela cheia</span>`;
  botao.addEventListener('click', async () => {
    try {
      await pedir.call(raiz);
      await screen.orientation?.lock?.('landscape');
    } catch { /* o navegador recusou: o jogo segue normal */ }
  });
  const atualizar = () => { botao.hidden = Boolean(emTelaCheia()); };
  document.addEventListener('fullscreenchange', atualizar);
  document.addEventListener('webkitfullscreenchange', atualizar);
  atualizar();
  document.body.append(botao);
}

/** Enquanto o teclado do celular está aberto, o palco não deve encolher. */
export function tecladoAberto() {
  const ativo = document.activeElement;
  return ehToque && ativo && (ativo.tagName === 'INPUT' || ativo.tagName === 'TEXTAREA');
}
