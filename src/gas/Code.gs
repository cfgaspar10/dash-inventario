/**
 * ========================================================
 * PAINEL DE INVENTÁRIO ANUAL SENAPPEN 2026
 * Google Apps Script (Backend & Web App)
 * ========================================================
 */

// Configurações Globais
const CONFIG = {
  EXERCICIO: 2026,
  PROCESSO_MAE: '08016.007081/2026-59',
  OFICIO_CIRCULAR: 'Ofício-Circular nº /2026/DIREX/SENAPPEN/MJ (SEI 35011389)',
  ABA_INVENTARIO: 'tb_inventario_acompanhamento',
  ABA_UG: 'tb_ug'
};

/**
 * Ponto de entrada do Web App (Google Apps Script)
 */
function doGet(e) {
  const template = HtmlService.createTemplateFromFile('gas/index');
  return template.evaluate()
    .setTitle('Painel de Acompanhamento do Inventário 2026 — SENAPPEN')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Inclui arquivos parciais no HTML (CSS, JS)
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Retorna todos os dados consolidados do inventário para o frontend
 */
function getInventarioData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.ABA_INVENTARIO);
    
    if (!sheet) {
      // Retorna fallback estruturado caso a aba ainda não esteja criada
      return { status: 'error', message: 'Aba de inventário não encontrada.' };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);

    const items = rows.map((row, index) => {
      const obj = { id: index + 1 };
      headers.forEach((h, i) => {
        obj[h] = row[i];
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
    return { status: 'error', message: err.toString() };
  }
}

/**
 * Atualiza o status de uma UORG na planilha
 */
function atualizarStatusUorg(id, novoStatus, processoSei, bensAcautelados) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.ABA_INVENTARIO);
    if (!sheet) throw new Error('Aba não encontrada.');

    // Localizar linha pelo ID (coluna A)
    const data = sheet.getDataRange().getValues();
    for (let r = 1; r < data.length; r++) {
      if (data[r][0] == id) {
        // Atualiza campos
        if (novoStatus) sheet.getRange(r + 1, 12).setValue(novoStatus); // Coluna status
        if (processoSei) sheet.getRange(r + 1, 5).setValue(processoSei); // Coluna processo
        if (bensAcautelados) sheet.getRange(r + 1, 6).setValue(bensAcautelados); // Coluna cautela
        return { status: 'success', message: 'UORG atualizada com sucesso!' };
      }
    }
    return { status: 'error', message: 'UORG com ID informado não localizada.' };
  } catch (err) {
    return { status: 'error', message: err.toString() };
  }
}
