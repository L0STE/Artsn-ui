// // src/hooks/use-web3-auth.ts
// import { useCallback, useEffect, useState, useMemo, useRef } from 'react'
// import {
//   CHAIN_NAMESPACES,
//   IProvider,
//   WALLET_ADAPTERS,
//   WEB3AUTH_NETWORK,
//   UX_MODE,
//   IWeb3AuthCoreOptions,
//   IAdapter,
// } from '@web3auth/base'
// import { WalletConnectModal } from '@walletconnect/modal'
// import {
//   WalletConnectV2Adapter,
//   getWalletConnectV2Settings,
// } from '@web3auth/wallet-connect-v2-adapter'
// import { getInjectedAdapters } from '@web3auth/default-solana-adapter'
// import { SolanaPrivateKeyProvider } from '@web3auth/solana-provider'
// import { Web3AuthNoModal } from '@web3auth/no-modal'
// import { AuthAdapter } from '@web3auth/auth-adapter'
// import { useMutation } from '@apollo/client'
// import { LOGIN_USER } from '@/graphql/mutations/user'
// import { useToast } from '@/hooks/use-toast'
// import { useAuthStore } from '@/lib/stores/useAuthStore'
// import { usePaymentStore } from '@/lib/stores/usePaymentStore'
// import RPC from '@/components/blockchain/solana-rpc'
// import debounce from 'lodash/debounce'

// const clientId =
//   'BI8MhAUT4vK4cfQZRQ_NEUYOHE3dhD4ouJif9SUgbgBeeZwP6wBlXast2pZsQJlney3nPBDb-PcMl9oF6lV67P0'
// let injectedAdapters: IAdapter<unknown>[] = []

// // RPC functions interface
// interface RPCFunctions {
//   getAccounts: () => Promise<string[]>
//   getBalance: () => Promise<{ sol: number; usdc: number }>
//   signTransaction: (params: { tx: any }) => Promise<any>
// }

// export const useWeb3Auth = () => {
//   const [loginUserMutation] = useMutation(LOGIN_USER)
//   const { toast } = useToast()
//   const [web3auth, setWeb3auth] = useState<Web3AuthNoModal | null>(null)
//   const [provider, setProvider] = useState<IProvider | null>(null)

//   // Auth store state and actions
//   const {
//     loggedIn,
//     loading,
//     error,
//     setWeb3AuthState,
//     setLoading,
//     setError: setStoreError,
//     setAuth,
//   } = useAuthStore()

//   // Payment store actions for balance
//   const { setBalance } = usePaymentStore()

//   // RPC instance
//   const getRPC = useCallback((): RPCFunctions | null => {
//     if (!provider) return null
//     return new RPC(provider)
//   }, [provider])

//   // const init = async () => {
//   //   try {
//   //     const chainConfig = {
//   //       chainNamespace: CHAIN_NAMESPACES.SOLANA,
//   //       chainId: '0x3', // Please use 0x1 for Mainnet, 0x2 for Testnet, 0x3 for Devnet
//   //       rpcTarget: 'https://api.devnet.solana.com',
//   //       displayName: 'Solana Devnet',
//   //       blockExplorerUrl: 'https://explorer.solana.com',
//   //       ticker: 'SOL',
//   //       tickerName: 'Solana Token',
//   //       logo: '',
//   //     }

//   //     const privateKeyProvider = new SolanaPrivateKeyProvider({
//   //       config: { chainConfig },
//   //     })

//   //     const web3authOptions: IWeb3AuthCoreOptions = {
//   //       clientId,
//   //       privateKeyProvider,
//   //       web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
//   //     }
//   //     const web3auth = new Web3AuthNoModal(web3authOptions)

//   //     setWeb3auth(web3auth)

//   //     const authAdapter = new AuthAdapter({
//   //       privateKeyProvider,
//   //       adapterSettings: {
//   //         uxMode: UX_MODE.REDIRECT,
//   //       },
//   //     })
//   //     web3auth.configureAdapter(authAdapter)

