// VIEW: peças de interface reutilizadas por todas as telas.

/** Cria um elemento: el('button', { class: 'botao', onclick }, 'Jogar') */
export function el(tag, atributos = {}, ...filhos) {
  const elemento = document.createElement(tag);
  for (const [chave, valor] of Object.entries(atributos)) {
    if (valor === false || valor == null) continue;
    if (chave.startsWith('on') && typeof valor === 'function') {
      elemento.addEventListener(chave.slice(2), valor);
    } else if (chave === 'html') {
      elemento.innerHTML = valor;
    } else if (chave === 'style' && typeof valor === 'object') {
      for (const [prop, v] of Object.entries(valor)) {
        if (prop.startsWith('--')) elemento.style.setProperty(prop, v); // variável CSS
        else elemento.style[prop] = v;
      }
    } else {
      elemento.setAttribute(chave, valor === true ? '' : valor);
    }
  }
  for (const filho of filhos.flat()) {
    if (filho == null || filho === false) continue;
    elemento.append(filho instanceof Node ? filho : document.createTextNode(String(filho)));
  }
  return elemento;
}

/** Botão de texto no estilo do jogo */
export function botao(texto, aoClicar, variante = '') {
  const classes = ['botao', ...variante.split(' ').filter(Boolean).map((v) => `botao--${v}`)];
  return el('button', { type: 'button', class: classes.join(' '), onclick: aoClicar }, texto);
}

/** Botão redondo com ícone SVG ou símbolo */
export function botaoIcone(conteudo, rotulo, aoClicar, extra = '') {
  return el('button', {
    type: 'button',
    class: `botao-icone ${extra}`.trim(),
    'aria-label': rotulo,
    title: rotulo,
    onclick: aoClicar,
    html: conteudo,
  });
}

