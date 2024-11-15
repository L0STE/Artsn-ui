'use client';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { useQuery } from '@apollo/client';
import { GET_LISTINGS_BY_NET_RETURN } from '@/graphql/queries/listing';
import { Skeleton } from '@/components/ui/skeleton';

const TopGainer = () => {
  const { data, loading, error } = useQuery(GET_LISTINGS_BY_NET_RETURN, {
    variables: { limit: 1 }, // Get only the top performer
  });
  const router = useRouter();

  // Shared loading skeleton component
  const LoadingSkeleton = () => {
    return (
      <Card className="rounded-3xl w-full h-full bg-bg text-secondary border-zinc-300 dark:border-zinc-700">
        <CardContent className="p-6 h-full flex flex-col justify-between">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="w-full h-44 my-8" />
          <div className="grid grid-cols-2 gap-10">
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-32" />
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return <LoadingSkeleton />;
  }
  console.log('data', data);
  if (error) {
    return (
      <Card className="rounded-3xl w-full h-full bg-bg text-secondary border-zinc-300 dark:border-zinc-700">
        <CardContent className="p-6 h-full flex items-center justify-center">
          <p className="text-red-500">Failed to load top performer</p>
        </CardContent>
      </Card>
    );
  }

  const topListing = data?.getAllListings[0];
  
  if (!topListing) {
    return (
      <Card className="rounded-3xl w-full h-full bg-bg text-secondary border-zinc-300 dark:border-zinc-700">
        <CardContent className="p-6 h-full flex items-center justify-center">
          <p>No listings available</p>
        </CardContent>
      </Card>
    );
  }

  const roi = ((topListing.expectedNetReturn / topListing.marketValue) * 100).toFixed(1);

  return (
    <Card className="rounded-3xl w-full h-full bg-bg text-secondary border-zinc-300 dark:border-zinc-700 cursor-pointer" onClick={()=> router.push(`/product/${topListing.associatedId}`)}>
      <CardContent className="p-6 h-full flex flex-col justify-between">
        <h2 className="text-xl font-semibold text-secondary">Top Performer</h2>

        <Image
          src={topListing.images?.[0] || "/products/rolex-bg.svg"}
          alt={topListing.assetDetails || "Top Performer"}
          width={300}
          height={300}
          className="rounded-xl w-full max-h-1/3 object-contain"
        />

        <div className="grid grid-cols-2 gap-10">
          <div className="flex items-end gap-1">
            <div className="flex flex-col gap-1">
              <p className="text-sm text-zinc-300">ROI</p>
              <h1 className="text-3xl text-secondary">
                ${topListing.expectedNetReturn.toLocaleString()}
              </h1>
            </div>
            <p className="text-sm text-zinc-300">+{roi}%</p>
          </div>
          <div className="flex items-end gap-1">
            <div className="flex flex-col gap-1">
              <p className="text-sm text-zinc-300">Market Value</p>
              <h1 className="text-3xl text-secondary">
                ${topListing.marketValue.toLocaleString()}
              </h1>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TopGainer;