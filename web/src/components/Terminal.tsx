import React, { useEffect, useRef, useState } from 'react';

// Use global Terminal from CDN
declare global {
    interface Window {
        Terminal: any;
        FitAddon: any;
        WebLinksAddon: any;
    }
}

export default function Terminal() {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<any>(null);
    const fitAddonRef = useRef<any>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        console.log('🖥️  Terminal component mounting...');

        if (!terminalRef.current) {
            console.error('❌ Terminal ref not found');
            return;
        }

        // Check if xterm is loaded
        if (!window.Terminal) {
            console.error('❌ XTerm not loaded from CDN');
            setError('XTerm library not loaded');
            return;
        }

        console.log('✅ Terminal ref found, initializing xterm...');

        // Initialize xterm.js
        const term = new window.Terminal({
            cursorBlink: true,
            fontSize: 14,
            fontFamily: '"Cascadia Code", Menlo, Monaco, "Courier New", monospace',
            theme: {
                background: '#0a0a0a',
                foreground: '#f0f0f0',
                cursor: '#00ff00',
                cursorAccent: '#000000',
                selection: 'rgba(255, 255, 255, 0.3)',
                black: '#000000',
                red: '#ff5555',
                green: '#50fa7b',
                yellow: '#f1fa8c',
                blue: '#bd93f9',
                magenta: '#ff79c6',
                cyan: '#8be9fd',
                white: '#f8f8f2',
                brightBlack: '#6272a4',
                brightRed: '#ff6e6e',
                brightGreen: '#69ff94',
                brightYellow: '#ffffa5',
                brightBlue: '#d6acff',
                brightMagenta: '#ff92df',
                brightCyan: '#a4ffff',
                brightWhite: '#ffffff',
            },
            rows: 30,
            cols: 80,
            scrollback: 1000,
        });

        console.log('✅ XTerm instance created');

        const fitAddon = new window.FitAddon.FitAddon();
        const webLinksAddon = new window.WebLinksAddon.WebLinksAddon();

        term.loadAddon(fitAddon);
        term.loadAddon(webLinksAddon);

        console.log('✅ Addons loaded');

        try {
            term.open(terminalRef.current);
            console.log('✅ Terminal opened in DOM');
        } catch (e) {
            console.error('❌ Failed to open terminal:', e);
            setError('Failed to open terminal');
            return;
        }

        // Small delay before fitting
        setTimeout(() => {
            try {
                fitAddon.fit();
                console.log(`✅ Terminal fitted: ${term.cols}x${term.rows}`);
            } catch (e) {
                console.error('❌ Failed to fit terminal:', e);
            }
        }, 100);

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        // Display welcome message
        term.writeln('\x1b[1;32m╔════════════════════════════════════════════════════════════════╗\x1b[0m');
        term.writeln('\x1b[1;32m║                                                                ║\x1b[0m');
        term.writeln('\x1b[1;32m║                    🏭  AgFactory Web Terminal                  ║\x1b[0m');
        term.writeln('\x1b[1;32m║                                                                ║\x1b[0m');
        term.writeln('\x1b[1;32m║                   AI Agent Creator - v1.0.0                    ║\x1b[0m');
        term.writeln('\x1b[1;32m║                                                                ║\x1b[0m');
        term.writeln('\x1b[1;32m╚════════════════════════════════════════════════════════════════╝\x1b[0m');
        term.writeln('');
        term.writeln('\x1b[1;36m🔌 Connecting to AgFactory CLI...\x1b[0m');
        term.writeln('');

        console.log('✅ Welcome message written');

        // Connect to WebSocket
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        console.log('🔌 Connecting to WebSocket:', wsUrl);

        let ws: WebSocket;
        try {
            ws = new WebSocket(wsUrl);
            wsRef.current = ws;
        } catch (e) {
            console.error('❌ Failed to create WebSocket:', e);
            term.writeln('\x1b[1;31m❌ Failed to create WebSocket connection\x1b[0m');
            setError('WebSocket connection failed');
            return;
        }

        ws.onopen = () => {
            console.log('✅ WebSocket connected');
            setConnectionStatus('connected');
            term.writeln('\x1b[1;32m✅ Connected! Starting AgFactory CLI...\x1b[0m');
            term.writeln('');

            // Automatically start the CLI
            console.log('📤 Sending start_cli command...');
            ws.send(JSON.stringify({ type: 'start_cli' }));
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log('📥 WebSocket message:', message.type);

                if (message.type === 'output') {
                    term.write(message.data);
                } else if (message.type === 'exit') {
                    term.writeln('');
                    term.writeln(`\x1b[1;33m⚠️  Process exited with code: ${message.code}\x1b[0m`);
                    term.writeln('');
                    term.writeln('\x1b[1;36m💡 Refresh the page to start a new session\x1b[0m');
                } else if (message.type === 'error') {
                    term.writeln('');
                    term.writeln(`\x1b[1;31m❌ Error: ${message.message}\x1b[0m`);
                } else if (message.type === 'connected') {
                    console.log('✅ Server confirmed connection');
                }
            } catch (error) {
                console.error('❌ Error parsing WebSocket message:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
            setConnectionStatus('disconnected');
            setError('WebSocket error');
            term.writeln('');
            term.writeln('\x1b[1;31m❌ Connection error\x1b[0m');
            term.writeln('\x1b[1;33m💡 Check that the server is running\x1b[0m');
        };

        ws.onclose = () => {
            console.log('🔌 WebSocket closed');
            setConnectionStatus('disconnected');
            term.writeln('');
            term.writeln('\x1b[1;33m⚠️  Connection closed\x1b[0m');
        };

        // Handle terminal input
        term.onData((data: string) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'input', data }));
            }
        });

        // Handle window resize
        const handleResize = () => {
            try {
                fitAddon.fit();
                console.log(`🔄 Terminal resized: ${term.cols}x${term.rows}`);
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        type: 'resize',
                        cols: term.cols,
                        rows: term.rows
                    }));
                }
            } catch (e) {
                console.error('❌ Resize error:', e);
            }
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            console.log('🧹 Cleaning up terminal...');
            window.removeEventListener('resize', handleResize);
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
            term.dispose();
        };
    }, []);

    if (error) {
        return (
            <div className="flex-1 bg-gray-900 flex items-center justify-center">
                <div className="text-center text-red-400">
                    <div className="text-4xl mb-4">❌</div>
                    <div className="text-xl mb-2">Terminal Error</div>
                    <div className="text-sm text-gray-500">{error}</div>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm"
                    >
                        Reload Page
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-[#0a0a0a] overflow-hidden relative" style={{ minHeight: 0 }}>
            <div ref={terminalRef} className="w-full h-full" style={{ minHeight: 0 }} />

            {/* Connection status indicator */}
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700 shadow-lg z-10">
                <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-400' :
                        connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
                            'bg-red-400'
                    }`} />
                <span className="text-xs text-gray-300 font-medium">
                    {connectionStatus === 'connected' ? 'Connected' :
                        connectionStatus === 'connecting' ? 'Connecting...' :
                            'Disconnected'}
                </span>
            </div>
        </div>
    );
}
