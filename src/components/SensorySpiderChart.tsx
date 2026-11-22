import React from 'react';
import { TasteProfile } from '../types/espresso';

interface SensorySpiderChartProps {
  profile: TasteProfile;
  size?: number;
  showLabels?: boolean;
}

export const SensorySpiderChart: React.FC<SensorySpiderChartProps> = ({
  profile,
  size = 220,
  showLabels = true,
}) => {
  const axes = [
    { key: 'sweetness', label: 'Sweetness', value: profile.sweetness },
    { key: 'acidity', label: 'Acidity', value: profile.acidity },
    { key: 'clarity', label: 'Clarity', value: profile.clarity },
    { key: 'crema', label: 'Crema', value: profile.crema },
    { key: 'body', label: 'Body', value: profile.body },
    { key: 'bitterness', label: 'Bitterness', value: profile.bitterness },
  ];

  const center = size / 2;
  const radius = (size / 2) - (showLabels ? 28 : 10);
  const totalAxes = axes.length;
  const angleStep = (Math.PI * 2) / totalAxes;

  // Grid levels (1 to 5)
  const levels = [1, 2, 3, 4, 5];

  const getCoordinates = (value: number, index: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const distance = (value / 5) * radius;
    return {
      x: center + distance * Math.cos(angle),
      y: center + distance * Math.sin(angle),
    };
  };

  // Generate polygon points for data
  const dataPoints = axes.map((axis, i) => getCoordinates(axis.value, i));
  const dataPolygonString = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <svg width={size} height={size} className="overflow-visible">
        {/* Concentric grid polygons */}
        {levels.map((level) => {
          const points = axes.map((_, i) => getCoordinates(level, i));
          const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(' ');
          return (
            <polygon
              key={level}
              points={polygonPoints}
              fill="none"
              stroke="#334155"
              strokeWidth={level === 5 ? '1.5' : '1'}
              strokeDasharray={level < 5 ? '2,2' : undefined}
              opacity={level === 5 ? 0.8 : 0.4}
            />
          );
        })}

        {/* Axis radial spokes */}
        {axes.map((_, i) => {
          const end = getCoordinates(5, i);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={end.x}
              y2={end.y}
              stroke="#334155"
              strokeWidth="1"
              opacity={0.6}
            />
          );
        })}

        {/* Sensory Data Polygon Area */}
        <polygon
          points={dataPolygonString}
          fill="rgba(245, 158, 11, 0.22)"
          stroke="#f59e0b"
          strokeWidth="2"
        />

        {/* Data vertex dots */}
        {dataPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="#fbbf24"
            stroke="#1e293b"
            strokeWidth="1.5"
          />
        ))}

        {/* Axis Labels */}
        {showLabels &&
          axes.map((axis, i) => {
            const labelCoord = getCoordinates(5.8, i);
            let textAnchor: 'middle' | 'start' | 'end' = 'middle';
            if (labelCoord.x > center + 10) textAnchor = 'start';
            else if (labelCoord.x < center - 10) textAnchor = 'end';

            return (
              <text
                key={i}
                x={labelCoord.x}
                y={labelCoord.y + 3}
                textAnchor={textAnchor}
                className="text-[10px] font-mono fill-slate-400 font-medium tracking-tight"
              >
                {axis.label}
              </text>
            );
          })}
      </svg>
    </div>
  );
};