//   //     // adding wallet connect v2 adapter
//   //     // const defaultWcSettings = await getWalletConnectV2Settings(CHAIN_NAMESPACES.SOLANA, ["0x3"], clientId);
//   //     // const walletConnectModal = new WalletConnectModal({ projectId: clientId });
//   //     // const walletConnectV2Adapter = new WalletConnectV2Adapter({
//   //     //   adapterSettings: {
//   //     //     qrcodeModal: walletConnectModal,
//   //     //     ...defaultWcSettings.adapterSettings,
//   //     //   },
//   //     //   loginSettings: { ...defaultWcSettings.loginSettings },
//   //     // });
//   //     // web3auth.configureAdapter(walletConnectV2Adapter);

//   //     injectedAdapters = getInjectedAdapters({ options: web3authOptions })
//   //     injectedAdapters.forEach((adapter) => {
//   //       web3auth.configureAdapter(adapter)
//   //     })

//   //     await web3auth.init()
//   //     setProvider(web3auth.provider)
//   //   } catch (error) {
//   //     console.error(error)
//   //   }
//   // }

//   // useEffect(() => {
//   //   init()
//   // }, [])

//   const init = async () => {
//     console.log('Initializing Web3Auth')
//     setLoading(true)
//     try {
//       const chainConfig = {
//         chainNamespace: CHAIN_NAMESPACES.SOLANA,
//         chainId: '0x3', // Please use 0x1 for Mainnet, 0x2 for Testnet, 0x3 for Devnet
//         rpcTarget: 'https://api.devnet.solana.com',
//         displayName: 'Solana Devnet',
//         blockExplorerUrl: 'https://explorer.solana.com',
//         ticker: 'SOL',
//         tickerName: 'Solana Token',
//         logo: '',
//       }

//       const privateKeyProvider = new SolanaPrivateKeyProvider({
//         config: { chainConfig },
//       })

//       const web3authOptions: IWeb3AuthCoreOptions = {
//         clientId,
//         privateKeyProvider,
//         web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
//       }
//       const web3auth = new Web3AuthNoModal(web3authOptions)
      
//       setWeb3auth(web3auth)

//       const authAdapter = new AuthAdapter({
//         privateKeyProvider,
//         adapterSettings: {
//           uxMode: UX_MODE.REDIRECT,
//         },
//       })
//       web3auth.configureAdapter(authAdapter)

//       injectedAdapters = getInjectedAdapters({ options: web3authOptions })
//       injectedAdapters.forEach((adapter) => {
//         web3auth.configureAdapter(adapter)
//       })

//       await web3auth.init()
//       console.log('Web3Auth initialized')

//       // Check for existing connection after initialization
//       if (web3auth.connected) {
//         console.log('Found existing Web3Auth connection')
//         const web3authProvider = web3auth.provider
//         setProvider(web3authProvider)
        
//         setWeb3AuthState({
//           provider: web3authProvider,
//           loggedIn: true,
//         })

//         // Handle post-connection flow for existing connection
//         try {
//           await handlePostConnection(web3auth)
//           console.log('Successfully processed existing connection')
//         } catch (error) {
//           console.error('Error handling existing connection:', error)
//           // Even if post-connection fails, keep the provider state
//           // as user might still be able to perform some operations
//         }
//       }
//     } catch (error) {
//       console.error('Error initializing Web3Auth:', error)
//       setStoreError(error as Error)
//     } finally {
//       setLoading(false)
//     }
//   }

//   useEffect(() => {
//     init()
//   }, [])

//   const handlePostConnection = async (web3authInstance: Web3AuthNoModal) => {
//     const rpc = new RPC(web3authInstance.provider!)
//     const accounts = await rpc.getAccounts()
//     const publicKey = accounts[0]
//     console.log('publicKey', publicKey)
//     const { idToken } = await web3authInstance.authenticateUser()
//     const user = await web3authInstance.getUserInfo()

//     try {
//       const result = await loginUserMutation({
//         variables: {
//           publicKey,
//           password: publicKey,
//         },
//       })

//       if (result.data?.login) {
//         setAuth(result.data.login)

//         // Get and set balance after successful login
//         // const balance = await rpc.getBalance()
//         // setBalance(balance)

//         // toast({
//         //   title: 'Welcome back!',
//         //   description: 'You have successfully logged in.',
//         // })
//       }
//     } catch (error) {
//       console.error('Login mutation error:', error)
//       throw error
//     }
//   }

