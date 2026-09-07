/**
 * ============================================================================
 * SISTEMA DE GESTÃO DO INVENTÁRIO ANUAL SENAPPEN 2026
 * Google Apps Script - Backend & Integração com o Banco de Dados Google Sheets
 * ============================================================================
 */

const CONFIG = {
  EXERCICIO: 2026,
  PROCESSO_MAE: '08016.007081/2026-59',
  OFICIO_CIRCULAR: 'Ofício-Circular nº /2026/DIREX/SENAPPEN/MJ (SEI 35011389)',
  SPREADSHEET_ID: '16BhZl7wc62AUASvqObESL9gNMItHqQCp5KWMPo6fvnQ',
  
  // Nomes das Abas do Banco de Dados
  ABAS: {
    CICLO: 'tb_ciclo_inventario',
    UG: 'tb_ug',
    INVENTARIO: 'tb_inventario_acompanhamento',
    COMISSAO: 'tb_comissao_membro',
    CAPACITACAO: 'tb_capacitacao'
  },
  
  DATA_LIMITE_CAUTELAS: '2026-08-31',
  DATA_LIMITE_FINAL: '2026-11-30'
};

/**
 * Retorna a planilha do banco de dados (pelo ID fixo ou planilha ativa se vinculada)
 */
function getDbSpreadsheet() {
  if (CONFIG.SPREADSHEET_ID) {
    try {
      return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    } catch (e) {
      console.warn('Não foi possível abrir por ID, tentando planilha ativa:', e);
    }
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Menu customizado acionado ao abrir a planilha 'db_inventario'
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🏛️ Inventário 2026')
    .addItem('📊 Abrir Painel / Dashboard', 'abrirDashboardModal')
    .addItem('📑 Abrir Painel na Barra Lateral', 'abrirDashboardSidebar')
    .addSeparator()
    .addItem('⚡ Estruturar Banco de Dados e Carga de Seeds', 'inicializarEstruturaBanco')
    .addItem('🔄 Recalcular Status e Prazos', 'recalcularStatusPlanilha')
    .addToUi();
}

/**
 * Ponto de entrada do Web App (Deploy autônomo na Web)
 */
function doGet(e) {
  const template = HtmlService.createTemplateFromFile('index');
  return template.evaluate()
    .setTitle('Painel de Acompanhamento do Inventário 2026 — SENAPPEN')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Abre o Dashboard em uma janela Modal ampla dentro do próprio Google Sheets
 */
function abrirDashboardModal() {
  const template = HtmlService.createTemplateFromFile('index');
  const html = template.evaluate()
    .setWidth(1360)
    .setHeight(820);
  SpreadsheetApp.getUi().showModalDialog(html, 'Painel de Gestão do Inventário SENAPPEN 2026');
}

/**
 * Abre o Dashboard na barra lateral direita do Google Sheets
 */
function abrirDashboardSidebar() {
  const template = HtmlService.createTemplateFromFile('index');
  const html = template.evaluate().setTitle('Inventário SENAPPEN 2026');
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Utilitário para inclusão de arquivos parciais no HTML
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Retorna os dados do inventário da planilha para o frontend
 */
function getInventarioData() {
  try {
    const ss = getDbSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.ABAS.INVENTARIO);

    if (!sheet || sheet.getLastRow() < 2) {
      return {
        status: 'warning',
        message: 'Aba de inventário vazia ou não inicializada.',
        dados: null
      };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);

    const items = rows.map((row) => {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = row[idx];
      });
      return obj;
    });

    return {
      status: 'success',
      exercicio: CONFIG.EXERCICIO,
      processo_mae: CONFIG.PROCESSO_MAE,
      oficio_circular: CONFIG.OFICIO_CIRCULAR,
      total: items.length,
      dados: items
    };
  } catch (err) {
    return {
      status: 'error',
      message: err.toString(),
      dados: null
    };
  }
}

/**
 * Cria a estrutura completa de banco de dados relacional nas abas da planilha
 * e carrega as sementes (seeds) de dados oficiais.
 */
