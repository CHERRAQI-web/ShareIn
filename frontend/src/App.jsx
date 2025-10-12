import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/dashboard.jsx";
import Layout from "./components/layout.jsx";
import { MantineProvider } from "@mantine/core";
import Users from "./pages/users.jsx";
import Clients from "./pages/client.jsx";
import Login from './pages/login.jsx';
import Register from './pages/register.jsx';
import Form_client  from './pages/form_client.jsx';
import Document from './pages/documents.jsx';
import EditClient from './pages/edit_client.jsx'
function App() {
  return (
    <>
      <MantineProvider>
        <Router>
          <Routes>
           
          <Route path="/Login" element={<Login />}/>
          <Route path="/Register" element={<Register />}/>


            {/* Routes avec Layout */}

            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="/Users" element={<Users />} />
              <Route path="/Clients" element={<Clients />} />  
              <Route path="/EditClient/:id" element={<EditClient />}/>
              <Route path="/Form_client" element={<Form_client />}/>

              <Route path="/documents" element={<Document/>}/>

            </Route>
          </Routes>
        </Router>
      </MantineProvider>
    </>
  );
}

export default App;
