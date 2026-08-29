import re

# Fix Search page padding
with open('pages/Search.tsx', 'r', encoding='utf-8') as f:
    search_content = f.read()
search_content = search_content.replace('py-6 md:py-8', 'py-4 sm:py-6 md:py-8')
search_content = search_content.replace('mb-4 md:mb-6', 'mb-3 md:mb-5')
search_content = search_content.replace('space-y-4 md:space-y-6', 'space-y-3 sm:space-y-4 md:space-y-6')
with open('pages/Search.tsx', 'w', encoding='utf-8') as f:
    f.write(search_content)

# Fix CategoryGrid padding
with open('components/CategoryGrid.tsx', 'r', encoding='utf-8') as f:
    cat_content = f.read()
cat_content = cat_content.replace('px-4 sm:px-6 lg:px-8', 'px-3 sm:px-4 lg:px-8')
with open('components/CategoryGrid.tsx', 'w', encoding='utf-8') as f:
    f.write(cat_content)

# Fix FlashSale padding
with open('components/FlashSale.tsx', 'r', encoding='utf-8') as f:
    fs_content = f.read()
fs_content = fs_content.replace('p-4 sm:p-6', 'p-3 sm:p-4 md:p-6')
with open('components/FlashSale.tsx', 'w', encoding='utf-8') as f:
    f.write(fs_content)
