// <EntitySelect /> — the global ledger-entity picker for the Finance &
// Procurement console header. The choice is persisted (redux-persist) and
// threaded into every entity-scoped request. When nothing is selected yet it
// auto-picks the first active entity, so the console is never stuck empty.

import { useEffect, useMemo } from "react";
import { Building2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { selectEntityCode, setSelectedEntity } from "@/redux/features/finance/entity-slice";
import { useGetEntitiesQuery } from "@/redux/services/finance/entity-api";

export function EntitySelect() {
  const dispatch = useAppDispatch();
  const code = useAppSelector(selectEntityCode);
  const { data, isLoading } = useGetEntitiesQuery({ is_active: true });

  const entities = useMemo(() => data?.data ?? [], [data]);

  // Auto-select the first active entity when none is chosen (or the persisted
  // one no longer exists), so callers always have an entity to scope by.
  useEffect(() => {
    if (isLoading || entities.length === 0) return;
    const stillValid = code && entities.some((e) => e.code === code);
    if (!stillValid) dispatch(setSelectedEntity(entities[0].code));
  }, [isLoading, entities, code, dispatch]);

  if (isLoading) return <Skeleton className="h-9 w-44" />;
  if (entities.length === 0) return null;

  return (
    <Select value={code ?? undefined} onValueChange={(v) => dispatch(setSelectedEntity(v))}>
      <SelectTrigger className="h-9 min-w-44 gap-2 bg-white font-mont text-sm" aria-label="Active entity">
        <Building2 className="size-4 text-gray-05" />
        <SelectValue placeholder="Select entity" />
      </SelectTrigger>
      <SelectContent>
        {entities.map((e) => (
          <SelectItem key={e.code} value={e.code} className="font-mont">
            <span className="font-semibold">{e.code}</span>
            <span className="ml-2 text-gray-05">{e.name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
