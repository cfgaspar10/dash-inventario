/**
 * ============================================================================
 * SISTEMA DE GESTÃO DO INVENTÁRIO ANUAL SENAPPEN 2026
 * Google Apps Script - Backend & Integração com a Planilha db_inventario
 * ============================================================================
 */

const CONFIG = {
  EXERCICIO: 2026,
  PROCESSO_MAE: '08016.007081/2026-59',
  OFICIO_CIRCULAR: 'Ofício-Circular nº /2026/DIREX/SENAPPEN/MJ (SEI 35011389)',
  ABA_INVENTARIO: 'tb_inventario_acompanhamento',
  ABA_UG: 'tb_ug',
  DATA_LIMITE_CAUTELAS: '2026-08-31',
  DATA_LIMITE_FINAL: '2026-11-30'
};

/**
 * Menu customizado acionado ao abrir a planilha 'db_inventario'
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🏛️ Inventário 2026')
    .addItem('📊 Abrir Painel / Dashboard', 'abrirDashboardModal')
    .addItem('📑 Abrir Painel na Barra Lateral', 'abrirDashboardSidebar')
    .addSeparator()
    .addItem('⚡ Inicializar / Popular Abas com Seeds (224 UORGs)', 'inicializarBancoDeDados')
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
    .setWidth(1280)
    .setHeight(800);
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
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.ABA_INVENTARIO);

    if (!sheet || sheet.getLastRow() < 2) {
      return {
        status: 'warning',
        message: 'Aba de inventário vazia ou não inicializada. Usando sementes locais.',
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
 * Inicializa a aba 'tb_inventario_acompanhamento' com as 224 UORGs sanitizadas
 */
function inicializarBancoDeDados() {
  const ui = SpreadsheetApp.getUi();
  const resp = ui.alert(
    'Inicialização do Banco de Inventário',
    'Deseja criar e popular a aba "tb_inventario_acompanhamento" com as 224 UORGs do Inventário 2026?',
    ui.ButtonSet.YES_NO
  );

  if (resp !== ui.Button.YES) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.ABA_INVENTARIO);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.ABA_INVENTARIO);
  } else {
    sheet.clear();
  }

  // Cabeçalhos padronizados
  const headers = [
    'id', 'ug_id', 'ug_sigla', 'ug_nome', 'ug_tipo', 'sequencia_ug',
    'uorg_codigo', 'uorg_sigla', 'comissao_designacao', 'processo_sei',
    'processo_sei_link', 'bens_acautelados_doc', 'bens_acautelados_link',
    'relatorios_sgp', 'relatorio_uorg', 'relatorio_final_ug',
    'status_simplificado', 'status_fase', 'data_limite_cautela', 'data_limite_final'
  ];

  sheet.appendRow(headers);

  // Formatação do Cabeçalho
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#1e3a8a')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setFontFamily('Arial');
  sheet.setFrozenRows(1);

  // Buscar dados dos seeds via HtmlService
  const rawHtml = HtmlService.createHtmlOutputFromFile('data').getContent();
  const match = rawHtml.match(/window\.DASH_DATA\s*=\s*(\{[\s\S]*?\});/);
  
  if (!match) {
    ui.alert('Erro: Arquivo de sementes (data.html) não localizado.');
    return;
  }

  const dashData = JSON.parse(match[1]);
  const rows = dashData.inventario.map(item => [
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

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    sheet.autoResizeColumns(1, headers.length);
    ui.alert(`Sucesso! Aba "${CONFIG.ABA_INVENTARIO}" criada e populada com ${rows.length} UORGs.`);
  }
}

/**
 * Recalcula o status das fases diretamente na planilha
 */
function recalcularStatusPlanilha() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.ABA_INVENTARIO);
  if (!sheet || sheet.getLastRow() < 2) return;

  const data = sheet.getDataRange().getValues();
  const colProc = 9;   // processo_sei (coluna J)
  const colCaut = 11;  // bens_acautelados_doc (coluna L)
  const colRelUorg = 14; // relatorio_uorg (coluna O)
  const colRelFin = 15;  // relatorio_final_ug (coluna P)
  const colStatusSimp = 16; // status_simplificado (coluna Q)

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

  SpreadsheetApp.getUi().alert(`Recálculo concluído! ${atualizados} linhas atualizadas.`);
}
