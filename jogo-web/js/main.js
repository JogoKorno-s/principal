// Ponto de partida do jogo: ajusta o palco à janela, carrega o save e abre o menu.

import { GameState } from './model/game-state.js';
import { definirNiveis } from './model/niveis.js';
import { registrar, ir } from './controller/roteador.js';
import { carregarJSON } from './util/formato.js';
import { criarHUD, aoClicarNoDia } from './view/hud.js';
import { abrirLinhaTempo } from './view/linha-tempo.js';
import { menu } from './view/menu.js';
import { abertura } from './view/abertura.js';
import { fachada } from './view/fachada.js';
import { dia1 } from './controller/dia1.js';

// O palco tem 1920×1080 e é escalado para caber inteiro na janela (desktop).
function ajustarPalco() {
  const escala = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  document.documentElement.style.setProperty('--escala', escala);
}
window.addEventListener('resize', ajustarPalco);
ajustarPalco();

async function iniciar() {
  const niveis = await carregarJSON('data/niveis.json');
  definirNiveis(niveis);
  GameState.iniciar(niveis.saldoInicialCentavos);

  criarHUD();
  aoClicarNoDia(abrirLinhaTempo);

  registrar('menu', menu);
  registrar('abertura', abertura);
  registrar('fachada', fachada);
  registrar('dia1', dia1);

  await ir('menu');
}

iniciar().catch((erro) => {
  console.error(erro);
  document.getElementById('tela').textContent =
    'Não foi possível carregar o jogo. Rode com "python -m http.server" dentro de jogo-web/ e abra http://localhost:8000.';
});
