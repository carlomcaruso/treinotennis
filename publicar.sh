#!/usr/bin/env bash
# Carimba uma versão nova no sw.js antes de publicar.
# Sem isso os aparelhos continuam servindo a versão em cache.
cd "$(dirname "$0")"
NOVA=$(date +%Y-%m-%d-%H%M)
sed -i.bak "s/^const VERSION = '.*';/const VERSION = '$NOVA';/" sw.js && rm -f sw.js.bak
echo "Versão carimbada: $NOVA"
echo "Agora suba os arquivos para o GitHub."
