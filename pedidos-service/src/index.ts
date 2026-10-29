import express from 'express';
import { randomUUID } from 'node:crypto';

const app = express();
app.use(express.json());

const CATALOG_URL = process.env.CATALOG_URL || "http://127.0.0.1:3001";
const NOTIFICATION_URL = process.env.NOTIFICATION_URL || "http://127.0.0.1:3002";

app.post('/pedidos', async (req, res) => {
    const { produtoId, quantidade, clienteEmail } = req.body;
    const correlationId = req.headers["x-correlation-id"] ?? randomUUID();
    
    console.log(`[${correlationId}] POST /pedidos recebido`);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    
    let preco = 0;
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
        preco = data.preco;
    } catch (error: any) {
        if (error.name === 'AbortError') {
            return res.status(504).json({ mensagem: "Catálogo demorou para responder" });
        }
        return res.status(502).json({ mensagem: "Catálogo indisponível" });
    } finally {
        clearTimeout(timer);
    }

    const pedido = {
        pedidoId: Math.floor(Math.random() * 1000),
        produtoId,
        quantidade,
        total: preco * quantidade,
        notificacaoStatus: "pendente"
    };

    try {
        const respostaNotificacao = await fetch(`${NOTIFICATION_URL}/notificacoes`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-correlation-id": String(correlationId) },
            body: JSON.stringify({ pedidoId: pedido.pedidoId, destino: clienteEmail, mensagem: `Pedido ${pedido.pedidoId} confirmado` })
        });
        if (respostaNotificacao.ok) pedido.notificacaoStatus = "enviada";
    } catch (error) {
        console.log(`[${correlationId}] Notificação falhou, mantendo pendente`);
    }

    return res.status(201).json(pedido);
});

app.listen(process.env.PORT || 3000, () => console.log('Pedidos rodando na 3000'));