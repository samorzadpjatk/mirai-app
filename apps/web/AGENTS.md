# Web Frontend — Quick Reference

> **Frontend-specific guidance for `apps/web/`**
> Universal rules: See root `AGENTS.md`

---

## Quick Start

- **TDD first:** Write component test before implementation
- **Component location:** `src/components/**/*.tsx` → `__tests__/*.test.tsx`
- **Test runner:** Jest. Run with `cd apps/web && npm test`

---

## Component Patterns

```tsx
// src/components/UserCard.tsx
interface UserCardProps {
  userId: string;
  onSelect?: (id: string) => void;
}

export function UserCard({ userId, onSelect }: UserCardProps) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);

  if (!user) return <Skeleton />;

  return (
    <div onClick={() => onSelect?.(userId)}>
      <h3>{user.name}</h3>
    </div>
  );
}
```

### Component Tests

```tsx
describe("[UNIT] UserCard", () => {
  it("renders user name", () => {
    render(<UserCard userId="123" />);
    expect(screen.getByText("John")).toBeInTheDocument();
  });
});
```

---

## API Client Usage

```tsx
import { api } from "@mirai-app/api-client";

const fetchUser = async (id: string) => {
  return await api.users.getById.query({ id });
};
```

### Error Handling

```tsx
try {
  const data = await api.users.getById.query({ id });
} catch (error) {
  if (error.code === "UNAUTHORIZED") redirect("/login");
}
```

---

## State Management

| Pattern      | Use for       | Example       |
| ------------ | ------------- | ------------- |
| `useState`   | Local state   | Form inputs   |
| `useEffect`  | Side effects  | API calls     |
| Context      | Shared state  | Theme, auth   |
| External lib | Complex state | See CLAUDE.md |

---

## Cleanup Checklist

- [ ] No `[DEBUG]` test files (delete or move to `__spikes__/`)
- [ ] Component tests written for new UI
- [ ] API calls use shared client

---

## Deep Reference

- **CLAUDE.md §4:** TDD Conventions — Component testing
- **CLAUDE.md §8:** Kaizen — Waste identification
- **Root `AGENTS.md`:** Universal conventions

**Version:** 1.0.0
