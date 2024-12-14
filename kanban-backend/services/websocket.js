const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', ws => {
    ws.on('message', message => {
        console.log('received:', message);
        // Рассылаем сообщение всем подключённым клиентам
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });
});

console.log('WebSocket server is running on ws://localhost:8080');