function inicializarEstruturaBanco() {
  let ui = null;
  try {
    ui = SpreadsheetApp.getUi();
  } catch (e) {
    // Executado fora de contexto de UI
  }

  if (ui) {
    const resp = ui.alert(
      'Estruturação do Banco de Dados — SENAPPEN 2026',
      `Esta ação criará as 5 abas normalizadas na planilha:\n\n` +
      `1. ${CONFIG.ABAS.CICLO} (Metadados do Exercício 2026)\n` +
      `2. ${CONFIG.ABAS.UG} (Catálogo das 10 Unidades Gestoras)\n` +
      `3. ${CONFIG.ABAS.INVENTARIO} (Acompanhamento das 224 UORGs)\n` +
      `4. ${CONFIG.ABAS.COMISSAO} (Integrantes das Comissões)\n` +
      `5. ${CONFIG.ABAS.CAPACITACAO} (Servidores Capacitados)\n\n` +
      `Deseja prosseguir com a estruturação e carga de dados?`,
      ui.ButtonSet.YES_NO
    );
    if (resp !== ui.Button.YES) return;
  }

  const ss = getDbSpreadsheet();

  // Buscar seeds de data.html
  const rawHtml = HtmlService.createHtmlOutputFromFile('data').getContent();
  const match = rawHtml.match(/window\.DASH_DATA\s*=\s*(\{[\s\S]*?\});/);
  if (!match) {
    throw new Error('Arquivo de sementes (data.html) não localizado.');
  }
  const dashData = JSON.parse(match[1]);

  // 1. Aba: tb_ciclo_inventario
  criarAbaComCabecalho(ss, CONFIG.ABAS.CICLO, [
    'id_ciclo', 'ano_exercicio', 'processo_sei_mae', 'oficio_circular',
    'data_limite_cautela', 'data_limite_final', 'status_ciclo', 'descricao'
  ], [
    [
      1,
      CONFIG.EXERCICIO,
      CONFIG.PROCESSO_MAE,
      CONFIG.OFICIO_CIRCULAR,
      CONFIG.DATA_LIMITE_CAUTELAS,
      CONFIG.DATA_LIMITE_FINAL,
      'EM_ANDAMENTO',
      'Inventário Físico-Financeiro Anual da SENAPPEN - Exercício 2026'
    ]
  ]);

  // 2. Aba: tb_ug
  const ugRows = dashData.ugs.map(ug => [
    ug.ug_id,
    ug.codigo,
    ug.sigla,
    ug.nome,
    ug.tipo,
    ug.processo_ug || '',
    ug.portaria_geral || ''
  ]);
  criarAbaComCabecalho(ss, CONFIG.ABAS.UG, [
    'id_ug', 'codigo_ug', 'sigla_ug', 'nome_ug', 'tipo_ug', 'processo_sei_ug', 'portaria_geral'
  ], ugRows);

  // 3. Aba: tb_inventario_acompanhamento
  const invRows = dashData.inventario.map(item => [
    item.id,
    item.ug_id,
    item.ug_sigla,
    item.ug_nome,
    item.ug_tipo,
    item.sequencia_ug,
    item.uorg_codigo,
    item.uorg_sigla,
    item.comissao_designacao,
    item.processo_sei,
    item.processo_sei_link,
    item.bens_acautelados_doc,
    item.bens_acautelados_link,
    item.relatorios_sgp,
    item.relatorio_uorg,
    item.relatorio_final_ug,
    item.status_simplificado,
    item.status_fase,
    item.data_limite_cautela,
    item.data_limite_final
  ]);
  criarAbaComCabecalho(ss, CONFIG.ABAS.INVENTARIO, [
    'id', 'ug_id', 'ug_sigla', 'ug_nome', 'ug_tipo', 'sequencia_ug',
    'uorg_codigo', 'uorg_sigla', 'comissao_designacao', 'processo_sei',
    'processo_sei_link', 'bens_acautelados_doc', 'bens_acautelados_link',
    'relatorios_sgp', 'relatorio_uorg', 'relatorio_final_ug',
    'status_simplificado', 'status_fase', 'data_limite_cautela', 'data_limite_final'
  ], invRows);

  // 4. Aba: tb_capacitacao
  const capRows = [
    [1, 8, 'PFPV', 'Jefferson de Medeiros Silva', 'Ofício 424 (SEI nº 36351643)'],
    [2, 8, 'PFPV', 'Claudio Félix Gonçalves', ''],
    [3, 9, 'PFMOS', 'Anna Paula Torres Guedes da Silva', 'Ofício 637 (36321882)'],
    [4, 9, 'PFMOS', 'Renofran Lima de Sousa', ''],
    [5, 6, 'PFCG', 'Édilla Kattiara Dias da Hora Freitas', 'Ofício 188 / 199'],
    [6, 6, 'PFCG', 'Eduardo Sousa de Lima', ''],
    [7, 10, 'PFBRA', 'Jéssica Ellen da Silva Lima', 'Ofício 16 (SEI nº 36383480)'],
    [8, 10, 'PFBRA', 'Tiago Aluísio Lopes de Sousa', ''],
    [9, 7, 'PFCAT', 'Bruno Henrique Martusevicus', 'Portaria 135 (36373976) - Presidente'],
    [10, 7, 'PFCAT', 'Jonas de Oliveira Dos Santos', 'Responsável Patrimônio']
  ];
  criarAbaComCabecalho(ss, CONFIG.ABAS.CAPACITACAO, [
    'id_capacitacao', 'id_ug', 'sigla_ug', 'nome_servidor', 'observacao_oficio'
  ], capRows);

  if (ui) {
    ui.alert(
      'Estruturação Concluída com Sucesso!',
      `O banco de dados foi estruturado na planilha:\n` +
      `- 10 Unidades Gestoras cadastradas em "${CONFIG.ABAS.UG}"\n` +
      `- 224 UORGs cadastradas e higienizadas em "${CONFIG.ABAS.INVENTARIO}"\n` +
      `- Ciclo e Capacitação configurados.\n\n` +
      `Você já pode abrir o painel pelo menu "🏛️ Inventário 2026".`,
      ui.ButtonSet.OK
    );
  }
}

