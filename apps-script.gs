/**
 * Ponte entre o site e uma planilha do Google.
 * O site envia partidas novas para cá (doPost) e lê de volta (doGet),
 * então o que você registra no celular aparece no desktop.
 *
 * Instalação: veja os passos que o Claude te passou.
 */

const ABA = 'Partidas';
const COLUNAS = ['data','oponente','res','quadra','placar','qual','conq','log','registrado_em'];

function aba_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(ABA);
  if (!sh) {
    sh = ss.insertSheet(ABA);
    sh.appendRow(COLUNAS);
    sh.setFrozenRows(1);
  }
  if (sh.getLastRow() === 0) {
    sh.appendRow(COLUNAS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function texto_(v) {
  if (v === null || v === undefined) return '';
  if (Object.prototype.toString.call(v) === '[object Date]') {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(v).trim();
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Lê todas as partidas registradas pelo site. */
function doGet() {
  try {
    const sh = aba_();
    const dados = sh.getDataRange().getValues();
    const cab = dados.shift().map(function (c) { return texto_(c); });
    const saida = [];
    dados.forEach(function (linha) {
      const obj = {};
      cab.forEach(function (nome, i) { obj[nome] = texto_(linha[i]); });
      if (obj.oponente) saida.push(obj);
    });
    return json_({ ok: true, partidas: saida });
  } catch (err) {
    return json_({ ok: false, erro: String(err) });
  }
}

/** Recebe uma partida nova do site e grava uma linha. */
function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (!d.oponente) return json_({ ok: false, erro: 'oponente vazio' });

    const sh = aba_();
    // evita duplicar se o celular reenviar o mesmo registro
    const existentes = sh.getDataRange().getValues();
    for (var i = 1; i < existentes.length; i++) {
      if (texto_(existentes[i][0]) === texto_(d.data) &&
          texto_(existentes[i][1]).toUpperCase() === texto_(d.oponente).toUpperCase() &&
          texto_(existentes[i][4]) === texto_(d.placar)) {
        return json_({ ok: true, duplicada: true });
      }
    }

    sh.appendRow([
      "'" + texto_(d.data),          // aspa inicial mantém a data como texto ISO
      texto_(d.oponente).toUpperCase(),
      texto_(d.res).toUpperCase().charAt(0),
      texto_(d.quadra).toUpperCase(),
      texto_(d.placar),
      texto_(d.qual).toUpperCase(),
      texto_(d.conq),
      texto_(d.log),
      new Date()
    ]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, erro: String(err) });
  }
}
