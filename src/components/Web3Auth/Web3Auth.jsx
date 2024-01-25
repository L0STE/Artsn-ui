import "./Web3Auth.scss";
import { Web3AuthNoModal } from "@web3auth/no-modal";
import {
    CHAIN_NAMESPACES,
    WALLET_ADAPTERS,
} from "@web3auth/base";
import { CgGoogle } from "react-icons/cg";
import { useEffect, useState } from "react";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { SolanaPrivateKeyProvider } from "@web3auth/solana-provider";
import RPC from "./solanaRPC";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

function Web3AuthLogin() {
    const [web3auth, setWeb3auth] = useState(null);
    const [provider, setProvider] = useState(null);
    const [loggedIn, setLoggedIn] = useState(false);

    const clientId = "BI8MhAUT4vK4cfQZRQ_NEUYOHE3dhD4ouJif9SUgbgBeeZwP6wBlXast2pZsQJlney3nPBDb-PcMl9oF6lV67P0";
    
    // get it from https://dashboard.web3auth.io by creating a Plug n Play project.

    function uiConsole(...args) {
        const el = document.querySelector("#console>p");
        if (el) {
          el.innerHTML = JSON.stringify(args || {}, null, 2);
        }
    }    
    
    const login = async () => {
        if (!web3auth) {
          uiConsole("web3auth not initialized yet");
          return;
        }
        const web3authProvider = await web3auth.connectTo(
          WALLET_ADAPTERS.OPENLOGIN,
          {
            loginProvider: "google",
          },
        );
        setProvider(web3authProvider);
    };

    const logout = async () => {
        if (!web3auth) {
          uiConsole("web3auth not initialized yet");
          return;
        }
        await web3auth.logout();
        setProvider(null);
        setLoggedIn(false);
    };

    // WEB3 AUTH FUNCTIONS*******************************
      const authenticateUser = async () => {
        if (!web3auth) {
          uiConsole("web3auth not initialized yet");
          return;
        }
        const idToken = await web3auth.authenticateUser();
        uiConsole(idToken);
      };
    
      const getUserInfo = async () => {
        if (!web3auth) {
          uiConsole("web3auth not initialized yet");
          return;
        }
        const user = await web3auth.getUserInfo();
        uiConsole(user);
      };
    
      const getAccounts = async () => {
        if (!provider) {
          uiConsole("provider not initialized yet");
          return;
        }
        const rpc = new RPC(provider);
        const address = await rpc.getAccounts();
        uiConsole(address);
      };
    
      const getBalance = async () => {
        if (!provider) {
          uiConsole("provider not initialized yet");
          return;
        }
        const rpc = new RPC(provider);
        const balance = await rpc.getBalance();
        uiConsole(balance);
      };
    
      const sendTransaction = async () => {
        if (!provider) {
          uiConsole("provider not initialized yet");
          return;
        }
        const rpc = new RPC(provider);
        const receipt = await rpc.sendTransaction();
        uiConsole(receipt);
      };
    
      const sendVersionTransaction = async () => {
        if (!provider) {
          uiConsole("provider not initialized yet");
          return;
        }
        const rpc = new RPC(provider);
        const receipt = await rpc.sendVersionTransaction();
        uiConsole(receipt);
      };
    
      const signVersionedTransaction = async () => {
        if (!provider) {
          uiConsole("provider not initialized yet");
          return;
        }
        const rpc = new RPC(provider);
        const receipt = await rpc.signVersionedTransaction();
        uiConsole(receipt);
      };
    
      const signAllVersionedTransaction = async () => {
        if (!provider) {
          uiConsole("provider not initialized yet");
          return;
        }
        const rpc = new RPC(provider);
        const receipt = await rpc.signAllVersionedTransaction();
        uiConsole(receipt);
      };
    
      const signAllTransaction = async () => {
        if (!provider) {
          uiConsole("provider not initialized yet");
          return;
        }
        const rpc = new RPC(provider);
        const receipt = await rpc.signAllTransaction();
        uiConsole(receipt);
      };
    
    //   const mintNFT = async () => {
    //     if (!provider) {
    //       uiConsole("provider not initialized yet");
    //       return;
    //     }
    //     const rpc = new RPC(provider);
    //     const NFT = await rpc.mintNFT();
    //     uiConsole(NFT);
    //   };
    
      const signMessage = async () => {
        if (!provider) {
          uiConsole("provider not initialized yet");
          return;
        }
        const rpc = new RPC(provider);
        const signedMessage = await rpc.signMessage();
        uiConsole(signedMessage);
      };
    
      const getPrivateKey = async () => {
        if (!provider) {
          uiConsole("provider not initialized yet");
          return;
        }
        const rpc = new RPC(provider);
        const privateKey = await rpc.getPrivateKey();
        uiConsole(privateKey);
      };

    // RENDER VIEWS*******************************
    const unloggedInView = (
        <button onClick={login} className="login-btn">
            <CgGoogle onClick={login} className="google-icon" />
            Google
        </button>
    );

    const loggedInView = (
        // <>
        <div className="flex-container">
            <div>
              <button onClick={getUserInfo} className="card">
                Get User Info
              </button>
            </div>
            <div>
              <button onClick={authenticateUser} className="card">
                Get ID Token
              </button>
            </div>
            <div>
              <button onClick={getAccounts} className="card">
                Get Account
              </button>
            </div>
            <div>
              <button onClick={getBalance} className="card">
                Get Balance
              </button>
            </div>
            <div>
              <button onClick={sendTransaction} className="card">
                Send Transaction
              </button>
            </div>
            <div>
              <button onClick={sendVersionTransaction} className="card">
                Send Version Transaction
              </button>
            </div>
            <div>
              <button onClick={signVersionedTransaction} className="card">
                Sign Versioned Transaction
              </button>
            </div>
            <div>
              <button onClick={signAllVersionedTransaction} className="card">
                Sign All Versioned Transaction
              </button>
            </div>
            <div>
              <button onClick={signAllTransaction} className="card">
                Sign All Transaction
              </button>
            </div>
            {/* <div>
              <button onClick={mintNFT} className="card">
                Mint NFT
              </button>
            </div> */}
            <div>
              <button onClick={signMessage} className="card">
                Sign Message
              </button>
            </div>
            <div>
              <button onClick={getPrivateKey} className="card">
                Get Private Key
              </button>
            </div>
            <div>
              <button onClick={logout} className="card">
                Log Out
              </button>
            </div>
        </div>
        //   {/* <div id="console" style={{ whiteSpace: "pre-line" }}>
        //     <p style={{ whiteSpace: "pre-line" }}>Logged in Successfully!</p>
        //   </div> */}
        // {/* </> */}
      );

    useEffect(() => {
        const init = async () => {
            try {
              const chainConfig = {
                chainNamespace: CHAIN_NAMESPACES.SOLANA,
                chainId: "0x3", // Please use 0x1 for Mainnet, 0x2 for Testnet, 0x3 for Devnet
                rpcTarget: "https://api.devnet.solana.com",
                displayName: "Solana Devnet",
                blockExplorer: "https://explorer.solana.com",
                ticker: "SOL",
                tickerName: "Solana Token",
              };
              const web3auth = new Web3AuthNoModal({
                clientId,
                chainConfig,
                web3AuthNetwork: "sapphire_mainnet",
              });
      
              setWeb3auth(web3auth);
      
              const privateKeyProvider = new SolanaPrivateKeyProvider({ config: { chainConfig } });
      
              const openloginAdapter = new OpenloginAdapter({
                privateKeyProvider,
                adapterSettings: {
                  uxMode: "redirect",
                }
              });
              web3auth.configureAdapter(openloginAdapter);
      
              await web3auth.init();
              setProvider(web3auth.provider);
              if (web3auth.connected) {
                setLoggedIn(true);
              }
            } catch (error) {
              console.error(error);
            }
          };
    
        init();
      }, []);

    return(
        <div className="modal-container">
            <h2 className="header">
                Sign in to The Artisan
            </h2>
            <div className="login-container">
                <div className="login-option">
                    <WalletMultiButton />
                </div>
                <div className="login-option">
                    {loggedIn ? loggedInView : unloggedInView}
                </div>
            </div>
        </div>
    );
}

export default Web3AuthLogin;