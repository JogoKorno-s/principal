// MODEL: preferências do jogador (música e sons), guardadas no navegador.
// Ficam separadas do save do jogo: "Reiniciar" não mexe nelas.

const CHAVE = 'kornos-preferencias';
const PADRAO = { musica: true, sons: true };

let prefs = { ...PADRAO };
try { prefs = { ...PADRAO, ...JSON.parse(localStorage.getItem(CHAVE) ?? '{}') }; } catch { /* navegador sem localStorage */ }

const ouvintes = new Set();

export const Preferencias = {
  get: () => ({ ...prefs }),
  definir(chave, valor) {
    prefs[chave] = valor;
    try { localStorage.setItem(CHAVE, JSON.stringify(prefs)); } catch { /* sem localStorage: vale só nesta sessão */ }
    ouvintes.forEach((fn) => fn(prefs));
  },
  ouvir(fn) { ouvintes.add(fn); },
};
