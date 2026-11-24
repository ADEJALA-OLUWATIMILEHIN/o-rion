import { BadgeCheck, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Condition } from '@/api/types'
import { CONDITION_LABEL } from '@/lib/format'

export function ConditionBadge({ condition, grade }: { condition: Condition; grade?: string | null }) {
  if (condition === 'brand_new') {
    return (
      <Badge variant="success">
        <Sparkles /> {CONDITION_LABEL[condition]}
      </Badge>
    )
  }
  if (condition === 'certified_refurbished') {
    return (
      <Badge>
        <BadgeCheck /> {grade ? `Grade ${grade} ` : ''}Refurbished
      </Badge>
    )
  }
  return <Badge variant="secondary">{CONDITION_LABEL[condition].replace('Pre-Owned ', '')}</Badge>
}
