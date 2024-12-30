"use client"

import React, { useState, useEffect, Suspense, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { countries } from '@/lib/countries'
import { REGISTER_USER } from '@/graphql/mutations/user'
import { IS_USER_REGISTERED } from '@/graphql/queries/user'
import { useLazyQuery, useMutation } from '@apollo/client'
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuGroup, 
  DropdownMenuItem 
} from '@/components/ui/dropdownMenu'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { LoadingSpinner } from '@/components/loading/LoadingSpinner'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { WALLET_ADAPTERS, IAdapter } from "@web3auth/base"
import RPC from '@/components/blockchain/solana-rpc'

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
)

interface RegisterFormProps {
  onClose: () => void
}

const defaultSolanaAdapters: IAdapter<unknown>[] = []

export function RegisterForm({ onClose }: RegisterFormProps) {
  const router = useRouter()
  const { toast } = useToast()

  // Auth store state and actions
  const { 
    web3auth,
    loading,
    loggedIn,
    userInfo,
    currentUser,
    setUserInfo,
    setWeb3AuthState,
    setError: setStoreError
  } = useAuthStore()

  // Local form state
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    country: 'CH',
    acceptTerms: '',
    plan: ''
  })

  // GraphQL mutations and queries
  const [checkRegistration] = useLazyQuery(IS_USER_REGISTERED)
  const [registerUser] = useMutation(REGISTER_USER)

  // Derived values from store
  const userPublicKey = currentUser?.publicKey || ''

  const getLocalStorage = () => {
    if (typeof window !== 'undefined') {
      return window.localStorage
    }
    return null
  }

  const handleInputChange = (e: any) => {
    const { name, value, type, checked } = e.target
    setFormData((prevData) => {
      const newData = {
        ...prevData,
        [name]: type === 'checkbox' ? Date.now() : value
      }
      // Save to localStorage
      const storage = getLocalStorage()
      if (storage) {
        storage.setItem('signupFormData', JSON.stringify(newData))
      }
      return newData
    })
  }

  const fetchUserInfo = async () => {
    try {
      if (!web3auth || !web3auth.provider) {
        throw new Error("Web3Auth not initialized or no provider")
      }

      const rpc = new RPC(web3auth.provider)
      const accounts = await rpc.getAccounts()
      const publicKey = accounts[0]
      
      const user = await web3auth.getUserInfo()
      
      // Update store with user info
      setUserInfo({
        email: user.email || '',
        name: user.name || '',
        profileImage: user.profileImage || ''
      })

      const _isRegistered = await checkRegistration({ 
        variables: { publicKey } 
      })
      
      if (_isRegistered.data.isUserRegistered) {
        setWeb3AuthState({
          loggedIn: true
        })
      } else {
        // Register new user
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'
        await fetch(`${baseUrl}/api/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            country: formData.country,
            email: user.email || '',
            password: publicKey,
            publicKey: publicKey
          }),
        })
      }
    } catch (error) {
      console.error("Error fetching user info:", error)
      setStoreError(error as Error)
    }
  }

  const loginWithGoogle = async () => {
    try {
      if (!web3auth) {
        console.error("Web3Auth not initialized yet")
        return
      }

      if (web3auth.connected) {
        await fetchUserInfo()
        return
      }

      const web3authProvider = await web3auth.connectTo(WALLET_ADAPTERS.AUTH, {
        loginProvider: "google",
      })

      if (!web3authProvider) {
        throw new Error('No provider')
      }

      setWeb3AuthState({
        provider: web3authProvider,
        loggedIn: true
      })
      
      await fetchUserInfo()

    } catch (error) {
      console.error("Error during Google login:", error)
      if (error instanceof Error && error.message.includes("Already connected")) {
        await fetchUserInfo()
      } else {
        setStoreError(error as Error)
        toast({
          title: 'Login Failed',
          description: 'Failed to login with Google. Please try again.',
          variant: 'destructive'
        })
      }
    }
  }

  const loginWithAdapter = async (adapterName: string) => {
    try {
      if (!web3auth) {
        throw new Error("web3auth not initialized yet")
      }

      const web3authProvider = await web3auth.connectTo(adapterName)
      
      setWeb3AuthState({
        provider: web3authProvider,
        loggedIn: true
      })

      await fetchUserInfo()

      toast({
        title: 'Connected',
        description: 'Successfully connected to your wallet',
      })
    } catch (error) {
      console.error('Login with adapter error:', error)
      setStoreError(error as Error)
      toast({
        title: 'Failed to connect',
        description: 'Failed to connect to your wallet',
        variant: 'destructive'
      })
    }
  }

  const handleLogin = useCallback(async (adapterName: string) => {
    await loginWithAdapter(adapterName)
  }, [loginWithAdapter])

  // Load saved form data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storage = getLocalStorage()
      if (storage) {
        const savedData = storage.getItem('signupFormData')
        if (savedData) {
          setFormData(JSON.parse(savedData))
        }
      }
    }
  }, [])

  if (!web3auth || loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="fixed h-full inset-0 bg-black bg-opacity-100 flex items-center justify-center z-[100]">
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10" />
      <div className="bg-transparent rounded-lg p-6 w-full max-w-4xl relative z-20">
        <Button 
          onClick={() => router.push('/')} 
          className="absolute -top-10 right-2 z-30"
        >
          Close
        </Button>
        <Progress 
          className='w-full my-6 shadow-sm rounded-full bg-gradient-to-r from-primary to-secondary' 
          value={step === 1 ? 50 : 100} 
          max={100} 
        />

        {step === 1 ? (
          <div className='flex flex-row gap-6'>
            <Card className='bg-primary p-8 flex flex-col text-secondary border-none w-full md:w-1/2'>
              <h3 className="text-xl font-bold mb-4">FILL YOUR ACCOUNT INFORMATION</h3>
              <div className="flex flex-col gap-4 mb-4">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="border p-2 rounded"
                  required
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="border p-2 rounded"
                  required
                />
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="border p-2 rounded"
                  required
                >
                  <option value='CH' label='Switzerland 🇨🇭'>
                    Switzerland 🇨🇭
                  </option>
                  {countries.map(country => (
                    <option key={country.value} value={country.label}>
                      {country.label}
                    </option>
                  ))}
                </select>

                <div className="mt-4">
                  <h3 className="text-xl font-bold mb-2">CONNECT A WALLET</h3>
                  <div className="flex flex-col justify-evenly mb-4 gap-4">
                    <Button 
                      disabled={loggedIn || userPublicKey ? true : false} 
                      variant="outline" 
                      className='w-full rounded-full border-none font-urbanist text-lg hover:bg-secondary hover:text-primary' 
                      style={{boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)'}} 
                      onClick={loginWithGoogle}
                    >
                      Google
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          disabled={loggedIn || userPublicKey ? true : false} 
                          variant='default'
                          className='w-full rounded-full border-secondary font-urbanist text-lg hover:bg-secondary hover:text-primary'
                        >
                          Connect 
                          {['phantom', 'solflare', 'backpack', 'ledger'].map(icon => (
                            <img 
                              key={icon} 
                              src={`/login/${icon}_icon.svg`} 
                              alt={icon} 
                              className='ml-2' 
                              style={{ width: '20px', height: '20px'}} 
                            />
                          ))}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56 z-[201]">
                        <DropdownMenuGroup>
                          {defaultSolanaAdapters?.map((adapter: IAdapter<unknown>) => (
                            <DropdownMenuItem 
                              key={adapter.name.toUpperCase()} 
                              onClick={() => handleLogin(adapter.name)}
                            >
                              <img 
                                src={`/login/${adapter.name}_icon.svg`} 
                                alt={adapter.name ?? ''} 
                                className='ml-2' 
                                style={{ width: '20px', height: '20px'}} 
                              />
                              {adapter.name.charAt(0).toUpperCase() + adapter.name.slice(1)}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              <Button 
                disabled={!userPublicKey} 
                type="submit" 
                className="bg-secondary text-primary hover:text-secondary px-4 py-2 rounded" 
                onClick={() => setStep(2)}
              >
                Next 
              </Button>
              <div className="flex text-sm items-center mb-4">
                By continuing, you agree to our Terms and Conditions.
              </div>
            </Card>

            <Card className='bg-bg hidden md:flex flex-col relative w-1/2 text-secondary overflow-hidden'>
              <div className='h-full w-full rounded-xl bg-[url(/products/rolex-bg.svg)] bg-contain bg-right-middle bg-no-repeat transform translate-x-[4rem] scale-150 translate-y-[7rem] ' />
              <CardHeader className='absolute bottom-0 left-0 w-1/2'>
                <CardTitle className='text-xl font-bold'>
                  Buy a fraction of your favorite asset
                </CardTitle>
                <CardDescription className='text-md'>
                  Democratizing Luxury one fraction at a time
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        ) : (
          <div className='flex flex-row gap-6'>
            <Card className='bg-primary p-8 flex flex-col text-secondary border-none w-full md:w-1/2'>
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Congratulations!</h3>
              <p className="mb-4">Your account with The Artisan has been created</p>
              <p className="mb-4">Head over to your dashboard to learn how to collect!</p>
              {userPublicKey && (
                <p className="mb-4">
                  <strong>
                    Wallet: {userPublicKey.slice(0,4)}...{userPublicKey.slice(-4)}
                  </strong>
                </p>
              )}
              <Button 
                onClick={() => {
                  onClose()
                  router.push('/dashboard')
                }} 
                className="bg-black text-white px-4 py-2 rounded"
              >
                Enter
              </Button>
            </Card>

            <Card className='bg-bg hidden md:flex flex-col relative w-1/2 text-secondary overflow-hidden'>
              <div className='hidden md:flex h-full w-full rounded-xl bg-[url(/products/rolex-bg.svg)] bg-contain bg-right-middle bg-no-repeat transform translate-x-20 scale-150 translate-y-20 ' />
              <CardHeader className='absolute bottom-0 left-0 w-1/2'>
                <CardTitle className='text-xl font-bold'>
                  Buy a fraction of your favorite asset
                </CardTitle>
                <CardDescription className='text-md'>
                  Democratizing Luxury one fraction at a time
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}