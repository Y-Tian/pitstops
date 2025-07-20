import DriverRow from "./DriverRow";
import { type Driver } from "../types";

interface LeaderboardGridProps {
  leaderboardData: Driver[];
  previousPositions: { [key: string]: number };
}

const LeaderboardGrid = ({
  leaderboardData,
  previousPositions,
}: LeaderboardGridProps) => (
  <div className="leaderboard-container">
    <div className="leaderboard">
      <div className="leaderboard-header">
        <div className="grid-header">
          <div>POS</div>
          <div>CHG</div>
          <div>CAR</div>
          <div>DRIVER</div>
          <div>LAST LAP</div>
          <div>DELTA</div>
          <div>STATUS</div>
        </div>
      </div>
      <div>
        {leaderboardData.map((driver) => (
          <DriverRow
            key={driver.driver_id}
            driver={driver}
            previousPosition={previousPositions[driver.driver_id]}
          />
        ))}
      </div>
    </div>
  </div>
);

export default LeaderboardGrid;
