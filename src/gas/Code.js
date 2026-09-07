/**
 * ============================================================================
 * [ENTRYPOINT] SISTEMA DE GESTÃO DO INVENTÁRIO ANUAL SENAPPEN 2026
 * Google Apps Script - Roteador e Integração com UI
 * ============================================================================
 */

/**
 * Menu customizado na planilha Google Sheets
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🏛️ Inventário 2026')
    .addItem('📊 Abrir Painel / Dashboard', 'abrirDashboardModal')
    .addItem('📝 Módulo de Gestão Operacional', 'abrirGestaoModal')
    .addItem('📑 Abrir Painel na Barra Lateral', 'abrirDashboardSidebar')
    .addSeparator()
    .addItem('⚡ Estruturar Banco de Dados e Carga de Seeds', 'inicializarEstruturaBanco')
    .addItem('🔄 Recalcular Status e Prazos', 'recalcularStatusPlanilha')
    .addToUi();
}

/**
 * Ponto de entrada do Web App
 */
function doGet(e) {
  const template = HtmlService.createTemplateFromFile('index');
  return template.evaluate()
    .setTitle('Painel de Gestão do Inventário 2026 — SENAPPEN')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Abre o Painel Executivo em Modal
 */
function abrirDashboardModal() {
  const template = HtmlService.createTemplateFromFile('index');
  const html = template.evaluate().setWidth(1360).setHeight(840);
  SpreadsheetApp.getUi().showModalDialog(html, 'Painel Executivo — SENAPPEN 2026');
}

/**
 * Abre o Módulo de Gestão Operacional em Modal
 */
function abrirGestaoModal() {
  const template = HtmlService.createTemplateFromFile('index');
  const html = template.evaluate().setWidth(1360).setHeight(840);
  SpreadsheetApp.getUi().showModalDialog(html, 'Gestão Operacional — SENAPPEN 2026');
}

/**
 * Abre a barra lateral
 */
function abrirDashboardSidebar() {
  const template = HtmlService.createTemplateFromFile('index');
  const html = template.evaluate().setTitle('Inventário SENAPPEN 2026');
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Inclusão de templates parciais
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/* ============================================================================
 * ENDPOINTS PÚBLICOS (Chamados pelo Frontend via google.script.run)
 * ============================================================================ */

function getInventarioData() {
  return DashboardController.obterDados();
}

function salvarUorg(payload) {
  return GestaoController.salvarUorg(payload);
}

function obterUorg(id) {
  return GestaoController.obterUorg(id);
}

function recalcularStatusPlanilha() {
  const res = GestaoController.recalcularFases();
  try {
    SpreadsheetApp.getUi().alert(res.mensagem);
  } catch (e) {
    console.log(res.mensagem);
  }
  return res;
}

function inicializarEstruturaBanco() {
  let ui = null;
  try { ui = SpreadsheetApp.getUi(); } catch (e) {}

  if (ui) {
    const resp = ui.alert(
      'Estruturação do Banco de Dados — SENAPPEN 2026',
      'Deseja criar e formatar as 5 abas relacionais com as 224 UORGs na planilha?',
      ui.ButtonSet.YES_NO
    );
    if (resp !== ui.Button.YES) return;
  }

  const res = AdminController.inicializarEstrutura();
  if (ui) {
    ui.alert('Sucesso!', res.mensagem, ui.ButtonSet.OK);
  }
  return res;
}
