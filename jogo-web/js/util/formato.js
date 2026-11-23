// Formatação de valores. O dinheiro é guardado SEMPRE em centavos (número inteiro),
// para que 300,00 − 79,98 dê exatamente 220,02, sem erro de arredondamento.

import { textoParaToque } from '../view/celular.js';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** 22002 -> "R$ 220,02" */
export function reais(centavos) {
  // Intl usa espaço não separável; trocamos por espaço comum para o texto ficar igual ao roteiro.
  return brl.format(centavos / 100).replace(/\s/u, ' ');
}

/** 1 -> "01" */
export function doisDigitos(n) {
  return String(n).padStart(2, '0');
}

/** Troca {chave} pelo valor correspondente: preencher("Limpe {nome}.", { nome: "o chão" }) */
export function preencher(modelo, valores) {
  return modelo.replace(/\{(\w+)\}/g, (_, chave) => valores[chave] ?? '');
}

/** Carrega um JSON da pasta data/ */
export async function carregarJSON(caminho) {
  const resposta = await fetch(caminho);
  if (!resposta.ok) throw new Error(`Não foi possível carregar ${caminho}`);
  // No celular, os textos falam em "toque" em vez de "clique" (ver view/celular.js)
  return JSON.parse(await resposta.text(), (_, valor) => textoParaToque(valor));
}

export const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
