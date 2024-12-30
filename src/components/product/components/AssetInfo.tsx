"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { VersionedTransaction } from "@solana/web3.js"
import { loadStripe } from '@stripe/stripe-js'
import { v4 as uuid } from 'uuid'
import { CreditCard } from 'lucide-react'
import { useHandleShare } from '@/hooks/use-handle-share'
import { useWeb3 } from '@/hooks/use-web3-auth'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { usePaymentStore } from '@/lib/stores/usePaymentStore'
import { useToast } from '@/hooks/use-toast'
import { LoginSecondary } from '@/components/login/LoginSecondary'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

interface AssetInfo {
  onChainData: {
    id: string
    name: string
    share: number
    shareSold: number
    price: number
    watchUri: string
    objectType: {
      watch: boolean
    }
  }
  offChainData: {
    associatedId: string
    reference: string
    mintAddress: string
    images: string[]
    about: string
  }
  attributes: Array<{
    value: string
  }>
}

export default function AssetInfo({ asset }: { asset: AssetInfo }) {
  const router = useRouter()
  const { toast } = useToast()
  const { handleCopy, copied } = useHandleShare()
  
  // Auth store
  const { currentUser } = useAuthStore()
  
  // Payment store
  const { balance, setBalance } = usePaymentStore()
  
  // Web3 utilities
  const { rpc, getBalance, signTransaction } = useWeb3()

  // Local state
  const [amount, setAmount] = useState(1)
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const [isBuying, setIsBuying] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const increment = () => amount < 4 && setAmount(amount + 1)
  const decrement = () => amount > 1 && setAmount(amount - 1)

  // Fetch user balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (currentUser?.publicKey && rpc) {
        const balance = await getBalance()
        if (balance) setBalance(balance)
      }
    }
    fetchBalance()
  }, [currentUser, rpc, getBalance, setBalance])

  // Buy with crypto
  const buyTx = async () => {
    try {
      toast({
        title: 'Preparing transaction...',
      })

      const response = await fetch('/api/protocol/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: Number(asset.onChainData.id),
          reference: asset.offChainData.reference,
          publicKey: currentUser?.publicKey,
          amount: amount,
          uri: asset.onChainData.watchUri,
        })
      })

      const { transaction } = await response.json()
      return VersionedTransaction.deserialize(Buffer.from(transaction, "base64"))
    } catch (error) {
      console.error('Error sending transaction:', error)
      throw error
    }
  }

  const handleBuy = async () => {
    setIsBuying(true)
    try {
      if (!rpc || !currentUser) {
        throw new Error('Web3 provider not initialized')
      }

      const tx = await buyTx()
      if (!tx) {
        throw new Error('No transaction to sign')
      }

      setIsProcessing(true)
      const signature = await signTransaction(tx)
      
      if (!signature) {
        throw new Error('Failed to sign transaction')
      }

      toast({
        title: 'Transaction sent',
        description: 'Transaction has been sent to the blockchain',
      })
      
      setIsComplete(true)
    } catch (error) {
      console.error('Buy transaction failed:', error)
      toast({
        title: 'Transaction Failed',
        description: error instanceof Error ? error.message : 'Failed to process transaction',
        variant: 'destructive'
      })
    } finally {
      setIsBuying(false)
      setIsProcessing(false)
    }
  }

  // Buy with Stripe
  const asyncStripe = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string)
  
  const buyStripe = async () => {
    try {
      const idempotencyKey = uuid()
      const encodedUri = encodeURIComponent(asset.onChainData.watchUri)
      
      const stripe = await asyncStripe
      const res = await fetch("/api/stripe", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          amount,
          id: asset.offChainData.associatedId,
          objectReference: asset.offChainData.reference,
          object: asset.offChainData.mintAddress,
          uri: encodedUri,
        }),
      })

      const { sessionId } = await res.json()
      sessionStorage.setItem('sessionId', sessionId)
      await stripe?.redirectToCheckout({ sessionId })
    } catch (error) {
      console.error("Stripe transaction failed:", error)
      toast({
        title: 'Payment Failed',
        description: 'Failed to process payment. Please try again.',
        variant: 'destructive'
      })
    }
  }

  return (
    <section className="bg-white rounded-3xl border-gray p-5 mb-5">
      {/* Asset Type Buttons */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-3">
          <button className="text-xs md:text-base border-gray text-black p-2.5 rounded-2xl shadow-sm">
            <span>{asset.onChainData.objectType.watch ? 'Watch' : 'Diamonds'}</span>
          </button>
          {asset.onChainData.objectType.watch && (
            <button className="text-xs md:text-base border-gray text-black p-2.5 rounded-2xl shadow-sm">
              <span>{asset.attributes?.[4]?.value.toString() ?? ''}</span>
            </button>
          )}
        </div>
        <button 
          className="text-xs md:text-base bg-black text-white px-4 py-2.5 rounded-2xl shadow-sm" 
          onClick={() => handleCopy(window.location.href)}
        >
          <span className="flex items-center gap-2">
            {!copied ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="size-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
                />
              </svg>
            ) : (
              <span>√</span>
            )}
            Share
          </span>
        </button>
      </div>

      {/* Asset Info */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">{asset.onChainData.name}</h1>
      </div>
      <p className="text-gray-600 mb-5">{asset.attributes[1].value}</p>
      
      {/* Share Information */}
      <p className="text-lg mb-3">Remaining fractions</p>
      <p className="text-3xl font-bold mb-2">
        {Number(asset.onChainData.share) - Number(asset.onChainData.shareSold)} / {asset.onChainData.share}
      </p>
      <p className="text-sm mb-2">{Number(asset.onChainData.price)}$ / fractions</p>
      <Progress 
        value={Number(asset.onChainData.share) - Number(asset.onChainData.shareSold)} 
        max={Number(asset.onChainData.share)} 
        className="my-4 bg-secondary text-primary" 
      />

      {/* Purchase Controls */}
      <div className="flex md:flex-row flex-col justify-between items-start md:items-center mb-5 gap-4">
        <div className="w-full max-w-48 flex justify-between items-center gap-4">
          <button
            onClick={decrement}
            className="h-[50px] w-[78px] bg-gray-300 flex justify-center items-center rounded-2xl"
          >
            -
          </button>
          <button className="h-[50px] w-[78px] bg-white flex justify-center items-center rounded-2xl font-bold border-gray box-border">
            {amount}
          </button>
          <button
            onClick={increment}
            className="h-[50px] w-[78px] bg-gray-700 flex justify-center items-center rounded-2xl text-white"
          >
            +
          </button>
        </div>

        {/* Purchase Dialog */}
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogTrigger className="w-full md:w-2/3 bg-black text-white py-3 rounded-2xl">
            {`Buy ${amount} Fractions`}
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                <div className="flex flex-row w-full justify-between gap-4 items-center">
                  <p className="text-lg font-semibold text-secondary">
                    {!isComplete ? 'Confirm Purchase' : 'Thanks for buying'}
                  </p>
                  <AlertDialogCancel className="w-fit rounded-xl bg-primary text-secondary hover:bg-secondary hover:text-primary">
                    X
                  </AlertDialogCancel>
                </div>
              </AlertDialogTitle>
              
              {!isComplete ? (
                <AlertDialogDescription>
                  {/* Purchase Summary */}
                  This action will purchase you {amount} fractions of the asset. Are you sure you want to continue?
                  <Separator className="my-2 bg-slate-300"/>
                  
                  {/* Asset Preview */}
                  <div className="flex flex-row justify-between gap-4 items-center px-4">
                    <div className="flex flex-row gap-2 items-center">
                      <Image
                        src={asset.offChainData.images[0]}
                        alt={asset.attributes[0].value}
                        width={100}
                        height={100}
                        className="rounded-3xl mt-5 border-gray border border-solid"
                      />
                      <div className="flex flex-col gap-2">
                        <p className="text-lg font-semibold text-secondary">
                          {asset.attributes[0].value} - {asset.attributes[1].value}
                        </p>
                        <p className="text-sm text-secondary">x {amount} Fractions</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">${Number(asset.onChainData.price)}</p>
                  </div>
                  
                  {/* Cost Breakdown */}
                  <Separator className="my-2 bg-slate-300"/>
                  <div className="flex flex-col w-full justify-between items-center px-4">
                    <div className="flex flex-row w-full justify-between gap-4 items-center px-4">
                      <p className="text-md text-secondary">Subtotal</p>
                      <p className="text-md text-secondary">
                        ${amount * Number(asset.onChainData.price)}
                      </p>
                    </div>
                    <div className="flex flex-row w-full justify-between gap-4 items-center px-4">
                      <p className="text-md text-secondary">Processing Fee</p>
                      <p className="text-md text-secondary">
                        ${(amount * Number(asset.onChainData.price)) * 0.04}
                      </p>
                    </div>
                    <div className="flex flex-row w-full justify-between gap-4 items-center px-4">
                      <p className="text-md font-semibold text-secondary">Purchase Total</p>
                      <p className="text-md font-semibold text-secondary">
                        ${((amount * Number(asset.onChainData.price)) * 0.04) + (amount * Number(asset.onChainData.price))}
                      </p>
                    </div>
                  </div>
                </AlertDialogDescription>
              ) : (
                <AlertDialogDescription>
                  You just bought x {amount} Fractions of {asset.attributes[0].value} - {asset.attributes[1].value}. 
                  Welcome to the Artisan family!
                </AlertDialogDescription>
              )}
            </AlertDialogHeader>

            <AlertDialogFooter>
              {/* Transaction Status */}
              {isBuying && !isProcessing && (
                <div className="flex flex-col justify-between gap-2 items-center px-4 w-full">
                  <p>Preparing your txn...</p>
                </div>
              )}
              {isBuying && isProcessing && (
                <div className="flex flex-col justify-between gap-2 items-center px-4 w-full">
                  <p>Processing, one more sec...</p>
                </div>
              )}

              {/* Purchase Actions */}
              {!isBuying && !isComplete && (
                <div className="flex flex-col justify-between gap-2 items-center px-4 w-full">
                  <Separator className="bg-slate-300"/>    
                  <Button 
                    className="w-full rounded-xl bg-secondary text-primary hover:bg-primary hover:text-secondary" 
                    onClick={handleBuy}
                    disabled={!currentUser || balance.usdc < (amount * Number(asset.onChainData.price))}
                  >
                    Pay with crypto ( save ${(amount * Number(asset.onChainData.price)) * 0.04} )
                  </Button>
                  <Button 
                    disabled={!currentUser} 
                    className="w-full rounded-xl bg-secondary text-primary hover:bg-primary hover:text-secondary" 
                    onClick={buyStripe}
                  >
                    <CreditCard className="mr-2"/>Pay with card
                  </Button>
                  
                  {/* Login Prompt */}
                  {!currentUser && (
                    <div className="flex flex-col gap-2 items-center w-full bg-red-500/20 rounded-2xl py-2">
                      <LoginSecondary className="w-full"/>
                    </div>
                  )}
                </div>
              )}

              {/* Post-Purchase Actions */}
              {isComplete && (
                <div className="flex flex-col justify-between gap-2 items-center px-4 w-full">
                  <div className="flex flex-row gap-4 items-center w-full">
                    <AlertDialogCancel 
                      className="w-1/3 rounded-xl bg-primary text-secondary hover:bg-primary hover:text-secondary" 
                      onClick={() => setIsComplete(false)}
                    >
                      Buy more
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      className="w-2/3 rounded-xl bg-secondary text-primary hover:bg-primary hover:text-secondary" 
                      onClick={() => router.push('/dashboard')}
                    >
                      Take me to my dashboard
                    </AlertDialogAction>
                  </div>
                </div>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </section>
  )
}