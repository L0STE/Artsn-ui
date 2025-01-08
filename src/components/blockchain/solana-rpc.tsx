// import {
//   Connection,
//   GetProgramAccountsFilter,
//   LAMPORTS_PER_SOL,
//   PublicKey,
//   SystemProgram,
//   Transaction,
//   TransactionMessage,
//   VersionedTransaction,
// } from '@solana/web3.js'
// import { USDC_MINT } from './artisan-exports'
// import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
// import {
//   createGenericFile,
//   createSignerFromKeypair,
//   publicKey,
//   signerIdentity,
//   usd,
// } from '@metaplex-foundation/umi'
// import { CustomChainConfig, IProvider } from '@web3auth/base'
// import { SolanaWallet } from '@web3auth/solana-provider'
// import * as b58 from 'bs58'
// import { get } from 'http'
// import {
//   getAccount,
//   getAssociatedTokenAddress,
//   getAssociatedTokenAddressSync,
//   TOKEN_PROGRAM_ID,
// } from '@solana/spl-token'
// import { rpcManager } from '@/lib/rpc/rpc-manager'
// const RPC = rpcManager.getConnection()

// export default class SolanaRpc {
//   private provider: IProvider
//   private solanaWallet: SolanaWallet

//   constructor(provider: IProvider) {
//     this.provider = provider
//     this.solanaWallet = new SolanaWallet(this.provider)
//   }

//   private async getConnection(): Promise<Connection> {
//     // const connectionConfig = await this.solanaWallet.request<string[], CustomChainConfig>({
//     //   method: "solana_provider_config",
//     //   params: [],
//     // });
//     // return new Connection(connectionConfig.rpcTarget);
//     return RPC
//   }

//   async getAccounts(): Promise<string[]> {
//     try {
//       return await this.solanaWallet.requestAccounts()
//     } catch (error) {
//       console.error('Error getting accounts:', error)
//       return []
//     }
//   }

//   async getTokenAccountBalance(wallet: string, solanaConnection: Connection) {
//     const filters: GetProgramAccountsFilter[] = [
//       {
//         dataSize: 165, //size of account (bytes)
//       },
//       {
//         memcmp: {
//           offset: 32, //location of our query in the account (bytes)
//           bytes: wallet, //our search criteria, a base58 encoded string
//         },
//       },
//       //Add this search parameter
//       {
//         memcmp: {
//           offset: 0, //number of bytes
//           bytes: USDC_MINT.toBase58(), //base58 encoded string
//         },
//       },
//     ]
//     const accounts = await solanaConnection.getParsedProgramAccounts(
//       TOKEN_PROGRAM_ID, //new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
//       { filters: filters }
//     )
//     accounts.forEach((account, i) => {
//       //Parse the account data
//       const parsedAccountInfo: any = account.account.data
//       const mintAddress: string = parsedAccountInfo['parsed']['info']['mint']
//       const tokenBalance: number =
//         parsedAccountInfo['parsed']['info']['tokenAmount']['uiAmount']
//     })
//     // @ts-ignore - return the first account's balance
//     return accounts[0].account.data.parsed.info.tokenAmount.uiAmount
//   }

//   // async getBalance(): Promise<{ sol: any; usdc: any }> {
//   //   try {
//   //     const conn = await this.getConnection()
//   //     const accounts = await this.getAccounts()
//   //     const balance = await conn.getBalance(new PublicKey(accounts[0]))
//   //     const usdcAta = await getAssociatedTokenAddress(
//   //       new PublicKey(accounts[0]),
//   //       new PublicKey(USDC_MINT)
//   //     )
//   //     const usdcBalance = await this.getTokenAccountBalance(accounts[0], conn)
//   //     const obj = {
//   //       sol: balance / LAMPORTS_PER_SOL,
//   //       usdc: usdcBalance,
//   //     }
//   //     return obj
//   //   } catch (error) {
//   //     console.error('Error getting balance:', error)
//   //     return { sol: 0, usdc: 0 }
//   //   }
//   // }

