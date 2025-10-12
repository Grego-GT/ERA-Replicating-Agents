// Use global React and ReactDOM from CDN
const React = (window as any).React;
const ReactDOM = (window as any).ReactDOM;

import App from './App.tsx';

console.log('📦 Main.tsx loading...');
console.log('✅ React available:', !!React);
console.log('✅ ReactDOM available:', !!ReactDOM);

const root = document.getElementById('root');
if (root && ReactDOM) {
    ReactDOM.createRoot(root).render(
        React.createElement(React.StrictMode, null,
            React.createElement(App, null)
        )
    );
    console.log('✅ App rendered');
} else {
    console.error('❌ Failed to render:', { root: !!root, ReactDOM: !!ReactDOM });
}
