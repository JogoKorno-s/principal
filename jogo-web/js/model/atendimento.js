// MODEL: nota de cada atendimento no caixa e o índice de atendimento (Nível 4 em diante).
//
//   até a metade do tempo  → 100 (rápido)
//   até o limite (40 s)     → 80  (no tempo)
//   depois do limite        → cai 2 pontos por segundo, até 30 (atrasado)
//   cada troco errado       → −10

/** Devolve { nota, faixa: 'rapido' | 'noTempo' | 'atrasado' }. */
export function notaDoAtendimento(segundos, erros, limite) {
  let nota;
  let faixa;
  if (segundos <= limite / 2) { nota = 100; faixa = 'rapido'; }
  else if (segundos <= limite) { nota = 80; faixa = 'noTempo'; }
  else { nota = Math.max(30, 80 - Math.round((segundos - limite) * 2)); faixa = 'atrasado'; }
  nota = Math.max(0, nota - erros * 10);
  return { nota, faixa };
}

/** Média das notas guardadas (0 a 100) ou null se ainda não há atendimentos. */
export function indiceDeAtendimento(atendimentos = []) {
  if (!atendimentos.length) return null;
  const soma = atendimentos.reduce((total, a) => total + (typeof a === 'number' ? a : a.nota), 0);
  return Math.round(soma / atendimentos.length);
}

/** Faixa do índice (Ótimo, Bom...) a partir da lista do JSON, da maior para a menor. */
export function faixaDoIndice(indice, faixas) {
  if (indice === null) return null;
  return faixas.find((f) => indice >= f.minimo) ?? faixas[faixas.length - 1];
}
