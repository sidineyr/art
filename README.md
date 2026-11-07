# art — Percursos da Arte

Site educativo estático com 30 encontros em artes visuais, música, dança, teatro e artes integradas. Referência pedagógica na BNCC, com adaptações para diferentes públicos, fontes institucionais internacionais e cinco laboratórios interativos.

## Uso local

Sirva esta pasta com `python -m http.server 8000 --bind 127.0.0.1` e abra http://127.0.0.1:8000/. Não abra index.html por file://.

Com Node.js 24: `npm ci`, `npm test` e `npm run build`. O resultado em dist/ contém somente o site. As regras podem ser verificadas com o emulador Firebase usando `npm run test:rules`.

## Participação

Perfil, estudos e cópia local do caderno ficam no navegador, com exportação. Cadastro opcional por e-mail/senha permite guardar anotações privadas na conta e consultar em outro dispositivo. O menu no topo mostra cadernos e contribuições. O mural usa Firebase: envio opcional com conta, fila privada e aprovação humana antes da exibição pública. Veja BANCO.md para configuração e limites.

Imagens incorporadas provêm de acervos oficiais com domínio público/CC0. Créditos, fontes e limites de verificação estão em resources.json. Obras protegidas são acessadas por links institucionais que abrem outra aba.

## Publicação

Site: https://sidineyr.github.io/art/ . O workflow Pages é manual. O banco não hospeda o site. Não há disparo automático de publicação por push.

Rodapé com dez marcas e ícones oficiais para acervos. Fontes em assets/institutions/SOURCES.json; não são parceiros declarados.
