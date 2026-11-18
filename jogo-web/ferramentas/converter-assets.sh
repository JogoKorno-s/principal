#!/usr/bin/env bash
# Copia e converte as artes do Godot (kornos/) para a versão web (jogo-web/assets/).
# Rodar a partir da raiz do repositório:  bash jogo-web/ferramentas/converter-assets.sh
# Precisa do ffmpeg (no Windows: winget install Gyan.FFmpeg).
# Só entram cenários, Luís, produtos e vídeos. Os botões com texto de art/ui NÃO são usados.
set -euo pipefail

FFMPEG="${FFMPEG:-ffmpeg}"
ORIGEM="kornos"
DESTINO="jogo-web/assets"

mkdir -p "$DESTINO/cenarios" "$DESTINO/luis" "$DESTINO/produtos" "$DESTINO/videos"

# Imagem -> WebP (mantém a transparência dos PNG)
webp() {
  local entrada="$1" saida="$2" qualidade="${3:-82}"
  "$FFMPEG" -loglevel error -y -i "$entrada" -c:v libwebp -quality "$qualidade" -compression_level 6 "$saida"
}

# Cenários (1920×1080)
# Mercado (limpeza, limpo, abastecido, caixa novo), intro-cena1/2, intro-cena5/7/9/10, o empresário, o senhor e os produtos do Dia 2
# vieram das artes novas do grupo (mais nítidas) e já estão convertidos em assets/; não refazer daqui.
webp "$ORIGEM/art/backgrounds/fachada_inicial.png"                        "$DESTINO/cenarios/fachada.webp"
webp "$ORIGEM/art/backgrounds/prateleira1.jpg"                            "$DESTINO/cenarios/prateleira.webp"
webp "$ORIGEM/art/backgrounds/intro/cena8.jpeg"                           "$DESTINO/cenarios/intro-cena8.webp"

# Luís
webp "$ORIGEM/art/characters/luis/luis_oi.png"         "$DESTINO/luis/oi.webp" 88
webp "$ORIGEM/art/characters/luis/luis_explicando.png" "$DESTINO/luis/explicando.webp" 88
webp "$ORIGEM/art/characters/luis/luis_joinha.png"     "$DESTINO/luis/joinha.webp" 88
webp "$ORIGEM/art/characters/luis/luis_pensando.png"   "$DESTINO/luis/pensando.webp" 88
webp "$ORIGEM/art/characters/luis/luis_errou1png.png"  "$DESTINO/luis/errou.webp" 88

# Produtos
webp "$ORIGEM/art/products/arroz.png"  "$DESTINO/produtos/arroz.webp" 88
webp "$ORIGEM/art/products/feijao.png" "$DESTINO/produtos/feijao.webp" 88
webp "$ORIGEM/art/products/acucar.png" "$DESTINO/produtos/acucar.webp" 88

# Vídeos: .ogv não toca no Chrome, então gera .webm (VP9) e .mp4 (H.264).
video() {
  local entrada="$1" nome="$2"
  "$FFMPEG" -loglevel error -y -i "$entrada" -c:v libvpx-vp9 -b:v 0 -crf 34 -row-mt 1 -c:a libopus -b:a 96k "$DESTINO/videos/$nome.webm"
  "$FFMPEG" -loglevel error -y -i "$entrada" -c:v libx264 -crf 24 -preset slow -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 128k "$DESTINO/videos/$nome.mp4"
}

video "$ORIGEM/videos/menu/menu.mp4" menu
for n in 3 4 6; do
  video "$ORIGEM/videos/intro/cena$n.ogv" "intro-cena$n"
done

echo "Assets prontos em $DESTINO"
