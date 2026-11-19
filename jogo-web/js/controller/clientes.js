// CONTROLLER: atendimento no caixa (usado pelo Dia 2 e pelos dias seguintes).
//
//   espera alguns segundos → cliente chega e pede → (falta algo? o jogador avisa)
//   → passa os produtos no leitor → calcula o troco → venda anotada no estoque e nas vendas do dia
//
// Entre um cliente e outro o jogador fica livre: olhos nas prateleiras e no computador,
// casinha liberada e o botão "Atender próximo cliente".

import { GameState } from '../model/game-state.js';
import { produto, produtosDoNivel, precoAtual, totalDaVenda, limiteEstoqueBaixo } from '../model/produtos.js';
import { nivelAtual } from '../model/niveis.js';
import { notaDoAtendimento } from '../model/atendimento.js';
import { gerarCliente, textosClientes, listaDeProdutos, nomeNaFala } from '../model/clientes.js';
import { el, botao, avisar } from '../view/componentes.js';
import { esperar } from '../util/formato.js';
import { falar } from './dialogo.js';
import { jogar } from './minigame.js';
import { escurecer, clarear } from './roteador.js';
import { mostrarHUD } from '../view/hud.js';
import { notificarReposicao } from '../view/estoque.js';
import { criarCaixa } from '../minigames/caixa.js';
import { liberarSecoes, travarSecoes, fecharSecao, mostrarOlhosDaPrincipal } from './secoes.js';

const sortear = (lista) => lista[Math.floor(Math.random() * lista.length)];
let vistosHoje = [];

/**
 * Cliente do roteiro (falas e produtos fixos), como o senhor do arroz.
 * cliente: { nome, pasta, falas, produtos, recebidoCentavos?, totalCentavos? }
 */
export async function atenderRoteiro(cena, cliente) {
  const t = textosClientes();
  await esperar(t.esperaClienteMs);
  await falar(cena.camada, cliente.falas, { nome: cliente.nome, pasta: cliente.pasta, chegada: true });
  await passarNoCaixa(cena, cliente.produtos, { total: cliente.totalCentavos, recebido: cliente.recebidoCentavos });
}

/**
 * Cliente sorteado: personagem e pedido aleatórios, só com produtos já liberados.
 * cronometro: true a partir do Nível 4 (bolinha de paciência e índice de atendimento).
 */
export async function atenderSorteado(cena, { chanceFalta = 0, cronometro = false } = {}) {
  const t = textosClientes();
  const estado = GameState.get();
  const c = gerarCliente({
    disponiveis: produtosDoNivel(nivelAtual(estado)),
    estoque: estado.estoque,
    chanceFalta,
    evitar: vistosHoje,
  });
  vistosHoje = [...vistosHoje.slice(-6), c.personagem];

  await esperar(t.esperaClienteMs);
  const temFalta = c.falta.length > 0;
  await falar(cena.camada, [{ pose: c.personagem, texto: c.texto, respostas: [t.respostas.temos, t.respostas.falta] }], {
    nome: t.nome, pasta: t.pasta, chegada: true,
    // O jogador precisa conferir o estoque: dizer "Claro!" só se tiver tudo
    validar: (_, resposta) => {
      if ((resposta === 1) === temFalta) return true;
      avisar(temFalta ? t.erroFalta : t.erroTemTudo, 'erro', 4500);
      return false;
    },
  });

  if (temFalta) {
    const falta = listaDeProdutos(c.falta.map((id) => nomeNaFala(produto(id))));
    const resto = listaDeProdutos(c.pedidos.map((id) => nomeNaFala(produto(id))));
    const texto = sortear(c.pedidos.length ? t.faltaParcial : t.faltaTotal)
      .replace('{falta}', falta).replace('{lista}', resto);
    notificarReposicao(c.falta);
    await falar(cena.camada, [{ pose: c.personagem, texto }], { nome: t.nome, pasta: t.pasta });
  }
  if (c.pedidos.length) await passarNoCaixa(cena, c.pedidos, { cronometro });
}

/** Minigame do caixa e a venda. total/recebido fixos só no cliente do roteiro. */
async function passarNoCaixa(cena, ids, { total: totalFixo, recebido: recebidoFixo, cronometro = false }) {
  const t = textosClientes();
  const { precos } = GameState.get();
  const total = totalFixo ?? totalDaVenda(ids, precos);
  // O cliente paga com a menor nota que cobre o total
  const recebido = recebidoFixo ?? t.notasDinheiro.find((n) => n >= total) ?? total;
  const config = {
    ...t.caixa,
    produtos: ids.map((id) => { const p = produto(id); return { id, nome: p.nome, imagem: p.imagem }; }),
    recebidoCentavos: recebido,
    totalCentavos: total,
  };
  let medido = null;
  if (cronometro) {
    config.cronometro = t.cronometro;
    config.aoTerminar = (info) => { medido = info; };
  }

  await escurecer();
  mostrarHUD(false);
  const fim = jogar(criarCaixa(config), cena.camada);
  await clarear();
  await fim;

  // Valor de cada item para as vendas do dia (proporcional, se o total foi fixo)
  const unitarios = ids.map((id) => precoAtual(id, precos));
  const soma = unitarios.reduce((a, b) => a + b, 0) || 1;
  const receitas = unitarios.map((v) => Math.round((v * total) / soma));
  GameState.vender(ids, total, receitas);

  await escurecer();
  mostrarHUD(true);
  await clarear();

  if (medido) {
    const { nota, faixa } = notaDoAtendimento(medido.segundos, medido.erros, t.cronometro.limiteSegundos);
    GameState.registrarAtendimento({ nota, segundos: medido.segundos, erros: medido.erros });
    avisar(`${t.cronometro.notas[faixa]} (${medido.segundos} s)`, faixa === 'atrasado' ? 'erro' : 'sucesso', 3500);
  }

  const { estoque } = GameState.get();
  const acabando = [...new Set(ids)].filter((id) => (estoque[id] ?? 0) <= limiteEstoqueBaixo());
  if (acabando.length) notificarReposicao(acabando);
}

/**
 * Momento livre entre clientes. Resolve quando o jogador chama o próximo.
 * textos: { proximo, dica, aviso? } — sem "proximo", mostra só o aviso e espera `fim`.
 * fim: Promise opcional que também encerra o momento livre (ex.: entregas feitas).
 */
export function entreClientes(cena, textos, { mostrarDica = false, fim = null } = {}) {
  liberarSecoes(['principal', 'prateleiras', 'congelados'], { alerta: 'principal' });
  const tirarOlhos = mostrarOlhosDaPrincipal(cena.camada);
  if (mostrarDica) avisar(textos.dica, '', 6000);
  return new Promise((seguir) => {
    let saiu = false;
    const sair = () => {
      if (saiu) return;
      saiu = true;
      fecharSecao();
      tirarOlhos();
      barra.remove();
      travarSecoes();
      seguir();
    };
    const barra = el('div', { class: 'entre-clientes' },
      textos.proximo ? botao(textos.proximo, sair, 'grande') : el('p', { class: 'entre-clientes__aviso' }, textos.aviso));
    cena.camada.append(barra);
    fim?.then(sair);
  });
}
