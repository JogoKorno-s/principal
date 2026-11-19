// VIEW: menu principal com o vídeo da fachada ao fundo.
// Botões: Jogar (continua de onde parou), Reiniciar, configurações (⚙) e informações (i).

import { GameState } from '../model/game-state.js';
import { el, botao, botaoIcone, icones, modal, criarVideo } from './componentes.js';
import { ir } from '../controller/roteador.js';
import { mostrarHUD } from './hud.js';
import { testesAtivos, abrirPainelTestes } from './testes.js';

export const menu = {
  montar(container) {
    mostrarHUD(false);
    const video = criarVideo('assets/videos/menu', { mudo: true, classe: 'menu__video' });
    video.setAttribute('aria-hidden', 'true');

    const temSave = GameState.temProgresso();

    const jogar = botao(temSave ? 'Continuar' : 'Jogar', () => {
      const { tela } = GameState.get();
      ir(temSave ? tela : 'abertura');
    }, 'grande');

    const reiniciar = botao('Reiniciar', confirmarReinicio, 'grande secundario');
    reiniciar.hidden = !temSave;

    container.append(
      video,
      el('div', { class: 'menu__veu' }),
      el('h1', { class: 'visualmente-oculto' }, "Korno's Supermercado"),
      el('div', { class: 'menu__icones' },
        botaoIcone(icones.engrenagem, 'Configurações', abrirConfiguracoes),
        botaoIcone(icones.info, 'Informações', abrirInformacoes)),
      el('nav', { class: 'menu__botoes', 'aria-label': 'Menu principal' }, jogar, reiniciar,
        testesAtivos() ? botao('Testes', abrirPainelTestes, 'grande secundario') : null),
    );
    video.play().catch(() => {});
    jogar.focus({ preventScroll: true });
  },
};

function confirmarReinicio() {
  const fechar = modal({
    titulo: 'Reiniciar o jogo?',
    conteudo: el('p', { class: 'modal__texto' }, 'Todo o progresso salvo neste navegador será apagado e o jogo começa do zero.'),
    acoes: [
      botao('Cancelar', () => fechar(), 'secundario'),
      botao('Sim, reiniciar', () => { fechar(); GameState.reiniciar(); ir('abertura'); }),
    ],
  });
}

function abrirConfiguracoes() {
  const fechar = modal({
    titulo: 'Configurações',
    conteudo: el('label', { class: 'campo' }, 'Idioma',
      el('select', { name: 'idioma' }, el('option', { value: 'pt-BR', selected: true }, 'Português (PT-BR)'))),
    acoes: [botao('Pronto', () => fechar())],
  });
}

function abrirInformacoes() {
  const fechar = modal({
    titulo: "Korno's",
    conteudo: [
      el('p', { class: 'modal__texto' }, 'Jogo educativo de matemática ambientado num supermercado.'),
      el('p', { class: 'modal__texto' }, 'TCC do Grupo 07 · Desenvolvimento de Sistemas · IFSP câmpus São Paulo.'),
    ],
    acoes: [botao('Fechar', () => fechar(), 'secundario')],
  });
}
