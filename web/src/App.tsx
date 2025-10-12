// Use global React from CDN
const React = (window as any).React;
const { useState, useEffect } = React;

import Terminal from './components/Terminal.tsx';
import Header from './components/Header.tsx';
import Sidebar from './components/Sidebar.tsx';

function App() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        console.log('🏭 App component mounted');
        setIsLoaded(true);
    }, []);

    if (!isLoaded) {
        return React.createElement('div',
            { className: 'flex items-center justify-center h-screen bg-gray-900 text-white' },
            React.createElement('div', { className: 'text-center' },
                React.createElement('div', { className: 'text-4xl mb-4' }, '🏭'),
                React.createElement('div', null, 'Initializing AgFactory...')
            )
        );
    }

    return React.createElement('div',
        { className: 'flex flex-col h-screen bg-gray-900' },
        React.createElement(Header, { onToggleSidebar: () => setIsSidebarOpen(!isSidebarOpen) }),
        React.createElement('div', { className: 'flex flex-1 overflow-hidden min-h-0' },
            isSidebarOpen && React.createElement(Sidebar, null),
            React.createElement('main',
                { className: 'flex-1 flex flex-col overflow-hidden min-h-0 terminal-container' },
                React.createElement(Terminal, null)
            )
        )
    );
}

export default App;
