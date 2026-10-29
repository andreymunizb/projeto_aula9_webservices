import express from 'express';

const app = express();
app.use(express.json());

app.post('/notificacoes', (req, res) => {
    const { pedidoId, destino } = req.body;
    const correlationId = req.headers["x-correlation-id"];
    
    console.log(`[${correlationId}] Notificação gerada para o pedido ${pedidoId}: Enviando para ${destino}`);
    
    return res.status(201).json({ status: "notificação registrada" });
});

app.listen(process.env.PORT || 3002, () => console.log('Notificações rodando na 3002'));