//   const login = useCallback(async () => {
//     console.log('attempting login with email')
//     if (!web3auth) {
//       console.log('Web3Auth not initialized')
//       return
//     }

//     try {
//       setLoading(true)

//       if (web3auth?.connected) {
//         const userInfo = await getUserInfo()
//         await handlePostConnection(web3auth!)
//         console.log('user connected', userInfo)
//         return userInfo
//       }
//       console.log('user not connected, connecting with google')
//       const web3authProvider = await web3auth!.connectTo(WALLET_ADAPTERS.AUTH, {
//         loginProvider: 'google',
//       })
//       console.log('web3authProvider', web3authProvider)
//       setWeb3AuthState({
//         provider: web3authProvider,
//         loggedIn: true,
//       })
//       console.log('processing post connection')
//       await handlePostConnection(web3auth!)
//       return await getUserInfo()
//     } catch (error) {
//       console.error('Login error:', error)
//       setStoreError(error as Error)
//       return null
//     } finally {
//       setLoading(false)
//     }
//   }, [web3auth, setLoading, setWeb3AuthState, setStoreError])

//   const logout = useCallback(async () => {
//     if (!web3auth) {
//       console.error('Web3Auth not initialized')
//       return
//     }

//     try {
//       await web3auth.logout()
//       useAuthStore.getState().logout()
//       setBalance({ sol: 0, usdc: 0 })
//     } catch (error) {
//       console.error('Logout error:', error)
//       setStoreError(error as Error)
//     }
//   }, [web3auth, setStoreError, setBalance])

//   const getUserInfo = useCallback(async () => {
//     if (!web3auth) return null

//     try {
//       const user = await web3auth.getUserInfo()
//       const rpc = getRPC()
//       if (!rpc) return null

//       const accounts = await rpc.getAccounts()
//       // const balance = await rpc.getBalance()
//       // setBalance(balance)

//       return {
//         ...user,
//         publicKey: accounts[0],
//       }
//     } catch (error) {
//       console.error('Get user info error:', error)
//       return null
//     }
//   }, [web3auth, getRPC, setBalance])

//   const checkUserRegistration = async (publicKey: string) => {
//     try {
//       const response = await fetch('/api/graphql', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           query: `
//             query IsUserRegistered($publicKey: String!) {
//               isUserRegistered(publicKey: $publicKey)
//             }
//           `,
//           variables: { publicKey },
//         }),
//       })

//       const data = await response.json()
//       return data.data?.isUserRegistered || false
//     } catch (error) {
//       console.error('Error checking registration:', error)
//       return false
//     }
//   }

//   const loginWithAdapter = useCallback(
//     async (adapterName: string) => {
//       if (!web3auth) {
//         console.error('Web3Auth not initialized')
//         return
//       }

//       try {
//         setLoading(true)

//         const web3authProvider = await web3auth.connectTo(adapterName)

//         if (!web3authProvider) {
//           throw new Error('Failed to get provider from adapter')
//         }

//         const userInfo = await web3auth.getUserInfo()
//         const rpc = new RPC(web3authProvider)
//         const accounts = await rpc.getAccounts()
//         const publicKey = accounts[0]

//         // Check if user is registered
//         const isRegistered = await checkUserRegistration(publicKey)

//         if (!isRegistered) {
//           // Store auth info temporarily
//           sessionStorage.setItem(
//             'pendingRegistration',
//             JSON.stringify({
//               publicKey,
//               userInfo,
//             })
//           )

//           // Redirect to registration
//           window.location.href = '/register'
//           return
//         }

//         // Continue with normal login flow for registered users
//         setWeb3AuthState({
//           provider: web3authProvider,
//           loggedIn: true,
//         })

//         await handlePostConnection(web3auth)

//         return {
//           ...userInfo,
//           publicKey,
//         }
//       } catch (error) {
//         console.error('Adapter login error:', error)
//         setStoreError(error as Error)
//         throw error
//       } finally {
//         setLoading(false)
//       }
//     },
//     [
//       web3auth,
//       setLoading,
//       setWeb3AuthState,
//       setStoreError,
//       handlePostConnection,
//     ]
//   )

//   // Transaction signing utility
//   const signTransaction = useCallback(
//     async (tx: any) => {
//       if (!provider) {
//         console.error('No provider available for transaction signing')
//         throw new Error('Web3 provider not initialized')
//       }