//   // async signMessage(message: string = "Test Signing Message"): Promise<string> {
//   //   try {
//   //     const msg = Buffer.from(message, "utf8");
//   //     const res = await this.solanaWallet.signMessage(msg);
//   //     return res.toString();
//   //   } catch (error) {
//   //     console.error("Error signing message:", error);
//   //     return "";
//   //   }
//   // }

//   async sendTransaction(amount: number = 0.01): Promise<string> {
//     try {
//       const accounts = await this.getAccounts()
//       const connection = await this.getConnection()
//       const { blockhash, lastValidBlockHeight } =
//         await connection.getLatestBlockhash('finalized')

//       const transaction = new Transaction({
//         feePayer: new PublicKey(accounts[0]),
//         blockhash,
//         lastValidBlockHeight,
//       }).add(
//         SystemProgram.transfer({
//           fromPubkey: new PublicKey(accounts[0]),
//           toPubkey: new PublicKey(accounts[0]),
//           lamports: amount * LAMPORTS_PER_SOL,
//         })
//       )

//       const { signature } =
//         await this.solanaWallet.signAndSendTransaction(transaction)
//       return signature
//     } catch (error) {
//       console.error('Error sending transaction:', error)
//       return ''
//     }
//   }

//   // async signTransaction(tx: any): Promise<string> {
//   //   try {
//   //     const accounts = await this.getAccounts();
//   //     // const connection = await this.getConnection();
//   //     const connection = new Connection("https://soft-cold-energy.solana-devnet.quiknode.pro/ad0dda04b536ff45a76465f9ceee5eea6a048a8f");
//   //     const { blockhash } = await connection.getLatestBlockhash("finalized");

//   //     const umi = createUmi('https://soft-cold-energy.solana-devnet.quiknode.pro/ad0dda04b536ff45a76465f9ceee5eea6a048a8f');
//   //     const UMI_KEY: string = process.env.NEXT_PUBLIC_UMI_KEY!;
//   //     const UMI_KEY_JSON = JSON.parse(UMI_KEY);
//   //     const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(UMI_KEY_JSON));
//   //     const _signer = createSignerFromKeypair(umi, keypair);
//   //     umi.use(signerIdentity(_signer));

//   //     const signedTx = await this.solanaWallet.signAndSendTransaction(tx);
//   //     // Convert the signed transaction to a format compatible with Umi
//   //     const umiTx = umi.transactions.deserialize(tx.serialize());
//   //     console.log('umiTx:', umiTx);
//   //     const signature = await umi.rpc.sendTransaction(umiTx, {
//   //       skipPreflight: true,
//   //     });
//   //     // const signature = signedTx.signature;
//   //     const confirmResult = await umi.rpc.confirmTransaction(signature, {
//   //     strategy: { type: 'blockhash', ...(await umi.rpc.getLatestBlockhash()) },
//   //     })

//   //     console.log('Transaction confirmed:', confirmResult);

//   //     return signature.toString() || "";
//   //   } catch (error) {
//   //     console.error("Error signing transaction:", error);
//   //     return "";
//   //   }
//   // }

//   // async sendVersionedTransaction(): Promise<string> {
//   //   try {
//   //     const accounts = await this.getAccounts();
//   //     const connection = await this.getConnection();
//   //     const { blockhash } = await connection.getLatestBlockhash("finalized");

//   //     const instruction = SystemProgram.transfer({
//   //       fromPubkey: new PublicKey(accounts[0]),
//   //       toPubkey: new PublicKey(accounts[0]),
//   //       lamports: 0.01 * LAMPORTS_PER_SOL,
//   //     });

//   //     const messageV0 = new TransactionMessage({
//   //       payerKey: new PublicKey(accounts[0]),
//   //       recentBlockhash: blockhash,
//   //       instructions: [instruction],
//   //     }).compileToV0Message();

//   //     const transaction = new VersionedTransaction(messageV0);
//   //     const { signature } = await this.solanaWallet.signAndSendTransaction(transaction);

//   //     return signature;
//   //   } catch (error) {
//   //     console.error("Error sending versioned transaction:", error);
//   //     return "";
//   //   }
//   // }
//   async signTransaction(tx: any): Promise<string> {
//     const steps: {
//       step: string
//       status: 'started' | 'completed' | 'failed'
//       error?: any
//     }[] = []

