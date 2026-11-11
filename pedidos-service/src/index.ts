import "dotenv/config";
import express from 'express';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from 'pg';

const { Pool } = pkg;

const app = express();
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const CATALOG_URL = process.env.CATALOG_URL || "http://127.0.0.1:3001";
const NOTIFICATION_URL = process.env.NOTIFICATION_URL || "http://127.0.0.1:3002";

app.post('/pedidos', async (req, res) => {
    const { produtoId, quantidade, clienteEmail } = req.body;
    const correlationId = req.headers["x-correlation-id"] ?? randomUUID();
    
    if (!produtoId || !quantidade || quantidade <= 0 || !clienteEmail) {
        return res.status(400).json({ mensagem: "Dados do pedido são inválidos" });
    }

    console.log(`[${correlationId}] POST /pedidos recebido`);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    
    let precoUnitario = 0;
    try {
        const urlCompleta = `${CATALOG_URL}/produtos/${produtoId}/reservas`;
        
        const respostaCatalogo = await fetch(urlCompleta, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json", 
                "x-correlation-id": String(correlationId) 
            },
            body: JSON.stringify({ quantidade }),
            signal: controller.signal
        });

        if (respostaCatalogo.status === 404) {
            return res.status(404).json({ mensagem: "Produto não encontrado" });
        }

        if (respostaCatalogo.status === 409) {
            return res.status(409).json({ mensagem: "Estoque insuficiente", codigo: "ESTOQUE_INSUFICIENTE" });
        }
        
        if (!respostaCatalogo.ok) {
            return res.status(502).json({ mensagem: "Catálogo indisponível" });
        }

        const data = await respostaCatalogo.json();
        precoUnitario = Number(data.precoUnitario);
    } catch (error: any) {
        if (error.name === 'AbortError') {
            return res.status(504).json({ mensagem: "Catálogo demorou para responder" });
        }
        return res.status(502).json({ mensagem: "Catálogo indisponível" });
    } finally {
        clearTimeout(timer);
    }

    try {
        const pedido = await prisma.pedido.create({
            data: {
                produtoId,
                quantidade,
                clienteEmail,
                precoUnitario,
                total: precoUnitario * quantidade,
                status: "CONFIRMADO"
            }
        });

        try {
            await fetch(`${NOTIFICATION_URL}/notificacoes`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-correlation-id": String(correlationId) },
                body: JSON.stringify({ pedidoId: pedido.id, destino: clienteEmail, mensagem: `Pedido ${pedido.id} confirmado` })
            });
        } catch (error) {
            console.log(`[${correlationId}] Notificação falhou, mantendo fluxo`);
        }

        return res.status(201).json(pedido);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensagem: "Erro ao salvar pedido no banco de dados" });
    }
});

app.get('/pedidos', async (req, res) => {
    try {
        const pedidos = await prisma.pedido.findMany({ orderBy: { id: "asc" } });
        return res.status(200).json(pedidos);
    } catch (error) {
        return res.status(500).json({ mensagem: "Erro ao buscar pedidos" });
    }
});

app.listen(process.env.PORT || 3000, () => console.log('Pedidos rodando na 3000'));