//       try {
//         const rpc = new RPC(provider)
//         // Make sure we're using the version-specific signing method
//         const signature = await rpc.signVersionedTransaction({ tx })

//         if (!signature) {
//           throw new Error('No signature returned')
//         }

//         console.log('Transaction signed successfully:', signature)
//         return signature
//       } catch (error) {
//         console.error('Transaction signing error:', error)
//         throw new Error('Failed to sign transaction')
//       }
//     },
//     [provider]
//   )

//   // useEffect(() => {
//   //   initWeb3Auth()
//   // }, [initWeb3Auth])

//   return {
//     web3auth,
//     provider,
//     loggedIn,
//     loading,
//     error,
//     login,
//     loginWithAdapter,
//     logout,
//     getUserInfo,
//     signTransaction,
//     injectedAdapters,
//   }
// }

// // Optional: Export a simpler hook for just Web3 utilities
// export const useWeb3 = () => {
//   const { provider } = useAuthStore()
//   const { setBalance } = usePaymentStore()
//   const lastBalanceCheck = useRef<number>(0)
//   const MIN_BALANCE_INTERVAL = 2000 // 2 seconds minimum between balance checks

//   // Memoize RPC instance
//   const rpc = useMemo(() => {
//     if (!provider) return null
//     return new RPC(provider)
//   }, [provider])

//   // Rate-limited balance fetching
//   const getBalance = useCallback(async () => {
//     if (!rpc) return null

//     const now = Date.now()
//     if (now - lastBalanceCheck.current < MIN_BALANCE_INTERVAL) {
//       return null
//     }

//     try {
//       const balance = await rpc.getBalance()
//       setBalance(balance)
//       lastBalanceCheck.current = now
//       return balance
//     } catch (error) {
//       console.error('Error fetching balance:', error)
//       return null
//     }
//   }, [rpc, setBalance])

//   // Memoize and debounce getAccounts
//   const getAccounts = useCallback(
//     debounce(async () => {
//       if (!rpc) return null
//       try {
//         return await rpc.getAccounts()
//       } catch (error) {
//         console.error('Error getting accounts:', error)
//         return null
//       }
//     }, 1000),
//     [rpc]
//   )

//   // Transaction signing doesn't need rate limiting since it's user-initiated
//   const signTransaction = useCallback(
//     async (tx: any) => {
//       if (!rpc) return null
//       try {
//         return await rpc.signTransaction({ tx })
//       } catch (error) {
//         console.error('Error signing transaction:', error)
//         return null
//       }
//     },
//     [rpc]
//   )

//   return {
//     rpc,
//     getBalance,
//     getAccounts,
//     signTransaction,
//   }
// }

// export default useWeb3


// VERSION 2222222

// import { useCallback, useEffect, useState, useMemo, useRef } from 'react'
// import {
//   CHAIN_NAMESPACES,
//   IProvider,
//   WALLET_ADAPTERS,
//   WEB3AUTH_NETWORK,
//   UX_MODE,
//   IWeb3AuthCoreOptions,
//   IAdapter,
// } from '@web3auth/base'
// import { getInjectedAdapters } from '@web3auth/default-solana-adapter'
// import { SolanaPrivateKeyProvider } from '@web3auth/solana-provider'
// import { Web3AuthNoModal } from '@web3auth/no-modal'
// import { AuthAdapter } from '@web3auth/auth-adapter'
// import { useMutation } from '@apollo/client'
// import { LOGIN_USER } from '@/graphql/mutations/user'
// import { useToast } from '@/hooks/use-toast'
// import { useAuthStore } from '@/lib/stores/useAuthStore'
// import { usePaymentStore } from '@/lib/stores/usePaymentStore'
// import RPC from '@/components/blockchain/solana-rpc'
// import debounce from 'lodash/debounce'

// const CLIENT_ID = 'BI8MhAUT4vK4cfQZRQ_NEUYOHE3dhD4ouJif9SUgbgBeeZwP6wBlXast2pZsQJlney3nPBDb-PcMl9oF6lV67P0'
// const CHAIN_CONFIG = {
//   chainNamespace: CHAIN_NAMESPACES.SOLANA,
//   chainId: '0x3',
//   rpcTarget: 'https://api.devnet.solana.com',
//   displayName: 'Solana Devnet',
//   blockExplorerUrl: 'https://explorer.solana.com',
//   ticker: 'SOL',
//   tickerName: 'Solana Token',
// }

