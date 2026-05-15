import { GolfTracker } from "@/components/golf-tracker"
import { GolfTrackerPersistenceProvider } from "@/components/golf-tracker-persistence"

export default function Page() {
  return (
    <GolfTrackerPersistenceProvider>
      <GolfTracker />
    </GolfTrackerPersistenceProvider>
  )
}
