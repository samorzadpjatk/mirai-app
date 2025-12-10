"use client";

import { useState, useEffect } from "react";
import { MagnifyingGlassIcon, Cross2Icon } from "@radix-ui/react-icons";
import { TextField, Button, Flex, Text, Badge } from "@radix-ui/themes";

interface UserSearchBarProps {
  onSearch: (searchTerm: string) => void;
  placeholder?: string;
  resultCount?: number;
}

export default function UserSearchBar({
  onSearch,
  placeholder = "Search users by name, email, or wrist number...",
  resultCount
}: UserSearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  useEffect(() => {
    onSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearch]);

  const handleClear = () => {
    setSearchTerm("");
  };

  return (
    <Flex direction="column" gap="2">
      <div style={{ position: "relative" }}>
        <TextField.Root
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
        >
          <TextField.Slot>
            <MagnifyingGlassIcon />
          </TextField.Slot>
          <TextField.Slot>
            {searchTerm && (
              <Button
                variant="soft"
                size="1"
                onClick={handleClear}
              >
                <Cross2Icon />
              </Button>
            )}
          </TextField.Slot>
        </TextField.Root>
      </div>

      {searchTerm && (
        <Flex align="center" gap="2">
          <Text size="2" color="gray">
            Wyszukiwanie: &quot;{searchTerm}&quot;
          </Text>
          {typeof resultCount === 'number' && (
            <Badge variant="soft" color="blue">
              {resultCount} {resultCount === 1 ? 'wynik' : 'wyników'}
            </Badge>
          )}
        </Flex>
      )}
    </Flex>
  );
}
