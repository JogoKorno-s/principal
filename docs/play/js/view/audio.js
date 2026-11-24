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

// ---------- Murmúrio dos clientes ----------
/**
 * "Blá-blá-blá" curtinho quando um cliente fala: sílabas sintetizadas com a altura da voz
 * (grave ou aguda), sem dizer palavras. Dura no máximo alguns segundos e para sozinho.
 * Devolve uma função que para o murmúrio antes da hora.
 */
export function murmurar(voz = 'aguda', texto = '') {
  if (!Preferencias.get().sons) return () => {};
  let ctx;
  try { ctx = obterContexto(); } catch { return () => {}; }
  const base = voz === 'grave' ? 115 : 230;              // Hz: voz masculina × feminina
  const duracao = Math.min(4.5, Math.max(1.5, texto.length * 0.045));
  const saida = ctx.createGain();
  saida.gain.value = 0.11;
  saida.connect(ctx.destination);
  const fontes = [];
  const comecar = () => {
    let t = ctx.currentTime + 0.05;
    const fim = t + duracao;
    while (t < fim) {
      const silaba = 0.07 + Math.random() * 0.09;
      const osc = ctx.createOscillator();
      const filtro = ctx.createBiquadFilter();
      const env = ctx.createGain();
      osc.type = 'sawtooth';
      const f0 = base * (0.85 + Math.random() * 0.35);
      osc.frequency.setValueAtTime(f0, t);
      osc.frequency.linearRampToValueAtTime(f0 * (0.9 + Math.random() * 0.2), t + silaba);
      filtro.type = 'bandpass';
      filtro.frequency.value = (voz === 'grave' ? 500 : 800) + Math.random() * 700;   // "vogal" diferente a cada sílaba
      filtro.Q.value = 4;
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(1, t + 0.02);
      env.gain.exponentialRampToValueAtTime(0.0001, t + silaba);
      osc.connect(filtro).connect(env).connect(saida);
      osc.start(t);
      osc.stop(t + silaba + 0.02);
      fontes.push(osc);
      t += silaba + (Math.random() < 0.2 ? 0.18 : 0.03);   // às vezes uma pausa, como entre palavras
    }
  };
  if (ctx.state === 'running') comecar(); else ctx.resume().then(comecar).catch(() => {});
  return () => {
    const agora = ctx.currentTime;
    saida.gain.setTargetAtTime(0.0001, agora, 0.03);
    fontes.forEach((o) => { try { o.stop(agora + 0.1); } catch { /* já parou */ } });
  };
}

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
