// ============================================================
// GOOGLE APPS SCRIPT — Banco de Leads Dra. Camila Fernandes
// Instruções: Cole este código no editor de scripts da planilha
// Ferramentas > Apps Script > colar > Salvar > Implantar
// ============================================================

const SPREADSHEET_ID = '1CxVYuqfV7jf539buHZ8s0mxl3PeS-meOqq75KkbYKQ0';
const SHEET_NAME     = 'Leads';
const EMAIL_NOTIF    = 'lineaquino@gmail.com,milamariaaf@gmail.com'; // e-mails que recebem alerta de novo lead

const HEADERS = [
  'Data/Hora',
  'Nome',
  'WhatsApp',
  'Email',
  'Procedimento',
  'Mensagem',
  'Página de Origem',
  'UTM Source',
  'UTM Medium',
  'UTM Campaign',
  'Status',
  'Observações'
];

// ── Inicializa cabeçalhos se a aba estiver vazia ──────────────
function inicializarPlanilha() {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet   = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    const headerRow = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRow.setValues([HEADERS]);

    // Estilo do cabeçalho
    headerRow.setBackground('#C4A45A');
    headerRow.setFontColor('#FFFFFF');
    headerRow.setFontWeight('bold');
    headerRow.setFontSize(11);
    sheet.setFrozenRows(1);

    // Largura das colunas
    sheet.setColumnWidth(1, 140);  // Data/Hora
    sheet.setColumnWidth(2, 180);  // Nome
    sheet.setColumnWidth(3, 140);  // WhatsApp
    sheet.setColumnWidth(4, 200);  // Email
    sheet.setColumnWidth(5, 200);  // Procedimento
    sheet.setColumnWidth(6, 250);  // Mensagem
    sheet.setColumnWidth(7, 160);  // Página
    sheet.setColumnWidth(8, 120);  // UTM Source
    sheet.setColumnWidth(9, 120);  // UTM Medium
    sheet.setColumnWidth(10, 160); // UTM Campaign
    sheet.setColumnWidth(11, 130); // Status
    sheet.setColumnWidth(12, 220); // Observações

    // Validação dropdown na coluna Status
    const statusRange = sheet.getRange(2, 11, 1000, 1);
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Novo', 'Contatado', 'Agendado', 'Convertido', 'Perdido'], true)
      .build();
    statusRange.setDataValidation(rule);
  }

  return sheet;
}

// ── Recebe POST da landing page ───────────────────────────────
function doPost(e) {
  try {
    const raw   = e.postData ? e.postData.contents : JSON.stringify(e.parameter);
    const dados = JSON.parse(raw);
    const sheet = inicializarPlanilha();

    const linha = [
      dados.data         || new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      dados.nome         || '',
      dados.whatsapp     || '',
      dados.email        || '',
      dados.procedimento || '',
      dados.mensagem     || '',
      dados.pagina       || '',
      dados.utm_source   || '',
      dados.utm_medium   || '',
      dados.utm_campaign || '',
      'Novo',            // Status inicial
      ''                 // Observações vazio
    ];

    sheet.appendRow(linha);

    // Formatar linha recém adicionada
    const ultimaLinha = sheet.getLastRow();
    const linhaRange  = sheet.getRange(ultimaLinha, 1, 1, HEADERS.length);
    if (ultimaLinha % 2 === 0) {
      linhaRange.setBackground('#FAF7F2');
    }

    // Destaque na célula de Status (nova = fundo verde claro)
    sheet.getRange(ultimaLinha, 11).setBackground('#D9EAD3');

    // Enviar e-mail de notificação
    enviarNotificacao(dados);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── Notificação por e-mail ────────────────────────────────────
function enviarNotificacao(dados) {
  try {
    const assunto = `🔔 Novo lead: ${dados.nome} — ${dados.procedimento}`;
    const corpo   = `
Novo lead recebido na landing page da Dra. Camila!

👤 Nome: ${dados.nome}
📱 WhatsApp: ${dados.whatsapp}
📧 Email: ${dados.email || 'Não informado'}
💉 Procedimento: ${dados.procedimento}
📝 Mensagem: ${dados.mensagem || 'Sem mensagem'}
📄 Página: ${dados.pagina || ''}
🎯 Origem: ${dados.utm_source || 'Direto'} / ${dados.utm_medium || ''} / ${dados.utm_campaign || ''}
🕐 Data/Hora: ${dados.data}

Acesse a planilha: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}
    `.trim();

    MailApp.sendEmail(EMAIL_NOTIF, assunto, corpo);
  } catch (err) {
    console.log('Erro ao enviar email:', err);
  }
}

// ── Permite requisições GET simples (teste de conectividade) ──
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'online', app: 'Dra. Camila Leads' }))
    .setMimeType(ContentService.MimeType.JSON);
}
