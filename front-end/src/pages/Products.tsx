import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, X, Package } from 'lucide-react'
import {
  Alert, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, IconButton, MenuItem, Paper, TextField,
} from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import PageHeader from '../components/PageHeader'
import ConfirmDialog from '../components/ConfirmDialog'
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '../hooks/useProducts'
import { useCategories } from '../hooks/useCategories'
import type {
  ProductDto, CreateProductRequest, UpdateProductRequest,
} from '../api/products/types'
import type { CategoryDto } from '../api/categories/types'
import { ValidationError } from '../api/errors'
import './Products.css'

type FormMode =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; product: ProductDto }

type FormValues = {
  name: string
  categoryId: number
  type: string
  weightValue: string  // raw input, parsed on submit
  weightUnit: 'g' | 'kg'
  mrp: string
  purchasePrice: string
  active: boolean
}

export default function Products() {
  const list = useProducts()
  const categoriesQuery = useCategories()
  const create = useCreateProduct()
  const update = useUpdateProduct()
  const remove = useDeleteProduct()

  const [formMode, setFormMode] = useState<FormMode>({ kind: 'closed' })
  const [pendingDelete, setPendingDelete] = useState<ProductDto | null>(null)

  const products = list.data ?? []
  const categories = categoriesQuery.data ?? []

  const closeForm = () => setFormMode({ kind: 'closed' })

  const handleSave = async (values: FormValues) => {
    const weightValue = values.weightValue.trim() ? Number(values.weightValue) : null
    const common = {
      name: values.name,
      categoryId: values.categoryId,
      type: values.type,
      weightValue,
      weightUnit: values.weightUnit,
      mrp: Number(values.mrp),
      purchasePrice: Number(values.purchasePrice),
    }

    if (formMode.kind === 'edit') {
      const req: UpdateProductRequest = { ...common, active: values.active }
      await update.mutateAsync({ id: formMode.product.id, req })
    } else if (formMode.kind === 'create') {
      const req: CreateProductRequest = { ...common, active: values.active }
      await create.mutateAsync(req)
    }
    closeForm()
  }

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return
    try {
      await remove.mutateAsync(pendingDelete.id)
    } finally {
      setPendingDelete(null)
    }
  }

  const columns: GridColDef<ProductDto>[] = [
    { field: 'code',         headerName: 'Code',         width: 100, sortable: false, filterable: false },
    { field: 'name',         headerName: 'Product Name', flex: 1.5,  minWidth: 200, sortable: false, filterable: false },
    {
      field: 'categoryName', headerName: 'Category',     width: 130, sortable: false, filterable: false,
      renderCell: ({ value }) => <Chip label={value} size="small" variant="outlined" />,
    },
    { field: 'type',         headerName: 'Type',         width: 100, sortable: false, filterable: false },
    {
      field: 'weight',       headerName: 'Net Weight',   width: 130, sortable: false, filterable: false,
      valueGetter: (_v, row) =>
        row.weightValue != null ? `${row.weightValue} ${row.weightUnit ?? ''}`.trim() : '—',
    },
    {
      field: 'mrp',          headerName: 'MRP',          width: 110, sortable: false, filterable: false,
      renderCell: ({ value }) => <span>₹ {value}</span>,
    },
    {
      field: 'purchasePrice', headerName: 'Purchase Price', width: 130, sortable: false, filterable: false,
      renderCell: ({ value }) =>
        value == null ? <span className="text-[#1F1F1F]/40">—</span> : <span>₹ {value}</span>,
    },
    {
      field: 'active', headerName: 'Status', width: 100, sortable: false, filterable: false,
      renderCell: ({ value }) => (
        <Chip
          label={value ? 'Active' : 'Inactive'}
          size="small"
          variant={value ? 'filled' : 'outlined'}
          color={value ? 'success' : 'default'}
        />
      ),
    },
    {
      field: 'actions', headerName: 'Actions', width: 120, sortable: false, filterable: false,
      align: 'right', headerAlign: 'right',
      renderCell: ({ row }) => (
        <Box>
          <IconButton size="small" onClick={() => setFormMode({ kind: 'edit', product: row })}>
            <Edit2 className="w-4 h-4" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => setPendingDelete(row)}>
            <Trash2 className="w-4 h-4" />
          </IconButton>
        </Box>
      ),
    },
  ]

  const errorMessage = list.isError
    ? (list.error instanceof Error ? list.error.message : 'Failed to load products.')
    : null

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={
          list.isLoading
            ? 'Loading…'
            : `${products.length} ${products.length === 1 ? 'product' : 'products'} in catalog`
        }
        action={
          <Button
            variant="contained"
            color="primary"
            startIcon={<Plus className="w-4 h-4" />}
            onClick={() => setFormMode({ kind: 'create' })}
            sx={{ textTransform: 'none', fontWeight: 600 }}
            disabled={categories.length === 0 || categoriesQuery.isLoading}
          >
            Add Product
          </Button>
        }
      />

      {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}

      {!categoriesQuery.isLoading && categories.length === 0 && (
        <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: '#FFF8DC', border: '1px solid #1F1F1F', fontSize: 14, color: '#1F1F1F' }}>
          No categories exist on the backend yet. Insert at least one category row before adding products.
        </Box>
      )}

      <Paper className="products-paper" sx={{ borderRadius: 2.5 }} elevation={0}>
        <DataGrid
          className="products-grid"
          rows={products}
          columns={columns}
          getRowId={r => r.id}
          loading={list.isLoading}
          disableRowSelectionOnClick
          disableColumnMenu
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          pageSizeOptions={[10, 25, 50]}
        />
      </Paper>

      <ProductFormDialog
        open={formMode.kind !== 'closed'}
        product={formMode.kind === 'edit' ? formMode.product : null}
        categories={categories}
        submitting={create.isPending || update.isPending}
        submitError={mutationErrorMessage(create.error) ?? mutationErrorMessage(update.error)}
        onClose={closeForm}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete product"
        message={`Are you sure you want to delete "${pendingDelete?.name ?? ''}"? This will deactivate it.`}
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}