/**
 * Função utilitária para criar ou recriar aba com estilo padrão
 */
function criarAbaComCabecalho(ss, nomeAba, cabecalhos, dados) {
  let sheet = ss.getSheetByName(nomeAba);
  if (!sheet) {
    sheet = ss.insertSheet(nomeAba);
  } else {
    sheet.clear();
  }

  // Insere cabeçalho
  sheet.appendRow(cabecalhos);

  // Estilização institucional do cabeçalho
  const headerRange = sheet.getRange(1, 1, 1, cabecalhos.length);
  headerRange
    .setBackground('#1e3a8a') // Azul institucional
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setFontFamily('Arial')
    .setHorizontalAlignment('center');

  sheet.setFrozenRows(1);

  // Insere linhas de dados
  if (dados && dados.length > 0) {
    sheet.getRange(2, 1, dados.length, cabecalhos.length).setValues(dados);
  }

  // Ajusta largura das colunas
  sheet.autoResizeColumns(1, cabecalhos.length);
}

/**
 * Recalcula o status das fases diretamente na planilha
 */
function recalcularStatusPlanilha() {
  const ss = getDbSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.ABAS.INVENTARIO);
  if (!sheet || sheet.getLastRow() < 2) return;

  const data = sheet.getDataRange().getValues();
  const colProc = 9;       // processo_sei (coluna J)
  const colCaut = 11;      // bens_acautelados_doc (coluna L)
  const colRelUorg = 14;   // relatorio_uorg (coluna O)
  const colRelFin = 15;    // relatorio_final_ug (coluna P)
  const colStatusSimp = 16;// status_simplificado (coluna Q)

  let atualizados = 0;
  for (let r = 1; r < data.length; r++) {
    const proc = data[r][colProc];
    const caut = data[r][colCaut];
    const relUorg = data[r][colRelUorg];
    const relFin = data[r][colRelFin];

    let status = 'Não iniciado';
    if (relFin || relUorg) {
      status = 'Processado';
    } else if (proc || caut) {
      status = 'Em andamento';
    }

    if (data[r][colStatusSimp] !== status) {
      sheet.getRange(r + 1, colStatusSimp + 1).setValue(status);
      atualizados++;
    }
  }

  try {
    SpreadsheetApp.getUi().alert(`Recálculo concluído! ${atualizados} linhas atualizadas.`);
  } catch (e) {
    console.log(`Recálculo concluído: ${atualizados} linhas atualizadas.`);
  }
}