// class RateLimitedRPC {
//   private static instance: RateLimitedRPC
//   private requestCount: number = 0
//   private lastRequestTime: number = 0
//   private readonly MAX_REQUESTS_PER_WINDOW = 10
//   private readonly WINDOW_MS = 1000
//   private provider: IProvider

//   private constructor(provider: IProvider) {
//     this.provider = provider
//   }

//   static getInstance(provider: IProvider): RateLimitedRPC {
//     if (!RateLimitedRPC.instance || RateLimitedRPC.instance.provider !== provider) {
//       RateLimitedRPC.instance = new RateLimitedRPC(provider)
//     }
//     return RateLimitedRPC.instance
//   }

//   private async rateLimitedRequest<T>(request: () => Promise<T>): Promise<T> {
//     const now = Date.now()
    
//     if (now - this.lastRequestTime > this.WINDOW_MS) {
//       this.requestCount = 0
//       this.lastRequestTime = now
//     }

//     if (this.requestCount >= this.MAX_REQUESTS_PER_WINDOW) {
//       const waitTime = this.WINDOW_MS - (now - this.lastRequestTime)
//       await new Promise(resolve => setTimeout(resolve, waitTime))
//       return this.rateLimitedRequest(request)
//     }

//     try {
//       this.requestCount++
//       return await request()
//     } catch (error: any) {
//       if (error.message?.includes('429')) {
//         await new Promise(resolve => setTimeout(resolve, this.WINDOW_MS))
//         return this.rateLimitedRequest(request)
//       }
//       throw error
//     }
//   }

//   async getBalance() {
//     return this.rateLimitedRequest(async () => {
//       return await new RPC(this.provider).getBalance()
//     })
//   }

//   async getAccounts() {
//     return this.rateLimitedRequest(async () => {
//       return await new RPC(this.provider).getAccounts()
//     })
//   }

//   async signTransaction(tx: any) {
//     // No rate limiting for user-initiated actions
//     return await new RPC(this.provider).signTransaction(tx)
//   }
// }

// export const useWeb3Auth = () => {
//   const [loginUserMutation] = useMutation(LOGIN_USER)
//   const { toast } = useToast()
//   const [web3auth, setWeb3auth] = useState<Web3AuthNoModal | null>(null)
//   const initializationPromise = useRef<Promise<void> | null>(null)
//   const [provider, setProvider] = useState<IProvider | null>(null)
//   const { setBalance } = usePaymentStore()
//   const {
//     loggedIn,
//     loading,
//     error,
//     setWeb3AuthState,
//     setLoading,
//     setError: setStoreError,
//     setAuth,
//   } = useAuthStore()

//   const rpc = useMemo(() => 
//     provider ? RateLimitedRPC.getInstance(provider) : null,
//     [provider]
//   )

//   const handlePostConnection = useCallback(async (web3authInstance: Web3AuthNoModal) => {
//     if (!web3authInstance.provider) return

//     const rpcInstance = RateLimitedRPC.getInstance(web3authInstance.provider)
//     const accounts = await rpcInstance.getAccounts()
//     const publicKey = accounts[0]
//     const user = await web3authInstance.getUserInfo()

//     try {
//       const result = await loginUserMutation({
//         variables: { publicKey, password: publicKey }
//       })

//       if (result.data?.login) {
//         setAuth(result.data.login)
//         const balance = await rpcInstance.getBalance()
//         setBalance(balance)
//       }
//     } catch (error) {
//       console.error('Login mutation error:', error)
//       throw error
//     }
//   }, [loginUserMutation, setAuth, setBalance])
//   let injectedAdapters: IAdapter<unknown>[] = []
//   const initialize = useCallback(async () => {
//     if (initializationPromise.current) return initializationPromise.current
//     if (web3auth?.connected) return

//     initializationPromise.current = (async () => {
//       try {
//         setLoading(true)
//         const privateKeyProvider = new SolanaPrivateKeyProvider({
//           config: { chainConfig: CHAIN_CONFIG }
//         })

