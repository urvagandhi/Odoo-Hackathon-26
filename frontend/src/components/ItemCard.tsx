/**
 * Card component for displaying a single item.
 */
import type { ItemResponse } from "../api/client";

interface ItemCardProps {
  item: ItemResponse;
  onDelete: (id: number) => void;
}

export default function ItemCard({ item, onDelete }: ItemCardProps) {
  const formattedDate = new Date(item.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-slate-900 truncate">{item.name}</h3>
          <p className="mt-1 text-slate-500 text-sm line-clamp-2">
            {item.description || 'No description provided.'}
          </p>
          <p className="mt-3 text-xs text-slate-400">Created {formattedDate}</p>
        </div>
        <button
          onClick={() => onDelete(item.id)}
          className="shrink-0 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
