// --- Selecionar Elementos do HTML ---
const nomeInput = document.getElementById('nome');
const quantidadeInput = document.getElementById('quantidade');
const valorInput = document.getElementById('valor');
const adicionarBtn = document.getElementById('adicionar-btn');
const tabelaOrcamentoBody = document.getElementById('tabela-orcamento').getElementsByTagName('tbody')[0];
const valorTotalSpan = document.getElementById('valor-total');

// URL base da nossa API backend (onde o server.js está rodando)
// Se o seu server.js estiver rodando em outra porta, ajuste aqui.
const apiUrl = 'http://localhost:5000/items';

// --- Funções Auxiliares ---

// Função para formatar números como moeda brasileira (BRL)
function formatarMoeda(valor) {
    // Se o valor não for um número, retorna 0.00 formatado
    if (isNaN(valor) || valor === null) {
        valor = 0;
    }
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// --- Funções Principais ---

// Função para buscar os itens da API e atualizar a tabela
async function carregarItens() {
    console.log("Tentando carregar itens..."); // Log para depuração
    try {
        const response = await fetch(apiUrl); // Faz a requisição GET para o backend
        if (!response.ok) { // Verifica se a resposta da API foi bem-sucedida
             throw new Error(`Erro HTTP: ${response.status}`);
        }
        const items = await response.json(); // Converte a resposta para JSON
        console.log("Itens recebidos:", items); // Log para depuração
        atualizarTabelaECalcularTotal(items); // Chama a função para mostrar na tela
    } catch (error) {
        console.error('Erro ao carregar itens:', error);
        alert(`Não foi possível carregar os itens. Verifique se o servidor backend está rodando.\nDetalhe: ${error.message}`);
    }
}

// Função para atualizar a tabela HTML e calcular o total
function atualizarTabelaECalcularTotal(items) {
    tabelaOrcamentoBody.innerHTML = ''; // Limpa a tabela antes de adicionar os itens atualizados
    let totalGeral = 0;

    if (!Array.isArray(items)) {
         console.error("Erro: 'items' não é um array.", items);
         items = []; // Garante que items seja um array vazio se algo der errado
    }


    items.forEach(item => {
        const row = tabelaOrcamentoBody.insertRow(); // Cria uma nova linha na tabela (<tr>)

        const valorTotalItem = (item.quantidade || 0) * (item.valor || 0); // Calcula o total do item

        // Insere as células (<td>) com os dados do item
        row.insertCell().textContent = item.nome;
        row.insertCell().textContent = item.quantidade;
        row.insertCell().textContent = formatarMoeda(item.valor);
        row.insertCell().textContent = formatarMoeda(valorTotalItem);

        // Cria a célula para o botão de deletar
        const acoesCell = row.insertCell();
        const deletarBtn = document.createElement('button'); // Cria o botão
        deletarBtn.textContent = 'Deletar'; // Texto do botão
        deletarBtn.classList.add('delete-btn'); // Adiciona a classe CSS para estilo
        deletarBtn.onclick = () => deletarItem(item._id); // Define o que acontece ao clicar
        acoesCell.appendChild(deletarBtn); // Adiciona o botão na célula

        totalGeral += valorTotalItem; // Soma o total do item ao total geral
    });

    valorTotalSpan.textContent = formatarMoeda(totalGeral); // Atualiza o total geral na página
    console.log("Tabela atualizada. Total geral:", formatarMoeda(totalGeral)); // Log
}

// Função para adicionar um novo item
async function adicionarItem() {
    // Pega os valores dos campos de input
    const nome = nomeInput.value.trim(); // trim() remove espaços em branco extras
    const quantidade = parseInt(quantidadeInput.value); // Converte para número inteiro
    const valor = parseFloat(valorInput.value.replace(',', '.')); // Converte para número decimal, aceitando vírgula

    // Validação simples: verifica se os campos não estão vazios e são números válidos
    if (!nome || isNaN(quantidade) || quantidade <= 0 || isNaN(valor) || valor < 0) {
        alert('Por favor, preencha todos os campos corretamente. Quantidade deve ser maior que 0 e valor não pode ser negativo.');
        return; // Para a execução se a validação falhar
    }

    const novoItem = { nome, quantidade, valor };
    console.log("Enviando para adicionar:", novoItem); // Log

    try {
        const response = await fetch(apiUrl, {
            method: 'POST', // Método HTTP para criar um novo recurso
            headers: {
                'Content-Type': 'application/json', // Informa que estamos enviando JSON
            },
            body: JSON.stringify(novoItem) // Converte o objeto JavaScript em texto JSON
        });

        if (!response.ok) {
             // Tenta ler a mensagem de erro do backend, se houver
             const errorData = await response.json().catch(() => null);
             throw new Error(`Erro HTTP: ${response.status}. ${errorData?.message || 'Não foi possível adicionar o item.'}`);
        }

        const itemAdicionado = await response.json();
        console.log('Item adicionado com sucesso:', itemAdicionado);

        // Limpa os campos do formulário
        nomeInput.value = '';
        quantidadeInput.value = '1'; // Volta a quantidade para 1
        valorInput.value = '';
        nomeInput.focus(); // Coloca o cursor de volta no campo nome

        carregarItens(); // Recarrega a lista de itens para mostrar o novo item

    } catch (error) {
        console.error('Erro ao adicionar item:', error);
        alert(`Não foi possível adicionar o item.\nDetalhe: ${error.message}`);
    }
}

// Função para deletar um item
async function deletarItem(id) {
    // Confirmação antes de deletar
    if (!confirm('Tem certeza que deseja deletar este item?')) {
        return; // Cancela se o usuário clicar em "Cancelar"
    }

    console.log("Tentando deletar item com ID:", id); // Log

    try {
        const response = await fetch(`${apiUrl}/${id}`, { // Adiciona o ID à URL
            method: 'DELETE' // Método HTTP para deletar
        });

         if (!response.ok) {
             const errorData = await response.json().catch(() => null);
             throw new Error(`Erro HTTP: ${response.status}. ${errorData?.message || 'Não foi possível deletar o item.'}`);
        }

        const resultado = await response.json();
        console.log('Item deletado:', resultado);

        carregarItens(); // Recarrega a lista para remover o item deletado da tabela

    } catch (error) {
        console.error('Erro ao deletar item:', error);
         alert(`Não foi possível deletar o item.\nDetalhe: ${error.message}`);
    }
}

// --- Event Listeners ---

// Adiciona um listener para o botão "Adicionar Item": chama a função adicionarItem quando clicado
adicionarBtn.addEventListener('click', adicionarItem);

// Adiciona um listener para permitir adicionar com a tecla Enter nos inputs
nomeInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        quantidadeInput.focus(); // Pula para o campo quantidade
    }
});
quantidadeInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        valorInput.focus(); // Pula para o campo valor
    }
});
valorInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        adicionarItem(); // Adiciona o item
    }
});


// --- Inicialização ---

// Carrega os itens existentes quando a página é carregada pela primeira vez
carregarItens();