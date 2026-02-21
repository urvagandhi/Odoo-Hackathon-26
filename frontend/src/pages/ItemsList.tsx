/**
 * Items list page — displays all items with delete capability.
 */
import { Link } from "react-router-dom";
import ItemCard from "../components/ItemCard";
import LoadingSpinner from "../components/LoadingSpinner";
import { useItems } from "../hooks/useItems";

export default function ItemsList() {
  const { items, loading, error, deleteItem } = useItems();

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteItem(id);
      } catch {
        alert('Failed to delete item.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Items</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your items collection</p>
        </div>
        <Link
          to="/items/new"
          className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + New Item
        </Link>
      </div>

      {/* Content */}
      {loading && <LoadingSpinner message="Loading items..." />}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">📭</p>
          <p className="text-slate-500">No items yet. Create your first one!</p>
          <Link
            to="/items/new"
            className="inline-block mt-4 px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Create Item
          </Link>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="grid gap-4">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
