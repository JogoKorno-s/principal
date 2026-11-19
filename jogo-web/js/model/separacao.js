// MODEL: pedido do Moto Entrega sendo separado.
// O jogador anda pelas seções e clica nos produtos expostos para colocar na cestinha.
// O que já está na cestinha fica reservado: sai da exposição e não pode ser exposto de novo.

let atual = null;            // { pedido, pegos: Set<id> }
const ouvintes = new Set();
const avisar = () => { for (const fn of ouvintes) fn(atual); };

export function comecarSeparacao(pedido) {
  atual = { pedido, pegos: new Set() };
  avisar();
}

export function terminarSeparacao() {
  atual = null;
  avisar();
}

export const separando = () => atual !== null;
export const separacaoAtual = () => atual;
export const separacaoCompleta = () => Boolean(atual) && atual.pedido.itens.every((id) => atual.pegos.has(id));

/** Unidades reservadas na cestinha (para o expositor não deixar expor de novo). */
export const reservado = (id) => (atual?.pegos.has(id) ? 1 : 0);

/** Tenta pegar um produto. Devolve 'ok', 'foraDoPedido' ou 'jaPegou'. */
export function pegarProduto(id) {
  if (!atual) return 'foraDoPedido';
  if (!atual.pedido.itens.includes(id)) return 'foraDoPedido';
  if (atual.pegos.has(id)) return 'jaPegou';
  atual.pegos.add(id);
  avisar();
  return 'ok';
}

export function ouvirSeparacao(fn) { ouvintes.add(fn); return () => ouvintes.delete(fn); }
