import re

with open('/Users/rafalopilowski/Projekty/migration/pjapp/packages/shared/src/stores/__tests__/authStore.test.ts', 'r') as f:
    content = f.read()

# Add import for createMockSupabaseClient
if 'createMockSupabaseClient' not in content:
    content = content.replace(
        'import { mockConsole, flushPromises } from "../../test-utils/test-helpers";',
        'import { mockConsole, flushPromises } from "../../test-utils/test-helpers";\nimport { createMockSupabaseClient } from "../../test-utils/mock-factories";'
    )

# Find all mock blocks
# Pattern: const mockClient = { ... } as unknown as SupabaseClient;
# We need to find the start (const mockClient = {) and end (} as unknown as SupabaseClient;)

# Let's use a simpler approach: find all lines with "as unknown as SupabaseClient" and work backwards
lines = content.split('\n')
new_lines = []
i = 0
while i < len(lines):
    if 'as unknown as SupabaseClient' in lines[i]:
        # Found the end of a mock block, now find the start
        end_idx = i
        start_idx = end_idx
        
        # Look backwards to find "const mockClient = {"
        while start_idx >= 0 and 'const mockClient = {' not in lines[start_idx]:
            start_idx -= 1
        
        if start_idx < 0:
            new_lines.append(lines[i])
            i += 1
            continue
        
        # Extract the mock block content
        block_lines = lines[start_idx:end_idx+1]
        
        # Parse the block to find the auth methods and their values
        auth_methods = {}
        
        for j, line in enumerate(block_lines):
            if 'getSession:' in line and 'mockResolvedValue' in line:
                # Extract the value inside mockResolvedValue(...)
                match = re.search(r'mockResolvedValue\((\{[^}]+\})\)', line)
                if match:
                    auth_methods['getSession'] = match.group(1)
            elif 'getSession:' in line and 'mockResolvedValue' in line and '{' in line:
                # Multi-line mockResolvedValue
                # Find the closing brace
                start_brace = line.index('{')
                brace_count = 1
                value_lines = [line[start_brace:]]
                k = j + 1
                while k < len(block_lines) and brace_count > 0:
                    value_lines.append(block_lines[k])
                    brace_count += block_lines[k].count('{') - block_lines[k].count('}')
                    k += 1
                auth_methods['getSession'] = '\n'.join(value_lines)
            elif 'onAuthStateChange:' in line and 'mockReturnValue' in line:
                match = re.search(r'mockReturnValue\((\{[^}]+\})\)', line)
                if match:
                    auth_methods['onAuthStateChange'] = match.group(1)
            elif 'onAuthStateChange:' in line and 'mockImplementation' in line:
                # Find the implementation block
                start_paren = line.index('(')
                paren_count = 1
                value_lines = [line[start_paren:]]
                k = j + 1
                while k < len(block_lines) and paren_count > 0:
                    value_lines.append(block_lines[k])
                    paren_count += block_lines[k].count('(') - block_lines[k].count(')')
                    k += 1
                auth_methods['onAuthStateChange'] = '\n'.join(value_lines)
            elif 'signInWithOtp:' in line and 'mockResolvedValue' in line:
                match = re.search(r'mockResolvedValue\((\{[^}]+\})\)', line)
                if match:
                    auth_methods['signInWithOtp'] = match.group(1)
            elif 'signInWithPassword:' in line and 'mockResolvedValue' in line:
                match = re.search(r'mockResolvedValue\((\{[^}]+\})\)', line)
                if match:
                    auth_methods['signInWithPassword'] = match.group(1)
            elif 'verifyOtp:' in line and 'mockResolvedValue' in line:
                match = re.search(r'mockResolvedValue\((\{[^}]+\})\)', line)
                if match:
                    auth_methods['verifyOtp'] = match.group(1)
            elif 'signOut:' in line and 'mockResolvedValue' in line:
                match = re.search(r'mockResolvedValue\((\{[^}]+\})\)', line)
                if match:
                    auth_methods['signOut'] = match.group(1)
            elif 'refreshSession:' in line and 'mockResolvedValue' in line:
                match = re.search(r'mockResolvedValue\((\{[^}]+\})\)', line)
                if match:
                    auth_methods['refreshSession'] = match.group(1)
        
        # Generate replacement lines
        indent = '      '  # 6 spaces
        replacement_lines = [f'{indent}const mockClient = createMockSupabaseClient();']
        
        if 'getSession' in auth_methods:
            replacement_lines.append(f'{indent}mockClient.auth.getSession.mockResolvedValue({auth_methods["getSession"]});')
        
        if 'onAuthStateChange' in auth_methods:
            if 'mockImplementation' in block_lines[0]:
                # Custom implementation - we need to handle this differently
                # For now, just keep it as mockImplementation
                impl_lines = auth_methods['onAuthStateChange'].split('\n')
                # Remove the trailing comma and newline
                impl_lines[-1] = impl_lines[-1].rstrip(',').rstrip()
                impl_str = '\n'.join(impl_lines)
                replacement_lines.append(f'{indent}mockClient.auth.onAuthStateChange.mockImplementation{impl_str};')
            else:
                replacement_lines.append(f'{indent}mockClient.auth.onAuthStateChange.mockReturnValue({auth_methods["onAuthStateChange"]});')
        
        if 'signInWithOtp' in auth_methods:
            replacement_lines.append(f'{indent}mockClient.auth.signInWithOtp.mockResolvedValue({auth_methods["signInWithOtp"]});')
        
        if 'signInWithPassword' in auth_methods:
            replacement_lines.append(f'{indent}mockClient.auth.signInWithPassword.mockResolvedValue({auth_methods["signInWithPassword"]});')
        
        if 'verifyOtp' in auth_methods:
            replacement_lines.append(f'{indent}mockClient.auth.verifyOtp.mockResolvedValue({auth_methods["verifyOtp"]});')
        
        if 'signOut' in auth_methods:
            replacement_lines.append(f'{indent}mockClient.auth.signOut.mockResolvedValue({auth_methods["signOut"]});')
        
        if 'refreshSession' in auth_methods:
            replacement_lines.append(f'{indent}mockClient.auth.refreshSession.mockResolvedValue({auth_methods["refreshSession"]});')
        
        new_lines.extend(replacement_lines)
        i = end_idx + 1
    else:
        new_lines.append(lines[i])
        i += 1

new_content = '\n'.join(new_lines)

# Count remaining occurrences
remaining = new_content.count('as unknown as SupabaseClient')
print(f"Remaining occurrences: {remaining}")

with open('/Users/rafalopilowski/Projekty/migration/pjapp/packages/shared/src/stores/__tests__/authStore.test.ts', 'w') as f:
    f.write(new_content)

print("Done")
