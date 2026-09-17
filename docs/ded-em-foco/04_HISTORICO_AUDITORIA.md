# 04 — Histórico da auditoria DED em Foco

Data: 17/09/2026.

## Passo 1 — separar modalidade e série

Confirmado que a escola possui REG noturno e EMTI Profissional. A lógica de cálculo não pode compartilhar uma única matriz entre esses grupos.

## Passo 2 — revisar a regra de escolha da matriz

Critério final: usar a **matriz mais recente oficialmente aplicável à série/oferta em 2026**.

Orientação oficial PRA/SRE-C de 03/06/2026:

- 1º ano EMTI → Documento/Matriz 2026;
- 2º e 3º anos EMTI → Documento/Matriz 2025.

## Passo 3 — investigar o saldo -110

Foi reproduzido matematicamente o saldo. Ele resultava de hipótese não documentada de 6 A/S + 6 A/S nos componentes técnicos de Sistemas de Energia Renovável. A hipótese foi retirada.

## Passo 4 — bloquear estimativa técnica sem fonte

Fabricação Mecânica e Sistemas de Energia Renovável do 2º ano ficam sem previsão automática por componente até localização da matriz TFE/SENAI aplicável ou do horário homologado.

## Passo 5 — revisar o calendário

O calendário estadual enviado foi reconstruído dia a dia. Ele possui 200 dias no modelo geral, incluindo os sábados letivos de 27/06 e 12/09.

Na adaptação para Belo Horizonte, 08/12 é feriado municipal e precisa de recomposição homologada. O painel não escolhe automaticamente uma data de reposição.

## Passo 6 — revisar a responsabilidade docente

O consolidado mantém um único diário por turma + componente. Se o professor mudou entre 1º e 2º trimestre, o total é acumulado e o responsável exibido é o atual do 2º trimestre. Duplicidade simultânea no relatório atual permanece `A confirmar`.

## Passo 7 — proteção de dados no GitHub

O repositório `christianhpo-star/Hilton_rocha` é público e contém outro WebApp escolar. Esta auditoria foi registrada em branch própria, em `docs/ded-em-foco/`, sem publicar o `index.html` preenchido nem nomes de docentes. O HTML com dados internos deve permanecer fora do repositório público enquanto houver informações identificáveis.

## Commits desta branch

- `2df83ef13e0c30fb931542bd37ec2aa36e892de0` — critério de matriz por série;
- `d7b09409a6df78e69a546bd0858b298edd9aed8a` — calendário e recomposição local;
- `3e67a98c774ebba7aa4548e3d50aac0b67f348e6` — investigação do saldo técnico de 110 aulas;
- este commit — histórico consolidado da auditoria.

## Próximo gate

Localizar e validar a matriz específica do Trilhas de Futuro nas Escolas/SENAI para:

- Fabricação Mecânica — 2º ano;
- Sistemas de Energia Renovável — 2º ano.

Somente após esse gate o painel poderá voltar a calcular automaticamente a previsão dos componentes técnicos dessas turmas.