//     try {
//       // Step 1: Get accounts
//       steps.push({ step: 'getAccounts', status: 'started' })
//       const accounts = await this.getAccounts()
//       if (!accounts || accounts.length === 0) {
//         throw new Error('No accounts found')
//       }
//       steps.push({ step: 'getAccounts', status: 'completed' })
//       console.log('Accounts retrieved:', accounts[0])

//       // Step 2: Get connection
//       steps.push({ step: 'getConnection', status: 'started' })
//       const connection = new Connection(
//         'https://soft-cold-energy.solana-devnet.quiknode.pro/ad0dda04b536ff45a76465f9ceee5eea6a048a8f'
//       )
//       const { blockhash } = await connection.getLatestBlockhash('finalized')
//       if (!blockhash) {
//         throw new Error('Failed to get blockhash')
//       }
//       steps.push({ step: 'getConnection', status: 'completed' })
//       console.log('Blockhash retrieved:', blockhash)

//       // Step 3: Initialize UMI
//       steps.push({ step: 'initializeUmi', status: 'started' })
//       const umi = createUmi(
//         'https://soft-cold-energy.solana-devnet.quiknode.pro/ad0dda04b536ff45a76465f9ceee5eea6a048a8f'
//       )
//       const UMI_KEY: string = process.env.NEXT_PUBLIC_UMI_KEY!
//       if (!UMI_KEY) {
//         throw new Error('UMI_KEY not found in environment variables')
//       }
//       const UMI_KEY_JSON = JSON.parse(UMI_KEY)
//       const keypair = umi.eddsa.createKeypairFromSecretKey(
//         new Uint8Array(UMI_KEY_JSON)
//       )
//       const _signer = createSignerFromKeypair(umi, keypair)
//       umi.use(signerIdentity(_signer))
//       steps.push({ step: 'initializeUmi', status: 'completed' })
//       console.log('UMI initialized with keypair:', keypair.publicKey.toString())

//       // Step 4: Sign and send transaction
//       steps.push({ step: 'signAndSendTransaction', status: 'started' })
//       if (!tx) {
//         throw new Error('Transaction object is null or undefined')
//       }
//       console.log('signing tx with wallet:', this.solanaWallet)
//       const signedTx = await this.solanaWallet.signAndSendTransaction(tx)
//       if (!signedTx) {
//         throw new Error('Failed to sign transaction')
//       }
//       steps.push({ step: 'signAndSendTransaction', status: 'completed' })
//       console.log('Transaction signed:', signedTx)

//       // Step 5: Convert and send via UMI
//       steps.push({ step: 'umiConversion', status: 'started' })
//       const umiTx = umi.transactions.deserialize(tx.serialize())
//       console.log('Transaction converted to UMI format')

//       const signature = await umi.rpc.sendTransaction(umiTx, {
//         skipPreflight: true,
//       })
//       if (!signature) {
//         throw new Error('No signature received from transaction')
//       }
//       steps.push({ step: 'umiConversion', status: 'completed' })
//       // console.log('UMI signature received:', signature.toString());

//       // // Step 6: Confirm transaction
//       // steps.push({ step: 'confirmTransaction', status: 'started' });
//       // const confirmResult = await umi.rpc.confirmTransaction(signature, {
//       //   strategy: { type: 'blockhash', ...(await umi.rpc.getLatestBlockhash()) },
//       // });
//       // steps.push({ step: 'confirmTransaction', status: 'completed' });
//       // console.log('Transaction confirmed:', confirmResult);

//       // // Return the signature
//       // if (typeof signature.toString() !== 'string' || signature.toString().length === 0) {
//       //   throw new Error('Invalid signature format received');
//       // }

//       return signature.toString()
//     } catch (error: any) {
//       // Mark the current step as failed
//       if (steps.length > 0) {
//         const lastStep = steps[steps.length - 1]
//         lastStep.status = 'failed'
//         lastStep.error = error
//       }

//       // Log detailed error information
//       console.error('Transaction signing failed:', {
//         error: error.message,
//         stack: error.stack,
//         steps: steps,
//       })

