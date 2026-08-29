import re

with open('pages/Checkout.tsx', 'r') as f:
    content = f.read()

# Fix 1: result.error in Checkout.tsx
content = content.replace('text: result.error ||', 'text: (result as any).error ||')

# Fix 2: Supabase upload destructuring
content = content.replace(
    "const { path: newPath } = await supabase.storage.from('payment-proofs').upload(filePath, fileToUpload, { upsert: false });",
    "const uploadRes = await supabase.storage.from('payment-proofs').upload(filePath, fileToUpload, { upsert: false });\n              if (uploadRes.error) throw uploadRes.error;\n              const newPath = uploadRes.data?.path;"
)

with open('pages/Checkout.tsx', 'w') as f:
    f.write(content)

