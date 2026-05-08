# 🏥 TFD Aviso+

Sistema de notificação simultânea de pacientes do **Tratamento Fora do Domicílio (TFD)** — Içara/SC.

> Desenvolvido para garantir que nenhum paciente perca sua consulta por falta de contato.

---

## 🎯 Objetivo

Disparar **simultaneamente** WhatsApp + SMS + Ligação automática para o paciente e grupo familiar, com atenção especial a idosos, analfabetos e pacientes sem família.

---

## ✅ Funcionalidades

- Cadastro de pacientes com perfil especial (idoso, analfabeto, sem família)
- Alerta automático de **homônimos** (mesmo nome, dados diferentes)
- Disparo simultâneo: **WhatsApp + SMS + Ligação** ao mesmo tempo
- Aviso para **grupo familiar** completo
- Acionamento automático de **agente de saúde** para perfis especiais
- **Ctrl+F** nativo em todas as listas
- Campo de observações em todos os cadastros
- **Auditoria completa** — LGPD (Lei 13.709/2018)
- Tema escuro para uso prolongado

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|---|---|
| Backend | Node.js + Express |
| Banco | SQLite (better-sqlite3) |
| Frontend | HTML + CSS + JS puro |
| WhatsApp | Z-API (configurável) |
| SMS/Ligação | Twilio (configurável) |

---

## ⚙️ Como rodar

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis (opcional para portfólio)
cp .env.example .env

# 3. Iniciar
npm start

# Acesse: http://localhost:3000
```

---

## 📁 Estrutura

```
tfd-aviso-mais/
├── backend/
│   ├── server.js
│   ├── database.js
│   ├── routes/
│   │   ├── pacientes.js
│   │   ├── agendamentos.js
│   │   ├── notificacoes.js
│   │   ├── auditoria.js
│   │   └── agentes.js
│   └── services/
│       └── notificador.js
├── frontend/
│   ├── index.html        — Dashboard
│   ├── pacientes.html    — Cadastro de pacientes
│   ├── agendamentos.html — Agendamentos
│   ├── notificacoes.html — Disparo de avisos
│   ├── auditoria.html    — Logs LGPD
│   ├── css/style.css
│   └── js/app.js
└── README.md
```

---

## 🔒 LGPD

- Consentimento registrado no cadastro do paciente
- Soft delete (dados mantidos, paciente inativado)
- Log imutável de todas as ações
- Dados sensíveis de saúde tratados conforme Art. 11 da LGPD

---

## 👩‍💻 Autora

**Simone Cardozo**  
Estudante — Técnico em Desenvolvimento de Sistemas — SENAC  
GitHub: [simonerosicar](https://github.com/simonerosicar)
