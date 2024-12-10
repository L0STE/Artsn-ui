"use client"

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/providers/Web3AuthProvider';
import { VersionedTransaction } from "@solana/web3.js";
import { useWeb3Auth } from "@/hooks/use-web3-auth";
import RPC from "@/components/blockchain/solana-rpc";
import { Button } from '../ui/button';

interface PaymentParams {
  sessionId: string;
  assetId: string;
  amount: string;
  ref: string;
  objectRef: string;
  uri: string;
}

interface ProcessingState {
  stage: 'initializing' | 'verifying' | 'processing' | 'complete' | 'error';
  message: string;
  error?: string;
}

export default function StripeSuccess() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, checkAuth } = useAuth();
  const { provider, loading: web3Loading } = useWeb3Auth();
  const [processingState, setProcessingState] = useState<ProcessingState>({
    stage: 'initializing',
    message: 'Initializing your purchase...'
  });
  const [state, setState] = useState({
    isVerifying: true,
    isProcessing: false,
    hasProcessed: false,
    verificationAttempted: false,
    authInitialized: false,
    error: null as string | null,
    paymentParams: null as PaymentParams | null
  });

  // Store payment params in sessionStorage immediately upon page load
  useEffect(() => {
    try {
      const params = extractPaymentParams();
      if (params) {
        sessionStorage.setItem('pendingPaymentParams', JSON.stringify(params));
        setState(prev => ({ ...prev, paymentParams: params }));
      }
    } catch (error) {
      console.error('Failed to store payment params:', error);
    }
  }, [searchParams]);

  // Handle authentication initialization
  useEffect(() => {
    const initAuth = async () => {
      try {
        await checkAuth();
        setState(prev => ({ ...prev, authInitialized: true }));
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setState(prev => ({ 
          ...prev, 
          error: 'Authentication failed. Please try again.',
          isVerifying: false 
        }));
      }
    };

    if (!state.authInitialized) {
      initAuth();
    }
  }, [checkAuth, state.authInitialized]);

  // Extract payment params with retry mechanism
  const extractPaymentParams = useCallback((): PaymentParams | null => {
    // First try from URL params
    if (searchParams) {
      const params = {
        sessionId: searchParams.get('session_id'),
        assetId: searchParams.get('asset_id'),
        amount: searchParams.get('amount'),
        ref: searchParams.get('ref'),
        objectRef: searchParams.get('object_ref'),
        uri: searchParams.get('uri')
      };

      if (Object.values(params).every(Boolean)) {
        return {
          ...params,
          uri: decodeURIComponent(params.uri!)
        } as PaymentParams;
      }
    }

    // If URL params fail, try from sessionStorage
    const storedParams = sessionStorage.getItem('pendingPaymentParams');
    if (storedParams) {
      return JSON.parse(storedParams);
    }

    return null;
  }, [searchParams]);

  const buyStripeTx = useCallback(async (params: PaymentParams) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Authentication required');

    const response = await fetch('/api/protocol/buy-stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        id: params.assetId,
        reference: params.objectRef,
        publicKey: user?.publicKey,
        amount: +params.amount,
        sessionId: params.sessionId,
        uri: encodeURIComponent(params.uri)
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create transaction');
    }

    const { transaction } = await response.json();
    return VersionedTransaction.deserialize(Buffer.from(transaction, "base64"));
  }, [user]);

  const processTransaction = useCallback(async (params: PaymentParams) => {
    if (!provider || !user) {
      throw new Error('Web3 provider not initialized');
    }

    const tx = await buyStripeTx(params);
    if (!tx) throw new Error('No transaction to sign');

    const rpc = new RPC(provider);
    const signature = await rpc.signVersionedTransaction({ tx });
    
    if (!signature) {
      throw new Error('Failed to sign transaction');
    }

    return signature;
  }, [provider, user, buyStripeTx]);

  // Main payment verification and processing logic
  useEffect(() => {
    const processPayment = async () => {
      if (!state.authInitialized || !user || !provider || web3Loading || 
          !state.paymentParams || state.verificationAttempted) {
        return;
      }

      setState(prev => ({ ...prev, verificationAttempted: true }));

      try {
        // Verify payment first
        const verificationResponse = await fetch('/api/stripe/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({
            sessionId: state.paymentParams.sessionId,
            assetId: state.paymentParams.assetId,
            amount: state.paymentParams.amount,
            ref: state.paymentParams.ref
          })
        });

        const verificationData = await verificationResponse.json();
        
        if (!verificationResponse.ok || !verificationData.verified) {
          throw new Error(verificationData.error || 'Payment verification failed');
        }

        setState(prev => ({ ...prev, isProcessing: true }));
        
        // Process blockchain transaction
        await processTransaction(state.paymentParams);

        toast({
          title: 'Transaction Complete',
          description: 'Your purchase has been processed successfully',
        });

        setState(prev => ({ 
          ...prev, 
          hasProcessed: true,
          isProcessing: false,
          isVerifying: false 
        }));

        // Clean up
        sessionStorage.removeItem('pendingPaymentParams');
        sessionStorage.removeItem('sessionId');
        
        // Redirect
        router.push('/dashboard');

      } catch (error) {
        console.error('Payment processing failed:', error);
        toast({
          title: 'Transaction Failed',
          description: error instanceof Error ? error.message : 'Failed to process transaction',
          variant: 'destructive'
        });
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Transaction failed',
          isProcessing: false,
          isVerifying: false
        }));
      }
    };

    processPayment();
  }, [
    state.authInitialized,
    state.paymentParams,
    state.verificationAttempted,
    user,
    provider,
    web3Loading,
    processTransaction,
    toast,
    router
  ]);

  // Update the UI state based on processing stage
  useEffect(() => {
    if (state.error) {
      setProcessingState({
        stage: 'error',
        message: 'Transaction failed',
        error: state.error
      });
      return;
    }

    if (state.hasProcessed) {
      setProcessingState({
        stage: 'complete',
        message: 'Purchase complete!'
      });
      return;
    }

    if (state.isProcessing) {
      setProcessingState({
        stage: 'processing',
        message: 'Processing your purchase...'
      });
      return;
    }

    if (state.isVerifying) {
      setProcessingState({
        stage: 'verifying',
        message: 'Verifying payment...'
      });
      return;
    }
  }, [state.error, state.hasProcessed, state.isProcessing, state.isVerifying]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="w-full max-w-md mx-auto p-6">
        <div className="bg-card rounded-lg shadow-lg p-6 space-y-2">
          {/* Status Icon */}
          <div className="flex justify-center">
            {processingState.stage === 'error' ? (
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            ) : processingState.stage === 'complete' ? (
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            )}
          </div>

          {/* Status Message */}
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold">
              {processingState.message}
            </h2>
            {processingState.stage !== 'complete' && processingState.stage !== 'error' && (
              <p className="text-muted-foreground">
                Please don't close this window
              </p>
            )}
            {processingState.error && (
              <p className="text-red-600">{processingState.error}</p>
            )}
          </div>

          {/* Action Button */}
          {(processingState.stage === 'complete' || processingState.stage === 'error') && (
            <div className="flex justify-center">
              <Button
                variant={'destructive'}
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 rounded-md hover:bg-black/90 transition-colors"
              >
                Return to Dashboard
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}