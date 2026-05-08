const express = require('express');
const router  = express.Router();
const db      = require('../database');

// GET — listar todos ou buscar
router.get('/', (req, res) => {
  const { q } = req.query;
  let rows;
  if (q) {
    rows = db.prepare(`
      SELECT * FROM pacientes
      WHERE nome LIKE ? OR cns LIKE ? OR bairro LIKE ? OR telefone1 LIKE ?
      ORDER BY nome
    `).all(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  } else {
    rows = db.prepare('SELECT * FROM pacientes WHERE ativo = 1 ORDER BY nome').all();
  }
  res.json(rows);
});

// GET — buscar por ID com grupo familiar
router.get('/:id', (req, res) => {
  const paciente = db.prepare('SELECT * FROM pacientes WHERE id = ?').get(req.params.id);
  if (!paciente) return res.status(404).json({ erro: 'Paciente não encontrado' });
  const familia = db.prepare('SELECT * FROM grupo_familiar WHERE paciente_id = ?').all(req.params.id);
  res.json({ ...paciente, familia });
});

// POST — cadastrar
router.post('/', (req, res) => {
  const { nome, cns, cpf, data_nasc, nome_mae, endereco, bairro,
          telefone1, telefone2, telefone3, perfil, observacoes, consentimento_lgpd } = req.body;

  if (!nome || !data_nasc) return res.status(400).json({ erro: 'Nome e data de nascimento são obrigatórios' });

  // Alerta de homônimo
  const homonimo = db.prepare('SELECT id, bairro FROM pacientes WHERE nome = ? AND data_nasc != ?').get(nome, data_nasc);
  
  const result = db.prepare(`
    INSERT INTO pacientes (nome, cns, cpf, data_nasc, nome_mae, endereco, bairro,
      telefone1, telefone2, telefone3, perfil, observacoes, consentimento_lgpd)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(nome, cns, cpf, data_nasc, nome_mae, endereco, bairro,
         telefone1, telefone2, telefone3, perfil || 'padrao', observacoes, consentimento_lgpd ? 1 : 0);

  // Auditoria
  db.prepare(`INSERT INTO auditoria (acao, tabela, registro_id, detalhes) VALUES (?, ?, ?, ?)`)
    .run('CADASTRO', 'pacientes', result.lastInsertRowid, `Paciente ${nome} cadastrado`);

  res.json({
    id: result.lastInsertRowid,
    alerta_homonimo: homonimo ? `⚠️ Existe outro paciente com o nome "${nome}" no bairro ${homonimo.bairro}. Confirme os dados.` : null
  });
});

// PUT — atualizar
router.put('/:id', (req, res) => {
  const { nome, cns, cpf, data_nasc, nome_mae, endereco, bairro,
          telefone1, telefone2, telefone3, perfil, observacoes } = req.body;

  db.prepare(`
    UPDATE pacientes SET nome=?, cns=?, cpf=?, data_nasc=?, nome_mae=?, endereco=?, bairro=?,
      telefone1=?, telefone2=?, telefone3=?, perfil=?, observacoes=?,
      atualizado_em=datetime('now','localtime')
    WHERE id=?
  `).run(nome, cns, cpf, data_nasc, nome_mae, endereco, bairro,
         telefone1, telefone2, telefone3, perfil, observacoes, req.params.id);

  db.prepare(`INSERT INTO auditoria (acao, tabela, registro_id, detalhes) VALUES (?, ?, ?, ?)`)
    .run('ATUALIZACAO', 'pacientes', req.params.id, `Paciente ${nome} atualizado`);

  res.json({ ok: true });
});

// DELETE — inativar (soft delete — LGPD)
router.delete('/:id', (req, res) => {
  db.prepare('UPDATE pacientes SET ativo = 0 WHERE id = ?').run(req.params.id);
  db.prepare(`INSERT INTO auditoria (acao, tabela, registro_id, detalhes) VALUES (?, ?, ?, ?)`)
    .run('INATIVACAO', 'pacientes', req.params.id, 'Paciente inativado');
  res.json({ ok: true });
});

// POST — adicionar familiar
router.post('/:id/familia', (req, res) => {
  const { nome, telefone, parentesco, observacoes } = req.body;
  const result = db.prepare(`
    INSERT INTO grupo_familiar (paciente_id, nome, telefone, parentesco, observacoes)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.params.id, nome, telefone, parentesco, observacoes);
  res.json({ id: result.lastInsertRowid });
});

module.exports = router;
