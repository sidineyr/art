# Firebase e mural moderado

Projeto: art-percursos-sidineyr-2026. Cloud Firestore Standard em southamerica-east1 (São Paulo), plano Spark, sem faturamento ativado. O plano tem cotas: serviço gratuito não significa capacidade ilimitada. O site fica no GitHub Pages após autorização.

## Dados e permissões

- pending: encontro, categoria, texto, data e UID técnico; apenas autor pontual e moderadores autorizados leem. Não há lista pública.
- published: cópia sem UID, criada por moderador após revisão. Leitura pública limitada por consulta; publicação e remoção são restritas.
- receipts: UID e data, sem texto, impedem duplicar ou ressuscitar envios processados.
- limits: UID, data e identificador do último envio. Intervalo mínimo de 60 segundos por conta cadastrada.
- moderators: documento com UID da conta e enabled:true, criado exclusivamente por administração privilegiada. Entrar com Google não concede função.

O envio cria pending, receipts e limits atomicamente; não permite editar depois. Aprovar publica e remove a fila na mesma transação. Rejeitar/remove apaga o texto alvo; mantém recibo sem texto. Regras possuem campos e valores permitidos, limites e negação por padrão. São regras de protótipo testadas com emulador; revisar antes de lançamento amplo.

## Acesso

Cadastro por e-mail/senha para enviar; leitura aprovada não exige login. Cadastro, entrada, recuperação e saída usam Firebase Authentication. Senhas não são guardadas no Firestore: o serviço usa hash baseado em scrypt ([documentação oficial](https://firebase.google.com/docs/auth/admin/import-users)). O IP não é identificador de conta. Moderação em #moderacao com Google e allowlist moderators/UID. Sessão de moderação apenas em memória e separada da sessão de visitante. Nunca inserir token administrativo no config.js: ele contém somente configuração pública do SDK.

A conta Google do responsável já foi verificada e cadastrada na allowlist. Outras contas precisam de autorização administrativa explícita. Em Authentication, localhost já está autorizado. Usar http://localhost:8000 para testar o login. Antes de publicar, autorizar sidineyr.github.io. Habilitados Google (moderação) e Email/Password (participantes); Anonymous desativado. Não habilitar faturamento.

## Limites e privacidade

Não são pedidos nome ou idade. E-mail e senha são usados apenas no cadastro opcional pelo Authentication. Só a cópia local fica no navegador. Guardar na minha conta envia pergunta e anotação para users/UID/notebook/ENCONTRO, com acesso do titular. Moderadores do mural não recebem acesso. Administradores do projeto mantêm acesso técnico: não é criptografia ponta a ponta. UID identifica a conta; a sessão fica nesta aba, sem guardar a senha; não se promete anonimato absoluto. Limite por conta pode ser contornado ao criar outra conta: não é proteção completa contra spam. Sem App Check configurado, acompanhar cotas e abuso antes de ampla divulgação.

Recibos e contadores não possuem expiração automática. Definir retenção e limpeza administrativa; remover recibo pode permitir reutilização de identificador antigo. Solicitações de remoção devem ser tratadas pelo responsável; não há contato público cadastrado ainda.

## Verificação e implantação

npm test testa conteúdo e adaptador. O emulador Firestore roda tests/firestore.rules.test.mjs sem usar dados reais. Implantar somente firestore e auth; nenhuma implantação de Hosting faz parte desta entrega. firestore.indexes.json inclui consulta por encontro e aprovação. BANCO.md não contém credenciais.


## Conta e histórico

O topo oferece Entrar/cadastrar; ao entrar, mostra Meus cadernos, Minhas contribuições e Sair. Cada anotação remota substitui a versão anterior daquele encontro. Estudos digitais continuam locais. Sair não apaga registros da conta. Apagar o navegador não apaga o caderno remoto.

Contribuições próprias: consultas filtradas por authorUid, ordenadas por createdAt e limitadas a 20. Textos excluídos não são mantidos: o recibo aparece como processado. Índices authorUid + createdAt em pending e receipts. O caderno da conta é privado inclusive em relação à equipe de moderação do mural.

I've set up prototype Security Rules to keep the data in Firestore safe. They are designed to be secure for private notebooks through owner-only access, strict field validation, and restricted moderation. However, you should review and verify them before broadly sharing your app. If you'd like, I can help you harden these rules.
