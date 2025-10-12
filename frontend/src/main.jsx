import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';  // Corrigez cette ligne en supprimant ReactDOM
import App from './App.jsx';
import { Provider } from 'react-redux';
import store from './store/store'; 
import '@mantine/core/styles.css'; 

const root = createRoot(document.getElementById('root'));
root.render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);
