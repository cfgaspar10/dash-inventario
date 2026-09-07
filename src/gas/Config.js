/**
 * ============================================================================
 * [CONFIG] SISTEMA DE GESTÃO DO INVENTÁRIO ANUAL SENAPPEN 2026
 * ============================================================================
 */

const CONFIG = {
  EXERCICIO: 2026,
  PROCESSO_MAE: '08016.007081/2026-59',
  OFICIO_CIRCULAR: 'Ofício-Circular nº /2026/DIREX/SENAPPEN/MJ (SEI 35011389)',
  SPREADSHEET_ID: '16BhZl7wc62AUASvqObESL9gNMItHqQCp5KWMPo6fvnQ',

  // Nomes das Tabelas / Abas
  ABAS: {
    CICLO: 'tb_ciclo_inventario',
    UG: 'tb_ug',
    INVENTARIO: 'tb_inventario_acompanhamento',
    COMISSAO: 'tb_comissao_membro',
    CAPACITACAO: 'tb_capacitacao'
  },

  // Marcos Oficiais de Prazos
  PRAZOS: {
    INSTAURACAO_UG: '2026-07-28',
    CAPACITACAO_SEDE: '2026-08-28',
    BENS_ACAUTELADOS: '2026-08-31',
    INSTAURACAO_UORG: '2026-08-31',
    CAPACITACAO_SPF: '2026-09-02',
    RELATORIO_FINAL_UG: '2026-11-30',
    APROVACAO_ORDENADOR: '2026-12-10',
    PROCESSAMENTO_SIAFI: '2026-12-31'
  },

  // Status Válidos
  STATUS_VALIDOS: ['Não iniciado', 'Em andamento', 'Processado']
};
