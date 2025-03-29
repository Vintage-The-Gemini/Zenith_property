// frontend/src/components/dashboard/OccupancyChart.jsx
import { useState, useEffect } from "react";
import { Building2 } from "lucide-react";
import Card from "../ui/Card";

const OccupancyChart = ({ properties = [], units = [] }) => {
  const [occupancyData, setOccupancyData] = useState({
    occupied: 0,
    vacant: 0,
    maintenance: 0,
    reserved: 0,
    occupancyRate: 0,
  });

  useEffect(() => {
    if (units.length > 0) {
      // Calculate occupancy stats
      const occupied = units.filter(
        (unit) => unit.status === "occupied"
      ).length;
      const vacant = units.filter((unit) => unit.status === "available").length;
      const maintenance = units.filter(
        (unit) => unit.status === "maintenance"
      ).length;
      const reserved = units.filter(
        (unit) => unit.status === "reserved"
      ).length;
      const total = units.length;

      setOccupancyData({
        occupied,
        vacant,
        maintenance,
        reserved,
        occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0,
      });
    }
  }, [units]);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium mb-4 flex items-center">
        <Building2 className="h-5 w-5 mr-2 text-primary-600" />
        Unit Occupancy
      </h3>

      <div className="flex justify-between items-center mb-4">
        <div className="text-center">
          <p className="text-3xl font-bold">{occupancyData.occupancyRate}%</p>
          <p className="text-sm text-gray-500">Occupancy Rate</p>
        </div>

        <div className="flex space-x-4">
          <div className="text-center">
            <p className="text-lg font-semibold text-blue-600">
              {occupancyData.occupied}
            </p>
            <p className="text-xs text-gray-500">Occupied</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-green-600">
              {occupancyData.vacant}
            </p>
            <p className="text-xs text-gray-500">Vacant</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-yellow-600">
              {occupancyData.maintenance}
            </p>
            <p className="text-xs text-gray-500">Maintenance</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-purple-600">
              {occupancyData.reserved}
            </p>
            <p className="text-xs text-gray-500">Reserved</p>
          </div>
        </div>
      </div>

      {/* Simple bar chart representation */}
      <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
        <div className="flex h-full">
          <div
            className="bg-blue-500 h-full"
            style={{
              width: `${(occupancyData.occupied / units.length) * 100}%`,
            }}
          ></div>
          <div
            className="bg-green-500 h-full"
            style={{ width: `${(occupancyData.vacant / units.length) * 100}%` }}
          ></div>
          <div
            className="bg-yellow-500 h-full"
            style={{
              width: `${(occupancyData.maintenance / units.length) * 100}%`,
            }}
          ></div>
          <div
            className="bg-purple-500 h-full"
            style={{
              width: `${(occupancyData.reserved / units.length) * 100}%`,
            }}
          ></div>
        </div>
      </div>

      <div className="flex justify-between text-xs mt-2">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
          <span>Occupied</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
          <span>Vacant</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
          <span>Maintenance</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-purple-500 rounded-full mr-1"></div>
          <span>Reserved</span>
        </div>
      </div>
    </Card>
  );
};

export default OccupancyChart;
