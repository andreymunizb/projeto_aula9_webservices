import "dotenv/config";
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from 'pg';

const { Pool } = pkg;

const app = express();
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

app.post('/produtos', async (req, res) => {
    try {
        const { nome, preco, estoque } = req.body;
        const produto = await prisma.produto.create({
            data: { nome, preco, estoque }
        });
        return res.status(201).json(produto);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensagem: "Erro ao criar produto" });
    }
});

app.post('/produtos/:id/reservas', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { quantidade } = req.body;

        if (!quantidade || quantidade <= 0) {
            return res.status(400).json({ mensagem: "Quantidade inválida" });
        }

        const produto = await prisma.produto.findUnique({ where: { id } });

        if (!produto) {
            return res.status(404).json({ mensagem: "Produto não encontrado" });
        }

        if (produto.estoque < quantidade) {
            return res.status(409).json({ mensagem: "Estoque insuficiente", codigo: "ESTOQUE_INSUFICIENTE" });
        }

        const atualizado = await prisma.produto.update({
            where: { id },
            data: { estoque: { decrement: quantidade } }
        });

        return res.status(200).json({ 
            reservado: quantidade, 
            estoqueRestante: atualizado.estoque, 
            precoUnitario: Number(produto.preco) 
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensagem: "Erro interno no servidor" });
    }
});

app.listen(process.env.PORT || 3001, () => console.log('Catálogo rodando na 3001'));