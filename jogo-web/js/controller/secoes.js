// CONTROLLER: seções do mercado e a casinha de navegação.
//
//   Casinha → painel com Tela inicial, Visão principal, Congelados, Quitanda...
//   (as prateleiras não são uma seção: abrem pelos olhos da visão principal)
//   Cada seção tem um nível para ser liberada. Durante falas, vídeos e minigames as seções
//   ficam travadas ("Termine a missão atual"); o controlador do dia libera nos momentos livres.
//
// As seções abrem numa camada acima do cenário (abaixo do HUD), dentro de #tela.

import { GameState } from '../model/game-state.js';
import { nivelAtual } from '../model/niveis.js';
import { el, botao, icones } from '../view/componentes.js';
import { montarExpositor } from '../view/expositor.js';
import { mostrarNavegacao, mostrarVendas } from '../view/navegacao.js';
import { ir } from './roteador.js';

let dados = null;
let livres = new Set(['fachada']);
let alerta = null;
let fundoPrincipal = null;
let aberta = null;          // { id, camada, desmontar }
const esperas = new Map();  // seção → resolver (o controlador espera o jogador chegar lá)
let navegando = false;

export function definirMercado(json) { dados = json; }
export const textosMercado = () => dados;

/** Libera as seções (além da Tela inicial). alerta: seção que ganha o "!". */
export function liberarSecoes(ids = [], opcoes = {}) {
  livres = new Set(['fachada', ...ids]);
  alerta = opcoes.alerta ?? null;
}
export function travarSecoes() { liberarSecoes([]); }

/** Imagem da "Visão principal" no painel (o cenário do dia). */
export function definirFundoPrincipal(src) { fundoPrincipal = src; }

/** Resolve quando o jogador abrir a seção pela casinha. */
export function esperarSecao(id) { return new Promise((r) => esperas.set(id, r)); }

export function secaoAberta() {
  // A troca de tela (roteador) apaga a camada: esquece a seção antiga
  if (aberta && !aberta.camada.isConnected) { aberta.desmontar?.(); aberta = null; }
  return aberta?.id ?? 'principal';
}

// ----- Painel da casinha -----
export async function abrirNavegacao() {
  if (navegando || !dados) return;
  navegando = true;
  const nivel = nivelAtual(GameState.get());
  const t = dados.navegacao;
  const secoes = t.secoes.map((s) => {
    let estado = 'livre';
    let aviso = null;
    if ((s.nivel ?? 1) > nivel) { estado = 'nivel'; aviso = s.imagem ? t.bloqueadoNivel.replace('{n}', s.nivel) : t.bloqueadoSemArte; }
    else if (!livres.has(s.id) && s.id !== secaoAberta()) { estado = 'missao'; aviso = t.bloqueadoMissao; }
    return {
      ...s, estado, aviso,
      imagem: s.id === 'principal' ? (fundoPrincipal ?? s.imagem) : s.imagem,
      alerta: alerta === s.id,
      atual: secaoAberta() === s.id,
    };
  });
  const escolha = await mostrarNavegacao({ titulo: t.titulo, secoes });
  navegando = false;
  if (escolha) irParaSecao(escolha);
}

export function irParaSecao(id) {
  if (id === 'fachada') { fecharSecao(); ir('menu'); return; }
  if (id === 'principal') fecharSecao();
  else if (id === 'congelados') abrirCongelados();
  else if (id === 'quitanda') abrirQuitanda();
  esperas.get(id)?.();
  esperas.delete(id);
}

// ----- Camada da seção -----
function novaCamada(id) {
  secaoAberta();
  fecharSecao();
  const camada = el('div', { class: 'secao', 'data-secao': id });
  document.getElementById('tela').append(camada);
  aberta = { id, camada, desmontar: null };
  return camada;
}

export function fecharSecao() {
  aberta?.desmontar?.();
  aberta?.camada.remove();
  aberta = null;
}

/** Camada da seção aberta (para o Luís falar dentro dela). */
export function camadaDaSecao() { return aberta?.camada ?? null; }

/**
 * Configuração do expositor. Depois de comprar a geladeira de bebidas, a parede esquerda
 * usa a imagem com a geladeira (mesmo id no save, para não perder o que já está exposto).
 */
export function configDoExpositor(idExpositor) {
  const comGeladeira = GameState.get().melhorias?.geladeiraBebidas;
  return (comGeladeira && dados.expositores[`${idExpositor}-geladeira`]) || dados.expositores[idExpositor];
}

function mostrarExpositor(camada, idExpositor, barra) {
  aberta.desmontar?.();
  camada.replaceChildren();
  aberta.desmontar = montarExpositor(camada, {
    id: idExpositor, config: configDoExpositor(idExpositor), textos: dados.expositor,
  });
  camada.append(barra);
}

