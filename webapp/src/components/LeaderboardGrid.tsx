import DriverRow from "./DriverRow";
import { type Driver } from "../types";

interface LeaderboardGridProps {
  leaderboardData: Driver[];
  previousPositions: { [key: string]: number };
  seriesId: string;
}

const LeaderboardGrid = ({
  leaderboardData,
  previousPositions,
  seriesId,
}: LeaderboardGridProps) => (
  <div className="leaderboard-container">
    <div className="leaderboard">
      <div className="leaderboard-header">
        <div className="grid-header">
          <div>Position</div>
          <div>Change</div>
          <div>Car</div>
          <div>Driver</div>
          <div>Last Lap Time</div>
          <div>Delta</div>
          <div>Status</div>
        </div>
      </div>
      <div>
        {leaderboardData.map((driver) => (
          <DriverRow
            key={driver.driver_id}
            driver={driver}
            previousPosition={previousPositions[driver.driver_id]}
            seriesId={seriesId}
          />
        ))}
      </div>
    </div>
  </div>
);

export default LeaderboardGrid;
