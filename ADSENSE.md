# Publicidade discreta — configuração pendente

Editor: `pub-4924241177850142` (identificador público, não é senha).

O HTML identifica o editor para verificação. O módulo local prepara um único banner no final do conteúdo, sem anúncios automáticos, janelas, vídeos obrigatórios ou bloqueio de aulas. Sem aprovação, número real do bloco e consentimento, nenhum SDK Google é carregado e nenhum espaço vazio é exibido.

Para ativar: confirmar o status Pronto deste site no painel AdSense; criar um bloco de display horizontal e copiar seu data-ad-slot para assets/adsense-config.json; confirmar adequação ao público e política de privacidade; integrar consentimento aplicável (CMP certificada pelo Google onde exigida). Só então definir approved como true. A CMP emite window.dispatchEvent(new CustomEvent('sidineyr:ads-consent', {detail:{advertising:true}})) após consentimento válido. Não emita esse evento automaticamente. A revogação usa advertising:false e exige interrupção das solicitações e atualização/recarregamento pela CMP.

No painel, manter anúncios automáticos e otimização de blocos desligados: sem âncoras, vinhetas, trilhos ou vídeos para continuar. Não encolher, recortar ou ocultar um anúncio preenchido. O portfólio está excluído da publicidade. O ads.txt pertence à raiz do domínio, não a cada pasta de projeto; seu arquivo técnico não mostra anúncios.

Não se confirmou aprovação da conta ou destes sites. Não há promessa de exibição ou receita. Não usar respostas, cadernos, pesquisas, saúde ou registros privados para segmentação. Revisar tratamento de público infantil antes da ativação.

Fontes: https://support.google.com/adsense/answer/12131223 · https://support.google.com/adsense/answer/9305577 · https://support.google.com/adsense/answer/12171612