//       // Log complete transaction state
//       console.error('Complete transaction state:', {
//         steps,
//         errorDetails: {
//           message: error.message,
//           name: error.name,
//           stack: error.stack,
//         },
//       })

//       // Rethrow with more context
//       throw new Error(
//         `Transaction signing failed at step ${steps[steps.length - 1]?.step}: ${error.message}`
//       )
//     }
//   }

//   async signVersionedTransaction({
//     tx,
//   }: {
//     tx: VersionedTransaction
//   }): Promise<string> {
//     try {
//       const accounts = await this.getAccounts()
//       // const connection = await this.getConnection();
//       const connection = rpcManager.getConnection()
//       const umi = rpcManager.getUmi()
//       const UMI_KEY: string = process.env.NEXT_PUBLIC_UMI_KEY!
//       const UMI_KEY_JSON = JSON.parse(UMI_KEY)
//       const keypair = umi.eddsa.createKeypairFromSecretKey(
//         new Uint8Array(UMI_KEY_JSON)
//       )
//       const _signer = createSignerFromKeypair(umi, keypair)
//       umi.use(signerIdentity(_signer))

//       const signedTx = await this.solanaWallet.signTransaction(tx)
//       // Convert the signed transaction to a format compatible with Umi
//       const umiTx = umi.transactions.deserialize(signedTx.serialize())

//       const signature = await umi.rpc.sendTransaction(umiTx, {
//         skipPreflight: true,
//       })
//       const confirmResult = await umi.rpc.confirmTransaction(signature, {
//         strategy: {
//           type: 'blockhash',
//           ...(await umi.rpc.getLatestBlockhash()),
//         },
//       })

//       const string = b58.encode(Buffer.from(signature))
//       return string
//     } catch (error) {
//       console.error('Error signing versioned transaction:', error)
//       throw error
//     }
//   }

//   async signAllTransactions(count: number = 3): Promise<Transaction[]> {
//     try {
//       const accounts = await this.getAccounts()
//       const connection = await this.getConnection()
//       const { blockhash } = await connection.getLatestBlockhash('finalized')

//       const transactions = Array(count)
//         .fill(null)
//         .map((_, i) =>
//           new Transaction({
//             feePayer: new PublicKey(accounts[0]),
//             recentBlockhash: blockhash,
//           }).add(
//             SystemProgram.transfer({
//               fromPubkey: new PublicKey(accounts[0]),
//               toPubkey: new PublicKey(accounts[0]),
//               lamports: 0.01 * (i + 1) * LAMPORTS_PER_SOL,
//             })
//           )
//         )

//       return await this.solanaWallet.signAllTransactions(transactions)
//     } catch (error) {
//       console.error('Error signing all transactions:', error)
//       throw error
//     }
//   }

//   async signAllVersionedTransactions(
//     count: number = 3
//   ): Promise<VersionedTransaction[]> {
//     try {
//       const accounts = await this.getAccounts()
//       const connection = await this.getConnection()
//       const { blockhash } = await connection.getLatestBlockhash('finalized')

//       const transactions = Array(count)
//         .fill(null)
//         .map((_, i) => {
//           const instruction = SystemProgram.transfer({
//             fromPubkey: new PublicKey(accounts[0]),
//             toPubkey: new PublicKey(accounts[0]),
//             lamports: 0.01 * (i + 1) * LAMPORTS_PER_SOL,
//           })

//           const messageV0 = new TransactionMessage({
//             payerKey: new PublicKey(accounts[0]),
//             recentBlockhash: blockhash,
//             instructions: [instruction],
//           }).compileToV0Message()

//           return new VersionedTransaction(messageV0)
//         })

//       return await this.solanaWallet.signAllTransactions(transactions)
//     } catch (error) {
//       console.error('Error signing all versioned transactions:', error)
//       throw error
//     }
//   }

//   async getPrivateKey(): Promise<string> {
//     try {
//       return (await this.provider.request({
//         method: 'solanaPrivateKey',
//       })) as string
//     } catch (error) {
//       console.error('Error getting private key:', error)
//       return ''
//     }
//   }
// }

