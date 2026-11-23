// VIEW: áudio do jogo — música de fundo e sons curtos (clique e bip).
// A música é o arquivo assets/audio/musica.mp3 (se não existir, o jogo segue sem música).
// Os dois podem ser desligados em Configurações (engrenagem no menu).

import { Preferencias } from '../model/preferencias.js';

const ARQUIVO_MUSICA = 'assets/audio/musica.mp3';
const VOLUME_MUSICA = 0.35;

// iPhone (iOS 17+): toca mesmo com o celular no modo silencioso
try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch { /* navegador sem audioSession */ }

// ---------- Sons curtos (gerados pelo navegador, sem arquivo) ----------
let contexto = null;

function obterContexto() {
  contexto ??= new (window.AudioContext || window.webkitAudioContext)();
  return contexto;
}

function tocarTom({ frequencia, duracao, volume, forma = 'sine' }) {
  if (!Preferencias.get().sons) return;
  try {
    const ctx = obterContexto();
    const tocar = () => {
      const agora = ctx.currentTime;
      const osc = ctx.createOscillator();
      const ganho = ctx.createGain();
      osc.type = forma;
      osc.frequency.value = frequencia;
      ganho.gain.setValueAtTime(volume, agora);
      ganho.gain.exponentialRampToValueAtTime(0.0001, agora + duracao); // some suave, sem estalo
      osc.connect(ganho).connect(ctx.destination);
      osc.start(agora);
      osc.stop(agora + duracao);
    };
    // No celular o áudio começa "suspenso": espera liberar antes de tocar
    if (ctx.state === 'running') tocar(); else ctx.resume().then(tocar).catch(() => {});
  } catch { /* navegador sem áudio: segue sem som */ }
}

/** Bip curto do leitor de código de barras. */
export function bip() { tocarTom({ frequencia: 1760, duracao: 0.12, volume: 0.06, forma: 'square' }); }

/** "Tic" suave ao clicar em um botão. */
export function somDeClique() { tocarTom({ frequencia: 880, duracao: 0.06, volume: 0.09 }); }

// ---------- Música de fundo ----------
let musica = null;

function criarMusica() {
  musica = new Audio(ARQUIVO_MUSICA);
  musica.loop = true;
  musica.volume = VOLUME_MUSICA;
  musica.preload = 'auto';
  musica.addEventListener('error', () => { musica = null; }, { once: true }); // arquivo ainda não existe
}

function atualizarMusica() {
  if (!musica) return;
  if (Preferencias.get().musica && document.visibilityState === 'visible') musica.play().catch(() => {});
  else musica.pause();
}

/**
 * Liga o áudio no primeiro toque ou clique do jogador
 * (celulares e navegadores só deixam tocar som depois de uma interação).
 */
export function iniciarAudio() {
  criarMusica();
  const liberar = () => {
    try { const ctx = obterContexto(); if (ctx.state !== 'running') ctx.resume(); } catch { /* sem áudio */ }
    atualizarMusica();
  };
  // pointerdown chega antes do clique; no iPhone, touchend é o que libera o áudio
  ['pointerdown', 'touchend', 'keydown'].forEach((tipo) => window.addEventListener(tipo, liberar, { capture: true, passive: true }));
  document.addEventListener('visibilitychange', atualizarMusica); // pausa ao sair da aba ou bloquear a tela
  Preferencias.ouvir(atualizarMusica);
}
