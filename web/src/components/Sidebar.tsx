// Use global React from CDN
const React = (window as any).React;
const { useEffect, useState } = React;

interface Agent {
    name: string;
    createdAt: string;
}

export default function Sidebar() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch agents from API
        fetch('/api/agents')
            .then(res => res.json())
            .then(data => {
                setAgents(data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Failed to load agents:', error);
                setLoading(false);
            });
    }, []);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    return React.createElement('aside',
        { className: 'w-64 bg-gray-800 border-r border-gray-700 flex flex-col' },
        React.createElement('div', { className: 'p-4 border-b border-gray-700' },
            React.createElement('h2',
                { className: 'text-sm font-semibold text-gray-400 uppercase tracking-wider' },
                'Live Terminal'
            ),
            React.createElement('p', { className: 'text-xs text-gray-500 mt-1' },
                'Interactive AgFactory CLI'
            )
        ),
        React.createElement('div', { className: 'flex-1 overflow-y-auto p-4' },
            React.createElement('div',
                { className: 'mb-6 p-3 bg-gray-900 rounded-lg border border-gray-700' },
                React.createElement('div', { className: 'flex items-start gap-2 mb-2' },
                    React.createElement('span', { className: 'text-lg' }, '💡'),
                    React.createElement('div', { className: 'text-xs text-gray-400' },
                        React.createElement('p', { className: 'font-semibold text-gray-300 mb-1' }, 'Quick Tip:'),
                        React.createElement('p', null, 'The terminal automatically runs the AgFactory CLI. Follow the prompts to create agents!')
                    )
                )
            ),
            React.createElement('div', { className: 'border-t border-gray-700 pt-4' },
                React.createElement('h3',
                    { className: 'px-1 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center justify-between' },
                    React.createElement('span', null, 'Your Agents'),
                    loading && React.createElement('span',
                        { className: 'inline-block w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin' }
                    )
                ),
                !loading && agents.length === 0 && React.createElement('div',
                    { className: 'px-1 py-4 text-center text-xs text-gray-500' },
                    React.createElement('p', { className: 'mb-1' }, 'No agents yet'),
                    React.createElement('p', { className: 'text-gray-600' }, 'Create your first one!')
                ),
                React.createElement('div', { className: 'space-y-1' },
                    ...agents.map((agent) =>
                        React.createElement('div', {
                            key: agent.name,
                            className: 'px-3 py-2 text-sm text-gray-300 bg-gray-900 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer'
                        },
                            React.createElement('div', { className: 'flex items-center justify-between' },
                                React.createElement('span', { className: 'flex items-center gap-2' },
                                    React.createElement('span', { className: 'text-green-400' }, '●'),
                                    React.createElement('span', { className: 'font-medium' }, agent.name)
                                )
                            ),
                            React.createElement('span', { className: 'text-xs text-gray-500 ml-4' },
                                formatDate(agent.createdAt)
                            )
                        )
                    )
                )
            )
        ),
        React.createElement('div', { className: 'p-4 border-t border-gray-700' },
            React.createElement('div', { className: 'text-xs text-gray-500' },
                React.createElement('div', { className: 'flex items-center gap-2 mb-2' },
                    React.createElement('span', { className: 'w-2 h-2 bg-green-400 rounded-full' }),
                    React.createElement('span', null, 'Live Connection')
                ),
                React.createElement('div', { className: 'text-gray-600' }, 'AgFactory v1.0.0')
            )
        )
    );
}
