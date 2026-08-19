import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';
import { TaskFilterState } from '../components/TaskFilterBar';

export const useTaskFiltersUrlSync = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: TaskFilterState = useMemo(() => {
    return {
      search: searchParams.get('search') || '',
      priorityId: searchParams.get('priorityId') || '',
      statusId: searchParams.get('statusId') || '',
      assigneeId: searchParams.get('assigneeId') || '',
      labelId: searchParams.get('labelId') || '',
    };
  }, [searchParams]);

  // Update browser URL query string (State -> URL)
  const setFilters = useCallback(
    (newFilters: TaskFilterState) => {
      const params = new URLSearchParams();

      if (newFilters.search) params.set('search', newFilters.search);
      if (newFilters.priorityId) params.set('priorityId', newFilters.priorityId);
      if (newFilters.statusId) params.set('statusId', newFilters.statusId);
      if (newFilters.assigneeId) params.set('assigneeId', newFilters.assigneeId);
      if (newFilters.labelId) params.set('labelId', newFilters.labelId);

      setSearchParams(params, { replace: true });
    },
    [setSearchParams]
  );

  const resetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  return { filters, setFilters, resetFilters };
};
