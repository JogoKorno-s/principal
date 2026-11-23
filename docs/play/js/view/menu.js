// VIEW: menu principal com o vídeo da fachada ao fundo.
// Botões: Jogar (continua de onde parou), Reiniciar, configurações (⚙) e informações (i).

import { GameState } from '../model/game-state.js';
import { el, botao, botaoIcone, icones, modal, criarVideo } from './componentes.js';
import { ir } from '../controller/roteador.js';
import { mostrarHUD } from './hud.js';
import { Preferencias } from '../model/preferencias.js';
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
    conteudo: [
      chave('musica', 'Música de fundo'),
      chave('sons', 'Sons dos botões'),
      el('label', { class: 'campo' }, 'Idioma',
        el('select', { name: 'idioma' }, el('option', { value: 'pt-BR', selected: true }, 'Português (PT-BR)'))),
    ],
    acoes: [botao('Pronto', () => fechar())],
  });
}

/** Chave liga/desliga de uma preferência (música ou sons). */
function chave(id, rotulo) {
  const ligado = () => Preferencias.get()[id];
  const estado = el('span', { class: 'chave__estado' });
  const botaoChave = el('button', {
    type: 'button', class: 'chave', role: 'switch',
    onclick: () => { Preferencias.definir(id, !ligado()); atualizar(); },
  }, el('span', { class: 'chave__rotulo' }, rotulo), el('span', { class: 'chave__trilho', 'aria-hidden': 'true' }, el('span', { class: 'chave__bolinha' })), estado);
  function atualizar() {
    botaoChave.setAttribute('aria-checked', String(ligado()));
    estado.textContent = ligado() ? 'Ligado' : 'Desligado';
  }
  atualizar();
  return botaoChave;
}

function abrirInformacoes() {
  const fechar = modal({
    titulo: "Korno's",
    conteudo: [
      el('p', { class: 'modal__texto' }, 'Jogo educativo de matemática ambientado num supermercado.'),
      el('p', { class: 'modal__texto' }, 'TCC do Grupo 07 · Desenvolvimento de Sistemas · IFSP câmpus São Paulo.'),
      el('p', { class: 'modal__texto modal__texto--credito' }, 'Música: “boba date”, de stream cafe.'),
    ],
    acoes: [botao('Fechar', () => fechar(), 'secundario')],
  });
}
