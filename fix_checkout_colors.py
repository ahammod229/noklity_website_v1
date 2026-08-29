import re

with open('pages/Checkout.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace pink colors in Mobile Banking section
content = content.replace('border-pink-200 bg-pink-50/40', 'border-gray-200 bg-gray-50')
content = content.replace('text-pink-700', 'text-gray-900')
content = content.replace('border-pink-100 shadow-sm', 'border-gray-100 shadow-sm')
content = content.replace('text-pink-600', 'text-primary')
content = content.replace('border-pink-100', 'border-gray-200')
content = content.replace('focus:border-pink-500 focus:ring-pink-500/20', 'focus:border-primary focus:ring-primary/20')
content = content.replace('hover:bg-green-50/30', 'hover:bg-primary/5')

# Replace green colors in Bank Transfer section
content = content.replace('border-green-200 bg-green-50/40', 'border-gray-200 bg-gray-50')
content = content.replace('text-green-600', 'text-gray-700')
content = content.replace('border-green-200', 'border-gray-200')
content = content.replace('bg-green-100', 'bg-primary/10')
content = content.replace('text-green-500', 'text-primary')
content = content.replace('focus:border-green-500 focus:ring-green-500/20', 'focus:border-primary focus:ring-primary/20')

# Ensure the radio buttons selected state uses a very subtle primary background, not harsh red
content = content.replace('bg-red-50/30', 'bg-primary/5 shadow-sm ring-1 ring-primary/20')

with open('pages/Checkout.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
