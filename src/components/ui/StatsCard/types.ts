export type StatsCardVariant = 'primary' | 'secondary' | 'accent';

export interface StatsCardProps {
  title: string;
  value: number | string;
  variant?: StatsCardVariant;
  trend?: string[];
  formatValue?: (value: number | string) => string;
  children?: React.ReactNode;
  className?: string;
}
