import type { Vehicle } from './types';
export type CardProps = { vehicle: Vehicle; admin: boolean; busy: boolean; onPurchase: (v: Vehicle) => void; onEdit: (v: Vehicle) => void; onRestock: (v: Vehicle) => void; onDelete: (v: Vehicle) => void };
export function VehicleCard(_props: CardProps) { return <article />; }
