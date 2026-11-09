import type { MonthlyReportRow } from '@/services/reports/historicalReport';
import { monthLabel } from '@/services/reports/historicalReport';

type ChartMode = 'cashflow' | 'savings';

const SERIES = {
  income: { label: 'Ingresos', color: '#B7C6FA' },
  expenses: { label: 'Gastos', color: '#F4AEA7' },
  savings: { label: 'Aportes al ahorro', color: '#A6D9C7' },
} as const;

function shortAmount(value: number): string {
  if (value === 0) return '0';
  return new Intl.NumberFormat('es-CL', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function MonthlyChart({ rows, mode }: { rows: MonthlyReportRow[]; mode: ChartMode }) {
  const keys = mode === 'cashflow' ? (['income', 'expenses'] as const) : (['savings'] as const);
  const largest = Math.max(1, ...rows.flatMap((row) => keys.map((key) => row[key])));
  const plotLeft = 48;
  const groupWidth = 76;
  const graphTop = 20;
  const graphHeight = 190;
  const baseline = graphTop + graphHeight;
  const width = plotLeft + rows.length * groupWidth + 18;
  const barWidth = mode === 'cashflow' ? 19 : 30;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {keys.map((key) => (
          <span key={key} className="inline-flex items-center gap-2 text-xs font-medium text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SERIES[key].color }} />
            {SERIES[key].label}
          </span>
        ))}
      </div>
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#191c26]/80 p-3"
        role="region" aria-label={mode === 'cashflow' ? 'Gráfico de ingresos y gastos' : 'Gráfico de aportes al ahorro'} tabIndex={0}>
        <svg width={width} height={252} viewBox={'0 0 ' + width + ' 252'} role="img"
          aria-label={mode === 'cashflow'
            ? 'Barras mensuales de ingresos y gastos. Los importes exactos están en la tabla del reporte.'
            : 'Barras mensuales de aportes al ahorro. Los importes exactos están en la tabla del reporte.'}
          className="block max-w-none">
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
            const y = baseline - fraction * graphHeight;
            return (
              <g key={fraction}>
                <line x1={plotLeft} x2={width - 10} y1={y} y2={y} stroke="#596171" strokeOpacity=".28" strokeDasharray={fraction === 0 ? 'none' : '3 5'} />
                <text x={plotLeft - 8} y={y + 4} textAnchor="end" fill="#A9B1C1" fontSize="10">
                  {shortAmount(largest * fraction)}
                </text>
              </g>
            );
          })}
          {rows.map((row, index) => {
            const centerX = plotLeft + index * groupWidth + groupWidth / 2;
            const offset = mode === 'cashflow' ? barWidth / 2 + 3 : 0;
            return (
              <g key={row.month}>
                {keys.map((key, seriesIndex) => {
                  const amount = row[key];
                  const height = amount > 0 ? Math.max(2, (amount / largest) * graphHeight) : 0;
                  const x = centerX - barWidth / 2 + (mode === 'cashflow' ? (seriesIndex === 0 ? -offset : offset) : 0);
                  return (
                    <rect key={key} x={x} y={baseline - height} width={barWidth} height={height}
                      rx={4} fill={SERIES[key].color}>
                      <title>{row.month} · {SERIES[key].label}: {new Intl.NumberFormat('es-CL').format(amount)} CLP</title>
                    </rect>
                  );
                })}
                <text x={centerX} y={baseline + 22} textAnchor="middle" fill="#CFD7E5" fontSize="11">
                  {monthLabel(row.month)}
                </text>
                <text x={centerX} y={baseline + 37} textAnchor="middle" fill="#8691A6" fontSize="10">
                  {row.month.slice(0, 4)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="text-xs leading-5 text-slate-400">Desliza el gráfico horizontalmente para ver todos los meses. Los montos exactos aparecen en el detalle inferior.</p>
    </div>
  );
}
