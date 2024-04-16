const stun = require('stun');
const WebSocket = require('ws');

// Create a WebSocket server
const port = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port });


// Store connected clients
const clients = new Set();

// Function to send a message to all clients except the sender
function broadcast(message, sender) {
    clients.forEach(function each(client) {
        if (client !== sender && client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// Event listener for connection
wss.on('connection', async function connection(ws) {
    clients.add(ws);

    // Perform STUN request to get the client's public IP
    try {
        const res = await stun.request('stun.l.google.com:19302');
        const { address } = res.getXorAddress();
        console.log('Client connected from IP:', address);
    } catch (err) {
        console.error('Error getting client IP:', err);
    }

    // Event listener for incoming messages
    ws.on('message', function incoming(message) {
        // Broadcast the message to all clients except the sender
        broadcast(message, ws);
    });

    // Event listener for closing connection
    ws.on('close', function() {
        clients.delete(ws);
    });
});

console.log('Signaling server started on port 8080');
