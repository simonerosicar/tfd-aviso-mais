const form = document.getElementById('form-paciente');
const tabela = document.querySelector('#tabela-pacientes tbody');

form.addEventListener('submit', function(e) {
    e.preventDefault();

    // Pegando os valores
    const nome = document.getElementById('nome').value;
    const telefone = document.getElementById('telefone').value;
    const procedimento = document.getElementById('procedimento').value;

    // Criando a linha na tabela (CRUD - Create)
    const novaLinha = document.createElement('tr');
    novaLinha.innerHTML = `
        <td>${nome}</td>
        <td>${procedimento}</td>
        <td class="status-pendente">Pendente</td>
        <td>
            <button class="btn-whatsapp" onclick="avisar(this, '${telefone}', '${nome}')">
                Avisar WhatsApp
            </button>
        </td>
    `;

    tabela.appendChild(novaLinha);
    form.reset(); // Limpa o formulário
});

function avisar(botao, tel, nome) {
    // Simula a mudança de status (CRUD - Update)
    const linha = botao.parentElement.parentElement;
    const statusTd = linha.querySelector('td:nth-child(3)');
    
    statusTd.innerText = "Avisado";
    statusTd.className = "status-avisado";
    
    // Abre o WhatsApp com mensagem automática
    const mensagem = `Olá ${nome}, o TFD de Içara informa que sua consulta foi autorizada!`;
    window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(mensagem)}`, '_blank');
}