//         const web3authInstance = new Web3AuthNoModal({
//           clientId: CLIENT_ID,
//           web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
//           chainConfig: CHAIN_CONFIG,
//         })

//         const web3authOptions: IWeb3AuthCoreOptions = {
//           clientId: CLIENT_ID,
//           privateKeyProvider,
//           web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
//         }

//         const authAdapter = new AuthAdapter({
//           privateKeyProvider,
//           adapterSettings: { uxMode: UX_MODE.REDIRECT }
//         })

//         web3authInstance.configureAdapter(authAdapter)

//         injectedAdapters = getInjectedAdapters({ options: web3authOptions })

//         injectedAdapters.forEach(adapter => {
//           web3authInstance.configureAdapter(adapter)
//         })

//         await web3authInstance.init()
//         setWeb3auth(web3authInstance)

//         if (web3authInstance.connected) {
//           setProvider(web3authInstance.provider)
//           await handlePostConnection(web3authInstance)
//         }

//       } catch (error) {
//         console.error('Failed to initialize Web3Auth:', error)
//         setStoreError(error as Error)
//       } finally {
//         setLoading(false)
//         initializationPromise.current = null
//       }
//     })()

//     return initializationPromise.current
//   }, [handlePostConnection, setLoading, setStoreError, web3auth?.connected])

//   useEffect(() => {
//     initialize()
//   }, [initialize])

//   const login = useCallback(async () => {
//     if (!web3auth) {
//       console.error('Web3Auth not initialized')
//       return null
//     }

//     try {
//       setLoading(true)

//       if (web3auth.connected) {
//         const userInfo = await web3auth.getUserInfo()
//         await handlePostConnection(web3auth)
//         return userInfo
//       }

//       const web3authProvider = await web3auth.connectTo(WALLET_ADAPTERS.AUTH, {
//         loginProvider: 'google'
//       })

//       setWeb3AuthState({
//         provider: web3authProvider,
//         loggedIn: true
//       })

//       await handlePostConnection(web3auth)
//       return await web3auth.getUserInfo()
//     } catch (error) {
//       console.error('Login error:', error)
//       setStoreError(error as Error)
//       return null
//     } finally {
//       setLoading(false)
//     }
//   }, [web3auth, handlePostConnection, setLoading, setStoreError, setWeb3AuthState])

//   const logout = useCallback(async () => {
//     if (!web3auth) return

//     try {
//       await web3auth.logout()
//       useAuthStore.getState().logout()
//       setBalance({ sol: 0, usdc: 0 })
//     } catch (error) {
//       console.error('Logout error:', error)
//       setStoreError(error as Error)
//     }
//   }, [web3auth, setStoreError, setBalance])

//   const signTransaction = useCallback(async (tx: any) => {
//     if (!rpc) {
//       throw new Error('Web3 provider not initialized')
//     }

//     try {
//       return await rpc.signTransaction({ tx })
//     } catch (error) {
//       console.error('Transaction signing error:', error)
//       throw error
//     }
//   }, [rpc])

//   return {
//     web3auth,
//     provider,
//     loggedIn,
//     loading,
//     error,
//     login,
//     logout,
//     signTransaction,
//     injectedAdapters
//   }
// }

// export const useWeb3 = () => {
//   const { provider, loggedIn } = useAuthStore()
//   const { setBalance } = usePaymentStore()
//   const lastBalanceCheck = useRef<number>(0)
//   const MIN_BALANCE_INTERVAL = 2000 // 2 seconds minimum between balance checks

//   // Debug provider state
//   useEffect(() => {
//     console.log('Provider state:', {
//       providerExists: !!provider,
//       loggedIn,
//       providerType: provider?.constructor?.name,
//     })
//   }, [provider, loggedIn])

//   // Memoize RPC instance
//   const rpc = useMemo(() => {
//     if (!provider) {
//       console.log('No provider available for RPC creation')
//       return null
//     }
//     console.log('Creating new RPC instance')
//     return new RPC(provider)
//   }, [provider])

//   // Rate-limited balance fetching
//   const getBalance = useCallback(async () => {
//     if (!rpc) {
//       console.log('No RPC instance available for getBalance')
//       return null
//     }

