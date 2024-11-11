
// TrendingUp.tsx
'use client';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { useQuery } from '@apollo/client';
import { GET_LISTINGS_BY_SALES } from '@/graphql/queries/listing';
import { Skeleton } from '../ui/skeleton';
import { useRouter } from 'next/navigation';

const TrendingUp = () => {
  const router = useRouter();
  const { data, loading, error } = useQuery(GET_LISTINGS_BY_SALES, {
    variables: { limit: 1 }, // Get the most sold listing
  });

  if (loading) {
    return <LoadingSkeleton />;
  }
  console.log('data', data);
  if (error) {
    return (
      <Card className="rounded-3xl w-full h-full bg-bg text-secondary border-zinc-300 dark:border-zinc-700">
        <CardContent className="p-6 h-full flex items-center justify-center">
          <p className="text-red-500">Failed to load trending item</p>
        </CardContent>
      </Card>
    );
  }

  const trendingListing = data?.getAllListings[0];

  if (!trendingListing) {
    return (
      <Card className="rounded-3xl w-full h-full bg-bg text-secondary border-zinc-300 dark:border-zinc-700">
        <CardContent className="p-6 h-full flex items-center justify-center">
          <p>No listings available</p>
        </CardContent>
      </Card>
    );
  }

  const roi = ((trendingListing.expectedNetReturn / trendingListing.marketValue) * 100).toFixed(1);

  return (
    <Card className="rounded-3xl w-full h-full bg-bg text-secondary border-zinc-300 dark:border-zinc-700" onClick={()=> router.push(`/product/${trendingListing.associatedId}`)}>
      <CardContent className="p-6 h-full flex flex-col justify-between">
        <h2 className="text-xl font-semibold text-secondary">Trending Up</h2>

        <Image
          src={trendingListing.images?.[0] || "/products/watch.svg"}
          alt={trendingListing.assetDetails || "Trending Item"}
          width={200}
          height={200}
          className="rounded-xl w-full border border-zinc-300 dark:border-zinc-700 my-8 max-h-44 object-cover"
        />

        <div className="grid grid-cols-2 gap-10">
          <div className="flex items-end gap-1">
            <div className="flex flex-col gap-1">
              <p className="text-sm text-zinc-300">Total Sales</p>
              <h1 className="text-3xl text-secondary">{trendingListing.sold}</h1>
            </div>
            <p className="text-sm text-zinc-300">+{roi}%</p>
          </div>
          <div className="flex items-end gap-1">
            <div className="flex flex-col gap-1">
              <p className="text-sm text-zinc-300">Market Value</p>
              <h1 className="text-3xl text-secondary">
                ${trendingListing.marketValue.toLocaleString()}
              </h1>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

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

export default TrendingUp;