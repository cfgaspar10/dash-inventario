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
    .addItem('⚙️ Configurações & Estrutura', 'abrirConfigModal')
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
  try {
    const dados = DashboardController.obterDadosCompletos();
    template.dadosIniciais = JSON.stringify(dados);
  } catch (err) {
    console.error('Erro ao ler banco no doGet:', err);
    template.dadosIniciais = 'null';
  }
  return template.evaluate()
    .setTitle('Sistema de Gestão do Inventário 2026 — SENAPPEN')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function abrirDashboardModal() {
  const template = HtmlService.createTemplateFromFile('index');
  try {
    template.dadosIniciais = JSON.stringify(DashboardController.obterDadosCompletos());
  } catch (e) { template.dadosIniciais = 'null'; }
  const html = template.evaluate().setWidth(1360).setHeight(840);
  SpreadsheetApp.getUi().showModalDialog(html, 'Painel Executivo — SENAPPEN 2026');
}

function abrirGestaoModal() {
  const template = HtmlService.createTemplateFromFile('index');
  try {
    template.dadosIniciais = JSON.stringify(DashboardController.obterDadosCompletos());
  } catch (e) { template.dadosIniciais = 'null'; }
  const html = template.evaluate().setWidth(1360).setHeight(840);
  SpreadsheetApp.getUi().showModalDialog(html, 'Gestão Operacional — SENAPPEN 2026');
}

function abrirConfigModal() {
  const template = HtmlService.createTemplateFromFile('index');
  try {
    template.dadosIniciais = JSON.stringify(DashboardController.obterDadosCompletos());
  } catch (e) { template.dadosIniciais = 'null'; }
  const html = template.evaluate().setWidth(1360).setHeight(840);
  SpreadsheetApp.getUi().showModalDialog(html, 'Administração e Configurações — SENAPPEN 2026');
}

function abrirDashboardSidebar() {
  const template = HtmlService.createTemplateFromFile('index');
  try {
    template.dadosIniciais = JSON.stringify(DashboardController.obterDadosCompletos());
  } catch (e) { template.dadosIniciais = 'null'; }
  const html = template.evaluate().setTitle('Inventário SENAPPEN 2026');
  SpreadsheetApp.getUi().showSidebar(html);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/* ============================================================================
 * ENDPOINTS PÚBLICOS (Chamados pelo Frontend via google.script.run)
 * ============================================================================ */

function getInventarioData() {
  return DashboardController.obterDados();
}

function obterDadosCompletos() {
  return DashboardController.obterDadosCompletos();
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

// Endpoints do Módulo de Configurações
function obterDadosConfig() {
  return AdminConfigController.obterDadosConfig();
}

function salvarUg(payload) {
  return AdminConfigController.salvarUg(payload);
}

function excluirUg(siglaOuId) {
  return AdminConfigController.excluirUg(siglaOuId);
}

function restaurarUgsPadrao() {
  return AdminConfigController.restaurarUgsPadrao();
}

function cadastrarUorg(payload) {
  return AdminConfigController.cadastrarUorg(payload);
}

function excluirUorg(id) {
  return AdminConfigController.excluirUorg(id);
}

function toggleUorg(id, novoStatusAtivo) {
  return AdminConfigController.toggleUorg(id, novoStatusAtivo);
}

function salvarParametrosCiclo(payload) {
  return AdminConfigController.salvarParametrosCiclo(payload);
}

function ativarCiclo(idOuAno) {
  return AdminConfigController.ativarCiclo(idOuAno);
}

function excluirCiclo(idOuAno) {
  return AdminConfigController.excluirCiclo(idOuAno);
}

function salvarEtapaCronograma(payload) {
  return AdminConfigController.salvarEtapaCronograma(payload);
}

function excluirEtapaCronograma(id) {
  return AdminConfigController.excluirEtapaCronograma(id);
}

