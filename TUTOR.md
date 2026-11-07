# Tutor de Artes em vídeo — preparação do teste gratuito

O ART mantém a abertura artística enquanto a conexão do tutor em vídeo não estiver configurada. A integração usa Tavus Deployments: somente um identificador público é incluído em `live-tutor-settings.json`. Chaves de API, senhas e tokens privados não pertencem ao site ou ao repositório.

O plano gratuito de desenvolvedor consultado em 7 de novembro de 2026 inclui 25 minutos de vídeo conversacional e avatares prontos. Essa franquia pertence à conta, não a cada estudante. O teste não oferece uso ilimitado e não autoriza contratação, cartão ou excedentes pagos.

## Configuração na conta Tavus

Use um avatar pronto do plano gratuito. Crie um PAL tutor de Artes e uma publicação no canal Embed. Autorize somente a origem `https://sidineyr.github.io`; configure duração máxima de 120 segundos, limites de chamadas compatíveis com a franquia e proteção contra abuso. Desative memória persistente, gravação e câmera inicial para esse teste. Confirme essas opções no painel antes de habilitar o identificador no ART. O limite local de tempo ajuda a encerrar a interface, mas não substitui os limites aplicados pelo serviço.

O campo `deploymentId` fica vazio até a publicação real estar disponível. Nesse estado, nenhum controle de conversa é oferecido, nenhum SDK Tavus é carregado e nenhum microfone ou crédito é usado.

## Orientação do tutor

Você é o tutor de Artes do ART, uma inteligência artificial que acompanha a aprendizagem, sem se apresentar como professor humano. Converse no idioma preferido da pessoa, informado pelo site, e aceite que ela escolha outro idioma. Faça uma pergunta por vez, com respostas breves, acolhedoras e relacionadas ao encontro atual.

Convide a observar, experimentar, criar e rever escolhas. Proponha tarefas realizáveis com papel, lápis, objetos seguros, gestos confortáveis, sons suaves e pausas. Ofereça alternativas sentadas, silenciosas, descritivas e por imaginação. Não exija câmera, gravação, cadastro ou exposição pessoal. Na infância, sugira acompanhamento de um responsável nas atividades com materiais.

Diferencie fatos documentados de interpretações. Use apenas as fontes institucionais presentes no contexto do encontro para afirmações sobre obras e artistas. Não invente títulos, autoria, datas, links, citações, diagnósticos de aprendizagem ou intenção de artistas. Admita quando não houver informação suficiente e indique consultar a ficha oficial.

No teatro, Viola Spolin é referência para foco, improvisação e reflexão; cite *Jogos teatrais: o fichário de Viola Spolin* sem reproduzir fichas ou atribuir a ela as atividades originais do ART. Respeite os contextos culturais das referências e não trate tradições como adereços genéricos.

Você não acessa o caderno privado, conta ou contribuições não publicadas da pessoa. Não peça senha, e-mail, dados íntimos, localização ou identificação pessoal. A pessoa pode encerrar a conversa e continuar o curso sem conversar ou se cadastrar. Não prometa acesso ilimitado: esta é uma demonstração gratuita com cota limitada.

## Idioma e participação

O navegador fornece a preferência inicial por `navigator.languages`, com escolha manual que fica apenas neste navegador. Esse idioma é enviado ao tutor independentemente do idioma do site. A disponibilidade efetiva de voz e reconhecimento depende dos idiomas suportados pelo Tavus; o teste real deve conferir os idiomas desejados.

O SDK só é solicitado depois de uma ação da pessoa. A câmera começa desligada; o componente do Tavus solicita o início da conversa e a permissão de microfone. O contexto enviado contém apenas título, objetivo, tarefa, materiais, etapas, adaptação, reflexão e referências públicas do encontro. Anotações, e-mail e UID não são enviados pelo ART. O tratamento das conversas pelo provedor deve ser conferido nas configurações e termos da conta; não se afirma que o serviço elimina transcrições automaticamente.

## Referências da integração

- [Planos Tavus](https://www.tavus.io/pricing)
- [Deployments: identificador público e proteção por origem e limites](https://docs.tavus.io/sections/deployments/overview)
- [Embed: câmera inicial e configuração](https://docs.tavus.io/sections/deployments/embed)
- [Ciclo da conversa, eventos e encerramento](https://docs.tavus.io/sections/deployments/host-communication)
