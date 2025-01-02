// src/hooks/use-web3-auth.ts
import { useCallback, useEffect, useState } from 'react'
import {
  CHAIN_NAMESPACES,
  IProvider,
  WALLET_ADAPTERS,
  WEB3AUTH_NETWORK,
  UX_MODE,
  IWeb3AuthCoreOptions,
  IAdapter,
} from '@web3auth/base'
import { WalletConnectModal } from "@walletconnect/modal";
import { WalletConnectV2Adapter, getWalletConnectV2Settings } from "@web3auth/wallet-connect-v2-adapter";
import { getInjectedAdapters } from '@web3auth/default-solana-adapter'
import { SolanaPrivateKeyProvider } from '@web3auth/solana-provider'
import { Web3AuthNoModal } from '@web3auth/no-modal'
import { AuthAdapter } from '@web3auth/auth-adapter'
import { useMutation } from '@apollo/client'
import { LOGIN_USER } from '@/graphql/mutations/user'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { usePaymentStore } from '@/lib/stores/usePaymentStore'
import RPC from '@/components/blockchain/solana-rpc'
import { useToast } from '@/hooks/use-toast'

const clientId =
  'BI8MhAUT4vK4cfQZRQ_NEUYOHE3dhD4ouJif9SUgbgBeeZwP6wBlXast2pZsQJlney3nPBDb-PcMl9oF6lV67P0'
let injectedAdapters: IAdapter<unknown>[] = []

// RPC functions interface
interface RPCFunctions {
  getAccounts: () => Promise<string[]>
  getBalance: () => Promise<{ sol: number; usdc: number }>
  signTransaction: (params: { tx: any }) => Promise<any>
}

export const useWeb3Auth = () => {
  const [loginUserMutation] = useMutation(LOGIN_USER)
  const { toast } = useToast()
  const [web3auth, setWeb3auth] = useState<Web3AuthNoModal | null>(null);
  const [provider, setProvider] = useState<IProvider | null>(null);

  // Auth store state and actions
  const {
    loggedIn,
    loading,
    error,
    setWeb3AuthState,
    setLoading,
    setError: setStoreError,
    setAuth,
  } = useAuthStore()

  // Payment store actions for balance
  const { setBalance } = usePaymentStore()

  // RPC instance
  const getRPC = useCallback((): RPCFunctions | null => {
    if (!provider) return null
    return new RPC(provider)
  }, [provider])

  const init = async () => {
    try {
      const chainConfig = {
        chainNamespace: CHAIN_NAMESPACES.SOLANA,
        chainId: "0x3", // Please use 0x1 for Mainnet, 0x2 for Testnet, 0x3 for Devnet
        rpcTarget: "https://api.devnet.solana.com",
        displayName: "Solana Devnet",
        blockExplorerUrl: "https://explorer.solana.com",
        ticker: "SOL",
        tickerName: "Solana Token",
        logo: "",
      };

      const privateKeyProvider = new SolanaPrivateKeyProvider({ config: { chainConfig } });

      const web3authOptions: IWeb3AuthCoreOptions = {
        clientId,
        privateKeyProvider,
        web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
      };
      const web3auth = new Web3AuthNoModal(web3authOptions);

      setWeb3auth(web3auth);

      const authAdapter = new AuthAdapter({
        privateKeyProvider,
        adapterSettings: {
          uxMode: UX_MODE.REDIRECT,
        },
      });
      web3auth.configureAdapter(authAdapter);

      // adding wallet connect v2 adapter
      // const defaultWcSettings = await getWalletConnectV2Settings(CHAIN_NAMESPACES.SOLANA, ["0x3"], clientId);
      // const walletConnectModal = new WalletConnectModal({ projectId: clientId });
      // const walletConnectV2Adapter = new WalletConnectV2Adapter({
      //   adapterSettings: {
      //     qrcodeModal: walletConnectModal,
      //     ...defaultWcSettings.adapterSettings,
      //   },
      //   loginSettings: { ...defaultWcSettings.loginSettings },
      // });
      // web3auth.configureAdapter(walletConnectV2Adapter);

      injectedAdapters = getInjectedAdapters({ options: web3authOptions });
      injectedAdapters.forEach((adapter) => {
        web3auth.configureAdapter(adapter);
      });

      await web3auth.init();
      setProvider(web3auth.provider);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    init();
  }, []);

  const handlePostConnection = async (web3authInstance: Web3AuthNoModal) => {
    const rpc = new RPC(web3authInstance.provider!)
    const accounts = await rpc.getAccounts()
    const publicKey = accounts[0]
    const { idToken } = await web3authInstance.authenticateUser()
    const user = await web3authInstance.getUserInfo()

    try {
      const result = await loginUserMutation({
        variables: {
          publicKey,
          password: publicKey,
        },
      })

      if (result.data?.login) {
        setAuth(result.data.login)

        // Get and set balance after successful login
        const balance = await rpc.getBalance()
        setBalance(balance)

        // toast({
        //   title: 'Welcome back!',
        //   description: 'You have successfully logged in.',
        // })
      }
    } catch (error) {
      console.error('Login mutation error:', error)
      throw error
    }
  }

  const login = useCallback(async () => {
    if (!web3auth) {
      console.log('Web3Auth not initialized')
      return
    }

    try {
      setLoading(true)

      if (web3auth?.connected) {
        const userInfo = await getUserInfo()
        return userInfo
      }

      const web3authProvider = await web3auth!.connectTo(WALLET_ADAPTERS.AUTH, {
        loginProvider: 'google',
      })

      setWeb3AuthState({
        provider: web3authProvider,
        loggedIn: true,
      })

      await handlePostConnection(web3auth!)
      return await getUserInfo()
    } catch (error) {
      console.error('Login error:', error)
      setStoreError(error as Error)
      return null
    } finally {
      setLoading(false)
    }
  }, [web3auth, setLoading, setWeb3AuthState, setStoreError])

  const logout = useCallback(async () => {
    if (!web3auth) {
      console.error('Web3Auth not initialized')
      return
    }

    try {
      await web3auth.logout()
      useAuthStore.getState().logout()
      setBalance({ sol: 0, usdc: 0 })
    } catch (error) {
      console.error('Logout error:', error)
      setStoreError(error as Error)
    }
  }, [web3auth, setStoreError, setBalance])

  const getUserInfo = useCallback(async () => {
    if (!web3auth) return null

    try {
      const user = await web3auth.getUserInfo()
      const rpc = getRPC()
      if (!rpc) return null

      const accounts = await rpc.getAccounts()
      const balance = await rpc.getBalance()
      setBalance(balance)

      return {
        ...user,
        publicKey: accounts[0],
      }
    } catch (error) {
      console.error('Get user info error:', error)
      return null
    }
  }, [web3auth, getRPC, setBalance])

  const checkUserRegistration = async (publicKey: string) => {
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query IsUserRegistered($publicKey: String!) {
              isUserRegistered(publicKey: $publicKey)
            }
          `,
          variables: { publicKey }
        }),
      });
  
      const data = await response.json();
      return data.data?.isUserRegistered || false;
    } catch (error) {
      console.error('Error checking registration:', error);
      return false;
    }
  };

  const loginWithAdapter = useCallback(async (adapterName: string) => {
    if (!web3auth) {
      console.error("Web3Auth not initialized");
      return;
    }
  
    try {
      setLoading(true);
      
      const web3authProvider = await web3auth.connectTo(adapterName);
      
      if (!web3authProvider) {
        throw new Error('Failed to get provider from adapter');
      }
  
      const userInfo = await web3auth.getUserInfo();
      const rpc = new RPC(web3authProvider);
      const accounts = await rpc.getAccounts();
      const publicKey = accounts[0];
  
      // Check if user is registered
      const isRegistered = await checkUserRegistration(publicKey);
      
      if (!isRegistered) {
        // Store auth info temporarily
        sessionStorage.setItem('pendingRegistration', JSON.stringify({
          publicKey,
          userInfo
        }));
        
        // Redirect to registration
        window.location.href = '/register';
        return;
      }
  
      // Continue with normal login flow for registered users
      setWeb3AuthState({
        provider: web3authProvider,
        loggedIn: true
      });
  
      await handlePostConnection(web3auth);
  
      return {
        ...userInfo,
        publicKey
      };
  
    } catch (error) {
      console.error('Adapter login error:', error);
      setStoreError(error as Error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [web3auth, setLoading, setWeb3AuthState, setStoreError, handlePostConnection]);

  // Transaction signing utility
  const signTransaction = useCallback(
    async (tx: any) => {
      if (!provider) {
        console.error('No provider available for transaction signing')
        throw new Error('Web3 provider not initialized')
      }

      try {
        const rpc = new RPC(provider)
        // Make sure we're using the version-specific signing method
        const signature = await rpc.signVersionedTransaction({ tx })

        if (!signature) {
          throw new Error('No signature returned')
        }

        console.log('Transaction signed successfully:', signature)
        return signature
      } catch (error) {
        console.error('Transaction signing error:', error)
        throw new Error('Failed to sign transaction')
      }
    },
    [provider]
  )

  // useEffect(() => {
  //   initWeb3Auth()
  // }, [initWeb3Auth])

  return {
    web3auth,
    provider,
    loggedIn,
    loading,
    error,
    login,
    loginWithAdapter,
    logout,
    getUserInfo,
    signTransaction,
    injectedAdapters,
  }
}

// Optional: Export a simpler hook for just Web3 utilities
export const useWeb3 = () => {
  const { provider } = useAuthStore()
  const { setBalance } = usePaymentStore()

  const rpc = provider ? new RPC(provider) : null

  return {
    rpc,
    getBalance: useCallback(async () => {
      if (!rpc) return null
      const balance = await rpc.getBalance()
      setBalance(balance)
      return balance
    }, [rpc, setBalance]),
    getAccounts: useCallback(async () => {
      if (!rpc) return null
      return await rpc.getAccounts()
    }, [rpc]),
    signTransaction: useCallback(
      async (tx: any) => {
        if (!rpc) return null
        return await rpc.signTransaction({ tx })
      },
      [rpc]
    ),
  }
}
