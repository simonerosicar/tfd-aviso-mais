const express = require('express');
const router  = express.Router();
const db      = require('../database');

router.get('/', (req, res) => {
  const { q, data_inicio, data_fim, acao } = req.query;
  let sql = `SELECT * FROM auditoria WHERE 1=1`;
  const params = [];
  if (q)           { sql += ` AND detalhes LIKE ?`;      params.push(`%${q}%`); }
  if (acao)        { sql += ` AND acao = ?`;             params.push(acao); }
  if (data_inicio) { sql += ` AND criado_em >= ?`;       params.push(data_inicio); }
  if (data_fim)    { sql += ` AND criado_em <= ?`;       params.push(data_fim + ' 23:59:59'); }
  sql += ` ORDER BY criado_em DESC LIMIT 500`;
  res.json(db.prepare(sql).all(...params));
});

module.exports = router;
