/**
 * ============================================================================
 * [MODEL] ACESSO A DADOS E REGRAS DE NEGÓCIO - SENAPPEN 2026
 * ============================================================================
 */

const Database = {
  getSpreadsheet: function() {
    if (CONFIG.SPREADSHEET_ID) {
      try {
        return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
      } catch (e) {
        console.warn('Falha ao abrir por ID, usando planilha ativa:', e);
      }
    }
    return SpreadsheetApp.getActiveSpreadsheet();
  },

  getSheet: function(nomeAba) {
    const ss = this.getSpreadsheet();
    return ss ? ss.getSheetByName(nomeAba) : null;
  }
};

const InventarioModel = {
  /**
   * Obtém todos os registros da tabela de acompanhamento
   */
  obterTodos: function() {
    const sheet = Database.getSheet(CONFIG.ABAS.INVENTARIO);
    if (!sheet || sheet.getLastRow() < 2) return [];

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);

    return rows.map(row => {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = row[idx];
      });
      return obj;
    });
  },

  /**
   * Obtém uma UORG específica pelo ID
   */
  obterPorId: function(id) {
    const sheet = Database.getSheet(CONFIG.ABAS.INVENTARIO);
    if (!sheet || sheet.getLastRow() < 2) return null;

    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    for (let r = 1; r < data.length; r++) {
      if (data[r][0] == id) {
        const obj = { rowIndex: r + 1 };
        headers.forEach((h, idx) => {
          obj[h] = data[r][idx];
        });
        return obj;
      }
    }
    return null;
  },

  /**
   * Valida e atualiza os dados de uma UORG
   */
  atualizar: function(id, payload) {
    const sheet = Database.getSheet(CONFIG.ABAS.INVENTARIO);
    if (!sheet) throw new Error('Aba ' + CONFIG.ABAS.INVENTARIO + ' não encontrada.');

    const uorg = this.obterPorId(id);
    if (!uorg) throw new Error('UORG com ID ' + id + ' não localizada.');

    // Validações
    this.validarPayload(payload);

    // Mapeamento de colunas na planilha
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const mapCols = {};
    headers.forEach((h, idx) => { mapCols[h] = idx + 1; });

    const row = uorg.rowIndex;

    if (payload.processo_sei !== undefined && mapCols['processo_sei']) {
      sheet.getRange(row, mapCols['processo_sei']).setValue(payload.processo_sei.trim());
    }

    if (payload.processo_sei_link !== undefined && mapCols['processo_sei_link']) {
      sheet.getRange(row, mapCols['processo_sei_link']).setValue(payload.processo_sei_link.trim());
    }

    if (payload.bens_acautelados_doc !== undefined && mapCols['bens_acautelados_doc']) {
      sheet.getRange(row, mapCols['bens_acautelados_doc']).setValue(payload.bens_acautelados_doc.trim());
    }

    if (payload.relatorio_uorg !== undefined && mapCols['relatorio_uorg']) {
      sheet.getRange(row, mapCols['relatorio_uorg']).setValue(payload.relatorio_uorg.trim());
    }

    if (payload.relatorio_final_ug !== undefined && mapCols['relatorio_final_ug']) {
      sheet.getRange(row, mapCols['relatorio_final_ug']).setValue(payload.relatorio_final_ug.trim());
    }

    if (payload.status_simplificado !== undefined && mapCols['status_simplificado']) {
      sheet.getRange(row, mapCols['status_simplificado']).setValue(payload.status_simplificado);
    }

    // Auditoria automática
    const dataHora = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm:ss');
    let emailUser = 'Sistema';
    try {
      emailUser = Session.getActiveUser().getEmail() || 'Gestor';
    } catch (e) {}

    if (mapCols['atualizado_em']) {
      sheet.getRange(row, mapCols['atualizado_em']).setValue(dataHora);
    }
    if (mapCols['usuario_editor']) {
      sheet.getRange(row, mapCols['usuario_editor']).setValue(emailUser);
    }

    return {
      sucesso: true,
      id: id,
      atualizado_em: dataHora,
      usuario: emailUser
    };
  },

  /**
   * Valida regras de negócio para a atualização
   */
  validarPayload: function(payload) {
    if (payload.status_simplificado && !CONFIG.STATUS_VALIDOS.includes(payload.status_simplificado)) {
      throw new Error('Status inválido: ' + payload.status_simplificado);
    }

    if (payload.processo_sei_link && !payload.processo_sei_link.startsWith('http')) {
      throw new Error('O link do processo deve começar com http:// ou https://');
    }
  },

  /**
   * Inicializa o banco com os seeds
   */
  inicializarBanco: function(dashData) {
    const ss = Database.getSpreadsheet();
    if (!ss) throw new Error('Não foi possível conectar à planilha.');

    // 1. Aba tb_ciclo_inventario
    this._criarAba(ss, CONFIG.ABAS.CICLO, [
      'id_ciclo', 'ano_exercicio', 'processo_sei_mae', 'oficio_circular',
      'data_limite_cautela', 'data_limite_final', 'status_ciclo', 'descricao'
    ], [
      [
        1, CONFIG.EXERCICIO, CONFIG.PROCESSO_MAE, CONFIG.OFICIO_CIRCULAR,
        CONFIG.PRAZOS.BENS_ACAUTELADOS, CONFIG.PRAZOS.RELATORIO_FINAL_UG,
        'EM_ANDAMENTO', 'Inventário Físico-Financeiro Anual da SENAPPEN - Exercício 2026'
      ]
    ]);

    // 2. Aba tb_ug
    const ugRows = dashData.ugs.map(ug => [
      ug.ug_id, ug.codigo, ug.sigla, ug.nome, ug.tipo,
      ug.processo_ug || '', ug.portaria_geral || ''
    ]);
    this._criarAba(ss, CONFIG.ABAS.UG, [
      'id_ug', 'codigo_ug', 'sigla_ug', 'nome_ug', 'tipo_ug', 'processo_sei_ug', 'portaria_geral'
    ], ugRows);

    // 3. Aba tb_inventario_acompanhamento
    const headersInv = [
      'id', 'ug_id', 'ug_sigla', 'ug_nome', 'ug_tipo', 'sequencia_ug',
      'uorg_codigo', 'uorg_sigla', 'comissao_designacao', 'processo_sei',
      'processo_sei_link', 'bens_acautelados_doc', 'bens_acautelados_link',
      'relatorios_sgp', 'relatorio_uorg', 'relatorio_final_ug',
      'status_simplificado', 'status_fase', 'data_limite_cautela', 'data_limite_final',
      'atualizado_em', 'usuario_editor'
    ];

    const invRows = dashData.inventario.map(item => [
      item.id, item.ug_id, item.ug_sigla, item.ug_nome, item.ug_tipo, item.sequencia_ug,
      item.uorg_codigo, item.uorg_sigla, item.comissao_designacao, item.processo_sei,
      item.processo_sei_link, item.bens_acautelados_doc, item.bens_acautelados_link,
      item.relatorios_sgp, item.relatorio_uorg, item.relatorio_final_ug,
      item.status_simplificado, item.status_fase, item.data_limite_cautela, item.data_limite_final,
      Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm:ss'),
      'Carga Inicial'
    ]);

    this._criarAba(ss, CONFIG.ABAS.INVENTARIO, headersInv, invRows);

    // 4. Aba tb_capacitacao
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
    this._criarAba(ss, CONFIG.ABAS.CAPACITACAO, [
      'id_capacitacao', 'id_ug', 'sigla_ug', 'nome_servidor', 'observacao_oficio'
    ], capRows);

    return { totalUorgs: invRows.length, totalUgs: ugRows.length };
  },

  _criarAba: function(ss, nomeAba, headers, dados) {
    let sheet = ss.getSheetByName(nomeAba);
    if (!sheet) {
      sheet = ss.insertSheet(nomeAba);
    } else {
      sheet.clear();
    }

    sheet.appendRow(headers);
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange
      .setBackground('#1e3a8a')
      .setFontColor('#ffffff')
      .setFontWeight('bold')
      .setFontFamily('Arial')
      .setHorizontalAlignment('center');

    sheet.setFrozenRows(1);
    if (dados && dados.length > 0) {
      sheet.getRange(2, 1, dados.length, headers.length).setValues(dados);
    }
    sheet.autoResizeColumns(1, headers.length);
  }
};