import {
  Connection,
  GetProgramAccountsFilter,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js'
import { USDC_MINT } from './artisan-exports'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import {
  createSignerFromKeypair,
  signerIdentity,
} from '@metaplex-foundation/umi'
import { CustomChainConfig, IProvider } from '@web3auth/base'
import { SolanaWallet } from '@web3auth/solana-provider'
import * as b58 from 'bs58'
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token'
import { rpcManager } from '@/lib/rpc/rpc-manager'

interface RequestCache {
  timestamp: number
  data: any
  expiresIn: number
}

interface RequestTracker {
  timestamp: number
  count: number
}

export default class SolanaRpc {
  private provider: IProvider
  private solanaWallet: SolanaWallet
  private static connection = rpcManager.getConnection()
  private static umi = rpcManager.getUmi()

  // Rate limiting
  private static requestsPerWindow = 10
  private static windowMs = 1000
  private static requests: RequestTracker[] = []

  // Caching
  private static cache = new Map<string, RequestCache>()
  private static defaultCacheTime = 5000 // 5 seconds

  constructor(provider: IProvider) {
    this.provider = provider
    this.solanaWallet = new SolanaWallet(this.provider)
  }

  private static async rateLimitedRequest<T>(
    key: string,
    request: () => Promise<T>,
    cacheTime: number = SolanaRpc.defaultCacheTime
  ): Promise<T> {
    // Check cache first
    const cached = SolanaRpc.cache.get(key)
    if (cached && Date.now() - cached.timestamp < cached.expiresIn) {
      return cached.data
    }

    // Clean old requests
    const now = Date.now()
    SolanaRpc.requests = SolanaRpc.requests.filter(
      (req) => now - req.timestamp < SolanaRpc.windowMs
    )

    // Check rate limit
    if (SolanaRpc.requests.length >= SolanaRpc.requestsPerWindow) {
      const oldestRequest = SolanaRpc.requests[0]
      const waitTime = SolanaRpc.windowMs - (now - oldestRequest.timestamp)
      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime))
      }
      return SolanaRpc.rateLimitedRequest(key, request, cacheTime)
    }

    // Make request
    try {
      SolanaRpc.requests.push({ timestamp: now, count: 1 })
      const result = await request()

      // Cache result
      SolanaRpc.cache.set(key, {
        timestamp: now,
        data: result,
        expiresIn: cacheTime,
      })

      return result
    } catch (error: any) {
      if (error.message?.includes('429')) {
        // Rate limit hit - wait and retry
        await new Promise((resolve) => setTimeout(resolve, SolanaRpc.windowMs))
        return SolanaRpc.rateLimitedRequest(key, request, cacheTime)
      }
      throw error
    }
  }

  async getAccounts(): Promise<string[]> {
    return SolanaRpc.rateLimitedRequest('getAccounts', async () => {
      try {
        return await this.solanaWallet.requestAccounts()
      } catch (error) {
        console.error('Error getting accounts:', error)
        return []
      }
    })
  }

  async getBalance(): Promise<{ sol: number; usdc: number }> {
    return SolanaRpc.rateLimitedRequest(
      'getBalance',
      async () => {
        try {
          const accounts = await this.getAccounts()
          if (!accounts || accounts.length === 0) {
            return { sol: 0, usdc: 0 }
          }

          const [solBalance, usdcBalance] = await Promise.all([
            SolanaRpc.connection.getBalance(new PublicKey(accounts[0])),
            this.getTokenAccountBalance(accounts[0], SolanaRpc.connection),
          ])

          return {
            sol: solBalance / LAMPORTS_PER_SOL,
            usdc: usdcBalance,
          }
        } catch (error) {
          console.error('Error getting balance:', error)
          return { sol: 0, usdc: 0 }
        }
      },
      10000 // Cache balance for 10 seconds
    )
  }

  async getTokenAccountBalance(
    wallet: string,
    connection: Connection = SolanaRpc.connection
  ): Promise<number> {
    const cacheKey = `tokenBalance-${wallet}`

    return SolanaRpc.rateLimitedRequest(cacheKey, async () => {
      const filters: GetProgramAccountsFilter[] = [
        { dataSize: 165 },
        {
          memcmp: {
            offset: 32,
            bytes: wallet,
          },
        },
        {
          memcmp: {
            offset: 0,
            bytes: USDC_MINT.toBase58(),
          },
        },
      ]

      try {
        const accounts = await connection.getParsedProgramAccounts(
          TOKEN_PROGRAM_ID,
          { filters }
        )

        if (!accounts || accounts.length === 0) return 0

        const parsedAccountInfo: any = accounts[0].account.data
        return (
          parsedAccountInfo['parsed']['info']['tokenAmount']['uiAmount'] || 0
        )
      } catch (error) {
        console.error('Error fetching token balance:', error)
        return 0
      }
    })
  }

  async signTransaction(tx: any): Promise<string> {
    const steps: Array<{
      step: string
      status: 'started' | 'completed' | 'failed'
      error?: any
    }> = []

    try {
      // Step 1: Get accounts
      steps.push({ step: 'getAccounts', status: 'started' })
      const accounts = await this.getAccounts()
      if (!accounts?.length) throw new Error('No accounts found')
      steps.push({ step: 'getAccounts', status: 'completed' })

      // Step 2: Sign transaction
      steps.push({ step: 'signAndSendTransaction', status: 'started' })
      if (!tx) throw new Error('Transaction object is null or undefined')

      const signedTx = await this.solanaWallet.signAndSendTransaction(tx)
      if (!signedTx) throw new Error('Failed to sign transaction')
      steps.push({ step: 'signAndSendTransaction', status: 'completed' })

      // Step 3: Process with UMI
      steps.push({ step: 'umiProcessing', status: 'started' })
      const umiTx = SolanaRpc.umi.transactions.deserialize(tx.serialize())

      const signature = await SolanaRpc.umi.rpc.sendTransaction(umiTx, {
        skipPreflight: true,
      })

      if (!signature) throw new Error('No signature received from transaction')
      steps.push({ step: 'umiProcessing', status: 'completed' })

      return signature.toString()
    } catch (error: any) {
      // Mark current step as failed
      const currentStep = steps[steps.length - 1]
      if (currentStep) {
        currentStep.status = 'failed'
        currentStep.error = error
      }

      console.error('Transaction signing failed:', {
        error: error.message,
        stack: error.stack,
        steps,
      })

      throw new Error(
        `Transaction signing failed at step ${currentStep?.step}: ${error.message}`
      )
    }
  }

  async signVersionedTransaction({
    tx,
  }: {
    tx: VersionedTransaction
  }): Promise<string> {
    try {
      const signedTx = await this.solanaWallet.signTransaction(tx)
      const umiTx = SolanaRpc.umi.transactions.deserialize(signedTx.serialize())

      const signature = await SolanaRpc.umi.rpc.sendTransaction(umiTx, {
        skipPreflight: true,
      })

      const confirmResult = await SolanaRpc.umi.rpc.confirmTransaction(
        signature,
        {
          strategy: {
            type: 'blockhash',
            ...(await SolanaRpc.umi.rpc.getLatestBlockhash()),
          },
        }
      )

      return b58.encode(Buffer.from(signature))
    } catch (error) {
      console.error('Error signing versioned transaction:', error)
      throw error
    }
  }

  async signAllTransactions(txs: Transaction[]): Promise<Transaction[]> {
    try {
      return await this.solanaWallet.signAllTransactions(txs)
    } catch (error) {
      console.error('Error signing all transactions:', error)
      throw error
    }
  }

  async signAllVersionedTransactions(
    txs: VersionedTransaction[]
  ): Promise<VersionedTransaction[]> {
    try {
      return await this.solanaWallet.signAllTransactions(txs)
    } catch (error) {
      console.error('Error signing all versioned transactions:', error)
      throw error
    }
  }

  async getPrivateKey(): Promise<string> {
    try {
      return (await this.provider.request({
        method: 'solanaPrivateKey',
      })) as string
    } catch (error) {
      console.error('Error getting private key:', error)
      return ''
    }
  }
}
