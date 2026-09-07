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

  sanitizarValor: function(val) {
    if (val === null || val === undefined) return '';
    if (val instanceof Date) {
      return Utilities.formatDate(val, 'America/Sao_Paulo', 'yyyy-MM-dd');
    }
    if (typeof val === 'string' && (val.indexOf('GMT') !== -1 || val.indexOf('Horário') !== -1 || /^[A-Za-z]{3}\s+[A-Za-z]{3}/.test(val))) {
      try {
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          return Utilities.formatDate(d, 'America/Sao_Paulo', 'yyyy-MM-dd');
        }
      } catch (e) {}
    }
    return val;
  },

  formatarDataPtBr: function(val) {
    if (!val) return '';
    if (val instanceof Date) {
      return Utilities.formatDate(val, 'America/Sao_Paulo', 'dd/MM/yyyy');
    }
    const str = String(val).trim();
    if (!str) return '';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str) || /^\d{2}-\d{2}\/\d{2}\/\d{4}$/.test(str)) {
      return str;
    }
    if (str.indexOf('GMT') !== -1 || str.indexOf('Horário') !== -1 || /^[A-Za-z]{3}\s+[A-Za-z]{3}/.test(str)) {
      try {
        const d = new Date(str);
        if (!isNaN(d.getTime())) {
          return Utilities.formatDate(d, 'America/Sao_Paulo', 'dd/MM/yyyy');
        }
      } catch (e) {}
    }
    const m = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      return m[3] + '/' + m[2] + '/' + m[1];
    }
    return str;
  },

  getSheet: function(nomeAba, autoCriar = true) {
    const ss = this.getSpreadsheet();
    if (!ss) return null;
    let sheet = ss.getSheetByName(nomeAba);
    if (!sheet && autoCriar) {
      sheet = this._autoCriarAba(ss, nomeAba);
    }
    return sheet;
  },

  _autoCriarAba: function(ss, nomeAba) {
    let sheet = ss.getSheetByName(nomeAba);
    if (sheet) return sheet;

    let headers = [];
    let dados = [];

    if (nomeAba === CONFIG.ABAS.UG) {
      headers = ['id_ug', 'codigo_ug', 'sigla_ug', 'nome_ug', 'tipo_ug', 'processo_sei_ug', 'portaria_geral', 'ativo'];
      dados = [
        [1, '200601', 'GAB', 'GABINETE DA SECRETARIA NACIONAL', 'DIRETORIA', '', '', 'S'],
        [2, '200602', 'DIREX', 'DIRETORIA DE EXECUÇÃO PENAL', 'DIRETORIA', '', '', 'S'],
        [3, '200603', 'DIRPP', 'DIRETORIA DE POLÍTICAS PENITENCIÁRIAS', 'DIRETORIA', '', '', 'S'],
        [4, '200604', 'DISPF', 'DIRETORIA DO SISTEMA PENITENCIÁRIO FEDERAL', 'DIRETORIA', '', '', 'S'],
        [5, '200605', 'DIRIN', 'DIRETORIA DE INTELIGÊNCIA PENITENCIÁRIA', 'DIRETORIA', '', '', 'S'],
        [6, '200606', 'PFCG', 'PENITENCIÁRIA FEDERAL EM CAMPO GRANDE', 'PENITENCIARIA_FEDERAL', '', '', 'S'],
        [7, '200607', 'PFCAT', 'PENITENCIÁRIA FEDERAL EM CATANDUVAS', 'PENITENCIARIA_FEDERAL', '', '', 'S'],
        [8, '200608', 'PFPV', 'PENITENCIÁRIA FEDERAL EM PORTO VELHO', 'PENITENCIARIA_FEDERAL', '', '', 'S'],
        [9, '200609', 'PFMOS', 'PENITENCIÁRIA FEDERAL EM MOSSORÓ', 'PENITENCIARIA_FEDERAL', '', '', 'S'],
        [10, '200610', 'PFBRA', 'PENITENCIÁRIA FEDERAL EM BRASÍLIA', 'PENITENCIARIA_FEDERAL', '', '', 'S']
      ];
    } else if (nomeAba === CONFIG.ABAS.CICLO) {
      headers = ['id_ciclo', 'ano_exercicio', 'processo_sei_mae', 'oficio_circular', 'data_limite_cautela', 'data_limite_final', 'status_ciclo', 'ativo'];
      dados = [
        [1, 2026, CONFIG.PROCESSO_MAE, CONFIG.OFICIO_CIRCULAR, CONFIG.PRAZOS.BENS_ACAUTELADOS, CONFIG.PRAZOS.RELATORIO_FINAL_UG, 'EM_ANDAMENTO', 'S']
      ];
    } else if (nomeAba === CONFIG.ABAS.CRONOGRAMA) {
      headers = ['id_etapa', 'data', 'label', 'acao', 'responsavel', 'status', 'ordem'];
      dados = [
        [1, '2026-07-28', '28/07/2026', 'Portaria de designação da Comissão e instauração do processo da UG', 'Ordenador de Despesa', 'concluido', 1],
        [2, '2026-08-28', '27-28/08/2026', 'Capacitação presencial na sede SENAPPEN (RFID e procedimentos)', 'Sede e Penitenciárias', 'concluido', 2],
        [3, '2026-08-31', '31/08/2026', 'Declaração de Bens Acautelados (Proc. 08016.007081/2026-59)', 'Resp. Carga Patrimonial', 'em_andamento', 3],
        [4, '2026-08-31', '31/08/2026', 'Instauração dos processos de inventário por UORG e ofício', 'Comissão de Inventário', 'em_andamento', 4],
        [5, '2026-09-02', '01-02/09/2026', 'Replicação da capacitação nas Penitenciárias Federais', 'Comissões Locais', 'em_andamento', 5],
        [6, '2026-11-30', '30/11/2026', 'Expedição do Relatório Final da Unidade Gestora', 'Comissão de Inventário', 'pendente', 6],
        [7, '2026-12-10', '10/12/2026', 'Aprovação do Relatório Final pelo Ordenador de Despesas', 'Ordenador de Despesa', 'pendente', 7],
        [8, '2026-12-31', '31/12/2026', 'Processamento e conciliação patrimonial/contábil (SIADS e SIAFI)', 'Patrimônio da UG', 'pendente', 8]
      ];
    } else {
      sheet = ss.insertSheet(nomeAba);
      return sheet;
    }

    try {
      sheet = ss.insertSheet(nomeAba);
      sheet.appendRow(headers);
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#002B49');
      headerRange.setFontColor('#FFFFFF');
      headerRange.setFontWeight('bold');

      if (dados.length > 0) {
        sheet.getRange(2, 1, dados.length, headers.length).setValues(dados);
      }
      sheet.setFrozenRows(1);
    } catch (e) {
      console.warn('Erro ao auto-criar aba ' + nomeAba + ':', e);
    }
    return sheet;
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
        let val = row[idx];
        obj[h] = Database.sanitizarValor(val);
      });
      if (obj.id) obj.id = parseInt(obj.id, 10) || obj.id;
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
   * Cadastra uma nova UORG vinculada a uma UG
   */
  cadastrarUorg: function(payload) {
    const sheet = Database.getSheet(CONFIG.ABAS.INVENTARIO);
    if (!sheet) throw new Error('Aba ' + CONFIG.ABAS.INVENTARIO + ' não encontrada.');

    if (!payload.ug_sigla || !payload.uorg_sigla) {
      throw new Error('A UG e a Sigla da UORG são obrigatórias.');
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const mapCols = {};
    headers.forEach((h, idx) => { mapCols[h] = idx + 1; });

    // Encontrar próximo ID
    let maxId = 0;
    for (let r = 1; r < data.length; r++) {
      const val = parseInt(data[r][0], 10);
      if (!isNaN(val) && val > maxId) maxId = val;
    }
    const novoId = maxId + 1;

    // Buscar dados da UG pai
    const ug = UgModel.obterPorSigla(payload.ug_sigla);
    const ugId = ug ? ug.id_ug : 1;
    const ugNome = ug ? ug.nome_ug : payload.ug_sigla;
    const ugTipo = ug ? ug.tipo_ug : (payload.ug_tipo || 'DIRETORIA');

    const dataHora = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm:ss');
    let emailUser = 'Sistema';
    try { emailUser = Session.getActiveUser().getEmail() || 'Gestor'; } catch (e) {}

    // Linha completa correspondente aos headers
    const novaLinha = headers.map(h => {
      switch (h) {
        case 'id': return novoId;
        case 'ug_id': return ugId;
        case 'ug_sigla': return payload.ug_sigla;
        case 'ug_nome': return ugNome;
        case 'ug_tipo': return ugTipo;
        case 'sequencia_ug': return 999;
        case 'uorg_codigo': return payload.uorg_codigo || '';
        case 'uorg_sigla': return payload.uorg_sigla;
        case 'comissao_designacao': return payload.comissao_designacao || '';
        case 'processo_sei': return payload.processo_sei || '';
        case 'processo_sei_link': return payload.processo_sei_link || '';
        case 'bens_acautelados_doc': return payload.bens_acautelados_doc || '';
        case 'bens_acautelados_link': return payload.bens_acautelados_link || '';
        case 'relatorios_sgp': return '';
        case 'relatorio_uorg': return '';
        case 'relatorio_final_ug': return '';
        case 'status_simplificado': return payload.status_simplificado || 'Não iniciado';
        case 'status_fase': return 'PENDENTE_INICIAL';
        case 'data_limite_cautela': return CONFIG.PRAZOS.BENS_ACAUTELADOS;
        case 'data_limite_final': return CONFIG.PRAZOS.RELATORIO_FINAL_UG;
        case 'ativo': return 'S';
        case 'atualizado_em': return dataHora;
        case 'usuario_editor': return emailUser;
        default: return '';
      }
    });

    sheet.appendRow(novaLinha);

    return {
      sucesso: true,
      id: novoId,
      ug_sigla: payload.ug_sigla,
      uorg_sigla: payload.uorg_sigla
    };
  },

  /**
   * Alterna status Ativo/Inativo de uma UORG (soft delete)
   */
  alternarStatusUorg: function(id, novoStatusAtivo) {
    const sheet = Database.getSheet(CONFIG.ABAS.INVENTARIO);
    if (!sheet) throw new Error('Aba não encontrada.');

    const uorg = this.obterPorId(id);
    if (!uorg) throw new Error('UORG não encontrada.');

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    let colAtivo = headers.indexOf('ativo') + 1;

    // Se coluna não existir, cria no cabeçalho
    if (colAtivo === 0) {
      colAtivo = headers.length + 1;
      sheet.getRange(1, colAtivo).setValue('ativo');
    }

    sheet.getRange(uorg.rowIndex, colAtivo).setValue(novoStatusAtivo);
    return { sucesso: true, id: id, ativo: novoStatusAtivo };
  },

  /**
   * Exclui definitivamente uma UORG da base de dados
   */
  excluirUorg: function(id) {
    const sheet = Database.getSheet(CONFIG.ABAS.INVENTARIO, true);
    if (!sheet) throw new Error('Aba ' + CONFIG.ABAS.INVENTARIO + ' não encontrada.');

    const data = sheet.getDataRange().getValues();
    for (let r = 1; r < data.length; r++) {
      if (data[r][0] == id) {
        sheet.deleteRow(r + 1);
        return { sucesso: true, id: id, mensagem: 'UORG excluída com sucesso!' };
      }
    }
    throw new Error('UORG com ID ' + id + ' não localizada para exclusão.');
  },

  /**
   * Valida e atualiza os dados operacionais de uma UORG
   */
  atualizar: function(id, payload) {
    const sheet = Database.getSheet(CONFIG.ABAS.INVENTARIO);
    if (!sheet) throw new Error('Aba ' + CONFIG.ABAS.INVENTARIO + ' não encontrada.');

    const uorg = this.obterPorId(id);
    if (!uorg) throw new Error('UORG com ID ' + id + ' não localizada.');

    this.validarPayload(payload);

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

    const dataHora = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm:ss');
    let emailUser = 'Sistema';
    try { emailUser = Session.getActiveUser().getEmail() || 'Gestor'; } catch (e) {}

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

  validarPayload: function(payload) {
    if (payload.status_simplificado && !CONFIG.STATUS_VALIDOS.includes(payload.status_simplificado)) {
      throw new Error('Status inválido: ' + payload.status_simplificado);
    }
    if (payload.processo_sei_link && !payload.processo_sei_link.startsWith('http')) {
      throw new Error('O link do processo deve começar com http:// ou https://');
    }
  },

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
      ug.processo_ug || '', ug.portaria_geral || '', 'S'
    ]);
    this._criarAba(ss, CONFIG.ABAS.UG, [
      'id_ug', 'codigo_ug', 'sigla_ug', 'nome_ug', 'tipo_ug', 'processo_sei_ug', 'portaria_geral', 'ativo'
    ], ugRows);

    // 3. Aba tb_inventario_acompanhamento
    const headersInv = [
      'id', 'ug_id', 'ug_sigla', 'ug_nome', 'ug_tipo', 'sequencia_ug',
      'uorg_codigo', 'uorg_sigla', 'comissao_designacao', 'processo_sei',
      'processo_sei_link', 'bens_acautelados_doc', 'bens_acautelados_link',
      'relatorios_sgp', 'relatorio_uorg', 'relatorio_final_ug',
      'status_simplificado', 'status_fase', 'data_limite_cautela', 'data_limite_final',
      'ativo', 'atualizado_em', 'usuario_editor'
    ];

    const invRows = dashData.inventario.map(item => [
      item.id, item.ug_id, item.ug_sigla, item.ug_nome, item.ug_tipo, item.sequencia_ug,
      item.uorg_codigo, item.uorg_sigla, item.comissao_designacao, item.processo_sei,
      item.processo_sei_link, item.bens_acautelados_doc, item.bens_acautelados_link,
      item.relatorios_sgp, item.relatorio_uorg, item.relatorio_final_ug,
      item.status_simplificado, item.status_fase, item.data_limite_cautela, item.data_limite_final,
      'S',
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

/**
 * Modelo para Gestão de Unidades Gestoras (UGs)
 */
const UgModel = {
  obterTodas: function() {
    const sheet = Database.getSheet(CONFIG.ABAS.UG, true);
    if (!sheet || sheet.getLastRow() < 2) return [];

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);

    return rows.map((row, idx) => {
      const obj = { rowIndex: idx + 2 };
      headers.forEach((h, i) => { 
        obj[h] = row[i]; 
      });
      // Normalização de propriedades para total compatibilidade com frontend
      obj.ug_id = obj.id_ug || (idx + 1);
      obj.id = obj.ug_id;
      obj.codigo = obj.codigo_ug || obj.codigo_siafi || '';
      obj.codigo_siafi = obj.codigo;
      obj.sigla = String(obj.sigla_ug || obj.sigla || '').trim();
      obj.nome = String(obj.nome_ug || obj.nome || '').trim();
      obj.tipo = String(obj.tipo_ug || obj.tipo || 'DIRETORIA').trim();
      obj.processo_sei = String(obj.processo_sei_ug || obj.processo_sei || '').trim();
      obj.portaria_geral = String(obj.portaria_geral || obj.portaria || '').trim();
      obj.ativo = String(obj.ativo || 'S').trim().toUpperCase();
      return obj;
    });
  },

  obterPorSigla: function(sigla) {
    const todas = this.obterTodas();
    return todas.find(u => (u.sigla_ug || u.sigla) === sigla) || null;
  },

  salvar: function(payload) {
    const sheet = Database.getSheet(CONFIG.ABAS.UG, true);
    if (!sheet) throw new Error('Aba ' + CONFIG.ABAS.UG + ' não encontrada.');

    const sigla = (payload.sigla_ug || payload.sigla || '').trim().toUpperCase();
    const nome = (payload.nome_ug || payload.nome || '').trim().toUpperCase();
    const codigo = payload.codigo_ug || payload.codigo_siafi || '';
    const tipo = payload.tipo_ug || payload.tipo || 'DIRETORIA';
    const processoSei = (payload.processo_sei_ug || payload.processo_sei || '').trim();
    const portaria = (payload.portaria_geral || payload.portaria_designacao || '').trim();

    if (!sigla || !nome) {
      throw new Error('Sigla e Nome da UG são obrigatórios.');
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const mapCols = {};
    headers.forEach((h, i) => { mapCols[h] = i + 1; });

    // Verifica se é edição (por ID ou sigla já existente)
    let rowEncontrada = -1;
    for (let r = 1; r < data.length; r++) {
      if ((payload.id_ug && data[r][0] == payload.id_ug) || (data[r][mapCols['sigla_ug'] - 1] == sigla)) {
        rowEncontrada = r + 1;
        break;
      }
    }

    if (rowEncontrada > 1) {
      if (mapCols['codigo_ug']) sheet.getRange(rowEncontrada, mapCols['codigo_ug']).setValue(codigo);
      if (mapCols['sigla_ug']) sheet.getRange(rowEncontrada, mapCols['sigla_ug']).setValue(sigla);
      if (mapCols['nome_ug']) sheet.getRange(rowEncontrada, mapCols['nome_ug']).setValue(nome);
      if (mapCols['tipo_ug']) sheet.getRange(rowEncontrada, mapCols['tipo_ug']).setValue(tipo);
      if (mapCols['processo_sei_ug']) sheet.getRange(rowEncontrada, mapCols['processo_sei_ug']).setValue(processoSei);
      if (mapCols['portaria_geral']) sheet.getRange(rowEncontrada, mapCols['portaria_geral']).setValue(portaria);
      return { sucesso: true, sigla: sigla, operacao: 'atualizacao' };
    }

    // Inclusão de Nova UG
    let maxId = 0;
    for (let r = 1; r < data.length; r++) {
      const val = parseInt(data[r][0], 10);
      if (!isNaN(val) && val > maxId) maxId = val;
    }
    const novoId = maxId + 1;

    const novaLinha = headers.map(h => {
      switch (h) {
        case 'id_ug': return novoId;
        case 'codigo_ug': return codigo;
        case 'sigla_ug': return sigla;
        case 'nome_ug': return nome;
        case 'tipo_ug': return tipo;
        case 'processo_sei_ug': return processoSei;
        case 'portaria_geral': return portaria;
        case 'ativo': return 'S';
        default: return '';
      }
    });

    sheet.appendRow(novaLinha);
    return { sucesso: true, id: novoId, sigla: sigla, operacao: 'inclusao' };
  },

  excluir: function(siglaOuId) {
    const sheet = Database.getSheet(CONFIG.ABAS.UG, true);
    if (!sheet) throw new Error('Aba ' + CONFIG.ABAS.UG + ' não encontrada.');

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const siglaCol = headers.indexOf('sigla_ug');

    for (let r = 1; r < data.length; r++) {
      if (data[r][0] == siglaOuId || (siglaCol >= 0 && data[r][siglaCol] == siglaOuId)) {
        sheet.deleteRow(r + 1);
        return { sucesso: true, mensagem: 'UG excluída com sucesso!' };
      }
    }
    throw new Error('Unidade Gestora não localizada para exclusão.');
  }
};

/**
 * Modelo para Gestão de Exercícios / Ciclos de Inventário
 */
const CicloModel = {
  obterTodos: function() {
    const sheet = Database.getSheet(CONFIG.ABAS.CICLO, true);
    if (!sheet || sheet.getLastRow() < 2) return [];

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);

    return rows.map((row, idx) => {
      const obj = { rowIndex: idx + 2 };
      headers.forEach((h, i) => { obj[h] = row[i]; });
      obj.id_ciclo = obj.id_ciclo || (idx + 1);
      obj.id = obj.id_ciclo;
      obj.ano_exercicio = parseInt(obj.ano_exercicio || obj.ano || CONFIG.EXERCICIO, 10);
      obj.ano = obj.ano_exercicio;
      obj.data_limite_cautela = Database.formatarDataPtBr(obj.data_limite_cautela);
      obj.data_limite_final = Database.formatarDataPtBr(obj.data_limite_final);
      obj.ativo = String(obj.ativo || 'N').trim().toUpperCase();
      return obj;
    });
  },

  obterParametros: function() {
    const todos = this.obterTodos();
    const ativo = todos.find(c => c.ativo === 'S') || todos[0];
    if (ativo) return ativo;

    return {
      id_ciclo: 1,
      ano_exercicio: CONFIG.EXERCICIO,
      ano: CONFIG.EXERCICIO,
      processo_sei_mae: CONFIG.PROCESSO_MAE,
      oficio_circular: CONFIG.OFICIO_CIRCULAR,
      data_limite_cautela: CONFIG.PRAZOS.BENS_ACAUTELADOS,
      data_limite_final: CONFIG.PRAZOS.RELATORIO_FINAL_UG,
      status_ciclo: 'EM_ANDAMENTO',
      ativo: 'S'
    };
  },

  salvarParametros: function(payload) {
    return this.salvarCiclo(payload);
  },

  salvarCiclo: function(payload) {
    const sheet = Database.getSheet(CONFIG.ABAS.CICLO, true);
    if (!sheet) throw new Error('Aba ' + CONFIG.ABAS.CICLO + ' não encontrada.');

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const mapCols = {};
    headers.forEach((h, i) => { mapCols[String(h).trim().toLowerCase()] = i + 1; });

    const colId = mapCols['id_ciclo'] || 1;
    const colAno = mapCols['ano_exercicio'] || 2;
    const colProc = mapCols['processo_sei_mae'] || 3;
    const colOficio = mapCols['oficio_circular'] || 4;
    const colCautela = mapCols['data_limite_cautela'] || 5;
    const colFinal = mapCols['data_limite_final'] || 6;
    const colStatus = mapCols['status_ciclo'] || 7;
    const colAtivo = mapCols['ativo'] || 8;

    const ano = parseInt(payload.ano_exercicio || payload.ano, 10);
    const procMae = (payload.processo_sei_mae || payload.processo_mae || '').trim();
    const dataCautela = payload.data_limite_cautela || '';
    const dataFinal = payload.data_limite_final || '';
    const status = payload.status_ciclo || 'EM_ANDAMENTO';
    const definirAtivo = payload.ativo === 'S' || payload.definir_ativo === true;

    if (!ano) throw new Error('Ano do exercício é obrigatório.');

    // Se for definir como ativo, desativa os outros
    if (definirAtivo) {
      for (let r = 1; r < data.length; r++) {
        sheet.getRange(r + 1, colAtivo).setValue('N');
      }
    }

    // Verifica se já existe o ano ou ID
    let rowEncontrada = -1;
    for (let r = 1; r < data.length; r++) {
      if (String(data[r][colAno - 1]) == String(ano) || (payload.id_ciclo && String(data[r][colId - 1]) == String(payload.id_ciclo))) {
        rowEncontrada = r + 1;
        break;
      }
    }

    if (rowEncontrada > 1) {
      sheet.getRange(rowEncontrada, colProc).setValue(procMae);
      sheet.getRange(rowEncontrada, colCautela).setValue(dataCautela);
      sheet.getRange(rowEncontrada, colFinal).setValue(dataFinal);
      sheet.getRange(rowEncontrada, colStatus).setValue(status);
      if (definirAtivo) {
        sheet.getRange(rowEncontrada, colAtivo).setValue('S');
      }
      return { sucesso: true, ano: ano, operacao: 'atualizacao' };
    }

    // Inclusão de Novo Ciclo
    let maxId = 0;
    for (let r = 1; r < data.length; r++) {
      const val = parseInt(data[r][colId - 1], 10);
      if (!isNaN(val) && val > maxId) maxId = val;
    }
    const novoId = maxId + 1;

    const novaLinha = headers.map(h => {
      const chave = String(h).trim().toLowerCase();
      switch (chave) {
        case 'id_ciclo': return novoId;
        case 'ano_exercicio': return ano;
        case 'processo_sei_mae': return procMae;
        case 'oficio_circular': return payload.oficio_circular || `Ofício-Circular nº /${ano}/DIREX (SEI)`;
        case 'data_limite_cautela': return dataCautela;
        case 'data_limite_final': return dataFinal;
        case 'status_ciclo': return status;
        case 'ativo': return definirAtivo ? 'S' : 'N';
        default: return '';
      }
    });

    sheet.appendRow(novaLinha);
    return { sucesso: true, id: novoId, ano: ano, operacao: 'inclusao' };
  },

  ativarCiclo: function(idOuAno) {
    const sheet = Database.getSheet(CONFIG.ABAS.CICLO, true);
    if (!sheet) throw new Error('Aba ' + CONFIG.ABAS.CICLO + ' não encontrada.');

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const mapCols = {};
    headers.forEach((h, i) => { mapCols[String(h).trim().toLowerCase()] = i + 1; });

    const colId = mapCols['id_ciclo'] || 1;
    const colAno = mapCols['ano_exercicio'] || 2;
    const colAtivo = mapCols['ativo'] || 8;

    let ativado = false;
    for (let r = 1; r < data.length; r++) {
      const corresponde = (String(data[r][colId - 1]) == String(idOuAno)) || (String(data[r][colAno - 1]) == String(idOuAno));
      sheet.getRange(r + 1, colAtivo).setValue(corresponde ? 'S' : 'N');
      if (corresponde) ativado = true;
    }

    if (!ativado) throw new Error('Ciclo não localizado.');
    return { sucesso: true, mensagem: 'Ciclo ativado como vigente!' };
  },

  excluirCiclo: function(idOuAno) {
    const sheet = Database.getSheet(CONFIG.ABAS.CICLO, true);
    if (!sheet) throw new Error('Aba ' + CONFIG.ABAS.CICLO + ' não encontrada.');

    const data = sheet.getDataRange().getValues();
    if (data.length <= 2) {
      throw new Error('Não é possível excluir o único ciclo cadastrado no sistema.');
    }

    const headers = data[0];
    const mapCols = {};
    headers.forEach((h, i) => { mapCols[String(h).trim().toLowerCase()] = i + 1; });

    const colId = mapCols['id_ciclo'] || 1;
    const colAno = mapCols['ano_exercicio'] || 2;
    const colAtivo = mapCols['ativo'] || 8;

    let linhaParaExcluir = -1;
    let eraAtivo = false;

    for (let r = 1; r < data.length; r++) {
      const rowId = String(data[r][colId - 1]).trim();
      const rowAno = String(data[r][colAno - 1]).trim();
      const termo = String(idOuAno).trim();
      if (rowId === termo || rowAno === termo) {
        linhaParaExcluir = r + 1;
        const valAtivo = String(data[r][colAtivo - 1] || '').trim().toUpperCase();
        eraAtivo = (valAtivo === 'S' || valAtivo === 'SIM');
        break;
      }
    }

    if (linhaParaExcluir <= 1) {
      throw new Error('Ciclo não localizado para exclusão.');
    }

    sheet.deleteRow(linhaParaExcluir);

    // Se o ciclo excluído era o ativo, ativa o primeiro ciclo remanescente da tabela
    if (eraAtivo) {
      sheet.getRange(2, colAtivo).setValue('S');
    }

    return { sucesso: true, mensagem: 'Ciclo excluído com sucesso!' };
  }
};

/**
 * Modelo para Gestão da Régua do Cronograma Oficial
 */
const CronogramaModel = {
  obterTodos: function() {
    const sheet = Database.getSheet(CONFIG.ABAS.CRONOGRAMA, true);
    if (!sheet || sheet.getLastRow() < 2) return [];

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const mapCols = {};
    headers.forEach((h, i) => { mapCols[String(h).trim().toLowerCase()] = i; });

    const rows = data.slice(1);

    return rows.map((row, idx) => {
      const obj = { rowIndex: idx + 2 };
      headers.forEach((h, i) => {
        let val = row[i];
        if (val instanceof Date) {
          val = Utilities.formatDate(val, 'America/Sao_Paulo', 'yyyy-MM-dd');
        }
        obj[h] = val;
      });

      const colId = mapCols['id_etapa'] !== undefined ? mapCols['id_etapa'] : 0;
      const colData = mapCols['data'] !== undefined ? mapCols['data'] : 1;
      const colLabel = mapCols['label'] !== undefined ? mapCols['label'] : 2;
      const colAcao = mapCols['acao'] !== undefined ? mapCols['acao'] : 3;
      const colResp = mapCols['responsavel'] !== undefined ? mapCols['responsavel'] : 4;
      const colStatus = mapCols['status'] !== undefined ? mapCols['status'] : 5;
      const colOrdem = mapCols['ordem'] !== undefined ? mapCols['ordem'] : 6;

      const rawId = parseInt(row[colId], 10);
      obj.id_etapa = !isNaN(rawId) && rawId > 0 ? rawId : (idx + 1);
      const rawData = row[colData];
      const rawLabel = row[colLabel];
      obj.data = Database.formatarDataPtBr(rawData || rawLabel);
      obj.label = rawLabel ? Database.formatarDataPtBr(rawLabel) : obj.data;
      obj.acao = String(row[colAcao] || '').trim();
      obj.responsavel = String(row[colResp] || '').trim();
      obj.status = String(row[colStatus] || 'pendente').trim().toLowerCase();
      obj.ordem = parseInt(row[colOrdem], 10) || (idx + 1);
      return obj;
    });
  },

  salvarEtapa: function(payload) {
    const sheet = Database.getSheet(CONFIG.ABAS.CRONOGRAMA, true);
    if (!sheet) throw new Error('Aba ' + CONFIG.ABAS.CRONOGRAMA + ' não encontrada.');

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const mapCols = {};
    headers.forEach((h, i) => { mapCols[String(h).trim().toLowerCase()] = i + 1; });

    const colId = mapCols['id_etapa'] || 1;
    const colData = mapCols['data'] || 2;
    const colLabel = mapCols['label'] || 3;
    const colAcao = mapCols['acao'] || 4;
    const colResp = mapCols['responsavel'] || 5;
    const colStatus = mapCols['status'] || 6;
    const colOrdem = mapCols['ordem'] || 7;

    const id = payload.id_etapa ? parseInt(payload.id_etapa, 10) : null;
    const dataStr = payload.data || '';
    const label = payload.label || dataStr;
    const acao = (payload.acao || '').trim();
    const responsavel = (payload.responsavel || '').trim();
    const status = payload.status || 'pendente';
    const ordem = payload.ordem ? parseInt(payload.ordem, 10) : data.length;

    if (!acao || !responsavel) {
      throw new Error('Ação e Responsável são obrigatórios.');
    }

    if (id) {
      for (let r = 1; r < data.length; r++) {
        if (data[r][colId - 1] == id) {
          const row = r + 1;
          sheet.getRange(row, colData).setValue(dataStr);
          sheet.getRange(row, colLabel).setValue(label);
          sheet.getRange(row, colAcao).setValue(acao);
          sheet.getRange(row, colResp).setValue(responsavel);
          sheet.getRange(row, colStatus).setValue(status);
          sheet.getRange(row, colOrdem).setValue(ordem);
          return { sucesso: true, id: id, operacao: 'atualizacao' };
        }
      }
    }

    // Inclusão de Nova Etapa
    let maxId = 0;
    for (let r = 1; r < data.length; r++) {
      const val = parseInt(data[r][colId - 1], 10);
      if (!isNaN(val) && val > maxId) maxId = val;
    }
    const novoId = maxId + 1;

    const novaLinha = headers.map(h => {
      const chave = String(h).trim().toLowerCase();
      switch (chave) {
        case 'id_etapa': return novoId;
        case 'data': return dataStr;
        case 'label': return label;
        case 'acao': return acao;
        case 'responsavel': return responsavel;
        case 'status': return status;
        case 'ordem': return ordem;
        default: return '';
      }
    });

    sheet.appendRow(novaLinha);
    return { sucesso: true, id: novoId, operacao: 'inclusao' };
  },

  excluirEtapa: function(id) {
    const sheet = Database.getSheet(CONFIG.ABAS.CRONOGRAMA, true);
    if (!sheet) throw new Error('Aba ' + CONFIG.ABAS.CRONOGRAMA + ' não encontrada.');

    const data = sheet.getDataRange().getValues();
    for (let r = 1; r < data.length; r++) {
      if (data[r][0] == id) {
        sheet.deleteRow(r + 1);
        return { sucesso: true, id: id, mensagem: 'Etapa do cronograma excluída com sucesso!' };
      }
    }
    throw new Error('Etapa não localizada para exclusão.');
  }
};
