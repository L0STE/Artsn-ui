'use client'
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useTheme } from '@/hooks/use-theme';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IconCurrencyDollar, IconCurrencySolana } from '@tabler/icons-react';
import { LoadingSpinner } from '@/components/loading/LoadingSpinner';
import Image from 'next/image';
import { ChevronDown, Copy, Menu } from 'lucide-react';
import { LogOut, Settings2, ListOrdered } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdownMenu";
import { useAuth } from '@/providers/Web3AuthProvider';
import { User } from '@/types/resolver-types';
import { useSolanaPrice } from '@/hooks/use-solana-price';
import { Button } from '@/components/ui/button';
import { ChevronRightIcon } from '@radix-ui/react-icons';
import { LoginDialog } from '@/components/login/LoginDialog';
import NavButton from '@/components/ui/buttons/NavButton';
import MobileNavbar from '../navbar/MobileNavbar';
import dynamic from 'next/dynamic';

// Dynamically import Joyride with ssr disabled
const Joyride = dynamic(() => import('react-joyride'), { ssr: false });

interface NavbarProps {
  links: { label: string; path: string }[];
  searchParams?: { get: (key: string) => string | null };
  scrollThreshold?: number;
  blurAmount?: number;
}

type BalanceObject = {
  sol: number;
  usdc: number;
};

const steps = [
  {
    target: '.about-link',
    content: 'Learn more about our platform and mission.',
  },
  {
    target: '.marketplace-link',
    content: 'Explore our marketplace and discover unique assets to invest in.',
  },
  {
    target: '.auth-section',
    content: 'Login or Create your profile here.',
  }
];

const UserDropdown = ({ user, userBalance, onLogout }: { 
  user: User, 
  userBalance: BalanceObject,
  onLogout: () => Promise<void>
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const { solToUsd } = useSolanaPrice();
  
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: text,
    });
  }, [toast]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className="flex items-center gap-2 cursor-pointer">
          <Avatar>
            <AvatarImage src={user?.baseProfile?.photoUrl || ''} alt="Profile picture" />
            <AvatarFallback>
              <div className="w-16 h-16 rounded-3xl dark:bg-white bg-black"></div>
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="text-secondary" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-screen md:w-72 p-4 bg-white dark:bg-white rounded-3xl border border-zinc-300 dark:border-zinc-700"
      >
        {/* User Profile Section */}
        <div className="flex items-center space-x-4 mb-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={user?.baseProfile?.photoUrl} alt="Profile picture" />
            <AvatarFallback>
              <div className="w-16 h-16 rounded-3xl dark:bg-white bg-black"></div>
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-3xl text-secondary font-semibold">
              {user?.baseProfile?.displayName || `User_${user?.publicKey?.slice(-4)}`}
            </h2>
            <div className="text-gray-500 flex items-center">
              <span className="truncate mr-1">
                {user?.publicKey?.slice(0, 4)}...{user?.publicKey?.slice(-4)}
              </span>
              <Copy
                className="cursor-pointer ml-2"
                onClick={() => copyToClipboard(user?.publicKey)}
              />
            </div>
          </div>
        </div>

        {/* Balance Section */}
        <div className="mb-4 p-4 bg-transparent border border-zinc-300 dark:border-zinc-600 rounded-3xl">
          <div className="flex justify-between items-center">
            <div className="text-secondary">Buying power</div>
            <div className="text-xl text-secondary font-bold">
              ${userBalance ? (solToUsd(userBalance.sol) + userBalance.usdc).toFixed(2) : '0.00'}
            </div>
          </div>

          {/* SOL Balance */}
          <div className="mt-2 flex items-center">
            <div className="flex-1 flex items-center gap-2 text-secondary">
              <div className="w-4 h-4 rounded-full bg-bg border border-solid border-[#D4D4D8]">
                <IconCurrencySolana className="w-4 h-4" />
              </div>
              <span>{userBalance?.sol?.toFixed(4) || '0.0000'} SOL</span>
            </div>
            <div className="text-zinc-500">=${solToUsd(userBalance?.sol || 0).toFixed(2)}</div>
          </div>

          {/* USDC Balance */}
          <div className="mt-2 flex items-center">
            <div className="flex-1 flex items-center gap-2 text-secondary">
              <div className="w-4 h-4 rounded-full bg-bg border border-solid border-[#D4D4D8]">
                <IconCurrencyDollar className="w-full h-full" />
              </div>
              <span>{userBalance?.usdc || '0'} USDC</span>
            </div>
          </div>

          {/* Test Funds Section */}
          <div className='flex flex-col items-center justify-center mt-2 bg-slate-500/20 p-2 rounded-2xl'>
            <p>Need Test Funds?</p>
            <div className='flex flex-row justify-center items-center gap-2 w-full h-fit'>
              <Link href='https://faucet.circle.com/' target='_blank'>
                <Button variant='outline' className='mt-4 w-full'>Get USDC</Button>
              </Link>
              <Link href='https://faucet.solana.com/' target='_blank'>
                <Button variant='outline' className='mt-4 w-full'>Get SOL</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <DropdownMenuItem className="cursor-pointer text-secondary mt-4" onClick={() => router.push('/dashboard/settings')}>
          <Settings2 className="mr-2 h-4 w-4" />
          <span className="text-sm font-semibold">Edit profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer text-secondary" onClick={() => router.push('/dashboard')}>
          <ListOrdered className="mr-2 h-4 w-4" />
          <span className="text-sm font-semibold">Dashboard</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer text-secondary" onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span className="text-sm font-semibold">Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserDropdown;