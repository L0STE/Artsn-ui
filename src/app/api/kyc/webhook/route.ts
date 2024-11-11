// app/api/kyc/webhook/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  try {
    const headersList = headers();
    // Get webhook signature if Ondato provides one
    const signature = headersList.get('x-ondato-signature');

    // Verify signature if needed
    // if (!verifySignature(signature, rawBody)) {
    //   return NextResponse.json(
    //     { error: 'Invalid signature' },
    //     { status: 401 }
    //   );
    // }

    const body = await request.json();
    const { type, data } = body;
    
    // Process webhook payload
    console.log('Received KYC webhook:', type, data);
    
    // Update user verification status in your database
    // await updateUserVerificationStatus(data);
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Optional: Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}