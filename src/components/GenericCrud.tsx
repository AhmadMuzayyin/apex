'use client';

import { useState } from 'react';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface FieldDef {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'password';
  required?: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: any;
}

export interface ColumnDef {
  key: string;
  label: string;
  render?: (value: any, item: any) => React.ReactNode;
}

interface Props<T> {
  title: string;
  items: T[];
  fields: FieldDef[];
  columns: ColumnDef[];
  onAdd: (item: any) => any;
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
  backPath?: string;
  readOnly?: boolean;
  extraAction?: (item: T) => React.ReactNode;
}

export default function GenericCrud<T extends { id: string }>({
  title, items, fields, columns, onAdd, onEdit, onDelete, backPath, readOnly, extraAction
}: Props<T>) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<T | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  const openAdd = () => {
    const d: Record<string, any> = {};
    fields.forEach(f => { d[f.name] = f.defaultValue ?? (f.type === 'number' ? 0 : ''); });
    setForm(d);
    setEditItem(null);
    setDialogOpen(true);
  };

  const openEdit = (item: T) => {
    const d: Record<string, any> = {};
    fields.forEach(f => { d[f.name] = (item as any)[f.name]; });
    setForm(d);
    setEditItem(item);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editItem) {
      onEdit({ ...editItem, ...form });
    } else {
      onAdd(form);
    }
    setDialogOpen(false);
  };

  return (
    <div>
      <div className="app-topbar">
        {backPath && (
          <button onClick={() => router.push(backPath)} className="p-1">
            <ArrowLeft size={22} />
          </button>
        )}
        <h1>{title}</h1>
        <span className="ml-auto text-sm opacity-80">{items.length} data</span>
      </div>

      <div className="app-content p-4 space-y-3">
        {items.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">Belum ada data</p>
            {!readOnly && <p className="text-sm mt-1">Tap + untuk menambah</p>}
          </div>
        )}
        {items.map((item: any, idx) => (
          <div key={item.id} className="app-card animate-fade-in" style={{ animationDelay: `${idx * 30}ms` }}>
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                {columns.map((col, ci) => (
                  <div key={col.key} className={ci === 0 ? 'font-semibold text-foreground' : 'text-sm text-muted-foreground mt-0.5'}>
                    {ci > 0 && <span className="text-xs">{col.label}: </span>}
                    {col.render ? col.render(item[col.key], item) : item[col.key]}
                  </div>
                ))}
              </div>
              {!readOnly && (
                <div className="flex gap-1 ml-2 shrink-0">
                  {extraAction && extraAction(item)}
                  <button onClick={() => openEdit(item)} className="p-2 rounded-lg text-primary hover:bg-accent transition-colors">
                    <Pencil size={18} />
                  </button>
                  <button onClick={() => setDeleteId(item.id)} className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {!readOnly && (
        <button className="app-fab" onClick={openAdd}>
          <Plus size={24} />
        </button>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[90vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit' : 'Tambah'} Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {fields.map(field => (
              <div key={field.name} className="space-y-1.5">
                <Label className="text-sm font-medium">{field.label}{field.required && <span className="text-destructive"> *</span>}</Label>
                {field.type === 'select' ? (
                  <Select value={String(form[field.name] || '')} onValueChange={v => setForm({ ...form, [field.name]: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                    <SelectContent>
                      {field.options?.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    className="rounded-xl"
                    type={field.type === 'number' ? 'number' : field.type === 'password' ? 'password' : 'text'}
                    value={form[field.name] ?? ''}
                    onChange={e => setForm({ ...form, [field.name]: field.type === 'number' ? Number(e.target.value) : e.target.value })}
                  />
                )}
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setDialogOpen(false)}>Batal</Button>
              <Button className="flex-1 rounded-xl" onClick={handleSave}>Simpan</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="max-w-[85vw] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data?</AlertDialogTitle>
            <AlertDialogDescription>Data yang dihapus tidak dapat dikembalikan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl" onClick={() => { if (deleteId) onDelete(deleteId); setDeleteId(null); }}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
