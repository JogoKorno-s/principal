# DESIGN.md · site do Korno's

Regras da identidade visual do site, para quem for mexer depois manter o mesmo mundo.

## Ideia central
O site é o próprio Korno's, um mercadinho de bairro brasileiro reformado com carinho. Os componentes são objetos de mercado, não "cards": placa de porta ABERTO/FECHADO (botão de jogar), placas de corredor penduradas (menu), etiqueta de gôndola (título de seção), encarte de ofertas (minigames), etiqueta de preço pendurada (download), cupom fiscal térmico (créditos), crachá (personagens), nota grampeada (documentos) e balão de fala igual ao do jogo (o Luís conversando).

## Paleta (oficial do GDD, sem cores novas)
| Token | Cor | Uso |
|---|---|---|
| `--bege` | #F4EDE4 | fundo, papel |
| `--bege-quente` | #E6D3B3 | superfícies, faixas alternadas |
| `--marrom` | #5B1F00 | texto, bordas de 3px, faixas escuras |
| `--marrom-claro` | #8D4925 | detalhes, molduras, carimbos |
| `--laranja` | #D96300 | ação e preço — **só texto ≥ 24px ou fundo com texto grande** |
| `--verde` | #82B875 | sucesso, "válido", "disponível" (texto sempre marrom) |
| `--azul` | #5C7A8D | informação, nome de personagem (texto branco), marcação [PREENCHER] |
Papel térmico do cupom: #FBF7F1 com tinta #2b1200 (variações do bege e do marrom).

## Tipografia
- **Fredoka** (peso 560–650): títulos h1/h2, números de preço, legendas da abertura. Arredondada como o "SUPERMERCADO" do logo e o HUD do jogo. Nunca em texto corrido.
- **Recursive**: texto (`MONO 0`), cupom/código/dados (`MONO 1`), fala do Luís (`CASL .85`).

## Formas
Borda marrom de 3px com contorno interno bege (o estilo dos painéis do HUD do jogo), cantos de 6 a 20px, sombras macias com deslocamento. Leves rotações (±1,5°) em objetos pendurados ou apoiados. Nada de vidro, degradê, bolha desfocada ou ícone de biblioteca: ícones são desenhados em `img/icones.svg`.

## Movimento
Só onde o objeto se mexeria de verdade: a placa gira no prego, a etiqueta de preço balança, o cupom sai da impressora, as latas tremem quando ficam lado a lado. Tudo some com `prefers-reduced-motion`.

## Ritmo
Seções alternam largura (largo 1320 / médio 1040 / estreito 720) e fundo (bege, bege-quente, marrom, parede #E8C9A8). Imagens podem sair do grid (o monitor sobe na fachada).
