// MODEL: gerador de clientes. Personagem e produto são separados:
// qualquer personagem do elenco pode pedir qualquer produto já liberado.
// Funções puras: recebem o sorteio (aleatorio) para poderem ser testadas.

let dados = null;
export function definirClientes(json) { dados = json; }
export const textosClientes = () => dados;

/** Nome do produto no meio da frase: marcas mantêm a maiúscula. */
export const nomeNaFala = (p) => (p.marca ? p.nome : p.nome.toLowerCase());

const sortear = (lista, aleatorio) => lista[Math.floor(aleatorio() * lista.length)];

function embaralhar(lista, aleatorio) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** "arroz", "arroz e leite", "arroz, leite e café" */
export function listaDeProdutos(nomes) {
  const itens = nomes;
  if (itens.length <= 1) return itens.join('');
  return `${itens.slice(0, -1).join(', ')} e ${itens.at(-1)}`;
}

/**
 * Sorteia um cliente.
 *   disponiveis: produtos liberados no nível [{ id, nome }]
 *   estoque: { id: quantidade }
 *   chanceFalta: chance (0 a 1) de pedir algo esgotado
 *   evitar: personagens que já apareceram hoje
 * Devolve { personagem, pedidos: [ids], falta: [ids], texto }.
 */
export function gerarCliente({ disponiveis, estoque, chanceFalta = 0, evitar = [], aleatorio = Math.random }) {
  const { elenco, itensPorPedido: { minimo, maximo } } = dados;
  const livres = elenco.filter((p) => !evitar.includes(p));
  const personagem = sortear(livres.length ? livres : elenco, aleatorio);

  const emEstoque = embaralhar(disponiveis.filter((p) => (estoque[p.id] ?? 0) > 0), aleatorio);
  const esgotados = embaralhar(disponiveis.filter((p) => (estoque[p.id] ?? 0) <= 0), aleatorio);
  const quantos = minimo + Math.floor(aleatorio() * (maximo - minimo + 1));

  let pedidos = emEstoque.slice(0, quantos);
  let falta = [];
  // Às vezes o cliente pede algo que acabou (ou tudo acabou e não há o que vender)
  if (esgotados.length && (pedidos.length === 0 || aleatorio() < chanceFalta)) {
    falta = [esgotados[0]];
    if (pedidos.length >= maximo) pedidos = pedidos.slice(0, maximo - 1);
  }
  const todos = embaralhar([...pedidos, ...falta], aleatorio);
  const texto = sortear(dados.pedido, aleatorio).replace('{lista}', listaDeProdutos(todos.map(nomeNaFala)));
  return { personagem, pedidos: pedidos.map((p) => p.id), falta: falta.map((p) => p.id), texto };
}
