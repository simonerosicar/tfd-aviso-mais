const express = require('express');
const router  = express.Router();
const db      = require('../database');

router.get('/',     (req, res) => res.json(db.prepare('SELECT * FROM agentes WHERE ativo=1 ORDER BY nome').all()));
router.post('/',    (req, res) => {
  const { nome, telefone, bairros } = req.body;
  const r = db.prepare('INSERT INTO agentes (nome, telefone, bairros) VALUES (?,?,?)').run(nome, telefone, JSON.stringify(bairros || []));
  res.json({ id: r.lastInsertRowid });
});
router.delete('/:id', (req, res) => {
  db.prepare('UPDATE agentes SET ativo=0 WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
