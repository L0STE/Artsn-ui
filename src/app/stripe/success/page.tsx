// "use client"

// import { useEffect, useState, useCallback } from 'react';
// import { useSearchParams } from 'next/navigation';
// import { useRouter } from 'next/navigation';
// import { useToast } from '@/hooks/use-toast';
// import { useAuth } from '@/providers/Web3AuthProvider';
// import { Transaction, VersionedTransaction } from "@solana/web3.js";
// import { useWeb3Auth } from "@/hooks/use-web3-auth";
// import RPC from "@/components/blockchain/solana-rpc";

// interface PaymentParams {
//   sessionId: string;
//   assetId: string;
//   amount: string;
//   ref: string;
//   objectRef: string;
//   uri: string;
// }

// export default function StripeSuccess() {
//   const searchParams = useSearchParams();
//   const router = useRouter();
//   const { toast } = useToast();
//   const { user, checkAuth } = useAuth();
//   const { provider, loading: web3Loading } = useWeb3Auth();

//   // State management
//   const [state, setState] = useState({
//     isVerifying: true,
//     isProcessing: false,
//     hasProcessed: false,
//     verificationAttempted: false,
//     error: null as string | null,
//     paymentParams: null as PaymentParams | null
//   });

//   // Extract and validate URL parameters
//   const extractPaymentParams = useCallback((): PaymentParams | null => {
//     if (!searchParams) return null;

//     const params = {
//       sessionId: searchParams.get('session_id'),
//       assetId: searchParams.get('asset_id'),
//       amount: searchParams.get('amount'),
//       ref: searchParams.get('ref'),
//       objectRef: searchParams.get('object_ref'),
//       uri: searchParams.get('uri')
//     };

//     // Validate all required parameters exist
//     if (!Object.values(params).every(Boolean)) {
//       throw new Error('Missing required payment parameters');
//     }

//     return {
//       ...params,
//       uri: decodeURIComponent(params.uri!)
//     } as PaymentParams;
//   }, [searchParams]);

//   const buyStripeTx = useCallback(async (id: string, reference: string, key: string, amount: number, uri: string) => {
//     const token = localStorage.getItem('authToken');
//     if (!token) throw new Error('Authentication required');

//     const response = await fetch('/api/protocol/buy-stripe', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${token}`
//       },
//       body: JSON.stringify({
//         id,
//         reference,
//         publicKey: key,
//         amount,
//         sessionId: sessionStorage.getItem('sessionId'),
//         uri: encodeURIComponent(uri)
//       })
//     });
//     console.log('response ->', response);
//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.error || 'Failed to create transaction');
//     }

//     const res = await response.json();
//     console.log('txData ->', res);
//     const tx = VersionedTransaction.deserialize(Buffer.from(res.transaction, "base64"));
    
//     if (!tx) throw new Error('Invalid transaction data received');
//     return tx;
//   }, []);

//   const buyStripeListing = useCallback(async (params: PaymentParams) => {
//     if (state.isProcessing || state.hasProcessed) return;
    
//     setState(prev => ({ ...prev, isProcessing: true }));
    
//     try {
//       // Ensure authentication
//       if (!user || !provider) {
//         await checkAuth();
//         if (!user) throw new Error('Authentication required');
//       }

//       // Create and sign transaction
//       const tx = await buyStripeTx(
//         params.assetId,
//         params.objectRef,
//         user.publicKey,
//         +params.amount,
//         params.uri
//       );
//       console.log('returned txn -> ', tx);
//       const rpc = new RPC(provider!);
//       if ( !tx ) {
//         throw new Error('No tx to sign');
//       }
//       const signature = await rpc!.signVersionedTransaction({ tx });
//       // const signature = await rpc.signTransaction(tx);
      
//       if (!signature) {
//         throw new Error('Failed to sign transaction');
//       }

//       toast({
//         title: 'Transaction Complete',
//         description: 'Your purchase has been processed successfully',
//       });
      
