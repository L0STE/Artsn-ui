// hooks/use-kyc.ts
import { useState, useCallback } from 'react';
import { useAuth} from '@/providers/Web3AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface KYCRegistration {
  dateOfBirth: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  personalCode?: string;
  phoneNumber: number;
  countryCode: string;
}

interface CreateIDVResponse {
  id: string;
  status: string;
}

interface UseKYCReturn {
  startKYCVerification: (registration: KYCRegistration) => Promise<void>;
  kycStatus: 'idle' | 'pending' | 'completed' | 'failed';
  error: string | null;
  loading: boolean;
  verificationUrl: string | null;
}

const ONDATO_IDV_URL = process.env.NEXT_PUBLIC_ONDATO_IDV_URL || 'https://sandbox-idv.ondato.com';

export const useKYC = (): UseKYCReturn => {
  const [kycStatus, setKYCStatus] = useState<'idle' | 'pending' | 'completed' | 'failed'>('idle');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  
  const { getUserInfo } = useAuth();
  const { toast } = useToast();

  const startKYCVerification = useCallback(async (registration: KYCRegistration) => {
    try {
      setLoading(true);
      setError(null);
      const userInfo = await getUserInfo();
      // Create identity verification
      const response = await fetch('/api/kyc/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          externalReferenceId: userInfo?.publicKey,
          registration,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create identity verification');
      }

      const { id }: CreateIDVResponse = await response.json();
      
      // Generate verification URL
      const url = `${ONDATO_IDV_URL}/?id=${id}`;
      console.log('verification url:', url);
      setVerificationUrl(url);
      setKYCStatus('pending');
      
      toast({
        title: "KYC Verification Started",
        description: "Please complete the verification process in the new window",
      });
    
      // open the verification URL in a new window
      window.open(url, '_blank');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start KYC verification';
      setError(errorMessage);
      setKYCStatus('failed');
      
      toast({
        title: "KYC Verification Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [getUserInfo, toast]);

  return {
    startKYCVerification,
    kycStatus,
    error,
    loading,
    verificationUrl,
  };
};