//     const now = Date.now()
//     if (now - lastBalanceCheck.current < MIN_BALANCE_INTERVAL) {
//       console.log('Balance check too frequent, skipping')
//       return null
//     }

//     try {
//       console.log('Fetching balance...')
//       const balance = await rpc.getBalance()
//       setBalance(balance)
//       lastBalanceCheck.current = now
//       console.log('Balance fetched:', balance)
//       return balance
//     } catch (error) {
//       console.error('Error fetching balance:', error)
//       return null
//     }
//   }, [rpc, setBalance])

//   // Memoize and debounce getAccounts
//   const getAccounts = useCallback(
//     debounce(async () => {
//       if (!rpc) {
//         console.log('No RPC instance available for getAccounts')
//         return null
//       }
//       try {
//         console.log('Fetching accounts...')
//         const accounts = await rpc.getAccounts()
//         console.log('Accounts fetched:', accounts)
//         return accounts
//       } catch (error) {
//         console.error('Error getting accounts:', error)
//         return null
//       }
//     }, 1000),
//     [rpc]
//   )

//   // Transaction signing doesn't need rate limiting since it's user-initiated
//   const signTransaction = useCallback(
//     async (tx: any) => {
//       if (!rpc) {
//         console.log('No RPC instance available for signTransaction')
//         return null
//       }
//       try {
//         console.log('Signing transaction...')
//         const result = await rpc.signTransaction({ tx })
//         console.log('Transaction signed:', result)
//         return result
//       } catch (error) {
//         console.error('Error signing transaction:', error)
//         throw error // Propagate signing errors
//       }
//     },
//     [rpc]
//   )

//   // Automatic balance updating when provider changes
//   useEffect(() => {
//     if (provider && loggedIn) {
//       console.log('Provider/login state changed, updating balance')
//       getBalance()
//     }
//   }, [provider, loggedIn, getBalance])

//   return {
//     rpc,
//     getBalance,
//     getAccounts,
//     signTransaction,
//   }
// }

// export default useWeb3Auth


import { useState, useEffect, useCallback, useMemo } from 'react';
import { CHAIN_NAMESPACES, IProvider, WALLET_ADAPTERS, WEB3AUTH_NETWORK, UX_MODE, IWeb3AuthCoreOptions, IAdapter } from "@web3auth/base";
import { getInjectedAdapters } from "@web3auth/default-solana-adapter";
import { SolanaPrivateKeyProvider } from "@web3auth/solana-provider";
import { Web3AuthNoModal } from "@web3auth/no-modal";
import { AuthAdapter } from "@web3auth/auth-adapter";
import RPC from "@/components/blockchain/solana-rpc";
import { LOGIN_USER } from '@/graphql/mutations/user';
import { useMutation } from '@apollo/client';
import { useAuthStore } from '@/lib/stores/useAuthStore';

