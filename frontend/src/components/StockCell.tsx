import { Badge } from '@/components/ui/badge'

interface StockCellProps {
  stock: number
}

export function StockCell({ stock }: StockCellProps) {
  if (stock === 0) return <Badge variant="destructive">Sin stock</Badge>
  return <>{stock}</>
}
