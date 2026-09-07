# Painel de Acompanhamento do Inventário Anual — SENAPPEN 2026

Sistema dinâmico para acompanhamento e governança do processo de inventário anual de bens patrimoniais da **Secretaria Nacional de Políticas Penais (SENAPPEN)**.

---

## 📌 Contexto e Objetivos

O processo de inventário anual envolve a identificação, acautelamento e prestação de contas dos bens móveis e permanentes alocados em todas as Unidades Gestoras (UGs) e Unidades Organizacionais (UORGs) da SENAPPEN, abrangendo tanto os órgãos da Sede em Brasília quanto as Penitenciárias Federais distribuídas pelo país.

### Principais Marcos Temporais do Exercício 2026 (Ofício-Circular SEI nº 35011389):
- **Processo Geral SENAPPEN:** `08016.007081/2026-59`
- **Portaria de Designação da Comissão da UG:** Prazo até **28/07/2026**
- **Capacitação Presencial na Sede SENAPPEN:** Realizada em **27 e 28/08/2026**
- **Marco 1 — Bens Acautelados e Instauração por UORG:** Prazo limite até **31/08/2026**
- **Capacitação nas Penitenciárias Federais:** Realizada de **01 a 02/09/2026**
- **Marco 2 — Relatório Final Consolidado da UG:** Prazo limite até **30/11/2026**
- **Aprovação pelo Ordenador de Despesas:** Prazo até **10/12/2026**
- **Processamento e Fechamento Contábil/SIAFI/SIADS:** Prazo até **31/12/2026**

---

## 🖥️ Dashboard Simplificado de Acompanhamento

O sistema conta com um painel executivo direto, com três status fundamentais:
- 🔴 **Não iniciado:** 32 UORGs (14,3%) — Sem processo autuado ou comissão.
- 🟡 **Em andamento:** 192 UORGs (85,7%) — Processos autuados e declarações de bens sendo instruídas.
- 🟢 **Processado:** 0 UORGs (0,0%) — Relatórios finais concluídos (meta final do exercício).
- ⏳ **Quanto Resta a Processar:** **224 UORGs (100%)** até o encerramento do exercício em 30/11/2026.

