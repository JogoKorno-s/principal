// CONTROLLER: Moto Entrega (Nível 4 em diante).
//
//   pedido chega (balão com "!") → lista de pedidos → notinha do pedido
//   → separar: o jogador anda pelas seções e clica nos produtos expostos (clientes ficam esperando)
//   → velocidade média da moto → motoboy sai (vídeo na 1ª vez) → venda anotada
//
// Os pedidos pendentes ficam no save (dia4.pedidos). Durante o expediente, pedidos novos chegam
// sozinhos de tempos em tempos. O controlador do dia diz quando o balão pode ser aberto.

import { GameState } from '../model/game-state.js';
import { produto, produtosDoNivel } from '../model/produtos.js';
import { nivelAtual } from '../model/niveis.js';
import { gerarPedido } from '../model/entregas.js';
import { avisar } from '../view/componentes.js';
import { reais } from '../util/formato.js';
import { jogar } from './minigame.js';
import { escurecer, clarear } from './roteador.js';
import { configurarMotoEntrega, mostrarIndiceNoHUD } from '../view/hud.js';
import { escolherPedido, mostrarPedido, mostrarIndice } from '../view/entregas.js';
import { notificarReposicao } from '../view/estoque.js';
import { tocarVideo } from '../view/video.js';
import { criarVelocidade } from '../minigames/velocidade.js';
import { comecarSeparacao, terminarSeparacao, separando } from '../model/separacao.js';
import { mostrarFaixaSeparacao, fecharFaixaSeparacao } from '../view/separacao.js';
import { fecharSecao } from './secoes.js';

let textos = null;
let liberado = false;     // o balão só abre nos momentos livres
let andamento = false;    // uma entrega por vez
let relogio = null;       // chegada automática de pedidos
let pararDeOuvir = null;

export function definirEntregas(json) { textos = json; }
export const textosEntregas = () => textos;

const dia4 = () => GameState.get().dia4;
const pendentes = () => dia4().pedidos ?? [];
const sobreposicao = () => document.getElementById('sobreposicao');

/** Mostra o balão do Moto Entrega e o índice de atendimento no topo esquerdo. */
export function ativarMotoEntrega({ indice = false } = {}) {
  const atualizar = () => configurarMotoEntrega({ visivel: true, pendentes: pendentes().length, aoClicar: abrirMotoEntrega });
  atualizar();
  pararDeOuvir?.();
  pararDeOuvir = GameState.ouvir((_, mudanca) => { if (mudanca === 'dia4') atualizar(); });
  if (indice) mostrarIndiceNoHUD(textos.indice, () => mostrarIndice(textos.indice));
}

export function desativarMotoEntrega() {
  fecharFaixaSeparacao();
  pararChegada();
  pararDeOuvir?.();
  pararDeOuvir = null;
  liberado = false;
}

/** true: o jogador pode abrir o balão agora. */
export function liberarMoto(sim) { liberado = sim; }

/** Cria um pedido novo e coloca na lista. opcoes: { preferidos, rota } para o 1º pedido. */
export function novoPedido(opcoes = {}) {
  const estado = GameState.get();
  const numero = dia4().proximoPedido ?? 1;
  const pedido = gerarPedido({
    numero,
    disponiveis: produtosDoNivel(nivelAtual(estado)),
    estoque: estado.estoque,
    precos: estado.precos,
    rotas: textos.rotas,
    itensPorPedido: textos.itensPorPedido,
    expostos: (id) => GameState.exposto(id),
    ...opcoes,
  });
  if (!pedido.itens.length) return null;   // estoque vazio: nenhum pedido
  GameState.atualizarDia4({ pedidos: [...pendentes(), pedido], proximoPedido: numero + 1 });
  return pedido;
}

/** Pedidos chegam sozinhos a cada [min, max] segundos, até `limite` pendentes. */
export function comecarChegada([minimo, maximo], limite = 2) {
  pararChegada();
  const agendar = () => {
    const ms = (minimo + Math.random() * (maximo - minimo)) * 1000;
    relogio = setTimeout(() => {
      if (pendentes().length < limite && novoPedido()) avisar(textos.novoPedido, 'sucesso', 3000);
      agendar();
    }, ms);
  };
  agendar();
}

export function pararChegada() { clearTimeout(relogio); relogio = null; }

/** Resolve quando o total de entregas feitas chegar a `n`. */
export function esperarEntregas(n) {
  return new Promise((pronto) => {
    const conferir = () => {
      if ((dia4().entregasFeitas ?? 0) < n) return false;
      parar();
      pronto();
      return true;
    };
    const parar = GameState.ouvir(conferir);
    conferir();
  });
}

// ----- Balão → lista → entrega -----
async function abrirMotoEntrega() {
  if (andamento) { if (separando()) avisar(textos.separacao.termine, 'erro'); return; }
  if (!liberado) { avisar(textos.bloqueado, 'erro'); return; }
  andamento = true;
  try {
    const pedido = await escolherPedido(pendentes(), textos);
    if (pedido) await fazerEntrega(pedido);
  } finally { andamento = false; }
}

async function fazerEntrega(pedido) {
  // O estoque pode ter acabado depois que o pedido chegou (vendas no caixa)
  const { estoque } = GameState.get();
  const falta = pedido.itens.find((id) => (estoque[id] ?? 0) <= 0);
  if (falta) {
    avisar(textos.faltaEstoque.replace('{nome}', produto(falta).nome.toLowerCase()), 'erro', 4500);
    notificarReposicao([falta]);
    return false;
  }

  const camada = sobreposicao();
  await mostrarPedido(camada, pedido, textos);

  // Separar: a faixa da cestinha fica no topo enquanto o jogador anda pelas seções
  comecarSeparacao(pedido);
  const palco = document.getElementById('palco');
  palco.classList.add('separando');
  palco.style.setProperty('--aviso-separacao', JSON.stringify(textos.separacao.bloqueioClientes));
  const escolha = await mostrarFaixaSeparacao(textos.separacao);
  palco.classList.remove('separando');
  terminarSeparacao();
  if (escolha === 'cancelar') return false;   // o que estava na cestinha volta para o estoque

  await escurecer();
  fecharSecao();
  const velocidade = jogar(criarVelocidade({
    numero: pedido.numero, loja: textos.loja, rota: pedido.rota, textos: textos.velocidade, botaoAvancar: textos.botaoAvancar,
  }), camada);
  await clarear();
  await velocidade;

  // O motoboy sai com o pedido (vídeo só na primeira entrega)
  if (!dia4().viuVideoMoto) {
    await tocarVideo(camada, textos.video.base, { legenda: textos.video.legenda });
    GameState.atualizarDia4({ viuVideoMoto: true });
  }

  GameState.vender(pedido.itens, pedido.totalCentavos, pedido.valores);
  GameState.atualizarDia4({
    pedidos: pendentes().filter((p) => p.numero !== pedido.numero),
    entregasFeitas: (dia4().entregasFeitas ?? 0) + 1,
  });
  avisar(textos.concluida.replace('{valor}', reais(pedido.totalCentavos)), 'sucesso', 3500);
  return true;
}
