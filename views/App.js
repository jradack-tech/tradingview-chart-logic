import './App.css';
import { useEffect } from 'react';
import dotenv from 'dotenv'
import {
  BrowserRouter,
  Switch,
  Route
} from "react-router-dom";
import { UseWalletProvider } from 'use-wallet'

import "./assets/scss/black-dashboard-react.scss";
import "./assets/scss/manual-overrides.scss";
import "./assets/demo/demo.css";
import "./assets/css/nucleo-icons.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import ThemeContextWrapper from "./components/ThemeWrapper/ThemeWrapper";
import BackgroundColorWrapper from "./components/BackgroundColorWrapper/BackgroundColorWrapper";
import AccountProvider from "./contexts/AccountProvider"
import Admin from './layouts/Admin/Admin.js';
import MultiChart from './views/MultiChart.js';


dotenv.config();

function App() {


  useEffect(() => {

  }, [])

  return (
  <ThemeContextWrapper>
    <BackgroundColorWrapper>
        <UseWalletProvider
          chainId={137}
        >
          <AccountProvider>
            <BrowserRouter>
              <Switch>
                <Route path="/multichart">
                  <MultiChart>
                  </MultiChart>
                </Route>
                <Route path="/">
                  <Admin>
                  </Admin>
                </Route>
              </Switch>
          </BrowserRouter>
        </AccountProvider>
      </UseWalletProvider>
    </BackgroundColorWrapper>
  </ThemeContextWrapper>
  );
}

export default App;
