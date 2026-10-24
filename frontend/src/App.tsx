import { useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, CarFront, CircleCheck, LayoutGrid, LogOut, Plus, Search, SlidersHorizontal, Package, ShieldCheck } from 'lucide-react';
import { AuthScreen, Brand } from './AuthScreen';
import { ApiError, messageOf, request } from './api';
import { VehicleCard } from './VehicleCard';
import { CarArtwork } from './CarArtwork';
import { VehicleDialog, type DialogState } from './VehicleDialog';
import type { Filters, Session, Vehicle } from './types';

const emptyFilters: Filters = { make: '', model: '', category: '', min_price: '', max_price: '' };

function Inventory({ session, logout }: { session: Session; logout: (notice?: string) => void }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [draft, setDraft] = useState(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState<number | null>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const admin = session.user.role === 'admin';
  const token = session.access_token;
  const handleError = useCallback((e: unknown) => {
    if (e instanceof ApiError && e.status === 401) logout('Your session expired. Please sign in again.');
    else setError(messageOf(e));
  }, [logout]);
  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setError('');
    const query = new URLSearchParams(Object.entries(filters).filter(([, v]) => v !== '')).toString();
    try { const result = await request<Vehicle[]>(`/vehicles/search?${query}`, token, { signal }); if (!signal?.aborted) setVehicles(result); }
    catch (e) { if (!signal?.aborted) handleError(e); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [filters, token, handleError]);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);
  async function purchase(v: Vehicle) {
    if (busy !== null) return;
    setBusy(v.id); setNotice('');
    try { await request(`/vehicles/${v.id}/purchase`, token, { method: 'POST' }); setNotice(`${v.make} ${v.model} purchased. One unit removed from stock.`); await load(); }
    catch (e) { await load(); handleError(e); } finally { setBusy(null); }
  }
  async function save(data: Record<string, unknown>) {
    if (!dialog) return;
    const { type, vehicle } = dialog;
    const path = type === 'add' ? '/vehicles' : `/vehicles/${vehicle?.id}${type === 'restock' ? '/restock' : ''}`;
    try { await request(path, token, { method: type === 'delete' ? 'DELETE' : type === 'edit' ? 'PUT' : 'POST', ...(type !== 'delete' ? { body: JSON.stringify(data) } : {}) }); }
    catch (e) { if (e instanceof ApiError && e.status === 401) handleError(e); throw e; }
    setNotice(type === 'delete' ? 'Vehicle deleted.' : type === 'restock' ? 'Stock updated.' : 'Vehicle saved.'); await load();
  }
  const totalStock = vehicles.reduce((sum, v) => sum + v.quantity, 0);
  const activeFilters = Object.values(filters).some(Boolean);
  return <div className="app-shell">
    <aside className="sidebar"><Brand /><div className="sidebar-caption">WORKSPACE</div><div className="nav-active"><LayoutGrid size={19} />The showroom<span>{vehicles.length}</span></div><div className="sidebar-note"><CarFront size={26} /><p>A great drive.<br />A fresh perspective.</p><span>Explore the Apex collection.</span></div><div className="sidebar-account"><div className="avatar">{session.user.email.slice(0, 1).toUpperCase()}</div><div className="account-copy"><strong>{admin ? 'Administrator' : 'Member'}</strong><span title={session.user.email}>{session.user.email}</span></div><button title="Sign out" aria-label="Sign out" onClick={() => logout()}><LogOut size={17} /></button></div></aside>
    <main className="main-content"><header className="topbar"><p>Showroom <span>/</span> <strong>Inventory</strong></p><div className="role-indicator"><span />{admin ? 'Admin workspace' : 'Member workspace'}</div></header>
      <div className="page-content"><section className="hero"><div className="hero-copy"><p className="eyebrow">THE APEX COLLECTION</p><h1>Find your<br />next chapter<span>.</span></h1><p>Explore the possibilities.<br />Make your next drive a great one.</p><a href="#inventory">Explore inventory <ArrowUpRight size={16} /></a></div><div className="hero-visual"><div className="hero-ring" /><p>MADE FOR THE ROAD AHEAD</p><CarArtwork category="SUV" hero /><span>Considered choices. Confident journeys.</span></div></section>
        <section className="stats-grid" aria-label="Inventory summary"><div><span className="stat-icon"><CarFront size={21} /></span><p><span>Vehicle listings{activeFilters ? ' · filtered' : ''}</span><strong>{String(vehicles.length).padStart(2, '0')}</strong></p></div><div><span className="stat-icon"><Package size={21} /></span><p><span>Units available{activeFilters ? ' · filtered' : ''}</span><strong>{String(totalStock).padStart(2, '0')}</strong></p></div><div><span className="stat-icon"><ShieldCheck size={21} /></span><p><span>Categories{activeFilters ? ' · filtered' : ''}</span><strong>{String(new Set(vehicles.map(v => v.category.toLowerCase())).size).padStart(2, '0')}</strong></p></div></section>
        <section id="inventory"><div className="section-heading"><div><p className="eyebrow">EXPLORE THE COLLECTION</p><h2>Vehicle inventory<span>{vehicles.length}</span></h2></div>{admin && <button className="primary" onClick={() => setDialog({ type: 'add' })}><Plus size={17} />Add vehicle</button>}</div>
          <form className="filter-panel" onSubmit={e => { e.preventDefault(); setFilters({ ...draft }); }}>
            <div className="filter-title"><SlidersHorizontal size={17} /> Refine your search</div><div className="filter-fields">
              <label>Make<input placeholder="Any make" value={draft.make} onChange={e => setDraft({ ...draft, make: e.target.value })} /></label>
              <label>Model<input placeholder="Any model" value={draft.model} onChange={e => setDraft({ ...draft, model: e.target.value })} /></label>
              <label>Category<input placeholder="Any category" value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })} /></label>
              <label>Min price (₹)<input type="number" min="0" step="0.01" placeholder="No minimum" value={draft.min_price} onChange={e => setDraft({ ...draft, min_price: e.target.value })} /></label>
              <label>Max price (₹)<input type="number" min="0" step="0.01" placeholder="No maximum" value={draft.max_price} onChange={e => setDraft({ ...draft, max_price: e.target.value })} /></label>
              <button className="primary" aria-label="Apply filters"><Search size={18} /><span>Search</span></button>
            </div>
          </form>
          <div className="collection-toolbar"><div className="category-tabs">{['All vehicles', 'Sedan', 'SUV', 'Electric'].map(label => <button key={label} aria-pressed={label === 'All vehicles' ? !filters.category : filters.category === label} onClick={() => { const next = { ...filters, category: label === 'All vehicles' ? '' : label }; setFilters(next); setDraft(next); }}>{label}</button>)}</div><button className="reset-button" disabled={!activeFilters && !Object.values(draft).some(Boolean)} onClick={() => { setFilters(emptyFilters); setDraft(emptyFilters); }}>Reset filters</button></div>
          {notice && <div className="notice" role="status"><CircleCheck size={18} />{notice}<button aria-label="Dismiss notification" onClick={() => setNotice('')}>×</button></div>}
          {error && <div className="error" role="alert">{error}<button onClick={() => void load()}>Retry</button></div>}
          {loading ? <div className="loading-state" role="status">Loading the collection…</div> : vehicles.length === 0 ? <div className="empty-state"><Search size={32} /><h3>No vehicles found</h3><p>Try a different make, category, or price range.</p></div> : <div className="vehicle-grid">{vehicles.map(v => <VehicleCard key={v.id} vehicle={v} admin={admin} busy={busy !== null} onPurchase={purchase} onEdit={vehicle => setDialog({ type: 'edit', vehicle })} onRestock={vehicle => setDialog({ type: 'restock', vehicle })} onDelete={vehicle => setDialog({ type: 'delete', vehicle })} />)}</div>}
        </section><footer className="page-footer"><span>APEX MOTORS <span>·</span> A better way forward.</span><span>Inventory demo · No payments collected</span></footer>
      </div></main>
    {dialog && <VehicleDialog state={dialog} onClose={() => setDialog(null)} onSubmit={save} />}
  </div>;
}

export default function App() {
  // Memory-only tokens limit persistence; refreshing intentionally requires sign-in.
  const [session, setSession] = useState<Session | null>(null);
  const [notice, setNotice] = useState('');
  const logout = useCallback((message = '') => { setSession(null); setNotice(message); }, []);
  return session ? <Inventory session={session} logout={logout} /> : <AuthScreen onLogin={setSession} notice={notice} />;
}
