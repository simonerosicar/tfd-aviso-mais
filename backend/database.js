const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../tfd.db'));

// Habilita WAL para melhor performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ============================================================
// CRIAÇÃO DAS TABELAS
// ============================================================
db.exec(`

  -- Pacientes
  CREATE TABLE IF NOT EXISTS pacientes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nome        TEXT    NOT NULL,
    cns         TEXT    UNIQUE,
    cpf         TEXT,
    data_nasc   TEXT    NOT NULL,
    nome_mae    TEXT,
    endereco    TEXT,
    bairro      TEXT,
    telefone1   TEXT,
    telefone2   TEXT,
    telefone3   TEXT,
    perfil      TEXT    DEFAULT 'padrao',  -- padrao | idoso | analfabeto | sem_familia
    observacoes TEXT,
    ativo       INTEGER DEFAULT 1,
    consentimento_lgpd INTEGER DEFAULT 0,
    criado_em   TEXT    DEFAULT (datetime('now','localtime')),
    atualizado_em TEXT  DEFAULT (datetime('now','localtime'))
  );

  -- Grupo familiar
  CREATE TABLE IF NOT EXISTS grupo_familiar (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente_id  INTEGER NOT NULL REFERENCES pacientes(id),
    nome         TEXT    NOT NULL,
    telefone     TEXT    NOT NULL,
    parentesco   TEXT,
    observacoes  TEXT,
    criado_em    TEXT    DEFAULT (datetime('now','localtime'))
  );

  -- Agendamentos
  CREATE TABLE IF NOT EXISTS agendamentos (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente_id   INTEGER NOT NULL REFERENCES pacientes(id),
    procedimento  TEXT    NOT NULL,
    clinica       TEXT    NOT NULL,
    cidade        TEXT    NOT NULL,
    data_proc     TEXT    NOT NULL,
    hora_proc     TEXT    NOT NULL,
    tipo          TEXT    DEFAULT 'consulta', -- consulta | exame | cirurgia | retorno | urgencia
    status        TEXT    DEFAULT 'pendente', -- pendente | confirmado | cancelado | realizado
    observacoes   TEXT,
    criado_em     TEXT    DEFAULT (datetime('now','localtime')),
    atualizado_em TEXT    DEFAULT (datetime('now','localtime'))
  );

  -- Notificações disparadas
  CREATE TABLE IF NOT EXISTS notificacoes (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    agendamento_id  INTEGER NOT NULL REFERENCES agendamentos(id),
    paciente_id     INTEGER NOT NULL REFERENCES pacientes(id),
    canal           TEXT    NOT NULL, -- whatsapp | sms | ligacao | agente
    destinatario    TEXT    NOT NULL, -- telefone ou nome do agente
    mensagem        TEXT    NOT NULL,
    status          TEXT    DEFAULT 'enviado', -- enviado | entregue | confirmado | falhou
    resposta        TEXT,
    disparado_em    TEXT    DEFAULT (datetime('now','localtime')),
    confirmado_em   TEXT
  );

  -- Auditoria LGPD
  CREATE TABLE IF NOT EXISTS auditoria (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    acao        TEXT NOT NULL,
    tabela      TEXT,
    registro_id INTEGER,
    usuario     TEXT DEFAULT 'operador',
    detalhes    TEXT,
    ip          TEXT,
    criado_em   TEXT DEFAULT (datetime('now','localtime'))
  );

  -- Agentes de saúde
  CREATE TABLE IF NOT EXISTS agentes (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    nome      TEXT NOT NULL,
    telefone  TEXT,
    bairros   TEXT, -- JSON array de bairros
    ativo     INTEGER DEFAULT 1,
    criado_em TEXT DEFAULT (datetime('now','localtime'))
  );
`);

module.exports = db;
