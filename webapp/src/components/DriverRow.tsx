import { type Driver } from "../types";
import {
  getManufacturerLogoUrl,
  getPositionChange,
  getPositionChangeClass,
  getPositionChangeIcon,
  getDeltaClass,
  formatTime,
  formatDelta,
} from "../utils";

interface DriverRowProps {
  driver: Driver;
  previousPosition?: number;
  seriesId: string;
}

const DriverRow = ({ driver, previousPosition, seriesId }: DriverRowProps) => {
  const positionChange = getPositionChange(
    parseInt(driver.running_position),
    previousPosition,
  );
  const changeClass = getPositionChangeClass(positionChange);
  const changeIcon = getPositionChangeIcon(positionChange);
  const position = parseInt(driver.running_position);
  const deltaClass = getDeltaClass(driver.delta);
  const positionColorClass = position <= 3 ? "position-top3" : "position-other";
  let rowBgClass = "";
  if (position === 1) rowBgClass = "position-1";
  else if (position === 2) rowBgClass = "position-2";
  else if (position === 3) rowBgClass = "position-3";
  else if (position <= 10) rowBgClass = "position-top10";

  return (
    <div className={`position-row ${rowBgClass}`}>
      <div className="grid-row">
        <div className={`position ${positionColorClass}`}>
          {driver.running_position}
        </div>
        <div
          className={changeClass}
          style={{ display: "flex", alignItems: "center", gap: "4px" }}
        >
          {changeIcon}
          {positionChange !== 0 && Math.abs(positionChange)}
        </div>
        <div className="car-info">
          <div className="manufacturer-logo">
            <img
              src={getManufacturerLogoUrl(seriesId, driver.vehicle_number)}
              alt="Car Badge"
              style={{ width: 40, height: 40, objectFit: "contain" }}
            />
          </div>
          <div>
            <div className="manufacturer-name">
              {driver.vehicle_manufacturer === "Tyt"
                ? "Toyota"
                : driver.vehicle_manufacturer === "Chv"
                  ? "Chevrolet"
                  : driver.vehicle_manufacturer === "Frd"
                    ? "Ford"
                    : driver.vehicle_manufacturer}
            </div>
          </div>
        </div>
        <div className="driver-info">
          <div className="driver-name">
            {driver.full_name}
            <div className="tooltip">
              <div className="tooltip-header">
                <span className="tooltip-name">{driver.full_name}</span>
                <span className="tooltip-number">#{driver.vehicle_number}</span>
              </div>
              <div className="tooltip-grid">
                <div>
                  <span className="tooltip-label">Starting Position:</span>
                  <span className="tooltip-value">
                    {driver.starting_position}
                  </span>
                </div>
                <div>
                  <span className="tooltip-label">Current Position:</span>
                  <span className="tooltip-value">
                    {driver.running_position}
                  </span>
                </div>
                <div>
                  <span className="tooltip-label">Last Lap:</span>
                  <span
                    className="tooltip-value"
                    style={{ fontFamily: "monospace" }}
                  >
                    {formatTime(driver.last_lap_time)}s
                  </span>
                </div>
                <div>
                  <span className="tooltip-label">Delta:</span>
                  <span
                    className={`tooltip-value ${deltaClass}`}
                    style={{ fontFamily: "monospace" }}
                  >
                    {formatDelta(driver.delta)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          {driver.is_on_dvp === "True" && <span className="dvp-tag">DVP</span>}
        </div>
        <div className="lap-time">{formatTime(driver.last_lap_time)}s</div>
        <div className={`delta ${deltaClass}`}>{formatDelta(driver.delta)}</div>
        <div>
          <span
            className={`track-status ${driver.is_on_track === "True" ? "status-on" : "status-off"}`}
          >
            {driver.is_on_track === "True" ? "ON" : "OFF"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DriverRow;
