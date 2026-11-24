import { Link } from 'react-router'
import { Heart } from 'lucide-react'
import { listingsApi } from '@/api/listings'
import { useAsync } from '@/hooks/useAsync'
import { PageHeader } from '@/components/PageHeader'
import { ListingCard, ListingCardSkeleton } from '@/components/ListingCard'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'

export function SavedPage() {
  const { data, setData, loading, error, reload } = useAsync(() => listingsApi.favorites(), [])

  return (
    <div className="lg:px-4">
      <PageHeader title="Saved" back={false} />
      <div className="px-4">
        {error ? (
          <EmptyState icon={<Heart />} title="Couldn't load saved items" body={error.message} action={<Button onClick={reload}>Retry</Button>} />
        ) : loading && !data ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 4 }, (_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        ) : !data?.length ? (
          <EmptyState
            icon={<Heart />}
            title="Nothing saved yet"
            body="Tap the heart on any listing to keep an eye on it."
            action={
              <Button asChild>
                <Link to="/">Browse deals</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {data.map((l) => (
              <ListingCard key={l.id} listing={l} onFavoriteChange={(fav) => !fav && setData(data.filter((x) => x.id !== l.id))} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