function mutationErrorMessage(err: unknown): string | null {
  if (!err) return null
  if (err instanceof ValidationError) return err.flatten()
  if (err instanceof Error)           return err.message
  return 'Something went wrong.'
}

function ProductFormDialog({ open, product, categories, submitting, submitError, onClose, onSave }: {
  open: boolean
  product: ProductDto | null
  categories: CategoryDto[]
  submitting: boolean
  submitError: string | null
  onClose: () => void
  onSave: (values: FormValues) => Promise<void>
}) {
  const isEdit = !!product
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [type, setType] = useState('pack')
  const [weightValue, setWeightValue] = useState('')
  const [weightUnit, setWeightUnit] = useState<'g' | 'kg'>('g')
  const [mrp, setMrp] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [active, setActive] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName(product?.name ?? '')
    setCategoryId(product?.categoryId ?? (categories[0]?.id ?? ''))
    setType(product?.type ?? 'pack')
    setWeightValue(product?.weightValue?.toString() ?? '')
    setWeightUnit((product?.weightUnit as 'g' | 'kg') ?? 'g')
    setMrp(product?.mrp?.toString() ?? '')
    setPurchasePrice(product?.purchasePrice?.toString() ?? '')
    setActive(product?.active ?? true)
    setErr(null)
  }, [open, product, categories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim())                                   { setErr('Enter a product name'); return }
    if (typeof categoryId !== 'number')                 { setErr('Pick a category'); return }
    if (!type.trim())                                   { setErr('Enter a type'); return }
    const mrpNum = parseFloat(mrp)
    const ppNum  = parseFloat(purchasePrice)
    if (Number.isNaN(mrpNum) || mrpNum < 0)             { setErr('Enter a valid MRP'); return }
    if (Number.isNaN(ppNum)  || ppNum  < 0)             { setErr('Enter a valid Purchase Price'); return }
    if (weightValue.trim()) {
      const w = parseFloat(weightValue)
      if (Number.isNaN(w) || w <= 0)                    { setErr('Enter a valid net weight'); return }
    }
    setErr(null)

    try {
      await onSave({
        name: name.trim(),
        categoryId,
        type: type.trim(),
        weightValue,
        weightUnit,
        mrp: mrpNum.toString(),
        purchasePrice: ppNum.toString(),
        active,
      })
    } catch {
      // Surfaces via submitError prop
    }
  }

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 600 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Package className="w-5 h-5" />
          {isEdit ? 'Edit Product' : 'Add Product'}
        </Box>
        <IconButton size="small" onClick={onClose} disabled={submitting}><X className="w-4 h-4" /></IconButton>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {isEdit && product && (
            <Box sx={{ display: 'flex', gap: 2, fontSize: 13, color: '#64748b' }}>
              <span><b>ID:</b> {product.id}</span>
              <span><b>Code:</b> {product.code}</span>
            </Box>
          )}
          <TextField label="Name" value={name} onChange={e => setName(e.target.value)} required size="small" disabled={submitting} />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField select label="Category" value={categoryId} onChange={e => setCategoryId(Number(e.target.value))} size="small" required disabled={submitting}>
              {categories.map(c => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </TextField>
            <TextField label="Type" value={type} onChange={e => setType(e.target.value)} placeholder="pack / bottle / jar" required size="small" disabled={submitting} />
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              label="Net Weight"
              type="number"
              slotProps={{ htmlInput: { step: 0.001, min: 0 } }}
              value={weightValue}
              onChange={e => setWeightValue(e.target.value)}
              size="small"
              sx={{ flex: 2 }}
              placeholder="100"
              disabled={submitting}
            />
            <TextField
              select
              label="Unit"
              value={weightUnit}
              onChange={e => setWeightUnit(e.target.value as 'g' | 'kg')}
              size="small"
              sx={{ flex: 1, minWidth: 90 }}
              disabled={submitting}
            >
              <MenuItem value="g">g</MenuItem>
              <MenuItem value="kg">kg</MenuItem>
            </TextField>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="MRP (₹)"
              type="number"
              slotProps={{ htmlInput: { step: 0.01, min: 0 } }}
              value={mrp}
              onChange={e => setMrp(e.target.value)}
              required
              size="small"
              disabled={submitting}
            />
            <TextField
              label="Purchase Price (₹)"
              type="number"
              slotProps={{ htmlInput: { step: 0.01, min: 0 } }}
              value={purchasePrice}
              onChange={e => setPurchasePrice(e.target.value)}
              required
              size="small"
              disabled={submitting}
            />
          </Box>
          <FormControlLabel
            control={<Checkbox checked={active} onChange={e => setActive(e.target.checked)} disabled={submitting} />}
            label="Active"
          />
          {err && <Box sx={{ color: 'error.main', fontSize: 14 }}>{err}</Box>}
          {submitError && <Alert severity="error" sx={{ whiteSpace: 'pre-line' }}>{submitError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} variant="outlined" color="secondary" disabled={submitting} sx={{ textTransform: 'none', fontWeight: 500 }}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={submitting} sx={{ textTransform: 'none', fontWeight: 600 }}>
            {submitting ? 'Saving…' : (isEdit ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
