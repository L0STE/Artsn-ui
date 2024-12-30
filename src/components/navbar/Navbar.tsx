'use client'

import { memo, Suspense, useCallback, useState } from 'react'
import { useTheme } from '@/hooks/use-theme'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { LoginDialog } from '@/components/login/LoginDialog'
import { Button } from '@/components/ui/button'
import { ChevronRightIcon } from '@radix-ui/react-icons'
import NavButton from '@/components/ui/buttons/NavButton'
import MobileNavbar from './MobileNavbar'
import dynamic from 'next/dynamic'

// Types
interface NavbarProps {
  links: { label: string; path: string }[]
  searchParams?: { get: (key: string) => string | null }
}

// Main Navbar Component
export const Navbar = memo(({ links, searchParams }: NavbarProps) => {
  const _params = searchParams?.get('register') === 'true'
  const { isDarkMode } = useTheme()
  const [navbarCollapsed, setNavbarCollapsed] = useState(false)
  const router = useRouter()
  
  // Get logo path based on theme
  const logoPath = isDarkMode 
    ? '/logos/artisan-small-logo-black.svg'
    : '/logos/artisan-small-logo-black.svg'

  const renderAuthComponent = useCallback(() => {
    return <LoginDialog className="auth-section" />
  }, [])

  return (
    <Suspense fallback={<div />}>
      {/* Desktop Navbar */}
      <header className="hidden md:flex fixed inset-x-0 top-0 z-50 items-center justify-between px-8 py-4 backdrop-blur-lg">
        <Link href="/" className="flex items-center">
          <Image
            src={logoPath}
            alt="Logo"
            width={32}
            height={32}
            className="cursor-pointer"
            priority
          />
        </Link>
        
        <div className="flex items-center space-x-6">
          <Button variant="ghost" asChild>
            <Link className="about-link" href="/about">
              About Us
            </Link>
          </Button>
          
          <Button 
            variant="outline"
            className="marketplace-link"
            asChild
          >
            <Link href="/marketplace">
              Explore the Marketplace
              <ChevronRightIcon className="ml-2" />
            </Link>
          </Button>

          {renderAuthComponent()}
        </div>
      </header>

      {/* Mobile Navbar */}
      <header className="md:hidden fixed inset-x-0 top-0 z-50 flex items-center justify-between p-4 backdrop-blur-lg">
        <Link href="/">
          <Image
            src={logoPath}
            alt="Logo"
            width={25}
            height={25}
            className="cursor-pointer"
            priority
          />
        </Link>

        {renderAuthComponent()}
        
        <NavButton
          onClick={() => setNavbarCollapsed(prev => !prev)}
          navbarCollapsed={navbarCollapsed}
          className="text-primary"
        />

        {navbarCollapsed && (
          <MobileNavbar
            links={links}
            LoginFeatureProps={{ 
              isOpen: navbarCollapsed,
              onClose: () => setNavbarCollapsed(false),
              onCompleted: () => setNavbarCollapsed(false),
            }}
          />
        )}
      </header>
    </Suspense>
  )
})

export default Navbar