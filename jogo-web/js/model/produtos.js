// MODEL: catálogo de produtos (custo, imagem) e regra do preço de venda.

let dados = null;

export function definirProdutos(json) { dados = json; }

export const produtos = () => dados.produtos;
export const produto = (id) => dados.produtos.find((p) => p.id === id);
export const atacadistas = () => dados.atacadistas;
export const lucroPercentual = () => dados.lucroPercentual;
export const precoMaximoPercentual = () => dados.precoMaximoPercentual;
export const limiteEstoqueBaixo = () => dados.estoqueBaixo;

/** Preço de venda = custo + lucro (25%), arredondado para centavos. 394 -> 493 */
export function precoDeVenda(custoCentavos) {
  return Math.round(custoCentavos * (1 + dados.lucroPercentual / 100));
}

/** Soma do preço de venda de uma lista de ids. */
export function totalDaVenda(ids, precos) {
  return ids.reduce((soma, id) => soma + (precos[id] ?? precoDeVenda(produto(id).custoCentavos)), 0);
}
