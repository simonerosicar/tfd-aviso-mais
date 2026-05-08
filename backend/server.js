require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Rotas
app.use('/api/pacientes',     require('./routes/pacientes'));
app.use('/api/agendamentos',  require('./routes/agendamentos'));
app.use('/api/notificacoes',  require('./routes/notificacoes'));
app.use('/api/auditoria',     require('./routes/auditoria'));
app.use('/api/agentes',       require('./routes/agentes'));

// Rota raiz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ TFD Aviso+ rodando em http://localhost:${PORT}`);
});
