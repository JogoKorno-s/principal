// MODEL: pedidos do Moto Entrega (Nível 4 em diante).
// Cada pedido tem um número, 2 ou 3 produtos que estão no estoque, o total pelo preço de venda
// e uma rota (bairro, distância e tempo máximo) para a pergunta de velocidade média.

import { precoAtual } from './produtos.js';

const sortear = (lista, aleatorio) => lista[Math.floor(aleatorio() * lista.length)];
function embaralhar(lista, aleatorio) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/**
 * Sorteia um pedido.
 *   disponiveis: produtos liberados [{ id }]
 *   estoque, precos: do GameState
 *   preferidos: ids que entram primeiro, se tiver no estoque (ex.: arroz e leite no 1º pedido)
 *   rota: rota fixa (1º pedido); senão sorteia de `rotas`
 */
export function gerarPedido({ numero, disponiveis, estoque, precos, rotas, rota = null, itensPorPedido, preferidos = [], aleatorio = Math.random }) {
  const temNoEstoque = (id) => (estoque[id] ?? 0) > 0;
  const quantos = itensPorPedido.minimo + Math.floor(aleatorio() * (itensPorPedido.maximo - itensPorPedido.minimo + 1));
  const primeiro = preferidos.filter(temNoEstoque);
  const outros = embaralhar(disponiveis.map((p) => p.id).filter((id) => temNoEstoque(id) && !primeiro.includes(id)), aleatorio);
  const itens = primeiro.length >= 2 ? primeiro : [...primeiro, ...outros].slice(0, quantos);
  const valores = itens.map((id) => precoAtual(id, precos));
  return {
    numero,
    itens,
    valores,
    totalCentavos: valores.reduce((a, b) => a + b, 0),
    rota: rota ?? sortear(rotas, aleatorio),
  };
}

/** Velocidade média mínima em km/h (distância ÷ tempo em horas). */
export const velocidadeMinima = ({ km, minutos }) => (km * 60) / minutos;

/** "36", "36 km/h", "36,0" → 36. Devolve null se não tiver número. */
export function lerNumero(texto) {
  const achado = String(texto ?? '').replace(',', '.').match(/-?\d+(\.\d+)?/);
  return achado ? Number(achado[0]) : null;
}

/** Número do pedido com 3 dígitos: 1 → "#001". */
export const numeroDoPedido = (n) => `#${String(n).padStart(3, '0')}`;