// ----- Prateleiras: 4 vistas (gôndola frente e verso, parede esquerda e direita) -----
export function abrirPrateleiras(vista) {
  const camada = secaoAberta() === 'prateleiras' ? aberta.camada : novaCamada('prateleiras');
  const abas = el('div', { class: 'secao__abas', role: 'tablist', 'aria-label': 'Prateleiras' },
    dados.prateleiras.vistas.map((v) => el('button', {
      type: 'button', role: 'tab', class: 'secao__aba', 'aria-selected': String(v === vista),
      onclick: () => abrirPrateleiras(v),
    }, configDoExpositor(v).titulo)));
  const barra = el('div', { class: 'secao__barra' },
    botao('‹ Visão principal', () => irParaSecao('principal'), 'pequeno claro'),
    abas);
  mostrarExpositor(camada, vista, barra);
}

// ----- Quitanda (Nível 5): visão geral com banca de frutas, caixote e estante -----
export function abrirQuitanda() {
  const camada = secaoAberta() === 'quitanda' ? aberta.camada : novaCamada('quitanda');
  aberta.desmontar?.();
  aberta.desmontar = null;
  const q = dados.quitanda;
  camada.replaceChildren(
    el('img', { class: 'cenario', src: q.fundo, alt: 'Quitanda do Bairro e hortifruti' }),
    ...q.hotspots.map((h) => areaComOlho(h, () => abrirDetalheQuitanda(h.alvo))),
    el('div', { class: 'secao__barra' }, botao('‹ Visão principal', () => irParaSecao('principal'), 'pequeno claro')));
}

function abrirDetalheQuitanda(idExpositor) {
  const barra = el('div', { class: 'secao__barra' },
    botao('‹ Voltar para a quitanda', () => abrirQuitanda(), 'pequeno claro'),
    el('span', { class: 'secao__titulo' }, configDoExpositor(idExpositor).titulo));
  mostrarExpositor(aberta.camada, idExpositor, barra);
}

// ----- Congelados: visão da seção com freezer, geladeira e açougue -----
export function abrirCongelados() {
  const camada = secaoAberta() === 'congelados' ? aberta.camada : novaCamada('congelados');
  aberta.desmontar?.();
  aberta.desmontar = null;
  const c = dados.congelados;
  camada.replaceChildren(
    el('img', { class: 'cenario', src: c.fundo, alt: 'Seção de congelados e açougue' }),
    ...c.hotspots.map((h) => areaComOlho(h, () => abrirDetalheCongelados(h.alvo))),
    el('div', { class: 'secao__barra' }, botao('‹ Visão principal', () => irParaSecao('principal'), 'pequeno claro')));
}

function abrirDetalheCongelados(idExpositor) {
  const barra = el('div', { class: 'secao__barra' },
    botao('‹ Voltar para os congelados', () => abrirCongelados(), 'pequeno claro'),
    el('span', { class: 'secao__titulo' }, configDoExpositor(idExpositor).titulo));
  mostrarExpositor(aberta.camada, idExpositor, barra);
}

/** Abre um expositor direto da visão principal (olho na prateleira). */
export function abrirExpositorDaPrincipal(alvo) {
  if (alvo === 'vendas') { mostrarVendas(dados.vendas); return; }
  if (dados.prateleiras.vistas.includes(alvo)) abrirPrateleiras(alvo);
}

// ----- Áreas com olho (aparece ao passar o mouse) -----
export function areaComOlho(area, aoClicar) {
  const olho = el('span', { class: 'botao-icone botao-olho', 'aria-hidden': 'true', html: icones.olho });
  return el('button', {
    type: 'button',
    class: 'area-prateleira area-olho',
    'aria-label': area.rotulo,
    title: area.rotulo,
    style: { left: `${area.x}px`, top: `${area.y}px`, width: `${area.largura}px`, height: `${area.altura}px` },
    onclick: aoClicar,
  }, olho);
}

/** Olhos da visão principal (prateleiras e computador). Devolve uma função que remove. */
export function mostrarOlhosDaPrincipal(camada) {
  // Algumas áreas mudam quando a geladeira de bebidas é comprada (comGeladeira: true/false)
  const comGeladeira = Boolean(GameState.get().melhorias?.geladeiraBebidas);
  const areas = dados.principal.hotspots
    .filter((h) => h.comGeladeira === undefined || h.comGeladeira === comGeladeira)
    .map((h) => areaComOlho(h, () => abrirExpositorDaPrincipal(h.alvo)));
  camada.append(...areas);
  return () => areas.forEach((a) => a.remove());
}

