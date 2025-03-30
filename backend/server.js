const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000; // Usaremos a porta 5000

app.use(cors()); // Permite requisições de diferentes origens (o front-end)
app.use(express.json()); // Permite que o servidor entenda JSON no corpo das requisições

// --- Conexão com o MongoDB ---
// Substitua 'mongodb://localhost:27017/orcamento-compras' se seu MongoDB estiver rodando em outro lugar
mongoose.connect('mongodb://localhost:27017/orcamento-compras', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const connection = mongoose.connection;
connection.once('open', () => {
    console.log('Conexão com o MongoDB estabelecida com sucesso!');
});
connection.on('error', (err) => { // Adicionamos um listener para erros de conexão
    console.error('Erro de conexão com o MongoDB:', err);
    process.exit(); // Sai da aplicação se não conseguir conectar
});

// --- Definição do Modelo (Schema) para os Itens ---
const itemSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    quantidade: { type: Number, required: true, min: 0 }, // Garante que a quantidade não seja negativa
    valor: { type: Number, required: true, min: 0 }, // Garante que o valor não seja negativo
});

const Item = mongoose.model('Item', itemSchema); // 'Item' é o nome da coleção no MongoDB (será 'items')

// --- Rotas da API (Endpoints) ---

// Rota para buscar todos os itens (GET /items)
app.get('/items', async (req, res) => {
    try {
        const items = await Item.find(); // Busca todos os documentos na coleção 'Item'
        res.json(items); // Envia a lista de itens como resposta em formato JSON
    } catch (err) {
        console.error("Erro ao buscar itens:", err); // Loga o erro no console do servidor
        res.status(500).json({ message: "Erro ao buscar itens", error: err.message }); // Envia uma resposta de erro
    }
});

// Rota para adicionar um novo item (POST /items)
app.post('/items', async (req, res) => {
    console.log("Recebido para adicionar:", req.body); // Mostra no console o que foi recebido
    const item = new Item({
        nome: req.body.nome,
        quantidade: req.body.quantidade,
        valor: req.body.valor,
    });

    try {
        const newItem = await item.save(); // Salva o novo item no banco de dados
        console.log("Item salvo:", newItem); // Mostra o item salvo no console
        res.status(201).json(newItem); // Envia o item recém-criado como resposta (status 201 = Created)
    } catch (err) {
        console.error("Erro ao salvar item:", err); // Loga o erro
         // Verifica se é um erro de validação do Mongoose
        if (err.name === 'ValidationError') {
             res.status(400).json({ message: "Erro de validação", errors: err.errors });
        } else {
             res.status(400).json({ message: "Erro ao criar item", error: err.message }); // Erro genérico
        }
    }
});

// Rota para deletar um item pelo ID (DELETE /items/:id)
app.delete('/items/:id', async (req, res) => {
    const itemId = req.params.id; // Pega o ID da URL
    console.log("Recebido para deletar ID:", itemId);

    // Verifica se o ID é válido para o MongoDB
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
        return res.status(400).json({ message: 'ID inválido' });
    }

    try {
        const itemDeletado = await Item.findByIdAndDelete(itemId); // Encontra e deleta pelo ID

        if (!itemDeletado) {
            // Se findByIdAndDelete não encontrar nada, retorna null
            console.log("Item não encontrado para deletar:", itemId);
            return res.status(404).json({ message: 'Item não encontrado' });
        }

        console.log("Item deletado:", itemDeletado);
        res.json({ message: 'Item deletado com sucesso', item: itemDeletado }); // Envia uma mensagem de sucesso
    } catch (err) {
        console.error("Erro ao deletar item:", err);
        res.status(500).json({ message: "Erro ao deletar item", error: err.message });
    }
});

// --- Iniciar o Servidor ---
app.listen(port, () => {
    console.log(`Servidor backend rodando na porta ${port}`);
    console.log(`Acesse em: http://localhost:${port}`);
});