// Ícones desenhados em SVG (traço marrom, nítidos em qualquer tamanho)
const svg = (corpo) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${corpo}</svg>`;

export const icones = {
  engrenagem: svg('<circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>'),
  info: svg('<circle cx="12" cy="12" r="9.5"/><path d="M12 11v6"/><circle cx="12" cy="7.3" r=".6" fill="currentColor"/>'),
  fechar: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  voltar: svg('<path d="M15 5l-7 7 7 7"/>'),
  carrinho: svg('<path d="M2.5 3.5h2.6l2.4 11.2a1.6 1.6 0 0 0 1.6 1.3h8.3a1.6 1.6 0 0 0 1.6-1.2l1.6-6.8H6.2"/><circle cx="9.5" cy="20" r="1.4"/><circle cx="17.5" cy="20" r="1.4"/>'),
  casa: svg('<path d="M3.5 11 12 3.5l8.5 7.5"/><path d="M5.5 9.5V20h5v-5.5h3V20h5V9.5"/>'),
  caixa: svg('<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5Z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/>'),
  olho: svg('<path d="M1.5 12S5.5 4.5 12 4.5 22.5 12 22.5 12 18.5 19.5 12 19.5 1.5 12 1.5 12Z"/><circle cx="12" cy="12" r="3.2"/>'),
  cadeado: svg('<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>'),
  certo: svg('<path d="M4.5 12.5l5 5 10-11"/>'),
  estrela: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="#5B1F00" stroke-width="1.2" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.2l2.9 6.2 6.8.8-5 4.6 1.3 6.7L12 17.2l-6 3.3 1.3-6.7-5-4.6 6.8-.8Z"/></svg>',
};

/** Aviso temporário no topo da tela. tipo: '' | 'erro' | 'sucesso' */
export function avisar(texto, tipo = '', duracaoMs = 2600) {
  const area = document.getElementById('avisos');
  area.replaceChildren();
  const aviso = el('div', { class: `aviso ${tipo ? `aviso--${tipo}` : ''}`.trim() }, texto);
  area.append(aviso);
  setTimeout(() => {
    aviso.classList.add('saindo');
    aviso.addEventListener('animationend', () => aviso.remove(), { once: true });
  }, duracaoMs);
  return aviso;
}

export function limparAvisos() {
  document.getElementById('avisos').replaceChildren();
}

/** Selo "TENTE NOVAMENTE" (vermelho) ou ✓ (verde) */
export function selo(certo, texto) {
  return el('span', { class: `selo selo--${certo ? 'certo' : 'erro'}` },
    certo ? el('span', { html: icones.certo, style: { width: '1em', display: 'inline-block' } }) : null,
    texto ?? (certo ? 'CERTO!' : 'TENTE NOVAMENTE'));
}

/** Janela modal sobre o jogo. Retorna uma função para fechar. */
export function modal({ titulo, conteudo = [], acoes = [], aoFechar }) {
  const camada = document.getElementById('sobreposicao');
  const fechar = () => { fundo.remove(); aoFechar?.(); };
  const painel = el('div', { class: 'painel modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': titulo },
    el('h2', { class: 'painel__titulo' }, titulo),
    conteudo,
    acoes.length ? el('div', { class: 'modal__acoes' }, acoes) : null,
    botaoIcone(icones.fechar, 'Fechar', fechar, 'painel__fechar botao-icone--pequeno'));
  const fundo = el('div', { class: 'fundo-escuro' }, painel);
  fundo.addEventListener('keydown', (e) => { if (e.key === 'Escape') fechar(); });
  camada.append(fundo);
  (painel.querySelector('.modal__acoes button') ?? painel.querySelector('button'))?.focus({ preventScroll: true });
  return fechar;
}

/** Converte a posição do mouse para coordenadas do palco (1920×1080). */
export function pontoNoPalco(evento) {
  const r = document.getElementById('palco').getBoundingClientRect();
  const escala = r.width / 1920;
  return { x: (evento.clientX - r.left) / escala, y: (evento.clientY - r.top) / escala };
}

// ---------- Sons ----------
// Por enquanto o jogo só tem sons curtos gerados pelo navegador (sem arquivos de áudio):
// um clique nos botões e o bip do leitor de código de barras. Os vídeos ficam sem som.
let contextoDeAudio = null;
function tocarTom({ frequencia, duracao, volume, forma = 'sine' }) {
  try {
    contextoDeAudio ??= new (window.AudioContext || window.webkitAudioContext)();
    if (contextoDeAudio.state === 'suspended') contextoDeAudio.resume();
    const agora = contextoDeAudio.currentTime;
    const osc = contextoDeAudio.createOscillator();
    const ganho = contextoDeAudio.createGain();
    osc.type = forma;
    osc.frequency.value = frequencia;
    ganho.gain.setValueAtTime(volume, agora);
    ganho.gain.exponentialRampToValueAtTime(0.0001, agora + duracao); // some suave, sem estalo
    osc.connect(ganho).connect(contextoDeAudio.destination);
    osc.start(agora);
    osc.stop(agora + duracao);
  } catch { /* navegador sem áudio: segue sem som */ }
}

/** Bip curto do leitor de código de barras. */
export function bip() { tocarTom({ frequencia: 1760, duracao: 0.12, volume: 0.06, forma: 'square' }); }

/** "Tic" suave ao clicar em um botão. */
export function somDeClique() { tocarTom({ frequencia: 880, duracao: 0.06, volume: 0.08 }); }

/** Espera uma imagem carregar (evita cenário piscando na troca de tela). */
export function carregarImagem(src) {
  const img = new Image();
  img.src = src;
  // Limite de 3 s: em aba em segundo plano o decode() pode demorar, e o jogo não deve travar
  const limite = new Promise((r) => setTimeout(r, 3000));
  return Promise.race([img.decode().catch(() => {}), limite]).then(() => img);
}

// Por enquanto todos os vídeos tocam sem som. Para voltar o som, troque para true.
const SOM_NOS_VIDEOS = false;

/** <video> com .webm e .mp4. base = caminho sem extensão */
export function criarVideo(base, { mudo = false, repetir = true, classe = '' } = {}) {
  const video = el('video', { class: classe, playsinline: true, preload: 'auto' },
    el('source', { src: `${base}.webm`, type: 'video/webm' }),
    el('source', { src: `${base}.mp4`, type: 'video/mp4' }));
  video.muted = mudo || !SOM_NOS_VIDEOS;
  video.defaultMuted = video.muted;
  video.loop = repetir;
  video.autoplay = true;
  return video;
}
