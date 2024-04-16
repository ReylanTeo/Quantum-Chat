 "use client"
// User.tsx
import React, { useState, useEffect } from 'react';

interface Message {
    username: string;
    content: string;
    roomCode: string; // Add roomCode to Message interface
}

const User: React.FC = () => {
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [message, setMessage] = useState(""); // Initialize message state with null
    const [receivedMessages, setReceivedMessages] = useState<Message[]>([]);
    const [sentMessages, setSentMessages] = useState<Message[]>([]);
    const [username, setUsername] = useState('');
    const [roomCreated, setRoomCreated] = useState<boolean>(false); // Track if room is created
    const [roomCode, setRoomCode] = useState<string>('');

    useEffect(() => {
        // Connect to the signaling server
        const socket = new WebSocket('wss://quantum-chat-lm82.onrender.com');

        socket.onopen = () => {
            console.log('Connected to signaling server');
            setWs(socket);
        };

        socket.onmessage = (event) => {
            // Handle incoming messages from signaling server
            const blobData = event.data;
            const reader = new FileReader();
            reader.onload = () => {
                const message = JSON.parse(reader.result as string) as Message;
                if (message.roomCode === roomCode) { // Only add messages with matching roomCode
                    if (message.content != "" && message.username != "") {
                        setReceivedMessages((prevMessages) => [...prevMessages, message]);
                      }
                }
                
            };
            reader.readAsText(blobData);
        };

        return () => {
            // Close the WebSocket connection when component unmounts
            socket.close();
        };
    }, [roomCode]); // Add roomCode as a dependency

    const generateRoomCode = () => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return code;
    };

    const createRoom = () => {
        const code = generateRoomCode();
        setRoomCode(code);
        setRoomCreated(true);
    };

    const joinRoom = () => {
        if (ws && roomCode.trim() !== '') {
            const joinMessage = {
                type: 'join',
                roomCode: roomCode.trim(),
                username
            };
            ws.send(JSON.stringify(joinMessage));
            setRoomCreated(true);
        }
    };

    const sendMessage = () => {
        if (ws && message !== null && message.trim() !== '') {
            const newMessage: Message = { username, content: message, roomCode };
            ws.send(JSON.stringify(newMessage));
            setSentMessages((prevMessages: Message[]) => [...prevMessages, newMessage]);
            setMessage('');
        }
    };

    return (
        <div>
            <h1>User Interface</h1>
            {!roomCreated && (
                <div>
                    <button onClick={createRoom}>Create Room</button>
                    <div>
                        <input
                            type="text"
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value)}
                            placeholder="Room Code"
                        />
                        <button onClick={joinRoom}>Join Room</button>
                    </div>
                </div>
            )}
            {roomCreated && (
                <div>
                    {roomCode && <div>Room Code: {roomCode}</div>} {/* Display room code if it exists */}
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Username"
                    />
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Message"
                    />
                    <button onClick={sendMessage}>Send</button>
                    <div>
                        <h2>Sent Messages:</h2>
                        <ul>
                            {sentMessages.map((msg, index) => (
                                <li key={index}>{`${msg.username}: ${msg.content}`}</li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h2>Received Messages:</h2>
                        <ul>
                            {receivedMessages.map((msg, index) => (
                                <li key={index}>{`${msg.username}: ${msg.content}`}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default User;