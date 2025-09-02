"use client";

import { useState, useEffect } from "react";
import { MagnifyingGlassIcon, Cross2Icon } from "@radix-ui/react-icons";
import { TextField, Button, Flex, Text, Badge } from "@radix-ui/themes";
import useDebounce from "~/utils/debounce";

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
          style={{ 
            width: "100%",
            paddingLeft: "2.5rem",
            paddingRight: searchTerm ? "2.5rem" : "1rem"
          }}
        />
        
        <MagnifyingGlassIcon 
          style={{
            position: "absolute",
            left: "0.75rem",
            top: "50%",
            transform: "translateY(-50%)",
            opacity: 0.6,
            width: "1rem",
            height: "1rem"
          }}
        />
        
        {searchTerm && (
          <Button
            variant="ghost"
            size="1"
            onClick={handleClear}
            style={{
              position: "absolute",
              right: "0.25rem",
              top: "50%",
              transform: "translateY(-50%)",
              padding: "0.25rem",
              minWidth: "auto",
              height: "auto"
            }}
          >
            <Cross2Icon width="12" height="12" />
          </Button>
        )}
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
