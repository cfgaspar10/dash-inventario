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
      const ugs = UgModel.obterTodas();
      const ciclo = CicloModel.obterParametros();

      if (!uorgs || uorgs.length === 0) {
        return {
          status: 'warning',
          mensagem: 'Tabela de inventário vazia ou não inicializada.',
          origem: 'fallback',
          total: 0,
          dados: null
        };
      }

      // Filtra apenas UORGs ativas para o dashboard
      const uorgsAtivas = uorgs.filter(u => u.ativo !== 'N');

      return {
        status: 'success',
        origem: 'planilha',
        exercicio: ciclo.ano_exercicio || CONFIG.EXERCICIO,
        processo_mae: ciclo.processo_sei_mae || CONFIG.PROCESSO_MAE,
        oficio_circular: ciclo.oficio_circular || CONFIG.OFICIO_CIRCULAR,
        total: uorgsAtivas.length,
        dados: uorgsAtivas,
        ugs: ugs.length > 0 ? ugs : null
      };
    } catch (err) {
      return {
        status: 'error',
        mensagem: err.toString(),
        dados: null
      };
    }
  },

  /**
   * Obtém a carga inicial completa e atualizada da planilha para sincronização do frontend
   */
  obterDadosCompletos: function() {
    try {
      const uorgs = InventarioModel.obterTodos();
      const ugs = UgModel.obterTodas();
      const ciclos = CicloModel.obterTodos();
      const ciclo = CicloModel.obterParametros();
      const cronograma = CronogramaModel.obterTodos();

      return {
        status: 'success',
        origem: 'planilha_google',
        inventario: uorgs,
        ugs: ugs,
        ciclos: ciclos,
        ciclo: ciclo,
        cronograma: cronograma
      };
    } catch (err) {
      return {
        status: 'error',
        mensagem: err.toString()
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

/**
 * [NOVO] Controlador de Configurações Estruturais e Governança
 */
const AdminConfigController = {
  /**
   * Retorna os dados completos para a tela de configurações
   */
  obterDadosConfig: function() {
    try {
      const ugs = UgModel.obterTodas();
      const ciclo = CicloModel.obterParametros();
      const ciclos = CicloModel.obterTodos();
      const cronograma = CronogramaModel.obterTodos();
      const uorgs = InventarioModel.obterTodos();

      return {
        status: 'success',
        ugs: ugs,
        ciclo: ciclo,
        ciclos: ciclos,
        cronograma: cronograma,
        totalUorgs: uorgs.length,
        uorgs: uorgs
      };
    } catch (err) {
      return { status: 'error', mensagem: err.toString() };
    }
  },

  /**
   * Salva (insere ou edita) uma Unidade Gestora (UG)
   */
  salvarUg: function(payload) {
    try {
      const res = UgModel.salvar(payload);
      return {
        status: 'success',
        mensagem: res.operacao === 'inclusao' ? 'Nova UG cadastrada com sucesso!' : 'UG atualizada com sucesso!',
        dados: res
      };
    } catch (err) {
      return { status: 'error', mensagem: err.message || err.toString() };
    }
  },

  /**
   * Exclui definitivamente uma UG
   */
  excluirUg: function(siglaOuId) {
    try {
      const res = UgModel.excluir(siglaOuId);
      return {
        status: 'success',
        mensagem: 'Unidade Gestora excluída com sucesso!',
        dados: res
      };
    } catch (err) {
      return { status: 'error', mensagem: err.message || err.toString() };
    }
  },

  /**
   * Cadastra uma nova UORG via aplicação
   */
  cadastrarUorg: function(payload) {
    try {
      const res = InventarioModel.cadastrarUorg(payload);
      return {
        status: 'success',
        mensagem: 'Nova UORG cadastrada com sucesso!',
        dados: res
      };
    } catch (err) {
      return { status: 'error', mensagem: err.message || err.toString() };
    }
  },

  /**
   * Exclui definitivamente uma UORG
   */
  excluirUorg: function(id) {
    try {
      const res = InventarioModel.excluirUorg(id);
      return {
        status: 'success',
        mensagem: 'UORG excluída da base de inventário!',
        dados: res
      };
    } catch (err) {
      return { status: 'error', mensagem: err.message || err.toString() };
    }
  },

  /**
   * Alterna status de ativação da UORG (Ativa/Inativa)
   */
  toggleUorg: function(id, novoStatusAtivo) {
    try {
      const res = InventarioModel.alternarStatusUorg(id, novoStatusAtivo);
      return {
        status: 'success',
        mensagem: novoStatusAtivo === 'S' ? 'UORG reativada!' : 'UORG desativada!',
        dados: res
      };
    } catch (err) {
      return { status: 'error', mensagem: err.message || err.toString() };
    }
  },

  /**
   * Salva parâmetros globais ou cadastra novo ciclo de inventário
   */
  salvarParametrosCiclo: function(payload) {
    try {
      const res = CicloModel.salvarCiclo(payload);
      return {
        status: 'success',
        mensagem: res.operacao === 'inclusao' ? 'Novo Ciclo de Inventário criado com sucesso!' : 'Parâmetros do ciclo atualizados!',
        dados: res
      };
    } catch (err) {
      return { status: 'error', mensagem: err.message || err.toString() };
    }
  },

  /**
   * Ativa um ciclo como corrente/vigente
   */
  ativarCiclo: function(idOuAno) {
    try {
      const res = CicloModel.ativarCiclo(idOuAno);
      return {
        status: 'success',
        mensagem: 'Ciclo ativado como vigente para a aplicação!',
        dados: res
      };
    } catch (err) {
      return { status: 'error', mensagem: err.message || err.toString() };
    }
  },

  /**
   * Exclui um ciclo de inventário
   */
  excluirCiclo: function(idOuAno) {
    try {
      const res = CicloModel.excluirCiclo(idOuAno);
      return {
        status: 'success',
        mensagem: 'Ciclo de inventário excluído!',
        dados: res
      };
    } catch (err) {
      return { status: 'error', mensagem: err.message || err.toString() };
    }
  },

  /**
   * Salva ou edita uma etapa da régua do cronograma
   */
  salvarEtapaCronograma: function(payload) {
    try {
      const res = CronogramaModel.salvarEtapa(payload);
      return {
        status: 'success',
        mensagem: res.operacao === 'inclusao' ? 'Nova etapa adicionada ao cronograma!' : 'Etapa do cronograma atualizada!',
        dados: res
      };
    } catch (err) {
      return { status: 'error', mensagem: err.message || err.toString() };
    }
  },

  /**
   * Exclui uma etapa da régua do cronograma
   */
  excluirEtapaCronograma: function(id) {
    try {
      const res = CronogramaModel.excluirEtapa(id);
      return {
        status: 'success',
        mensagem: 'Etapa removida do cronograma!',
        dados: res
      };
    } catch (err) {
      return { status: 'error', mensagem: err.message || err.toString() };
    }
  }
};

const AdminController = {
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
