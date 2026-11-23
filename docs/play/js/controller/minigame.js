// CONTROLLER: interface comum de todos os minigames (RNF07).
//
//   ENTRADA  →  VALIDAÇÃO  →  RESULTADO
//
// Um minigame é um objeto com quatro métodos:
//
//   montar(container, enviar)  VIEW. Monta a tela do minigame. Quando o jogador
//                              faz algo (clica, digita, solta um produto), chama
//                              enviar(entrada).
//   validar(entrada)           REGRA. Função pura, não mexe na tela nem no estado.
//                              Retorna { ok: boolean, mensagem?: string, ... }.
//   resultado(r, entrada)      VIEW. Mostra o resultado (aviso, selo, animação).
//                              Retorna (ou resolve) true quando o minigame acabou.
//   desmontar()                Remove a tela do minigame.
//
// jogar() liga as três etapas e devolve uma Promise com a última validação,
// para que o controlador do dia aplique as mudanças no GameState.

export function jogar(minigame, container) {
  return new Promise((resolver) => {
    let processando = false;

    async function enviar(entrada) {
      if (processando) return;
      processando = true;
      const validacao = minigame.validar(entrada);
      const terminou = await minigame.resultado(validacao, entrada);
      processando = false;
      if (terminou) {
        minigame.desmontar?.();
        resolver({ ...validacao, entrada });
      }
    }

    minigame.montar(container, enviar);
  });
}
