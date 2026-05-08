// ============================================================
// TFD Aviso+ — Utilitários globais
// ============================================================

const API = 'http://localhost:3000/api';

// ---- Toast ----
function toast(msg, tipo = 'info') {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const t = document.createElement('div');
  t.className = `toast ${tipo}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  t.innerHTML = `<span>${icons[tipo] || 'ℹ️'}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

// ---- Modal ----
function abrirModal(id) { document.getElementById(id)?.classList.add('open'); }
function fecharModal(id) { document.getElementById(id)?.classList.remove('open'); }

// ---- Busca com highlight (Ctrl+F nativo da tabela) ----
function iniciarBusca(inputId, tabelaId) {
  const input = document.getElementById(inputId);
  const tabela = document.getElementById(tabelaId);
  if (!input || !tabela) return;

  // Atalho Ctrl+F
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      input.focus();
      input.select();
    }
  });

  input.addEventListener('input', () => {
    const termo = input.value.toLowerCase().trim();
    const linhas = tabela.querySelectorAll('tbody tr');
    let visiveis = 0;

    linhas.forEach(tr => {
      const texto = tr.textContent.toLowerCase();
      if (!termo || texto.includes(termo)) {
        tr.style.display = '';
        visiveis++;
        // Highlight
        if (termo) {
          tr.querySelectorAll('td').forEach(td => {
            const original = td.getAttribute('data-original') || td.textContent;
            td.setAttribute('data-original', original);
            const regex = new RegExp(`(${termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            td.innerHTML = original.replace(regex, '<mark>$1</mark>');
          });
        } else {
          tr.querySelectorAll('td').forEach(td => {
            const original = td.getAttribute('data-original');
            if (original) td.textContent = original;
          });
        }
      } else {
        tr.style.display = 'none';
      }
    });

    // Contador
    const contador = document.getElementById('search-count');
    if (contador) contador.textContent = termo ? `${visiveis} resultado(s)` : '';
  });
}

// ---- Formatar data ----
function formatarData(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// ---- Badge de status ----
function badgeStatus(status) {
  return `<span class="badge badge-${status}">${status}</span>`;
}

// ---- Badge de perfil ----
function badgePerfil(perfil) {
  const labels = { padrao: 'Padrão', idoso: '👴 Idoso', analfabeto: '📢 Analfabeto', sem_familia: '👤 Sem família' };
  return perfil !== 'padrao' ? `<span class="badge badge-${perfil}">${labels[perfil] || perfil}</span>` : '';
}

// ---- Fetch helpers ----
async function get(url) {
  const r = await fetch(API + url);
  return r.json();
}

async function post(url, data) {
  const r = await fetch(API + url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return r.json();
}

async function put(url, data) {
  const r = await fetch(API + url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return r.json();
}

async function del(url) {
  const r = await fetch(API + url, { method: 'DELETE' });
  return r.json();
}
