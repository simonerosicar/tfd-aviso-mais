const express = require('express');
const router  = express.Router();
const db      = require('../database');
const { dispararNotificacoes } = require('../services/notificador');

// POST — disparar notificações para um agendamento
router.post('/disparar/:agendamento_id', async (req, res) => {
  try {
    const resultados = await dispararNotificacoes(req.params.agendamento_id);
    res.json({ ok: true, total: resultados.length, resultados });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// POST — disparar para múltiplos agendamentos de uma vez
router.post('/disparar-lote', async (req, res) => {
  const { ids } = req.body; // array de agendamento_ids
  if (!ids || !ids.length) return res.status(400).json({ erro: 'Informe os IDs' });

  const todos = await Promise.allSettled(ids.map(id => dispararNotificacoes(id)));
  const resumo = todos.map((r, i) => ({
    agendamento_id: ids[i],
    status: r.status,
    total: r.status === 'fulfilled' ? r.value.length : 0,
    erro: r.status === 'rejected' ? r.reason.message : null
  }));

  res.json({ ok: true, resumo });
});

// GET — histórico de notificações
router.get('/', (req, res) => {
  const { agendamento_id, paciente_id, canal, q } = req.query;
  let sql = `
    SELECT n.*, p.nome as paciente_nome, a.procedimento, a.data_proc
    FROM notificacoes n
    JOIN pacientes p ON p.id = n.paciente_id
    JOIN agendamentos a ON a.id = n.agendamento_id
    WHERE 1=1
  `;
  const params = [];
  if (agendamento_id) { sql += ` AND n.agendamento_id = ?`; params.push(agendamento_id); }
  if (paciente_id)    { sql += ` AND n.paciente_id = ?`;    params.push(paciente_id); }
  if (canal)          { sql += ` AND n.canal = ?`;          params.push(canal); }
  if (q)              { sql += ` AND (p.nome LIKE ? OR a.procedimento LIKE ?)`; params.push(`%${q}%`, `%${q}%`); }
  sql += ` ORDER BY n.disparado_em DESC`;
  res.json(db.prepare(sql).all(...params));
});

// PUT — confirmar recebimento
router.put('/:id/confirmar', (req, res) => {
  db.prepare(`
    UPDATE notificacoes SET status='confirmado', confirmado_em=datetime('now','localtime') WHERE id=?
  `).run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
