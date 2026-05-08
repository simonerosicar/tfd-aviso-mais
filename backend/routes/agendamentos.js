const express = require('express');
const router  = express.Router();
const db      = require('../database');

// GET — listar com filtros
router.get('/', (req, res) => {
  const { q, status, data_inicio, data_fim } = req.query;
  let sql = `
    SELECT a.*, p.nome as paciente_nome, p.cns, p.perfil, p.telefone1, p.bairro
    FROM agendamentos a
    JOIN pacientes p ON p.id = a.paciente_id
    WHERE 1=1
  `;
  const params = [];

  if (q) {
    sql += ` AND (p.nome LIKE ? OR a.procedimento LIKE ? OR a.clinica LIKE ? OR p.cns LIKE ?)`;
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (status) { sql += ` AND a.status = ?`; params.push(status); }
  if (data_inicio) { sql += ` AND a.data_proc >= ?`; params.push(data_inicio); }
  if (data_fim)    { sql += ` AND a.data_proc <= ?`; params.push(data_fim); }

  sql += ` ORDER BY a.data_proc ASC, a.hora_proc ASC`;
  res.json(db.prepare(sql).all(...params));
});

// GET — por ID
router.get('/:id', (req, res) => {
  const ag = db.prepare(`
    SELECT a.*, p.nome as paciente_nome, p.cns, p.perfil,
           p.telefone1, p.telefone2, p.telefone3, p.bairro, p.observacoes as obs_paciente
    FROM agendamentos a JOIN pacientes p ON p.id = a.paciente_id
    WHERE a.id = ?
  `).get(req.params.id);
  if (!ag) return res.status(404).json({ erro: 'Agendamento não encontrado' });
  const familia = db.prepare('SELECT * FROM grupo_familiar WHERE paciente_id = ?').all(ag.paciente_id);
  res.json({ ...ag, familia });
});

// POST — cadastrar
router.post('/', (req, res) => {
  const { paciente_id, procedimento, clinica, cidade, data_proc, hora_proc, tipo, observacoes } = req.body;
  if (!paciente_id || !procedimento || !data_proc)
    return res.status(400).json({ erro: 'Paciente, procedimento e data são obrigatórios' });

  const result = db.prepare(`
    INSERT INTO agendamentos (paciente_id, procedimento, clinica, cidade, data_proc, hora_proc, tipo, observacoes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(paciente_id, procedimento, clinica, cidade, data_proc, hora_proc, tipo || 'consulta', observacoes);

  db.prepare(`INSERT INTO auditoria (acao, tabela, registro_id, detalhes) VALUES (?, ?, ?, ?)`)
    .run('CADASTRO', 'agendamentos', result.lastInsertRowid, `Agendamento ${procedimento} em ${data_proc}`);

  res.json({ id: result.lastInsertRowid });
});

// PUT — atualizar status
router.put('/:id', (req, res) => {
  const { status, observacoes, procedimento, clinica, cidade, data_proc, hora_proc, tipo } = req.body;
  db.prepare(`
    UPDATE agendamentos SET status=?, observacoes=?, procedimento=?, clinica=?, cidade=?,
      data_proc=?, hora_proc=?, tipo=?, atualizado_em=datetime('now','localtime')
    WHERE id=?
  `).run(status, observacoes, procedimento, clinica, cidade, data_proc, hora_proc, tipo, req.params.id);

  db.prepare(`INSERT INTO auditoria (acao, tabela, registro_id, detalhes) VALUES (?, ?, ?, ?)`)
    .run('ATUALIZACAO', 'agendamentos', req.params.id, `Status atualizado para ${status}`);

  res.json({ ok: true });
});

module.exports = router;
