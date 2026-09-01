import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Edit2,
  Trash2,
  Save,
  X,
  Loader2,
  Upload,
  Plus,
  FolderOpen,
  Tag,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronRight,
  Layers,
  List,
  Navigation,
  ArrowUp,
  ArrowDown,
  Monitor,
  Eye,
  EyeOff,
  GripVertical,
  Check,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase, uploadFile } from '../../lib/supabase';
import { ADMIN_IMAGE_GUIDES, formatImageGuideHint, validateImageAgainstGuide } from '../../utils/adminImageGuides';
import { optimizeImageByGuide } from '../../utils/imageOptimization';
import { invalidateCategoryCache } from '../../services/categoryCache';

// ── Types ──────────────────────────────────────────────────────────────────

interface DbCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  logo_url: string | null;
  description: string | null;
  is_active: boolean;
  parent_id: string | null;
  show_in_header: boolean;
  header_sort_order: number;
  sidebar_order: number;
}

interface EmptyForm {
  name: string;
  icon: string;
  logo_url: string;
  description: string;
  is_active: boolean;
  editingId: string | null;
  parentId: string | null;
}

const BLANK: EmptyForm = {
  name: '',
  icon: 'Package',
  logo_url: '',
  description: '',
  is_active: true,
  editingId: null,
  parentId: null,
};

const slugify = (v: string) =>
  v.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

// ── Shared Form Component ──────────────────────────────────────────────────

