import express from 'express';

const app = express();
app.use(express.json());

const estoque: Record<number, { preco: number; quantidade: number }> = { 
    1: { preco: 94.95, quantidade: 8 } 
};

app.post('/produtos/:id/reservas', (req, res) => {
    const id = Number(req.params.id);
    const { quantidade } = req.body;
    const produto = estoque[id];

    if (!produto) {
        return res.status(404).json({ mensagem: "Produto não encontrado" });
    }

    if (produto.quantidade < quantidade) {
        return res.status(409).json({ mensagem: "Estoque insuficiente", codigo: "ESTOQUE_INSUFICIENTE" });
    }

    produto.quantidade -= quantidade;
    return res.status(200).json({ reservado: quantidade, estoqueRestante: produto.quantidade, preco: produto.preco });
});

app.listen(process.env.PORT || 3001, () => console.log('Catálogo rodando na 3001'));