import re

with open('pages/Checkout.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix inner section padding to be smaller on mobile
content = content.replace('p-6 md:p-8', 'p-4 sm:p-6 md:p-8')
content = content.replace('p-5 space-y-4', 'p-4 sm:p-5 space-y-4')

# Fix outer layout padding
content = content.replace('py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full', 'py-6 sm:py-8 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full')
content = content.replace('gap-8 xl:gap-12 items-start mt-6 sm:mt-10', 'gap-6 lg:gap-8 xl:gap-12 items-start mt-4 sm:mt-8')
content = content.replace('space-y-6 sm:space-y-8', 'space-y-4 sm:space-y-6')

# Address Selection Modal inner padding
content = content.replace('p-4 overflow-y-auto space-y-3 pb-safe', 'p-3 sm:p-4 overflow-y-auto space-y-3 pb-safe')

with open('pages/Checkout.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
