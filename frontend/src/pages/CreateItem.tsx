/**
 * Create Item page.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ItemForm from "../components/ItemForm";
import { useItems } from "../hooks/useItems";
import type { ItemCreateInput } from "../validators/item";

export default function CreateItem() {
  const { createItem } = useItems();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: ItemCreateInput) => {
    setSubmitting(true);
    try {
      await createItem({
        name: data.name,
        description: data.description || null,
      });
      navigate("/items");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Create New Item</h1>
        <p className="text-sm text-slate-500 mt-1">Add a new item to your collection</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <ItemForm onSubmit={handleSubmit} loading={submitting} />
      </div>
    </div>
  );
}
