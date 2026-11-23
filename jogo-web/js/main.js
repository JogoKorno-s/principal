// Ponto de partida do jogo: ajusta o palco à janela, carrega o save e abre o menu.

import { GameState } from './model/game-state.js';
import { definirNiveis } from './model/niveis.js';
import { definirProdutos } from './model/produtos.js';
import { definirTextosMercado } from './controller/mercado.js';
import { definirMercado } from './controller/secoes.js';
import { definirClientes } from './model/clientes.js';
import { registrar, ir } from './controller/roteador.js';
import { carregarJSON } from './util/formato.js';
import { criarHUD, aoClicarNoDia } from './view/hud.js';
import { abrirLinhaTempo } from './view/linha-tempo.js';
import { menu } from './view/menu.js';
import { abertura } from './view/abertura.js';
import { fachada } from './view/fachada.js';
import { dia1 } from './controller/dia1.js';
import { dia2 } from './controller/dia2.js';
import { dia3 } from './controller/dia3.js';
import { dia4 } from './controller/dia4.js';
import { definirEntregas } from './controller/entregas.js';
import { definirTelasDeTeste } from './view/testes.js';
import { somDeClique, iniciarAudio } from './view/audio.js';
import { iniciarCelular, tecladoAberto, ehToque } from './view/celular.js';

// O palco tem 1920×1080 e é escalado para caber inteiro na janela.
// Celular em pé: o palco é desenhado girado 90° (classe "girado"), então basta deitar o aparelho,
// mesmo com a rotação automática desligada ou dentro do navegador do WhatsApp/Instagram.
function ajustarPalco() {
  if (tecladoAberto()) return; // no celular, o teclado diminui a janela: o palco fica como estava
  const girado = ehToque && window.innerHeight > window.innerWidth;
  document.documentElement.classList.toggle('girado', girado);
  const largura = girado ? window.innerHeight : window.innerWidth;
  const altura = girado ? window.innerWidth : window.innerHeight;
  const escala = Math.min(largura / 1920, altura / 1080);
  document.documentElement.style.setProperty('--escala', escala);
}
window.addEventListener('resize', ajustarPalco);
window.addEventListener('orientationchange', () => setTimeout(ajustarPalco, 250));
ajustarPalco();
iniciarCelular();
iniciarAudio();

// Som de clique em qualquer botão do jogo (botões desabilitados não disparam o clique).
document.addEventListener('click', (evento) => {
  if (evento.target.closest('button, [role="button"]')) somDeClique();
}, true);

async function iniciar() {
  const [niveis, catalogo, mercado, clientes, entregas] = await Promise.all(
    ['niveis', 'produtos', 'mercado', 'clientes', 'entregas'].map((nome) => carregarJSON(`data/${nome}.json`)));
  definirNiveis(niveis);
  definirProdutos(catalogo);
  definirTextosMercado(catalogo.mercado);
  definirMercado(mercado);
  definirClientes(clientes);
  definirEntregas(entregas);
  GameState.iniciar(niveis.saldoInicialCentavos);

  criarHUD();
  aoClicarNoDia(abrirLinhaTempo);

  registrar('menu', menu);
  registrar('abertura', abertura);
  registrar('fachada', fachada);
  registrar('dia1', dia1);
  registrar('dia2', dia2);
  registrar('dia3', dia3);
  registrar('dia4', dia4);
  definirTelasDeTeste({ dia1, dia2, dia3, dia4 });

  await ir('menu');
}

iniciar().catch((erro) => {
  console.error(erro);
  document.getElementById('tela').textContent =
    'Não foi possível carregar o jogo. Rode com "python -m http.server" dentro de jogo-web/ e abra http://localhost:8000.';
});