interface CategoryFormProps {
  form: EmptyForm;
  setForm: React.Dispatch<React.SetStateAction<EmptyForm>>;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  uploading: boolean;
  onUpload: (file?: File) => void;
  title: string;
  parentLabel?: string; // e.g. "under Electronics"
  message: { type: 'success' | 'error'; text: string } | null;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  form, setForm, onSave, onCancel, saving, uploading, onUpload, title, parentLabel, message
}) => (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mt-4">
    <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
      <div>
        <h4 className="font-bold text-gray-900 text-sm">{title}</h4>
        {parentLabel && <p className="text-xs text-primary font-semibold mt-0.5">{parentLabel}</p>}
      </div>
      <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors">
        <X className="w-4 h-4 text-gray-500" />
      </button>
    </div>
    <div className="p-5 space-y-4">
      {message && (
        <div className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
          message.type === 'error'
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>{message.text}</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            autoFocus
            type="text"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && onSave()}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="e.g. Electronics"
          />
          {form.name && (
            <p className="text-[11px] text-gray-400 mt-1">Slug: /{slugify(form.name)}</p>
          )}
        </div>
        <div>
          <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
            Description
          </label>
          <input
            type="text"
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="Optional description..."
          />
        </div>
      </div>

      {/* Active toggle */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Visible to customers</span>
        <button
          type="button"
          onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
        >
          <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${form.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
        <span className={`text-xs font-bold ${form.is_active ? 'text-green-600' : 'text-gray-400'}`}>
          {form.is_active ? 'Active' : 'Hidden'}
        </span>
      </div>

      {/* Logo */}
      <div>
        <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Logo Image</label>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Upload Logo'}
            <input type="file" className="hidden" accept="image/*" disabled={uploading}
              onChange={e => onUpload(e.target.files?.[0])} />
          </label>
          {form.logo_url && (
            <>
              <img src={form.logo_url} alt="preview" className="w-10 h-10 rounded-lg border border-gray-200 object-cover" />
              <button onClick={() => setForm(p => ({ ...p, logo_url: '' }))} className="text-xs text-red-500 hover:underline font-semibold">Remove</button>
            </>
          )}
        </div>
        <p className="text-[11px] text-gray-400 mt-1">{formatImageGuideHint(ADMIN_IMAGE_GUIDES.categoryLogo)}</p>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
        <button
          onClick={onSave}
          disabled={saving || uploading || !form.name.trim()}
          className="bg-primary text-white font-bold px-5 py-2.5 rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {form.editingId ? 'Update' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          className="border border-gray-200 text-gray-700 font-bold px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <X className="w-4 h-4" />Cancel
        </button>
      </div>
    </div>
  </div>
);

// ── SortableCategoryCard (must be top-level — Rules of Hooks) ─────────────

interface SortableCategoryCardProps {
  cat: DbCategory;
  idx: number;
  isExpanded: boolean;
  isEditingThis: boolean;
  isAddingSubHere: boolean;
  children: DbCategory[];
  form: EmptyForm;
  setForm: React.Dispatch<React.SetStateAction<EmptyForm>>;
  saving: boolean;
  uploading: boolean;
  openForm: string | null;
  message: { type: 'success' | 'error'; text: string } | null;
  onToggleExpand: () => void;
  onToggleActive: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddSub: () => void;
  onCloseForm: () => void;
  onSave: (isSub: boolean) => void;
  onUpload: (file?: File) => void;
}

const SortableCategoryCard: React.FC<SortableCategoryCardProps> = ({
  cat, idx, isExpanded, isEditingThis, isAddingSubHere, children,
  form, setForm, saving, uploading, openForm, message,
  onToggleExpand, onToggleActive, onEdit, onDelete, onAddSub, onCloseForm, onSave, onUpload,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cat.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
    >
      {/* Main row */}
      <div className="flex items-center px-3 py-3.5 hover:bg-gray-50/50 group transition-colors">

        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="p-2 mr-1 cursor-grab active:cursor-grabbing rounded-lg hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0 touch-none"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Position badge */}
        <span className="text-[10px] font-black text-gray-400 bg-gray-100 rounded-md px-1.5 py-0.5 mr-2 flex-shrink-0 w-7 text-center">
          #{idx + 1}
        </span>

        {/* Expand toggle */}
        <button
          onClick={onToggleExpand}
          className="p-1 mr-1 rounded-lg hover:bg-gray-100 flex-shrink-0"
        >
          {isExpanded
            ? <ChevronDown className="w-4 h-4 text-gray-400" />
            : <ChevronRight className={`w-4 h-4 ${children.length > 0 ? 'text-gray-400' : 'text-gray-200'}`} />}
        </button>

        {/* Logo */}
        {cat.logo_url
          ? <img src={cat.logo_url} alt={cat.name} className="w-9 h-9 rounded-xl object-cover border border-gray-100 mr-3 flex-shrink-0" />
          : <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/10 to-red-100 flex items-center justify-center mr-3 flex-shrink-0">
              <FolderOpen className="w-4 h-4 text-primary/70" />
            </div>
        }

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-black text-gray-900 text-[15px]">{cat.name}</span>
            {!cat.is_active && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold uppercase">Hidden</span>}
          </div>
          <p className="text-xs text-gray-400">
            {children.length} subcategor{children.length === 1 ? 'y' : 'ies'}
            {cat.description && ` · ${cat.description}`}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          <button
            onClick={isAddingSubHere ? onCloseForm : onAddSub}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${isAddingSubHere ? 'bg-gray-200 text-gray-600' : 'text-primary bg-red-50 hover:bg-red-100'}`}
          >
            <Plus className="w-3 h-3" />
            {isAddingSubHere ? 'Cancel' : 'Add Sub'}
          </button>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onToggleActive} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              {cat.is_active ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}
            </button>
            <button onClick={isEditingThis ? onCloseForm : onEdit} className="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-red-50 transition-colors">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Main Form (inline) */}
      {isEditingThis && (
        <div className="border-t border-gray-100 p-4">
          <CategoryForm
            form={form} setForm={setForm}
            onSave={() => onSave(false)} onCancel={onCloseForm}
            saving={saving} uploading={uploading} onUpload={onUpload}
            title={`Edit: ${cat.name}`}
            message={message}
          />
        </div>
      )}

      {/* Subcategories list */}
      {isExpanded && children.length > 0 && (
        <div className="border-t border-gray-100 bg-gray-50/40 px-3 py-2 space-y-0.5">
          {children.map(sub => (
            <SubcategoryRow key={sub.id} cat={sub} />
          ))}
        </div>
      )}

      {/* Add Sub Form (inline under parent) */}
      {isAddingSubHere && (
        <div className="border-t border-gray-100 p-4">
          <CategoryForm
            form={form} setForm={setForm}
            onSave={() => onSave(true)} onCancel={onCloseForm}
            saving={saving} uploading={uploading} onUpload={onUpload}
            title="Add Subcategory"
            parentLabel={`Under: ${cat.name}`}
            message={message}
          />
        </div>
      )}
    </div>
  );
};

// ── SubcategoryRow (simple row for subcats inside a main card) ────────────
// Note: this is a static display row; sub editing is handled by the SubcategoryRow below
const SubcategoryRow: React.FC<{ cat: DbCategory }> = ({ cat }) => (
  <div className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-gray-100/60 transition-colors">
    {cat.logo_url
      ? <img src={cat.logo_url} alt={cat.name} className="w-7 h-7 rounded-lg object-cover border border-gray-100 flex-shrink-0" />
      : <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
          <Tag className="w-3.5 h-3.5 text-gray-400" />
        </div>
    }
    <span className="text-sm font-bold text-gray-700 truncate">{cat.name}</span>
    {!cat.is_active && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold uppercase ml-auto flex-shrink-0">Hidden</span>}
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────

const CategoryManager: React.FC = () => {
  const [allCats, setAllCats] = useState<DbCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Which form is open — 'main-add', 'main-edit:{id}', 'sub-add:{parentId}', 'sub-add-new', 'sub-edit:{id}'
  const [openForm, setOpenForm] = useState<string | null>(null);
  const [form, setForm] = useState<EmptyForm>(BLANK);

  // Expand/collapse subcats in main section
  const [expandedMains, setExpandedMains] = useState<Set<string>>(new Set());

  const formRef = useRef<HTMLDivElement>(null);

  // ── helpers ──

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    if (type === 'success') setTimeout(() => setMessage(null), 3000);
  };

  const friendlyErr = (msg: string) => {
    if (msg.includes('sort_order')) return 'Migration needed: Run supabase/subcategory_migration.sql in Supabase SQL Editor.';
    if (msg.includes('parent_id')) return 'Migration needed: Run supabase/subcategory_migration.sql in Supabase SQL Editor.';
    if (msg.includes('duplicate key')) return 'A category with this name already exists.';
    return msg;
  };

  const scrollToForm = () => setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);

  // ── fetch ──

  const fetchCats = async () => {
    setLoading(true);
    // NOTE: order by name only — sort_order column may not exist yet
    const { data, error } = await supabase
      .from('categories')
      .select('id,name,slug,icon,logo_url,description,is_active,parent_id,show_in_header,header_sort_order,sidebar_order')
      .order('sidebar_order', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true });

    if (error) {
      showMsg('error', friendlyErr(error.message));
    } else {
      const cats = (data as unknown as DbCategory[]) || [];
      setAllCats(cats);
      // Auto-expand mains that have children
      const parentIds = new Set(cats.filter(c => c.parent_id).map(c => c.parent_id as string));
      setExpandedMains(parentIds);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCats(); }, []);

  // ── derived ──

  const mainCats = allCats.filter(c => !c.parent_id);
  const subCats = allCats.filter(c => !!c.parent_id);
  const getChildren = (parentId: string) => subCats.filter(c => c.parent_id === parentId);
  const getParentName = (parentId: string | null) => allCats.find(c => c.id === parentId)?.name || '—';

  /** Ordered list of main cats for DnD (local state, not persisted until saved) */
  const [orderedMains, setOrderedMains] = useState<DbCategory[]>([]);
  const [isDirty, setIsDirty] = useState(false); // has unsaved order change
  const [savingOrder, setSavingOrder] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // Keep orderedMains in sync with allCats (only when not dirty)
  useEffect(() => {
    const mains = allCats.filter(c => !c.parent_id);
    setOrderedMains(mains);
  }, [allCats]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrderedMains(prev => {
      const oldIdx = prev.findIndex(c => c.id === active.id);
      const newIdx = prev.findIndex(c => c.id === over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });
    setIsDirty(true);
  }, []);

  /** Bulk upsert sidebar_order 1,2,3... to Supabase */
  const saveSidebarOrder = async () => {
    setSavingOrder(true);
    const updates = orderedMains.map((cat, idx) => ({
      id: cat.id,
      sidebar_order: idx + 1,
    }));
    // Run updates in parallel (Supabase doesn't support bulk update by id easily, so we use Promise.all)
    const results = await Promise.all(
      updates.map(u => supabase.from('categories').update({ sidebar_order: u.sidebar_order }).eq('id', u.id))
    );
    const err = results.find(r => r.error)?.error;
    if (err) {
      showMsg('error', err.message.includes('sidebar_order')
        ? 'Run this SQL first: ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS sidebar_order INTEGER;'
        : err.message);
    } else {
      showMsg('success', 'Order saved! Categories reordered successfully.');
      setIsDirty(false);
      invalidateCategoryCache();
      window.dispatchEvent(new Event('categories-updated'));
      fetchCats();
    }
    setSavingOrder(false);
  };


  const openMainAdd = () => {
    setForm({ ...BLANK });
    setOpenForm('main-add');
    scrollToForm();
  };
  const openMainEdit = (cat: DbCategory) => {
    setForm({ name: cat.name, icon: cat.icon || 'Package', logo_url: cat.logo_url || '', description: cat.description || '', is_active: cat.is_active, editingId: cat.id, parentId: null });
    setOpenForm(`main-edit:${cat.id}`);
    scrollToForm();
  };
  const openSubAddUnder = (parentId: string) => {
    setForm({ ...BLANK, parentId });
    setOpenForm(`sub-add:${parentId}`);
    setExpandedMains(p => new Set([...p, parentId]));
    scrollToForm();
  };
  const openSubAddNew = () => {
    setForm({ ...BLANK, parentId: mainCats[0]?.id || null });
    setOpenForm('sub-add-new');
    scrollToForm();
  };
  const openSubEdit = (cat: DbCategory) => {
    setForm({ name: cat.name, icon: cat.icon || 'Package', logo_url: cat.logo_url || '', description: cat.description || '', is_active: cat.is_active, editingId: cat.id, parentId: cat.parent_id });
    setOpenForm(`sub-edit:${cat.id}`);
    scrollToForm();
  };
  const closeForm = () => { setOpenForm(null); setForm(BLANK); setMessage(null); };

  // ── CRUD ──

  const handleSave = async (isSubcategory: boolean) => {
    setMessage(null);
    if (!form.name.trim()) { showMsg('error', 'Name is required.'); return; }
    if (isSubcategory && !form.parentId) { showMsg('error', 'Please select a parent category.'); return; }

    setSaving(true);
    const payload: any = {
      name: form.name.trim(),
      slug: slugify(form.name),
      icon: form.icon || 'Package',
      logo_url: form.logo_url || null,
      description: form.description || null,
      is_active: form.is_active,
      parent_id: isSubcategory ? form.parentId : null,
    };

    let error;
    if (form.editingId) {
      ({ error } = await supabase.from('categories').update(payload).eq('id', form.editingId));
    } else {
      ({ error } = await supabase.from('categories').insert(payload));
    }
    setSaving(false);
    if (error) { showMsg('error', friendlyErr(error.message)); return; }

    showMsg('success', form.editingId ? 'Updated successfully.' : 'Added successfully.');
    closeForm();
    invalidateCategoryCache();
    window.dispatchEvent(new Event('categories-updated'));
    fetchCats();
  };

  const handleDelete = async (cat: DbCategory) => {
    const children = getChildren(cat.id);
    const msg = children.length > 0
      ? `"${cat.name}" has ${children.length} subcategor${children.length > 1 ? 'ies' : 'y'}. Deleting it will remove all subcategories too. Continue?`
      : `Delete "${cat.name}"?`;
    if (!window.confirm(msg)) return;
    const { error } = await supabase.from('categories').delete().eq('id', cat.id);
    if (error) showMsg('error', friendlyErr(error.message));
    else { showMsg('success', 'Deleted.'); invalidateCategoryCache(); window.dispatchEvent(new Event('categories-updated')); fetchCats(); }
  };

  const handleToggleActive = async (cat: DbCategory) => {
    await supabase.from('categories').update({ is_active: !cat.is_active }).eq('id', cat.id);
    invalidateCategoryCache();
    window.dispatchEvent(new Event('categories-updated'));
    fetchCats();
  };

  const handleUpload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const validation = await validateImageAgainstGuide(file, ADMIN_IMAGE_GUIDES.categoryLogo);
      if (validation.shouldBlock) { showMsg('error', validation.message); return; }
      const optimized = await optimizeImageByGuide(file, ADMIN_IMAGE_GUIDES.categoryLogo, { fileNamePrefix: 'category-logo' });
      const { publicUrl } = await uploadFile('assets', `categories/${optimized.file.name}`, optimized.file, { upsert: false });
      setForm(p => ({ ...p, logo_url: publicUrl }));
    } catch (e: any) { showMsg('error', e?.message || 'Upload failed'); }
    finally { setUploading(false); }
  };

  // ── Category row (reusable) ──

  const CategoryRow = ({ cat, isSubcat }: { cat: DbCategory; isSubcat?: boolean }) => (
    <div className={`flex items-center justify-between py-2.5 px-4 rounded-xl hover:bg-gray-50 transition-colors group ${isSubcat ? 'pl-10' : ''}`}>
      <div className="flex items-center gap-3 min-w-0">
        {cat.logo_url
          ? <img src={cat.logo_url} alt={cat.name} className="w-8 h-8 rounded-lg object-cover border border-gray-100 flex-shrink-0" />
          : <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isSubcat ? 'bg-gray-100' : 'bg-gradient-to-br from-primary/10 to-red-100'}`}>
              {isSubcat ? <Tag className="w-4 h-4 text-gray-400" /> : <FolderOpen className="w-4 h-4 text-primary/70" />}
            </div>
        }
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-bold text-gray-900 truncate ${isSubcat ? 'text-sm' : 'text-[15px]'}`}>{cat.name}</span>
            {!cat.is_active && (
              <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold uppercase flex-shrink-0">Hidden</span>
            )}
          </div>
          {cat.description && <p className="text-xs text-gray-400 truncate">{cat.description}</p>}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
        <button onClick={() => handleToggleActive(cat)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title={cat.is_active ? 'Hide' : 'Show'}>
          {cat.is_active ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}
        </button>
        <button onClick={() => isSubcat ? openSubEdit(cat) : openMainEdit(cat)} className="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-red-50 transition-colors">
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => handleDelete(cat)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  // ── Render ──

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-gray-500">Loading categories...</p>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500 space-y-8" ref={formRef}>

      {/* ── Global message ── */}
      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {message.text}
        </div>
      )}

      {/* ════════════════════════════════════════════
           SECTION 1 — MAIN CATEGORIES (Drag & Drop)
         ════════════════════════════════════════════ */}
      <section>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Layers className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900">Main Categories</h2>
              <p className="text-xs text-gray-500">
                {orderedMains.length} categories
                {isDirty && <span className="ml-2 text-amber-600 font-bold">· Unsaved order changes</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Save Order button — only visible when dragged */}
            {isDirty && (
              <button
                onClick={saveSidebarOrder}
                disabled={savingOrder}
                className="inline-flex items-center gap-2 bg-green-600 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-green-700 transition-colors text-sm shadow-sm disabled:opacity-60"
              >
                {savingOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {savingOrder ? 'Saving...' : 'Save Order'}
              </button>
            )}
            <button
              onClick={openForm === 'main-add' ? closeForm : openMainAdd}
              className="inline-flex items-center gap-2 bg-primary text-white font-bold px-4 py-2.5 rounded-xl hover:bg-red-700 transition-colors text-sm shadow-sm"
            >
              {openForm === 'main-add' ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {openForm === 'main-add' ? 'Cancel' : 'Add Category'}
            </button>
          </div>
        </div>

        {/* Drag hint */}
        {orderedMains.length > 1 && (
          <p className="text-[11px] text-gray-400 mb-3 flex items-center gap-1.5">
            <GripVertical className="w-3.5 h-3.5" />
            Drag the handle to reorder, then click Save Order
          </p>
        )}

        {/* Add Main Form */}
        {openForm === 'main-add' && (
          <CategoryForm
            form={form} setForm={setForm}
            onSave={() => handleSave(false)} onCancel={closeForm}
            saving={saving} uploading={uploading} onUpload={handleUpload}
            title="Add New Main Category"
            message={message}
          />
        )}

        {/* DnD Category List */}
        {orderedMains.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 py-12 flex flex-col items-center gap-3 text-center">
            <FolderOpen className="w-10 h-10 text-gray-300" />
            <p className="font-bold text-gray-500">No main categories yet</p>
            <button onClick={openMainAdd} className="text-sm text-primary font-bold hover:underline">+ Add your first category</button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={orderedMains.map(c => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {orderedMains.map((cat, idx) => {
                  const children = getChildren(cat.id);
                  const isExpanded = expandedMains.has(cat.id);
                  const isEditingThis = openForm === `main-edit:${cat.id}`;
                  const isAddingSubHere = openForm === `sub-add:${cat.id}`;

                  return (
                    <SortableCategoryCard
                      key={cat.id}
                      cat={cat}
                      idx={idx}
                      isExpanded={isExpanded}
                      isEditingThis={isEditingThis}
                      isAddingSubHere={isAddingSubHere}
                      children={children}
                      form={form}
                      setForm={setForm}
                      saving={saving}
                      uploading={uploading}
                      openForm={openForm}
                      message={message}
                      onToggleExpand={() => setExpandedMains(p => { const n = new Set(p); n.has(cat.id) ? n.delete(cat.id) : n.add(cat.id); return n; })}
                      onToggleActive={() => handleToggleActive(cat)}
                      onEdit={() => openMainEdit(cat)}
                      onDelete={() => handleDelete(cat)}
                      onAddSub={() => openSubAddUnder(cat.id)}
                      onCloseForm={closeForm}
                      onSave={handleSave}
                      onUpload={handleUpload}
                    />
                  );
                })}
              </div>
            </SortableContext>

            {/* Drag overlay — floating ghost card while dragging */}
            <DragOverlay
              dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({
                  styles: { active: { opacity: '0.4' } },
                }),
              }}
            >
              {activeDragId ? (() => {
                const cat = orderedMains.find(c => c.id === activeDragId);
                if (!cat) return null;
                return (
                  <div className="bg-white rounded-2xl border-2 border-primary shadow-2xl px-4 py-3.5 flex items-center gap-3 opacity-95">
                    <GripVertical className="w-4 h-4 text-primary" />
                    {cat.logo_url
                      ? <img src={cat.logo_url} alt={cat.name} className="w-9 h-9 rounded-xl object-cover border border-gray-100 flex-shrink-0" />
                      : <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/10 to-red-100 flex items-center justify-center flex-shrink-0">
                          <FolderOpen className="w-4 h-4 text-primary/70" />
                        </div>
                    }
                    <span className="font-black text-gray-900">{cat.name}</span>
                  </div>
                );
              })() : null}
            </DragOverlay>
          </DndContext>
        )}
      </section>

      {/* Divider */}
      <div className="border-t-2 border-dashed border-gray-200" />

      {/* ════════════════════════════════════════════
           SECTION 2 — SUBCATEGORIES
         ════════════════════════════════════════════ */}
      <section>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <List className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900">Subcategories</h2>
              <p className="text-xs text-gray-500">{subCats.length} subcategories across {mainCats.length} categories</p>
            </div>
          </div>
          {mainCats.length > 0 && (
            <button
              onClick={openForm === 'sub-add-new' ? closeForm : openSubAddNew}
              className="inline-flex items-center gap-2 bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-blue-600 transition-colors text-sm shadow-sm"
            >
              {openForm === 'sub-add-new' ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {openForm === 'sub-add-new' ? 'Cancel' : 'Add Subcategory'}
            </button>
          )}
        </div>

        {/* Add Subcategory Form (standalone — with parent selector) */}
        {openForm === 'sub-add-new' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-4">
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <h4 className="font-bold text-gray-900 text-sm">Add New Subcategory</h4>
              <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-5">
              {/* Parent category selector */}
              <div className="mb-4">
                <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                  Parent Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.parentId || ''}
                  onChange={e => setForm(p => ({ ...p, parentId: e.target.value || null }))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                >
                  <option value="">Select main category...</option>
                  {mainCats.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <CategoryForm
                form={form} setForm={setForm}
                onSave={() => handleSave(true)} onCancel={closeForm}
                saving={saving} uploading={uploading} onUpload={handleUpload}
                title=""
                message={message}
              />
            </div>
          </div>
        )}

        {/* Edit Sub Form */}
        {openForm?.startsWith('sub-edit:') && (() => {
          const editId = openForm.replace('sub-edit:', '');
          const editCat = allCats.find(c => c.id === editId);
          if (!editCat) return null;
          return (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-4">
              <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <h4 className="font-bold text-gray-900 text-sm">Edit Subcategory: {editCat.name}</h4>
                <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-gray-200"><X className="w-4 h-4 text-gray-500" /></button>
              </div>
              <div className="p-5">
                {/* Parent selector for edit */}
                <div className="mb-4">
                  <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                    Parent Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.parentId || ''}
                    onChange={e => setForm(p => ({ ...p, parentId: e.target.value || null }))}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                  >
                    <option value="">Select main category...</option>
                    {mainCats.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <CategoryForm
                  form={form} setForm={setForm}
                  onSave={() => handleSave(true)} onCancel={closeForm}
                  saving={saving} uploading={uploading} onUpload={handleUpload}
                  title=""
                  message={message}
                />
              </div>
            </div>
          );
        })()}

        {/* Subcategories list — grouped by parent */}
        {subCats.length === 0 && mainCats.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 py-10 flex flex-col items-center gap-2 text-center">
            <Tag className="w-8 h-8 text-gray-300" />
            <p className="font-bold text-gray-500 text-sm">Add main categories first</p>
          </div>
        )}
        {subCats.length === 0 && mainCats.length > 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 py-10 flex flex-col items-center gap-2 text-center">
            <Tag className="w-8 h-8 text-gray-300" />
            <p className="font-bold text-gray-500 text-sm">No subcategories yet</p>
            <p className="text-xs text-gray-400">Use "+ Add Sub" next to any category, or click "Add Subcategory" above</p>
          </div>
        )}

        {subCats.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100">
              {mainCats.map(parent => {
                const children = getChildren(parent.id);
                if (children.length === 0) return null;
                return (
                  <div key={parent.id}>
                    {/* Parent group header */}
                    <div className="px-5 py-2.5 bg-gray-50 flex items-center gap-2">
                      {parent.logo_url
                        ? <img src={parent.logo_url} alt={parent.name} className="w-5 h-5 rounded object-cover" />
                        : <FolderOpen className="w-4 h-4 text-primary/60" />}
                      <span className="text-xs font-black text-gray-600 uppercase tracking-wider">{parent.name}</span>
                      <span className="text-xs text-gray-400 ml-auto">{children.length} sub</span>
                    </div>
                    {/* Children rows */}
                    <div className="px-3 py-2 space-y-0.5">
                      {children.map(sub => {
                        const isEditingThis = openForm === `sub-edit:${sub.id}`;
                        return (
                          <div key={sub.id}>
                            <div className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-gray-50 transition-colors group">
                              <div className="flex items-center gap-2.5 min-w-0">
                                {sub.logo_url
                                  ? <img src={sub.logo_url} alt={sub.name} className="w-7 h-7 rounded-lg object-cover border border-gray-100 flex-shrink-0" />
                                  : <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0"><Tag className="w-3.5 h-3.5 text-gray-400" /></div>}
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm text-gray-800">{sub.name}</span>
                                    {!sub.is_active && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-bold uppercase">Hidden</span>}
                                  </div>
                                  {sub.description && <p className="text-xs text-gray-400">{sub.description}</p>}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                                <button onClick={() => handleToggleActive(sub)} className="p-1.5 rounded-lg hover:bg-gray-100">
                                  {sub.is_active ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}
                                </button>
                                <button onClick={() => isEditingThis ? closeForm() : openSubEdit(sub)} className="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-red-50">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDelete(sub)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Orphaned subcats (parent not found) */}
              {(() => {
                const orphans = subCats.filter(s => !mainCats.find(m => m.id === s.parent_id));
                if (orphans.length === 0) return null;
                return (
                  <div>
                    <div className="px-5 py-2.5 bg-yellow-50 flex items-center gap-2">
                      <span className="text-xs font-black text-yellow-700 uppercase tracking-wider">⚠ Unassigned</span>
                    </div>
                    <div className="px-3 py-2 space-y-0.5">
                      {orphans.map(sub => <CategoryRow key={sub.id} cat={sub} isSubcat />)}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Stats */}
        {allCats.length > 0 && (
          <div className="flex items-center gap-6 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-500 mt-4">
            <span><strong className="text-gray-800">{mainCats.length}</strong> main categories</span>
            <span><strong className="text-gray-800">{subCats.length}</strong> subcategories</span>
            <span><strong className="text-gray-800">{allCats.filter(c => !c.is_active).length}</strong> hidden</span>
          </div>
        )}
      </section>

      {/* Divider */}
      <div className="border-t-2 border-dashed border-gray-200" />

      {/* ════════════════════════════════════════════
           SECTION 3 — HEADER NAVIGATION
         ════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <Navigation className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900">Header Navigation</h2>
              <p className="text-xs text-gray-500">
                Header-এ কোন categories দেখাবে ও কোন order-এ — manage করুন
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-xl border border-indigo-100">
            <Monitor className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold text-indigo-600">
              {mainCats.filter(c => c.show_in_header).length} showing in header
            </span>
          </div>
        </div>

        {/* Info box */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 mb-4 flex items-start gap-3">
          <Navigation className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-indigo-700 font-medium">
            <p>Toggle করুন কোন categories header navigation-এ দেখাবে।</p>
            <p className="mt-0.5 text-indigo-500">↑↓ arrow দিয়ে order পরিবর্তন করুন। Hover করলে সেই category-র subcategories dropdown হিসেবে দেখাবে।</p>
            {!mainCats.some(c => 'show_in_header' in c) && (
              <p className="mt-1 text-amber-600 font-bold">⚠ Migration প্রয়োজন: header_nav_migration.sql Supabase SQL Editor-এ run করুন।</p>
            )}
          </div>
        </div>

        {mainCats.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 py-8 text-center text-gray-400 text-sm">
            প্রথমে Main Categories section থেকে category যোগ করুন
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <span className="text-xs font-black text-gray-500 uppercase tracking-wider">Category</span>
              <span className="text-xs font-black text-gray-500 uppercase tracking-wider">Header Order &amp; Visibility</span>
            </div>

            <div className="divide-y divide-gray-100">
              {[...mainCats]
                .sort((a, b) => {
                  // Show header cats first, sorted by header_sort_order
                  const aOrder = a.show_in_header ? (a.header_sort_order ?? 999) : 9999;
                  const bOrder = b.show_in_header ? (b.header_sort_order ?? 999) : 9999;
                  return aOrder - bOrder;
                })
                .map((cat, idx, arr) => {
                  const headerCats = arr.filter(c => c.show_in_header);
                  const headerIdx = headerCats.findIndex(c => c.id === cat.id);
                  const isFirst = headerIdx === 0;
                  const isLast = headerIdx === headerCats.length - 1;

                  const moveUp = async () => {
                    if (isFirst || !cat.show_in_header) return;
                    const prev = headerCats[headerIdx - 1];
                    await supabase.from('categories').update({ header_sort_order: cat.header_sort_order - 1 }).eq('id', cat.id);
                    await supabase.from('categories').update({ header_sort_order: prev.header_sort_order + 1 }).eq('id', prev.id);
                    invalidateCategoryCache();
                    window.dispatchEvent(new Event('header-cats-updated'));
                    window.dispatchEvent(new Event('categories-updated'));
                    fetchCats();
                  };

                  const moveDown = async () => {
                    if (isLast || !cat.show_in_header) return;
                    const next = headerCats[headerIdx + 1];
                    await supabase.from('categories').update({ header_sort_order: cat.header_sort_order + 1 }).eq('id', cat.id);
                    await supabase.from('categories').update({ header_sort_order: next.header_sort_order - 1 }).eq('id', next.id);
                    invalidateCategoryCache();
                    window.dispatchEvent(new Event('header-cats-updated'));
                    window.dispatchEvent(new Event('categories-updated'));
                    fetchCats();
                  };

                  const toggleHeader = async () => {
                    const newVal = !cat.show_in_header;
                    const newOrder = newVal ? (headerCats.length) : 999;
                    await supabase.from('categories').update({
                      show_in_header: newVal,
                      header_sort_order: newOrder,
                    } as any).eq('id', cat.id);
                    invalidateCategoryCache();
                    window.dispatchEvent(new Event('header-cats-updated'));
                    window.dispatchEvent(new Event('categories-updated'));
                    fetchCats();
                  };

                  return (
                    <div
                      key={cat.id}
                      className={`flex items-center gap-3 px-5 py-3 transition-colors ${
                        cat.show_in_header ? 'bg-indigo-50/30' : 'hover:bg-gray-50'
                      }`}
                    >
                      {/* Logo */}
                      {cat.logo_url
                        ? <img src={cat.logo_url} alt={cat.name} className="w-8 h-8 rounded-lg object-cover border border-gray-100 flex-shrink-0" />
                        : <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0"><FolderOpen className="w-4 h-4 text-gray-400" /></div>}

                      {/* Name */}
                      <span className={`flex-1 font-bold text-sm ${cat.show_in_header ? 'text-gray-900' : 'text-gray-500'}`}>
                        {cat.name}
                      </span>

                      {/* Header position badge */}
                      {cat.show_in_header && (
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-black">
                          #{headerIdx + 1}
                        </span>
                      )}

                      {/* Order controls */}
                      {cat.show_in_header && (
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={moveUp}
                            disabled={isFirst}
                            className="p-1 rounded hover:bg-indigo-100 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                            title="Move up"
                          >
                            <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                          </button>
                          <button
                            onClick={moveDown}
                            disabled={isLast}
                            className="p-1 rounded hover:bg-indigo-100 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                            title="Move down"
                          >
                            <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                          </button>
                        </div>
                      )}

                      {/* Toggle show in header */}
                      <button
                        onClick={toggleHeader}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          cat.show_in_header
                            ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={cat.show_in_header ? 'Remove from header' : 'Add to header'}
                      >
                        {cat.show_in_header
                          ? <><Eye className="w-3.5 h-3.5" /> Showing</>
                          : <><EyeOff className="w-3.5 h-3.5" /> Hidden</>}
                      </button>
                    </div>
                  );
                })}
            </div>

            {/* Preview hint */}
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
              💡 Header-এ দেখানো categories hover করলে তাদের subcategories dropdown হিসেবে দেখাবে।
              Migration SQL না চালালে শুধু toggle কাজ করবে না।
            </div>
          </div>
        )}
      </section>

    </div>
  );
};

export default CategoryManager;
