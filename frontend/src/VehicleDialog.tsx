import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { Vehicle } from './types';
import { messageOf } from './api';

export type DialogState = { type: 'add' | 'edit' | 'restock' | 'delete'; vehicle?: Vehicle };
export function VehicleDialog({ state, onClose, onSubmit }: { state: DialogState; onClose: () => void; onSubmit: (data: Record<string, unknown>) => Promise<void> }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const titles = { add: 'Add a vehicle', edit: 'Edit vehicle', restock: 'Restock vehicle', delete: 'Delete vehicle?' };
  useEffect(() => { ref.current?.showModal(); }, []);
  const v = state.vehicle;
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError('');
    const data: Record<string, unknown> = Object.fromEntries(new FormData(e.currentTarget));
    if ('quantity' in data) data.quantity = Number(data.quantity);
    try { await onSubmit(data); onClose(); } catch (error) { setError(messageOf(error)); } finally { setBusy(false); }
  }
  return <dialog ref={ref} onCancel={e => { e.preventDefault(); if (!busy) onClose(); }} className="vehicle-dialog">
    <div className="dialog-header"><div><p className="eyebrow">INVENTORY MANAGEMENT</p><h2>{titles[state.type]}</h2></div><button className="icon-button" aria-label="Close dialog" disabled={busy} onClick={onClose}><X size={20} /></button></div>
    <form onSubmit={submit} className="space-y-5">
      {(state.type === 'add' || state.type === 'edit') && <>
        <div className="grid grid-cols-2 gap-4"><label>Make<input name="make" defaultValue={v?.make} required maxLength={80} placeholder="Toyota" disabled={busy} /></label><label>Model<input name="model" defaultValue={v?.model} required maxLength={80} placeholder="Camry" disabled={busy} /></label></div>
        <label>Category<input name="category" list="categories" defaultValue={v?.category || 'Sedan'} required maxLength={80} disabled={busy} /><datalist id="categories"><option>Sedan</option><option>SUV</option><option>Electric</option><option>Hatchback</option><option>Truck</option><option>Coupe</option></datalist></label>
        <label>Price (₹)<input name="price" type="number" min="0" max="999999999" step="0.01" defaultValue={v?.price} required disabled={busy} /></label>
      </>}
      {(state.type === 'add' || state.type === 'restock') && <label>{state.type === 'restock' ? 'Units to add' : 'Initial quantity'}<input name="quantity" type="number" min={state.type === 'restock' ? 1 : 0} max="1000000" step="1" defaultValue={state.type === 'restock' ? 1 : 0} required disabled={busy} /></label>}
      {state.type === 'edit' && <p className="muted text-sm">Stock is managed separately through purchases and restocking.</p>}
      {state.type === 'restock' && <p className="muted">{v?.make} {v?.model} · Currently {v?.quantity} in stock</p>}
      {state.type === 'delete' && <p className="muted">Remove <strong>{v?.make} {v?.model}</strong> from the inventory? This cannot be undone.</p>}
      {error && <p className="error" role="alert">{error}</p>}
      <div className="flex justify-end gap-3 pt-3"><button type="button" className="secondary" onClick={onClose} disabled={busy}>Cancel</button><button className={state.type === 'delete' ? 'danger' : 'primary'} disabled={busy}>{busy ? 'Saving…' : state.type === 'delete' ? 'Delete vehicle' : state.type === 'restock' ? 'Add stock' : 'Save vehicle'}</button></div>
    </form>
  </dialog>;
}
