import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { italianBanks } from "@/data/italian-banks";

interface BankSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function BankSelect({ value, onValueChange, placeholder = "Seleziona banca..." }: BankSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedBank = italianBanks.find((bank) => bank.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between border-2 border-input hover:border-border focus:border-primary"
        >
          {selectedBank ? selectedBank.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Cerca banca..." />
          <CommandList>
            <CommandEmpty>Nessuna banca trovata.</CommandEmpty>
            <CommandGroup>
              {italianBanks.map((bank) => (
                <CommandItem
                  key={bank.value}
                  value={bank.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === bank.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {bank.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}