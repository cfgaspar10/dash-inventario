/**
 * ============================================================================
 * [CONTROLLER] CONTROLADORES DE APLICAÇÃO - SENAPPEN 2026
 * ============================================================================
 */

const DashboardController = {
  /**
   * Retorna os dados para renderização do painel executivo
   */
  obterDados: function() {
    try {
      const uorgs = InventarioModel.obterTodos();

      // Se a planilha estiver vazia ou não inicializada, sinaliza para usar fallback local
      if (!uorgs || uorgs.length === 0) {
        return {
          status: 'warning',
          mensagem: 'Tabela de inventário vazia ou não inicializada.',
          origem: 'fallback',
          total: 0,
          dados: null
        };
      }

      return {
        status: 'success',
        origem: 'planilha',
        exercicio: CONFIG.EXERCICIO,
        processo_mae: CONFIG.PROCESSO_MAE,
        oficio_circular: CONFIG.OFICIO_CIRCULAR,
        total: uorgs.length,
        dados: uorgs
      };
    } catch (err) {
      return {
        status: 'error',
        mensagem: err.toString(),
        dados: null
      };
    }
  }
};

const GestaoController = {
  /**
   * Obtém detalhes de uma UORG específica para o formulário de edição
   */
  obterUorg: function(id) {
    try {
      const uorg = InventarioModel.obterPorId(id);
      if (!uorg) return { status: 'error', mensagem: 'UORG não localizada.' };
      return { status: 'success', dados: uorg };
    } catch (err) {
      return { status: 'error', mensagem: err.toString() };
    }
  },

  /**
   * Salva alterações de uma UORG vindas do Módulo de Gestão Operacional
   */
  salvarUorg: function(payload) {
    try {
      if (!payload || !payload.id) {
        return { status: 'error', mensagem: 'ID da UORG é obrigatório.' };
      }

      const res = InventarioModel.atualizar(payload.id, payload);
      return {
        status: 'success',
        mensagem: 'UORG atualizada com sucesso no banco!',
        dados: res
      };
    } catch (err) {
      return { status: 'error', mensagem: err.message || err.toString() };
    }
  },

  /**
   * Recalcula os status das fases em lote com base no preenchimento
   */
  recalcularFases: function() {
    try {
      const sheet = Database.getSheet(CONFIG.ABAS.INVENTARIO);
      if (!sheet || sheet.getLastRow() < 2) {
        return { status: 'warning', mensagem: 'Aba vazia.' };
      }

      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const colProc = headers.indexOf('processo_sei');
      const colCaut = headers.indexOf('bens_acautelados_doc');
      const colRelUorg = headers.indexOf('relatorio_uorg');
      const colRelFin = headers.indexOf('relatorio_final_ug');
      const colStatusSimp = headers.indexOf('status_simplificado');

      if (colStatusSimp === -1) {
        return { status: 'error', mensagem: 'Coluna status_simplificado não encontrada.' };
      }

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

      return {
        status: 'success',
        mensagem: `Recálculo concluído! ${atualizados} UORGs atualizadas.`
      };
    } catch (err) {
      return { status: 'error', mensagem: err.toString() };
    }
  }
};

const AdminController = {
  /**
   * Executa a carga inicial e formatação das 5 abas
   */
  inicializarEstrutura: function() {
    const rawHtml = HtmlService.createHtmlOutputFromFile('data').getContent();
    const match = rawHtml.match(/window\.DASH_DATA\s*=\s*(\{[\s\S]*?\});/);
    if (!match) {
      throw new Error('Arquivo de sementes (data.html) não localizado.');
    }
    const dashData = JSON.parse(match[1]);
    const res = InventarioModel.inicializarBanco(dashData);
    return {
      status: 'success',
      mensagem: `Banco estruturado com ${res.totalUorgs} UORGs e ${res.totalUgs} UGs!`
    };
  }
};