Para visualizar localmente, basta abrir o arquivo [`index.html`](file:///Users/gaspar/apps/dash_inventario/index.html) diretamente em qualquer navegador ou acoplar via Google Apps Script (`src/gas/Code.gs`).

---

## 🔍 Diagnóstico da Planilha Base (`docs/Inventário_Senappen_2026.xlsx`)

A análise técnica aprofundada da planilha original revelou um ecossistema com **12 abas** e **224 unidades organizacionais (UORGs)**:

### 1. Divisão por Unidade Gestora (UG) e Grupo Institucional

| Grupo Institucional | Aba | Código UG | Nome da Unidade Gestora | Total UORGs | Processos SEI | Cautelas Entregues |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: |
| **Sede / Diretorias** | `DIREX` | 200326 | Diretoria Executiva | 41 | 41 (100%) | 19 (46%) |
| **Sede / Diretorias** | `DISPF_DDPF` | 200323 | Diretoria de Política Penal Federal | 6 | 5 (83%) | 4 (67%) |
| **Sede / Diretorias** | `DIRPP` | 200324 | Diretoria de Políticas Penitenciárias | 6 | 4 (67%) | 2 (33%) |
| **Sede / Diretorias** | `DIPEN` | 200327 | Diretoria de Inteligência Penitenciária | 8 | 8 (100%) | 8 (100%) |
| **Sede / Diretorias** | `DICAP` | 200456 | Diretoria de Cidadania e Alternativas Penais | 8 | 8 (100%) | 6 (75%) |
| **Sistema Penitenciário Federal** | `PFCG` | 200600 | Penitenciária Federal em Campo Grande | 22 | 0 (0%) | 2 (9%) |
| **Sistema Penitenciário Federal** | `PFCAT` | 200601 | Penitenciária Federal em Catanduvas | 9 | 9 (100%) | 2 (22%) |
| **Sistema Penitenciário Federal** | `PFPV` | 200603 | Penitenciária Federal em Porto Velho | 25 | 15 (60%) | 3 (12%) |
| **Sistema Penitenciário Federal** | `PFMOS` | 200602 | Penitenciária Federal em Mossoró | 36 | 34 (94%) | 6 (17%) |
| **Sistema Penitenciário Federal** | `PFBRA` | 200604 | Penitenciária Federal em Brasília | 63 | 61 (97%) | 1 (2%) |
| **Total Consolidado** | — | — | **10 Unidades Gestoras** | **224** | **185 (82,6%)** | **53 (23,7%)** |

### 2. Abas de Apoio e Cadastros
- **`Informação`:** Baseada na *Informação 53 (SEI nº 36833070)*, contém a relação nominal com matrículas SIAPE dos integrantes designados para as comissões de inventário por UORG.
- **`Capacitação para o Invnetário`:** Relação de servidores indicados para capacitação presencial realizada na sede da SENAPPEN para as 5 penitenciárias federais.

### 3. Principais Insights Técnicos
- **Preservação de Links do SEI:** Foram identificados e mapeados **113 hyperlinks diretos** para os processos no SEI do Ministério da Justiça (`https://sei.mj.gov.br/...`), vitais para a navegabilidade do usuário.
- **Limpeza de Caracteres Especiais:** Eliminação sistemática de espaços rígidos (`\xa0`) que causavam falhas de busca nos códigos de UORG e nomes.
- **Etapas do Ciclo:** Quase todos os relatórios finais (SGP e UORG) estão pendentes, refletindo que o inventário está atualmente na fase de autuação e coleta das declarações de bens acautelados.

---

## 🏛️ Arquitetura da Solução

O projeto adota uma estratégia de **design orientado a banco de dados relacional** desde o primeiro momento. Isso permite rodar a versão inicial no Google Sheets + Apps Script e migrar para o Oracle APEX sem qualquer mudança de modelo conceitual:

```
[Planilha Excel Bruta]
          │
          ▼ (Sanitização & Extração)
[Sementes Normalizadas JSON / CSV]
          │
          ├─────────────────────────────────────────┐
          ▼                                         ▼
   [FASE 1: GOOGLE SUITE]                  [FASE 2: ORACLE APEX]
   Google Sheets (Tabelas 3FN)             Oracle Database (DDL Criado)
   Google Apps Script (Lógica & SLA)       PL/SQL Packages & Automations
```

### Planilha Oficial do Banco de Dados (`db_inventario`)
- **ID da Planilha:** `16BhZl7wc62AUASvqObESL9gNMItHqQCp5KWMPo6fvnQ`
- **ID do Projeto Google Apps Script:** `1R3laPMKhQL4a5ZDotJKxT6LDUFvjt8qnAsCJXxMyk3bxwokTZhVCFiXy`
- **Link Direto:** [db_inventario no Google Sheets](https://docs.google.com/spreadsheets/d/16BhZl7wc62AUASvqObESL9gNMItHqQCp5KWMPo6fvnQ/edit)

### Estrutura Normalizada das Tabelas Criadas na Planilha:

1. `tb_ug`: Catálogo das 10 Unidades Gestoras (código, sigla, nome, tipo institucional).
2. `tb_ciclo_inventario`: Parâmetros do exercício (prazos de cautela, prazo final, processo mãe).
3. `tb_uorg`: Cadastro unificado das 224 Unidades Organizacionais.
4. `tb_inventario_acompanhamento`: Tabela fato contendo o status de cada UORG, número do processo SEI, link direto, número da cautela e status de relatórios.
5. `tb_comissao_membro`: Servidores designados por portaria/despacho, com matrícula SIAPE.
6. `tb_capacitacao`: Histórico de servidores capacitados.
7. `vw_dashboard_inventario`: Visão consolidada calculada para relatórios e painéis analíticos.

---

## ⚙️ Dinamicidade do Sistema

O sistema foi desenhado para eliminar tabelas estáticas e rotinas manuais:
- **Separação por Diretoria com Filtro Multinível:** Filtro hierárquico intuitivo: *Grupo Institucional (Diretorias Sede vs Penitenciárias Federais) $\rightarrow$ UG específica $\rightarrow$ UORG*.
- **Máquina de Estados Automatizada:** O status de cada UORG progride automaticamente conforme os dados são inseridos:
  - `PENDENTE_INICIAL` $\rightarrow$ `PROCESSO_AUTUADO` $\rightarrow$ `CAUTELA_INFORMADA` $\rightarrow$ `EM_RELATORIO` $\rightarrow$ `CONCLUIDO`.
- **Monitoramento Dinâmico de Prazos (SLA):** Sinalização visual em tempo real para cautelas não entregues após 31/08 ou relatórios finais não entregues após 30/11.

---

## 📁 Estrutura de Arquivos do Repositório

```
dash_inventario/
├── agent.md                          # Guia de engenharia, arquitetura e convenções
├── README.md                         # Documentação principal do projeto
├── docs/
│   └── Inventário_Senappen_2026.xlsx # Planilha original enviada pela área gestora
└── data/
    └── seeds/
        ├── ug_seed.json              # Seed das 10 UGs
        ├── inventario_uorg_seed.json # Seed das 224 UORGs com processos e status
        ├── comissao_membros_seed.json# Seed nominal de integrantes das comissões
        ├── capacitacao_seed.json     # Seed de servidores participantes da capacitação
        ├── consolidado_inventario_2026.csv # CSV normalizado para importação no Sheets
        └── schema_oracle.sql         # Script SQL (DDL + DML) para Oracle APEX
```

---

## 🚀 Como Utilizar os Seeds

### No Google Planilhas:
1. Crie uma nova planilha no Google Drive.
2. Importe o arquivo [`data/seeds/consolidado_inventario_2026.csv`](file:///Users/gaspar/apps/dash_inventario/data/seeds/consolidado_inventario_2026.csv) (separador: ponto-e-vírgula `;`).
3. Todas as 224 UORGs já estarão com campos sanitizados, links SEI preservados e status de fase calculado.

### No Oracle APEX / Oracle Database:
1. Abra o **SQL Workshop** no Oracle APEX.
2. Carregue e execute o script [`data/seeds/schema_oracle.sql`](file:///Users/gaspar/apps/dash_inventario/data/seeds/schema_oracle.sql).
3. Todas as tabelas (`tb_ug`, `tb_ciclo_inventario`, `tb_uorg`, etc.) e a view analítica `vw_dashboard_inventario` serão criadas com integridade referencial.

---

## 📋 Próximas Etapas

- [x] Varredura e diagnóstico minucioso da planilha base
- [x] Extração e geração dos seeds de dados (JSON, CSV e SQL)
- [x] Elaboração das diretrizes arquiteturais (`agent.md` e `README.md`)
- [ ] Construção do plano detalhado de implementação
- [ ] Desenvolvimento do módulo Google Apps Script (GAS)
- [ ] Construção da interface visual interativa (Dashboard Dinâmico)
- [ ] Preparação e homologação para migração Oracle APEX