//       setState(prev => ({ ...prev, hasProcessed: true }));
//       router.push('/dashboard');
      
//     } catch (error) {
//       console.error('Transaction failed:', error);
//       toast({
//         title: 'Transaction Failed',
//         description: error instanceof Error ? error.message : 'Failed to process transaction',
//         variant: 'destructive'
//       });
//       setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Transaction failed' }));
//     } finally {
//       sessionStorage.removeItem('sessionId');
//       setState(prev => ({ ...prev, isProcessing: false }));
//     }
//   }, [user, provider, checkAuth, buyStripeTx, toast, router]);

//   const verifyPayment = useCallback(async (params: PaymentParams) => {
//     if (state.hasProcessed || state.isProcessing || state.verificationAttempted) return;

//     setState(prev => ({ ...prev, verificationAttempted: true }));
    
//     try {
//       const token = localStorage.getItem('authToken');
//       if (!token) throw new Error('Authentication required');

//       const response = await fetch('/api/stripe/verify', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         },
//         body: JSON.stringify({
//           sessionId: params.sessionId,
//           assetId: params.assetId,
//           amount: params.amount,
//           ref: params.ref
//         })
//       });

//       const data = await response.json();
      
//       if (!response.ok) {
//         throw new Error(data.error || 'Payment verification failed');
//       }

//       if (data.verified) {
//         toast({
//           title: 'Payment Verified',
//           description: 'Processing your purchase...',
//         });
//         await buyStripeListing(params);
//       }

//     } catch (error) {
//       console.error('Verification failed:', error);
//       toast({
//         title: 'Verification Failed',
//         description: error instanceof Error ? error.message : 'Please contact support',
//         variant: 'destructive'
//       });
//       setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Verification failed' }));
//     } finally {
//       setState(prev => ({ ...prev, isVerifying: false }));
//     }
//   }, [state.hasProcessed, state.isProcessing, state.verificationAttempted, buyStripeListing, toast]);

//   // Initialize payment parameters and start verification process
//   useEffect(() => {
//     const initializePayment = async () => {
//       try {
//         const params = extractPaymentParams();
//         if (!params) {
//           throw new Error('Invalid payment parameters');
//         }
//         setState(prev => ({ ...prev, paymentParams: params }));
//       } catch (error) {
//         console.error('Failed to initialize payment:', error);
//         setState(prev => ({
//           ...prev,
//           error: error instanceof Error ? error.message : 'Invalid payment parameters',
//           isVerifying: false
//         }));
//       }
//     };

//     initializePayment();
//   }, [extractPaymentParams]);

//   // Handle payment verification once user and parameters are available
//   useEffect(() => {
//     const processPayment = async () => {
//       if (
//         user && 
//         state.paymentParams && 
//         !state.verificationAttempted && 
//         !web3Loading && 
//         provider
//       ) {
//         await verifyPayment(state.paymentParams);
//       }
//     };

//     processPayment();
//   }, [user, state.paymentParams, state.verificationAttempted, web3Loading, provider, verifyPayment]);

//   // Loading state
//   if (state.isVerifying || state.isProcessing) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-center space-y-4">
//           <h2 className="text-xl font-semibold">
//             {state.isProcessing ? 'Processing your purchase...' : 'Verifying payment...'}
//           </h2>
//           <p className="text-gray-500">{`Please don't close this window`}</p>
//         </div>
//       </div>
//     );
//   }

//   // Error state
//   if (state.error) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-center space-y-4">
//           <h2 className="text-xl font-semibold text-red-600">Transaction Failed</h2>
//           <p className="text-gray-600">{state.error}</p>
//           <button
//             onClick={() => router.push('/dashboard')}
//             className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//           >
//             Return to Dashboard
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // Success state (will redirect to dashboard)
//   return null;
// }

import StripeSuccess from "@/components/stripe/StripeSuccess";

export default function StripeSuccessPage() {
  return <StripeSuccess />;
}