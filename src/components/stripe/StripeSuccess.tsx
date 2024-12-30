"use client"

import { useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { VersionedTransaction } from "@solana/web3.js"
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { useWeb3Auth } from '@/hooks/use-web3-auth'
import { LoadingSpinner } from '@/components/loading/LoadingSpinner'
import { Button } from '@/components/ui/button'

interface PaymentParams {
  sessionId: string | null
  assetId: string | null
  amount: string | null
  ref: string | null
  objectRef: string | null
  uri: string | null
}

export default function StripeSuccess() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  
  // Auth store state
  const { 
    currentUser, 
    authToken,
    loading: authLoading,
    setAuth,
  } = useAuthStore()

  // Web3Auth hook
  const { 
    web3auth, 
    provider,
    signTransaction,
    loading: web3Loading 
  } = useWeb3Auth()

  // Add this to your StripeSuccess component

  const verifyPayment = useCallback(async (params: PaymentParams) => {
    // Get fresh token
    const token = localStorage.getItem('authToken');
    console.log('Verifying payment with token:', token ? 'exists' : 'missing');

    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      // Log the request details
      console.log('Sending verification request:', {
        sessionId: params.sessionId,
        assetId: params.assetId,
        amount: params.amount,
        ref: params.ref
      });

      const response = await fetch('/api/stripe/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: params.sessionId,
          assetId: params.assetId,
          amount: params.amount,
          ref: params.ref
        })
      });

      // Log the response status
      console.log('Response status:', response.status);

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        if (response.status === 401) {
          console.log('Auth failed, clearing token');
          localStorage.removeItem('authToken');
          router.push('/login');
          throw new Error('Authentication expired. Please login again.');
        }
        throw new Error(data.error || `Verification failed: ${response.status}`);
      }

      return data.verified;
    } catch (error) {
      console.error('Verification error:', error);
      throw error;
    }
  }, [router]);

// Update auth check effect
useEffect(() => {
  const checkAuthStatus = async () => {
    const token = localStorage.getItem('authToken');
    
    // If no token, redirect to login
    if (!token) {
      router.push('/login');
      return;
    }

    // Only try to rehydrate if we have a token but no user
    if (!currentUser) {
      try {
        const response = await fetch('/api/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to verify auth');
        }

        const data = await response.json();
        
        if (data.user) {
          setAuth({
            token,
            user: data.user
          });
        } else {
          throw new Error('No user data returned');
        }
      } catch (error) {
        console.error('Auth rehydration failed:', error);
        localStorage.removeItem('authToken');
        router.push('/login');
      }
    }
  };

  checkAuthStatus();
}, [currentUser, router, setAuth]);

  // Function to create and sign transaction
  const processTransaction = useCallback(async (params: PaymentParams) => {
    if (!authToken || !currentUser?.publicKey) {
      throw new Error('Missing auth token or public key')
    }

    console.log('Processing transaction:', params)
    const response = await fetch('/api/protocol/buy-stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        id: params.assetId,
        reference: params.objectRef,
        publicKey: currentUser.publicKey,
        amount: +(params.amount || 0),
        sessionId: params.sessionId,
        uri: params.uri
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create transaction')
    }

    const { transaction } = await response.json()
    console.log('Got transaction:', transaction)

    const tx = VersionedTransaction.deserialize(Buffer.from(transaction, "base64"))
    const signature = await signTransaction(tx)
    
    if (!signature) {
      throw new Error('Failed to sign transaction')
    }

    return signature
  }, [authToken, currentUser, signTransaction])

  // Effect to check auth status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      const storedToken = localStorage.getItem('authToken')
      console.log('Checking auth status, token:', storedToken ? 'exists' : 'missing')
      
      if (!currentUser && storedToken) {
        try {
          const response = await fetch('/api/me', {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          })
          const data = await response.json()
          
          if (data.user) {
            console.log('Rehydrated user:', data.user)
            setAuth({
              token: storedToken,
              user: data.user
            })
          }
        } catch (error) {
          console.error('Failed to rehydrate auth:', error)
          localStorage.removeItem('authToken')
        }
      }
    }

    checkAuthStatus()
  }, [currentUser, setAuth])

  // Process the stripe success
  useEffect(() => {
    const processStripeSuccess = async () => {
      // Check requirements
      if (!web3auth || !provider || !currentUser || !authToken) {
        console.log('Missing requirements:', { 
          web3auth: !!web3auth, 
          provider: !!provider, 
          currentUser: !!currentUser,
          authToken: !!authToken
        })
        return
      }

      try {
        // Extract and validate params
        if (!searchParams) {
          throw new Error('Search parameters are missing')
        }

        const params: PaymentParams = {
          sessionId: searchParams.get('session_id'),
          assetId: searchParams.get('asset_id'),
          amount: searchParams.get('amount'),
          ref: searchParams.get('ref'),
          objectRef: searchParams.get('object_ref'),
          uri: searchParams.get('uri')
        }

        // Validate required params
        const requiredParams = ['sessionId', 'assetId', 'amount', 'ref', 'objectRef']
        const missingParams = requiredParams.filter(param => !params[param as keyof PaymentParams])
        
        if (missingParams.length > 0) {
          throw new Error(`Missing required parameters: ${missingParams.join(', ')}`)
        }

        // Verify payment
        const verified = await verifyPayment(params)
        if (!verified) {
          throw new Error('Payment verification failed')
        }

        // Process transaction
        const signature = await processTransaction(params)
        console.log('Transaction signature:', signature)

        toast({
          title: 'Transaction Complete',
          description: 'Your purchase has been processed successfully'
        })

        // Clean up and redirect
        sessionStorage.removeItem('pendingPaymentParams')
        sessionStorage.removeItem('sessionId')
        router.push('/dashboard')

      } catch (error) {
        console.error('Payment processing failed:', error)
        toast({
          title: 'Transaction Failed',
          description: error instanceof Error ? error.message : 'Failed to process transaction',
          variant: 'destructive'
        })
      }
    }

    processStripeSuccess()
  }, [
    web3auth, 
    provider, 
    currentUser, 
    authToken, 
    searchParams, 
    router, 
    toast, 
    verifyPayment, 
    processTransaction
  ])

  // Loading state
  if (authLoading || web3Loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  // Auth required state
  if (!currentUser || !web3auth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
          <p>Please log in to complete your purchase.</p>
          <Button
            onClick={() => router.push('/login')}
            className="mt-4"
            variant="default"
          >
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  // Processing state
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-4">Processing your purchase...</h2>
        <LoadingSpinner />
      </div>
    </div>
  )
}