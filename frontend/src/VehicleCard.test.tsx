import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VehicleCard } from './VehicleCard';

const vehicle = { id: 1, make: 'Toyota', model: 'Camry', category: 'Sedan', price: '3500000.50', quantity: 2 };
const props = () => ({ vehicle, admin: false, busy: false, onPurchase: vi.fn(), onEdit: vi.fn(), onRestock: vi.fn(), onDelete: vi.fn() });

describe('VehicleCard', () => {
  it('shows the vehicle and purchases it', () => {
    const p = props(); render(<VehicleCard {...p} />);
    expect(screen.getByText('Camry')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /purchase/i }));
    expect(p.onPurchase).toHaveBeenCalledWith(vehicle);
  });
  it('disables purchasing sold-out stock', () => {
    render(<VehicleCard {...props()} vehicle={{ ...vehicle, quantity: 0 }} />);
    expect(screen.getByRole('button', { name: /out of stock/i })).toBeDisabled();
  });
  it('prevents double clicks while a purchase is pending', () => {
    render(<VehicleCard {...props()} busy />);
    expect(screen.getByRole('button', { name: /processing/i })).toBeDisabled();
  });
  it('hides administration from buyers', () => {
    render(<VehicleCard {...props()} />);
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /restock/i })).not.toBeInTheDocument();
  });
  it('offers edit, restock and delete to an administrator', () => {
    const p = props(); render(<VehicleCard {...p} admin />);
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    fireEvent.click(screen.getByRole('button', { name: /restock/i }));
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(p.onEdit).toHaveBeenCalledWith(vehicle);
    expect(p.onRestock).toHaveBeenCalledWith(vehicle);
    expect(p.onDelete).toHaveBeenCalledWith(vehicle);
  });
});