const clientId = "BI8MhAUT4vK4cfQZRQ_NEUYOHE3dhD4ouJif9SUgbgBeeZwP6wBlXast2pZsQJlney3nPBDb-PcMl9oF6lV67P0";
let injectedAdapters: IAdapter<unknown>[] = [];
export const useWeb3Auth = () => {
  const [web3auth, setWeb3auth] = useState<Web3AuthNoModal | null>(null);
  const [provider, setProvider] = useState<IProvider | null>(null);
  // const [loggedIn, setLoggedIn] = useState(false);
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);
  const [userWallet, setUserWallet] = useState<string | null>(null);
  const [loginUserMutation] = useMutation(LOGIN_USER);
  const rpc = useMemo(() => provider ? new RPC(provider) : null, [provider]);
  const {
    loggedIn,
    loading,
    error,
    setWeb3AuthState,
    setLoading,
    setError: setStoreError,
    setAuth,
  } = useAuthStore()

  const initWeb3Auth = useCallback(async () => {
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

      injectedAdapters = getInjectedAdapters({ options: web3authOptions });
      injectedAdapters.forEach((adapter) => {
        web3auth.configureAdapter(adapter);
      });

      const availableAdapters = injectedAdapters.map((adapter) => adapter.name);

      await web3auth.init();
      setProvider(web3auth.provider);
      if (web3auth.connected) {
        console.log('web3auth is connected')

        const rpc = new RPC(web3auth.provider!);
        const accounts = await rpc?.getAccounts();
        const publicKey = accounts![0];
        const{ idToken }= await web3auth.authenticateUser();
        const user = await web3auth.getUserInfo();


        const userObject= {
            email: user.email || '',
            publicKey: publicKey,
            username: user.name || '',
            profilePictureUrl: user.profileImage || '',
        };  

        setUserWallet(userObject.publicKey);

            const result = await loginUserMutation({
              variables: {
                publicKey: userObject.publicKey,
                password: userObject.publicKey,
              },
              onCompleted: (data) => {
                console.log('Mutation completed with data:', data);
                setAuth(data.login);
              },
              onError: (error) => {
                console.error('Mutation error:', {
                  message: error.message,
                  graphQLErrors: error.graphQLErrors?.map(err => ({
                    message: err.message,
                    path: err.path,
                    extensions: err.extensions
                  })),
                  networkError: error.networkError
                });
              }
            }).catch(error => {
              console.error('Caught in mutation catch block:', error);
              throw error;
            });

            // toast({
            //   title: 'Welcome back!',
            //   description: 'You have successfully logged in.',
            // })
            // router.push('/dashboard');
        
        // else {
        //   router.push('/register');
        // }

      }
    } catch (error) {
      console.error(error);
    }  finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initWeb3Auth();
  }, [initWeb3Auth]);

  const login = useCallback(async () => {
    if (!web3auth) {
      console.log('Web3Auth not initialized, initializing...');
      await initWeb3Auth();
    }

    try {
      setLoading(true);
      if(web3auth && web3auth.connected) {

        const user = await web3auth!.getUserInfo();
        
        const accounts = await rpc?.getAccounts();
        
        const publicKey = accounts?.[0];
        
        return {
          email: user.email,
          publicKey,
          profileImage: user.profileImage,
        };
      }
      const web3authProvider = await web3auth!.connectTo(WALLET_ADAPTERS.AUTH, {
        loginProvider: "google",
      });

      setProvider(web3authProvider);

      const user = await web3auth!.getUserInfo();
      
      const accounts = await rpc?.getAccounts();
      
      const publicKey = accounts?.[0];
      
      return {
        email: user.email,
        publicKey,
        profileImage: user.profileImage,
      };
    } catch (err) {
      console.error("Login failed:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [web3auth, rpc, initWeb3Auth]);

  const loginWithAdapter = useCallback(async (adapterName: string) => {
    if (!web3auth) {
      console.error("Web3Auth not initialized");
      return;
    }

    try {
      setLoading(true);
      const web3authProvider = await web3auth.connectTo(adapterName);
      setProvider(web3authProvider);

      const user = await web3auth.getUserInfo();
      
      const accounts = await rpc?.getAccounts();
      
      const publicKey = accounts?.[0];

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
          // const balance = await rpc.getBalance()
          // setBalance(balance)

          // toast({
          //   title: 'Welcome back!',
          //   description: 'You have successfully logged in.',
          // })
        }
      } catch (error) {
        console.error('Login mutation error:', error)
        throw error
      }
      
      return {
        email: user.email || 'adapter',
        publicKey,
        profileImage: user.profileImage || 'adapter',
      };
    } catch (err) {
      console.error("Login failed:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [web3auth, rpc, initWeb3Auth]);

  const logout = useCallback(async () => {
    if (!web3auth) {
      console.error("Web3Auth not initialized");
      return;
    }

    try {
      await web3auth.logout();
      setProvider(null);
      setAuth(null);
      localStorage.removeItem('web3auth_logged_in');
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }, [web3auth]);

  const getUserInfo = useCallback(async () => {
    try {
      const user = await web3auth!.getUserInfo();
      
      const accounts = await rpc?.getAccounts();
      
      return {
        ...user,
        publicKey: accounts?.[0],
      };
    } catch (err) {
      console.error("Failed to get user info:", err);
      return null;
    }
  }, [web3auth, rpc]);

  // Check localStorage on mount
  useEffect(() => {
    if (web3auth && web3auth?.connected) {
      setProvider(web3auth.provider);
    }
  }, [web3auth]);

  return {
    web3auth,
    injectedAdapters,
    provider,
    loggedIn,
    loading,
    error,
    rpc,
    login,
    loginWithAdapter,
    logout,
    getUserInfo,
  };
};