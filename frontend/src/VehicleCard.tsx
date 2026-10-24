import type { Vehicle } from "./types";
import { ArrowUpRight, Pencil, Plus, Trash2 } from "lucide-react";
import { CarArtwork } from "./CarArtwork";
export type CardProps = {
  vehicle: Vehicle;
  admin: boolean;
  busy: boolean;
  onPurchase: (v: Vehicle) => void;
  onEdit: (v: Vehicle) => void;
  onRestock: (v: Vehicle) => void;
  onDelete: (v: Vehicle) => void;
};
export function VehicleCard({
  vehicle: v,
  admin,
  busy,
  onPurchase,
  onEdit,
  onRestock,
  onDelete,
}: CardProps) {
  return (
    <article className="vehicle-card">
      <div className={`vehicle-art tone-${v.id % 3}`}>
        <span className="category-tag">{v.category}</span>
        <span className={`stock-tag ${v.quantity === 0 ? "sold" : ""}`}>
          {v.quantity === 0 ? "Sold out" : `${v.quantity} in stock`}
        </span>
        <CarArtwork category={v.category} index={v.id - 1} />
        <span className="illustration-note">Illustrative vehicle</span>
      </div>
      <div className="p-5">
        <p className="make">{v.make}</p>
        <h3>{v.model}</h3>
        <div className="price-row">
          <p>
            <span className="price-label">Asking price</span>
            <strong>
              {new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 2,
              }).format(Number(v.price))}
            </strong>
          </p>
          <span className="vehicle-number">
            #{String(v.id).padStart(3, "0")}
          </span>
        </div>
        <button
          className="purchase-button"
          disabled={busy || v.quantity === 0}
          onClick={() => onPurchase(v)}
        >
          {busy
            ? "Processing…"
            : v.quantity === 0
              ? "Out of stock"
              : "Purchase vehicle"}
          <ArrowUpRight size={17} aria-hidden />
        </button>
        {admin && (
          <div className="admin-actions">
            <button disabled={busy} onClick={() => onEdit(v)}>
              <Pencil size={13} aria-hidden />
              Edit
            </button>
            <button disabled={busy} onClick={() => onRestock(v)}>
              <Plus size={14} aria-hidden />
              Restock
            </button>
            <button
              disabled={busy}
              className="delete-action"
              onClick={() => onDelete(v)}
            >
              <Trash2 size={13} aria-hidden />
              Delete
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
