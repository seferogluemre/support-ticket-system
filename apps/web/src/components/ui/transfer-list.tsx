import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useState } from "react";

interface TransferListItem {
    id: string;
    label: string;
    sublabel?: string;
}

interface TransferListProps {
    available: TransferListItem[];
    selected: TransferListItem[];
    onChange: (selected: TransferListItem[]) => void;
    availableTitle?: string;
    selectedTitle?: string;
    searchPlaceholder?: string;
    disabled?: boolean;
}

export function TransferList({
    available,
    selected,
    onChange,
    availableTitle = "Available",
    selectedTitle = "Selected",
    searchPlaceholder = "Search...",
    disabled = false,
}: TransferListProps) {
    const [searchLeft, setSearchLeft] = useState("");
    const [searchRight, setSearchRight] = useState("");
    const [selectedLeft, setSelectedLeft] = useState<Set<string>>(new Set());
    const [selectedRight, setSelectedRight] = useState<Set<string>>(new Set());

    const selectedIds = new Set(selected.map((item) => item.id));
    const availableFiltered = available.filter(
        (item) =>
            !selectedIds.has(item.id) &&
            (item.label.toLowerCase().includes(searchLeft.toLowerCase()) ||
                item.sublabel?.toLowerCase().includes(searchLeft.toLowerCase()))
    );

    const selectedFiltered = selected.filter(
        (item) =>
            item.label.toLowerCase().includes(searchRight.toLowerCase()) ||
            item.sublabel?.toLowerCase().includes(searchRight.toLowerCase())
    );

    const handleMoveRight = () => {
        const itemsToMove = available.filter((item) =>
            selectedLeft.has(item.id)
        );
        onChange([...selected, ...itemsToMove]);
        setSelectedLeft(new Set());
    };

    const handleMoveLeft = () => {
        const newSelected = selected.filter(
            (item) => !selectedRight.has(item.id)
        );
        onChange(newSelected);
        setSelectedRight(new Set());
    };

    const handleToggleLeft = (id: string) => {
        const newSelected = new Set(selectedLeft);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedLeft(newSelected);
    };

    const handleToggleRight = (id: string) => {
        const newSelected = new Set(selectedRight);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedRight(newSelected);
    };

    const ListItem = ({
        item,
        isSelected,
        onToggle,
    }: {
        item: TransferListItem;
        isSelected: boolean;
        onToggle: () => void;
    }) => (
        <div
            className={`p-3 rounded-md border cursor-pointer transition-colors ${
                isSelected
                    ? "bg-primary/10 border-primary"
                    : "bg-muted/30 border-border hover:bg-muted/50"
            }`}
            onClick={onToggle}
        >
            <div className="font-medium text-sm">{item.label}</div>
            {item.sublabel && (
                <div className="text-xs text-muted-foreground">
                    {item.sublabel}
                </div>
            )}
        </div>
    );

    return (
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-start">
            {/* Available Items */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                        {availableTitle} ({availableFiltered.length})
                    </CardTitle>
                    <div className="relative mt-2">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchLeft}
                            onChange={(e) => setSearchLeft(e.target.value)}
                            className="pl-8"
                            disabled={disabled}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {availableFiltered.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                No items available
                            </p>
                        ) : (
                            availableFiltered.map((item) => (
                                <ListItem
                                    key={item.id}
                                    item={item}
                                    isSelected={selectedLeft.has(item.id)}
                                    onToggle={() => handleToggleLeft(item.id)}
                                />
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Transfer Buttons */}
            <div className="flex flex-col gap-2 justify-center pt-16">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={handleMoveRight}
                    disabled={selectedLeft.size === 0 || disabled}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={handleMoveLeft}
                    disabled={selectedRight.size === 0 || disabled}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
            </div>

            {/* Selected Items */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                        {selectedTitle} ({selectedFiltered.length})
                    </CardTitle>
                    <div className="relative mt-2">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchRight}
                            onChange={(e) => setSearchRight(e.target.value)}
                            className="pl-8"
                            disabled={disabled}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {selectedFiltered.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                No items selected
                            </p>
                        ) : (
                            selectedFiltered.map((item) => (
                                <ListItem
                                    key={item.id}
                                    item={item}
                                    isSelected={selectedRight.has(item.id)}
                                    onToggle={() => handleToggleRight(item.id)}
                                />
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

