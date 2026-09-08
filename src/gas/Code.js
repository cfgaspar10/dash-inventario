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
  // Suporte a API REST via GET caso solicitado (?api=true&action=...)
  if (e && e.parameter && e.parameter.api === 'true') {
    const action = e.parameter.action || 'obterDadosCompletos';
    let res = null;
    try {
      if (action === 'obterDadosCompletos') {
        res = DashboardController.obterDadosCompletos();
      } else if (action === 'listarUsuarios') {
        res = UsuarioController.listar();
      } else if (action === 'obterDadosConfig') {
        res = AdminConfigController.obterDadosConfig();
      } else {
        res = { status: 'error', mensagem: 'Ação GET desconhecida: ' + action };
      }
    } catch (err) {
      res = { status: 'error', mensagem: err.message || err.toString() };
    }
    return ContentService.createTextOutput(JSON.stringify(res))
      .setMimeType(ContentService.MimeType.JSON);
  }

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

/**
 * Ponto de entrada para requisições POST (API REST para Vercel e integrações externas)
 */
function doPost(e) {
  let payload = {};
  try {
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      payload = e.parameter;
    }
  } catch (parseErr) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      mensagem: 'Falha ao processar payload JSON: ' + parseErr.message
    })).setMimeType(ContentService.MimeType.JSON);
  }

  const action = payload.action;
  let resposta = { status: 'error', mensagem: 'Ação não especificada.' };

  try {
    switch (action) {
      // Autenticação & Usuários
      case 'autenticar':
        resposta = UsuarioController.autenticar(payload.login, payload.senha);
        break;
      case 'listarUsuarios':
        resposta = UsuarioController.listar();
        break;
      case 'salvarUsuario':
        resposta = UsuarioController.salvar(payload.usuario);
        break;
      case 'excluirUsuario':
        resposta = UsuarioController.excluir(payload.id);
        break;
      case 'alterarSenhaUsuario':
        resposta = UsuarioController.alterarSenha(payload.id, payload.novaSenha);
        break;

      // Dados Operacionais e Dashboard
      case 'obterDadosCompletos':
        resposta = DashboardController.obterDadosCompletos();
        break;
      case 'getInventarioData':
        resposta = DashboardController.obterDados();
        break;
      case 'salvarUorg':
        resposta = GestaoController.salvarUorg(payload.uorg);
        break;
      case 'obterUorg':
        resposta = GestaoController.obterUorg(payload.id);
        break;
      case 'recalcularStatus':
        resposta = GestaoController.recalcularFases();
        break;

      // Configurações & Parametrização
      case 'obterDadosConfig':
        resposta = AdminConfigController.obterDadosConfig();
        break;
      case 'salvarUg':
        resposta = AdminConfigController.salvarUg(payload.ug);
        break;
      case 'excluirUg':
        resposta = AdminConfigController.excluirUg(payload.siglaOuId);
        break;
      case 'cadastrarUorg':
        resposta = AdminConfigController.cadastrarUorg(payload.uorg);
        break;
      case 'excluirUorg':
        resposta = AdminConfigController.excluirUorg(payload.id);
        break;
      case 'toggleUorg':
        resposta = AdminConfigController.toggleUorg(payload.id, payload.ativo);
        break;
      case 'salvarParametrosCiclo':
        resposta = AdminConfigController.salvarParametrosCiclo(payload.ciclo);
        break;
      case 'ativarCiclo':
        resposta = AdminConfigController.ativarCiclo(payload.idOuAno);
        break;
      case 'excluirCiclo':
        resposta = AdminConfigController.excluirCiclo(payload.idOuAno);
        break;
      case 'salvarEtapaCronograma':
        resposta = AdminConfigController.salvarEtapaCronograma(payload.etapa);
        break;
      case 'excluirEtapaCronograma':
        resposta = AdminConfigController.excluirEtapaCronograma(payload.id);
        break;

      default:
        resposta = { status: 'error', mensagem: 'Ação não reconhecida: ' + action };
    }
  } catch (execErr) {
    resposta = { status: 'error', mensagem: execErr.message || execErr.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(resposta))
    .setMimeType(ContentService.MimeType.JSON);
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

// Endpoints de Usuários e Autenticação
function autenticarUsuario(login, senha) {
  return UsuarioController.autenticar(login, senha);
}

function listarUsuarios() {
  return UsuarioController.listar();
}

function salvarUsuario(payload) {
  return UsuarioController.salvar(payload);
}

function excluirUsuario(id) {
  return UsuarioController.excluir(id);
}

function alterarSenhaUsuario(id, novaSenha) {
  return UsuarioController.alterarSenha(id, novaSenha);
}

