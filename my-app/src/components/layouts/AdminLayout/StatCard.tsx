import type { StatCardProps } from "../../../types";

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon }) => (
  <div className="bg-white rounded-lg p-6 border hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
        {icon}
      </div>
      <span className="text-sm text-green-600 font-medium">{change}</span>
    </div>
    <p className="text-sm text-gray-600 mb-1">{title}</p>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

export default StatCard;