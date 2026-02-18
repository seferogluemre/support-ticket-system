import { Button } from '#/components/ui/button';
import { Checkbox } from '#/components/ui/checkbox';
import { Label } from '#/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover';
import { Separator } from '#/components/ui/separator';
import { Filter } from 'lucide-react';
import { TicketStatus } from '../types';

interface TicketStatusFilterProps {
  selectedStatuses: TicketStatus[];
  onStatusChange: (statuses: TicketStatus[]) => void;
}

const filterOptions = [
  { value: TicketStatus.OPEN, label: 'Açık', color: 'text-blue-500' },
  { value: TicketStatus.IN_PROGRESS, label: 'Devam Ediyor', color: 'text-purple-500' },
  { value: TicketStatus.PENDING, label: 'Beklemede', color: 'text-yellow-500' },
  { value: TicketStatus.CLOSED, label: 'Kapalı', color: 'text-gray-500' },
];

export function TicketStatusFilter({
  selectedStatuses,
  onStatusChange,
}: TicketStatusFilterProps) {
  const handleToggle = (status: TicketStatus) => {
    const newStatuses = selectedStatuses.includes(status)
      ? selectedStatuses.filter((s) => s !== status)
      : [...selectedStatuses, status];
    onStatusChange(newStatuses);
  };

  const handleClearAll = () => {
    onStatusChange([]);
  };

  const handleSelectAll = () => {
    onStatusChange(filterOptions.map((opt) => opt.value));
  };

  const activeCount = selectedStatuses.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2"
        >
          <Filter className="h-3.5 w-3.5" />
          Filtre
          {activeCount > 0 && (
            <span className="ml-1 rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Durum Filtresi</h4>
            <p className="text-xs text-muted-foreground">
              Görüntülenecek ticket durumlarını seçin
            </p>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            {filterOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={option.value}
                  checked={selectedStatuses.includes(option.value)}
                  onCheckedChange={() => handleToggle(option.value)}
                />
                <Label
                  htmlFor={option.value}
                  className="text-sm font-normal cursor-pointer flex items-center gap-2"
                >
                  <span className={`h-2 w-2 rounded-full ${option.color.replace('text-', 'bg-')}`} />
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-7 text-xs"
            >
              Temizle
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="h-7 text-xs"
            >
              Tümünü Seç
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
