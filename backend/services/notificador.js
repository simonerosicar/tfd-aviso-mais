/**
 * Serviço de notificação simultânea — TFD Aviso+
 * Dispara WhatsApp + SMS + Ligação ao mesmo tempo.
 * Em modo portfólio: simula os envios com log detalhado.
 * Em produção: substitua as funções por chamadas reais de API.
 */

const db = require('../database');

// ============================================================
// MONTAGEM DA MENSAGEM
// ============================================================
function montarMensagem(agendamento, destinatario = 'paciente') {
  const data = new Date(agendamento.data_proc + 'T00:00:00').toLocaleDateString('pt-BR');
  if (destinatario === 'familia') {
    return `Olá! Somos do TFD de Içara/SC.\n\n` +
           `*${agendamento.paciente_nome}* tem procedimento agendado:\n\n` +
           `📅 Data: *${data}*\n` +
           `⏰ Hora: *${agendamento.hora_proc}*\n` +
           `🏥 Local: *${agendamento.clinica}* — ${agendamento.cidade}\n` +
           `🩺 Procedimento: *${agendamento.procedimento}*\n\n` +
           `Por favor, avise o(a) paciente.\n` +
           `Dúvidas: TFD Içara`;
  }
  return `Olá, *${agendamento.paciente_nome}*! 👋\n\n` +
         `O TFD de Içara informa seu agendamento:\n\n` +
         `📅 Data: *${data}*\n` +
         `⏰ Hora: *${agendamento.hora_proc}*\n` +
         `🏥 Local: *${agendamento.clinica}* — ${agendamento.cidade}\n` +
         `🩺 Procedimento: *${agendamento.procedimento}*\n\n` +
         `Dúvidas: TFD Içara`;
}

// ============================================================
// SIMULADORES DE API (substituir em produção)
// ============================================================
async function enviarWhatsApp(telefone, mensagem) {
  // PRODUÇÃO: chamar Z-API ou Evolution API
  console.log(`[WhatsApp] → ${telefone}: ${mensagem.substring(0, 50)}...`);
  return { sucesso: true, canal: 'whatsapp', simulado: true };
}

async function enviarSMS(telefone, mensagem) {
  // PRODUÇÃO: chamar Twilio SMS
  const textoSimples = mensagem.replace(/\*/g, '').replace(/\n/g, ' ');
  console.log(`[SMS] → ${telefone}: ${textoSimples.substring(0, 50)}...`);
  return { sucesso: true, canal: 'sms', simulado: true };
}

async function fazerLigacao(telefone, mensagem) {
  // PRODUÇÃO: chamar Twilio Voice com TTS
  console.log(`[Ligação] → ${telefone}: mensagem de voz`);
  return { sucesso: true, canal: 'ligacao', simulado: true };
}

async function alertarAgente(agente, agendamento) {
  // PRODUÇÃO: enviar WhatsApp para o agente de saúde
  console.log(`[Agente] → ${agente.nome}: paciente ${agendamento.paciente_nome}`);
  return { sucesso: true, canal: 'agente', simulado: true };
}

// ============================================================
// DISPARO SIMULTÂNEO — função principal
// ============================================================
async function dispararNotificacoes(agendamento_id) {
  const ag = db.prepare(`
    SELECT a.*, p.nome as paciente_nome, p.perfil,
           p.telefone1, p.telefone2, p.telefone3, p.bairro
    FROM agendamentos a JOIN pacientes p ON p.id = a.paciente_id
    WHERE a.id = ?
  `).get(agendamento_id);

  if (!ag) throw new Error('Agendamento não encontrado');

  const familia = db.prepare('SELECT * FROM grupo_familiar WHERE paciente_id = ?').all(ag.paciente_id);
  const mensagem = montarMensagem(ag, 'paciente');
  const mensagemFamilia = montarMensagem(ag, 'familia');
  const resultados = [];

  // ---- PACIENTE — todos os canais ao mesmo tempo ----
  const telefonesP = [ag.telefone1, ag.telefone2, ag.telefone3].filter(Boolean);

  const disparosPaciente = telefonesP.flatMap(tel => [
    enviarWhatsApp(tel, mensagem),
    enviarSMS(tel, mensagem),
    fazerLigacao(tel, mensagem)
  ]);

  const resP = await Promise.allSettled(disparosPaciente);
  resP.forEach((r, i) => {
    const canais = ['whatsapp', 'sms', 'ligacao'];
    const tel = telefonesP[Math.floor(i / 3)];
    const canal = canais[i % 3];
    const status = r.status === 'fulfilled' && r.value.sucesso ? 'enviado' : 'falhou';
    db.prepare(`
      INSERT INTO notificacoes (agendamento_id, paciente_id, canal, destinatario, mensagem, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(agendamento_id, ag.paciente_id, canal, tel, mensagem, status);
    resultados.push({ tipo: 'paciente', canal, tel, status });
  });

  // ---- GRUPO FAMILIAR — WhatsApp + SMS ----
  const disparosFamilia = familia.flatMap(f => [
    enviarWhatsApp(f.telefone, mensagemFamilia),
    enviarSMS(f.telefone, mensagemFamilia)
  ]);

  const resF = await Promise.allSettled(disparosFamilia);
  resF.forEach((r, i) => {
    const canais = ['whatsapp', 'sms'];
    const fam = familia[Math.floor(i / 2)];
    const canal = canais[i % 2];
    const status = r.status === 'fulfilled' && r.value.sucesso ? 'enviado' : 'falhou';
    db.prepare(`
      INSERT INTO notificacoes (agendamento_id, paciente_id, canal, destinatario, mensagem, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(agendamento_id, ag.paciente_id, canal, fam.telefone, mensagemFamilia, status);
    resultados.push({ tipo: 'familia', nome: fam.nome, canal, status });
  });

  // ---- AGENTE DE SAÚDE (perfis especiais ou sem família) ----
  const precisaAgente = ag.perfil === 'idoso' || ag.perfil === 'analfabeto' ||
                        ag.perfil === 'sem_familia' || familia.length === 0;

  if (precisaAgente) {
    const agente = db.prepare(`
      SELECT * FROM agentes WHERE ativo = 1 AND bairros LIKE ? LIMIT 1
    `).get(`%${ag.bairro}%`);

    if (agente) {
      await alertarAgente(agente, ag);
      db.prepare(`
        INSERT INTO notificacoes (agendamento_id, paciente_id, canal, destinatario, mensagem, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(agendamento_id, ag.paciente_id, 'agente', agente.nome,
             `Visitar ${ag.paciente_nome} — ${ag.procedimento} em ${ag.data_proc}`, 'enviado');
      resultados.push({ tipo: 'agente', nome: agente.nome, status: 'enviado' });
    }
  }

  // Auditoria
  db.prepare(`INSERT INTO auditoria (acao, tabela, registro_id, detalhes) VALUES (?, ?, ?, ?)`)
    .run('NOTIFICACAO', 'agendamentos', agendamento_id,
         `${resultados.length} notificações disparadas simultaneamente`);

  return resultados;
}

module.exports = { dispararNotificacoes, montarMensagem };
